using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Poolr.Engine.Api;

public sealed class DriveWorkspace
{
    public sealed record Member(string KeyId, string PublicKey, string Name, string Role);
    public sealed record Authority(string Name, string OwnerKeyId, bool Ended, string PreviousHash, List<Member> Members, List<string> AcceptedChanges);
    public sealed record Link(string Id, string OwnerPublicKey, string Remote, long HighestEpoch = -1);
    public sealed record Invitation(string Id, string OwnerPublicKey, string AuthorityHash);
    public sealed record Revision(string ReviewId, string Title, string[] Parents, JsonObject Project);
    public sealed record VerifiedRevision(string Hash, string Author, long Epoch, Revision Data);
    public sealed record TeamView(string Id, string Name, bool Ended, string OwnerKeyId, long Epoch, string Remote, List<Member> Members, List<VerifiedRevision> Heads, int Pending, string[] Warnings);
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly string root;
    private readonly CollaborationVault vault;
    public DriveWorkspace(string root) { this.root = root; Directory.CreateDirectory(root); vault = new(root); }
    public CollaborationVault Vault => vault;
    private string TeamPath(string id)
    {
        if (!Guid.TryParseExact(id, "D", out _)) throw new ArgumentException("Invalid team identifier.");
        return Path.Combine(root, "teams", id);
    }
    private string Objects(string id) => Path.Combine(TeamPath(id), "objects");
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private static T Read<T>(string path) => JsonSerializer.Deserialize<T>(File.ReadAllText(path), Json) ?? throw new InvalidDataException("Invalid workspace data.");
    private static void Write(string path, object data)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var tmp = path + ".tmp"; File.WriteAllText(tmp, JsonSerializer.Serialize(data, Json)); File.Move(tmp, path, true);
    }
    private Link GetLink(string id) => Read<Link>(Path.Combine(TeamPath(id), "link.json"));
    public string[] Teams() => Directory.Exists(Path.Combine(root, "teams")) ? Directory.GetDirectories(Path.Combine(root, "teams")).Select(Path.GetFileName).OfType<string>().ToArray() : Array.Empty<string>();
    private string Persist(string id, CollaborationSignatures.Envelope envelope)
    {
        var hash = Hash(envelope.PayloadBase64);
        Write(Path.Combine(Objects(id), hash + ".json"), envelope);
        Write(Path.Combine(TeamPath(id), "outbox", hash + ".json"), envelope);
        return hash;
    }
    public Invitation Create(string name, string remote, string password)
    {
        RcloneTransport.ValidateRemote(remote);
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120) throw new ArgumentException("Provide a team name up to 120 characters.");
        using var key = vault.Unlock(password);
        var identity = vault.PublicIdentity()!;
        var id = Guid.NewGuid().ToString();
        var member = new Member(identity.KeyId, identity.PublicKey, identity.Name, "owner");
        var authority = new Authority(name.Trim(), identity.KeyId, false, "", new() { member }, new());
        Write(Path.Combine(TeamPath(id), "link.json"), new Link(id, identity.PublicKey, remote.TrimEnd('/')));
        var envelope = CollaborationSignatures.Sign(new(1, id, identity.KeyId, 0, Guid.NewGuid().ToString(), "membership", JsonSerializer.Serialize(authority, Json)), key);
        return new(id, identity.PublicKey, Persist(id, envelope));
    }
    public async Task<TeamView> Join(Invitation invite, string remote)
    {
        RcloneTransport.ValidateRemote(remote);
        if (File.Exists(Path.Combine(TeamPath(invite.Id), "link.json"))) throw new InvalidOperationException("This team is already connected.");
        using var key = ECDsa.Create(); key.ImportSubjectPublicKeyInfo(Convert.FromBase64String(invite.OwnerPublicKey), out _);
        var candidate = Path.Combine(TeamPath(invite.Id), "candidate"); Directory.CreateDirectory(candidate);
        await RcloneTransport.Fetch(remote.TrimEnd('/') + "/objects", candidate);
        if (invite.AuthorityHash.Length != 64 || !invite.AuthorityHash.All(Uri.IsHexDigit)) throw new InvalidDataException("Invalid invitation fingerprint.");
        var pin = Path.Combine(candidate, invite.AuthorityHash + ".json");
        if (!File.Exists(pin)) throw new InvalidDataException("Invitation checkpoint was not found. Ask the owner to sync and send a current invitation.");
        var envelope = Read<CollaborationSignatures.Envelope>(pin);
        var untrusted = JsonSerializer.Deserialize<CollaborationSignatures.Payload>(Convert.FromBase64String(envelope.PayloadBase64))!;
        CollaborationSignatures.Verify(envelope, Convert.FromBase64String(invite.OwnerPublicKey), invite.Id, untrusted.Epoch);
        if (Hash(envelope.PayloadBase64) != invite.AuthorityHash || untrusted.Kind != "membership") throw new InvalidDataException("Invalid invitation checkpoint.");
        Directory.CreateDirectory(Objects(invite.Id));
        foreach (var file in Directory.GetFiles(candidate, "*.json")) File.Copy(file, Path.Combine(Objects(invite.Id), Path.GetFileName(file)), false);
        Write(Path.Combine(TeamPath(invite.Id), "link.json"), new Link(invite.Id, invite.OwnerPublicKey, remote.TrimEnd('/'), untrusted.Epoch));
        return View(invite.Id);
    }
    private (Authority Authority, long Epoch, string Hash, List<(CollaborationSignatures.Payload Payload, string Hash)> Changes, List<string> Warnings) Verify(string id)
    {
        var link = GetLink(id); var warnings = new List<string>();
        var files = Directory.Exists(Objects(id)) ? Directory.GetFiles(Objects(id), "*.json") : Array.Empty<string>();
        if (files.Length > 10000) throw new InvalidDataException("Workspace exceeds this release's 10,000-object safety limit. Export a checkpoint before adding more history.");
        var manifests = new List<(CollaborationSignatures.Payload Payload, string Hash)>();
        var edits = new List<(CollaborationSignatures.Envelope Envelope, CollaborationSignatures.Payload Payload, string Hash)>();
        foreach (var file in files)
        {
            try
            {
                if (new FileInfo(file).Length > 2 * 1024 * 1024) throw new InvalidDataException();
                var envelope = Read<CollaborationSignatures.Envelope>(file);
                if (envelope.PayloadBase64.Length > 1_500_000) throw new InvalidDataException();
                var payload = JsonSerializer.Deserialize<CollaborationSignatures.Payload>(Convert.FromBase64String(envelope.PayloadBase64)) ?? throw new InvalidDataException();
                var hash = Hash(envelope.PayloadBase64);
                if (Path.GetFileNameWithoutExtension(file) != hash) throw new InvalidDataException();
                if (payload.Kind == "membership") manifests.Add((CollaborationSignatures.Verify(envelope, Convert.FromBase64String(link.OwnerPublicKey), id, payload.Epoch), hash));
                else edits.Add((envelope, payload, hash));
            }
            catch { warnings.Add("Ignored an invalid remote object."); }
        }
        Authority? authority = null; long epoch = -1; var head = "";
        var history = new Dictionary<long, Authority>();
        foreach (var group in manifests.OrderBy(m => m.Payload.Epoch).GroupBy(m => m.Payload.Epoch))
        {
            if (group.Count() != 1) throw new InvalidDataException("Conflicting authority revisions. Owner intervention is required.");
            var manifest = group.Single();
            var next = JsonSerializer.Deserialize<Authority>(manifest.Payload.Body, Json) ?? throw new InvalidDataException("Invalid authority.");
            if (manifest.Payload.Epoch != epoch + 1 || next.PreviousHash != head || next.OwnerKeyId != CollaborationSignatures.KeyId(Convert.FromBase64String(link.OwnerPublicKey)) || next.Members.Count(m => m.Role == "owner" && m.KeyId == next.OwnerKeyId) != 1 || next.Members.Select(m => m.KeyId).Distinct().Count() != next.Members.Count) throw new InvalidDataException("Broken authority chain.");
            foreach (var member in next.Members) if (member.KeyId != CollaborationSignatures.KeyId(Convert.FromBase64String(member.PublicKey)) || member.Role is not ("owner" or "editor" or "reviewer" or "viewer")) throw new InvalidDataException("Invalid membership.");
            epoch = manifest.Payload.Epoch; authority = next; head = manifest.Hash; history.Add(epoch, next);
        }
        if (authority is null || epoch < link.HighestEpoch) throw new InvalidDataException("Missing or rolled-back authority. Retained local data has not been discarded.");
        var changes = new List<(CollaborationSignatures.Payload, string)>();
        var operationIds = new HashSet<string>();
        foreach (var edit in edits)
        {
            try
            {
                if (!history.TryGetValue(edit.Payload.Epoch, out var policy)) throw new InvalidDataException();
                var member = policy.Members.SingleOrDefault(m => m.KeyId == edit.Payload.AuthorKeyId);
                if (member is null || member.Role == "viewer" || (policy.Ended && member.Role != "owner")) throw new InvalidDataException();
                var payload = CollaborationSignatures.Verify(edit.Envelope, Convert.FromBase64String(member.PublicKey), id, edit.Payload.Epoch);
                if (payload.Kind != "change" || !operationIds.Add(payload.OperationId)) throw new InvalidDataException();
                if (payload.Epoch != epoch && !authority.AcceptedChanges.Contains(edit.Hash)) throw new InvalidDataException();
                changes.Add((payload, edit.Hash));
            }
            catch { warnings.Add("Ignored an unauthorized or malformed change."); }
        }
        Write(Path.Combine(TeamPath(id), "link.json"), link with { HighestEpoch = epoch });
        return (authority, epoch, head, changes, warnings);
    }
    public TeamView View(string id)
    {
        var verified = Verify(id); var revisions = new List<VerifiedRevision>();
        foreach (var change in verified.Changes)
        {
            try
            {
                var revision = JsonSerializer.Deserialize<Revision>(change.Payload.Body, Json) ?? throw new InvalidDataException();
                if (!Guid.TryParseExact(revision.ReviewId, "D", out _) || revision.Project["metadata"]?["id"]?.GetValue<string>() != revision.ReviewId || revision.Parents.Length > 32) throw new InvalidDataException();
                revisions.Add(new(change.Hash, change.Payload.AuthorKeyId, change.Payload.Epoch, revision));
            }
            catch { verified.Warnings.Add("Ignored an invalid review revision."); }
        }
        // Only connected histories can supersede a head; cross-review parents cannot hide data.
        var accepted = new Dictionary<string, VerifiedRevision>();
        while (true)
        {
            var ready = revisions.Where(r => !accepted.ContainsKey(r.Hash) && r.Data.Parents.All(p => accepted.TryGetValue(p, out var parent) && parent.Data.ReviewId == r.Data.ReviewId && parent.Epoch <= r.Epoch)).ToArray();
            if (ready.Length == 0) break;
            foreach (var revision in ready)
            {
                if (!AssignmentsAllowed(revision.Data, revision.Data.Parents.Select(p => accepted[p].Data), revision.Author == verified.Authority.OwnerKeyId))
                {
                    revisions.Remove(revision);
                    verified.Warnings.Add("Ignored an unauthorized assignment change.");
                }
                else accepted.Add(revision.Hash, revision);
            }
        }
        if (accepted.Count != revisions.Count) verified.Warnings.Add("Ignored revisions with missing, cyclic or cross-review parents.");
        revisions = accepted.Values.ToList();
        var parents = revisions.SelectMany(r => r.Data.Parents).ToHashSet();
        var heads = revisions.Where(r => !parents.Contains(r.Hash)).ToList();
        var pending = Directory.Exists(Path.Combine(TeamPath(id), "outbox")) ? Directory.GetFiles(Path.Combine(TeamPath(id), "outbox"), "*.json").Length : 0;
        return new(id, verified.Authority.Name, verified.Authority.Ended, verified.Authority.OwnerKeyId, verified.Epoch, GetLink(id).Remote, verified.Authority.Members, heads, pending, verified.Warnings.ToArray());
    }
    public Invitation Invite(string id) { var state = Verify(id); return new(id, GetLink(id).OwnerPublicKey, state.Hash); }
    public void ChangeMembership(string id, Member? member, bool? ended, string? removeKey, string password)
    {
        using var key = vault.Unlock(password); var verified = Verify(id); var identity = vault.PublicIdentity()!;
        if (identity.KeyId != verified.Authority.OwnerKeyId) throw new UnauthorizedAccessException("Only the owner can change membership or end/reopen this team.");
        var members = verified.Authority.Members.ToList();
        if (removeKey is not null) { if (removeKey == identity.KeyId) throw new ArgumentException("Cannot remove the owner."); members.RemoveAll(m => m.KeyId == removeKey); }
        if (member is not null)
        {
            if (member.KeyId == identity.KeyId || member.Role is not ("editor" or "reviewer" or "viewer") || member.KeyId != CollaborationSignatures.KeyId(Convert.FromBase64String(member.PublicKey))) throw new ArgumentException("Invalid member identity or role.");
            members.RemoveAll(m => m.KeyId == member.KeyId); members.Add(member);
        }
        var policy = verified.Authority with { Members = members, Ended = ended ?? verified.Authority.Ended, PreviousHash = verified.Hash, AcceptedChanges = verified.Changes.Select(c => c.Hash).ToList() };
        Persist(id, CollaborationSignatures.Sign(new(1, id, identity.KeyId, verified.Epoch + 1, Guid.NewGuid().ToString(), "membership", JsonSerializer.Serialize(policy, Json)), key));
    }
    public string Save(string id, Revision revision, long expectedEpoch, string password)
    {
        using var key = vault.Unlock(password); var state = View(id); var identity = vault.PublicIdentity()!;
        var member = state.Members.SingleOrDefault(m => m.KeyId == identity.KeyId);
        if (member is null || member.Role == "viewer" || (state.Ended && identity.KeyId != state.OwnerKeyId)) throw new UnauthorizedAccessException("This team is read-only for your identity.");
        if (state.Epoch != expectedEpoch) throw new InvalidOperationException("Membership changed. Refresh before publishing; your draft is retained.");
        if (!Guid.TryParseExact(revision.ReviewId, "D", out _) || revision.Project["metadata"]?["id"]?.GetValue<string>() != revision.ReviewId) throw new ArgumentException("Invalid review identity.");
        var heads = state.Heads.Where(r => r.Data.ReviewId == revision.ReviewId).Select(r => r.Hash).Order().ToArray();
        if (!heads.SequenceEqual(revision.Parents.Order())) throw new InvalidOperationException("The review changed. Fetch and resolve the newer revision first.");
        if (!AssignmentsAllowed(revision, state.Heads.Where(r => r.Data.ReviewId == revision.ReviewId).Select(r => r.Data), identity.KeyId == state.OwnerKeyId)) throw new UnauthorizedAccessException("Only the team owner can change section assignments, reviewers or due dates.");
        return Persist(id, CollaborationSignatures.Sign(new(1, id, identity.KeyId, state.Epoch, Guid.NewGuid().ToString(), "change", JsonSerializer.Serialize(revision, Json)), key));
    }
    public async Task<TeamView> Sync(string id)
    {
        var link = GetLink(id); RcloneTransport.ValidateRemote(link.Remote);
        Directory.CreateDirectory(Objects(id));
        var pendingFolder = Path.Combine(TeamPath(id), "outbox");
        if (vault.PublicIdentity()?.KeyId == CollaborationSignatures.KeyId(Convert.FromBase64String(link.OwnerPublicKey)) && Directory.Exists(pendingFolder) && Directory.GetFiles(pendingFolder, "*.json").Any(f => JsonSerializer.Deserialize<CollaborationSignatures.Payload>(Convert.FromBase64String(Read<CollaborationSignatures.Envelope>(f).PayloadBase64)) is { Kind: "membership", Epoch: 0 }))
            await RcloneTransport.Run(new[] { "mkdir", link.Remote + "/objects" });
        await RcloneTransport.Fetch(link.Remote + "/objects", Objects(id));
        var state = Verify(id);
        var outbox = Path.Combine(TeamPath(id), "outbox");
        foreach (var file in Directory.Exists(outbox) ? Directory.GetFiles(outbox, "*.json") : Array.Empty<string>())
        {
            var envelope = Read<CollaborationSignatures.Envelope>(file);
            var payload = JsonSerializer.Deserialize<CollaborationSignatures.Payload>(Convert.FromBase64String(envelope.PayloadBase64))!;
            if (payload.Kind == "change" && payload.Epoch != state.Epoch) continue;
            await RcloneTransport.Upload(file, link.Remote + "/objects/" + Path.GetFileName(file));
            File.Move(file, file + ".sent", true);
        }
        return View(id);
    }

    private static bool AssignmentsAllowed(Revision revision, IEnumerable<Revision> parents, bool owner)
    {
        if (owner) return true;
        JsonObject Assignments(JsonObject project)
        {
            var result = new JsonObject();
            if (project["manuscript"]?["sectionMetas"] is JsonObject metas)
                foreach (var section in metas)
                    foreach (var field in new[] { "assignedTo", "reviewer", "dueDate" })
                        if (section.Value?[field]?.GetValue<string>() is { Length: > 0 } value) result[section.Key + ":" + field] = value;
            return result;
        }
        var baseline = parents.ToArray();
        var next = Assignments(revision.Project);
        return baseline.Length == 0 ? next.Count == 0 : baseline.All(p => JsonNode.DeepEquals(Assignments(p.Project), next));
    }
}
