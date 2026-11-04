using System.Text.Json.Nodes;
using Poolr.Engine.Api;
using Xunit;

namespace Poolr.Engine.Tests;

public class DriveWorkspaceTests : IDisposable
{
    private readonly string root = Path.Combine(Path.GetTempPath(), "poolr-tests-" + Guid.NewGuid());
    private const string Password = "test-only-long-passphrase";
    public void Dispose() { if (Directory.Exists(root)) Directory.Delete(root, true); }
    [Fact]
    public void VaultRoundTripRequiresPasswordAndWillNotOverwrite()
    {
        var vault = new CollaborationVault(Path.Combine(root, "one"));
        var identity = vault.Create("Owner", 2, Password);
        Assert.Throws<InvalidOperationException>(() => vault.Unlock("wrong"));
        Assert.Throws<InvalidOperationException>(() => vault.Create("Other", 1, Password));
        var other = new CollaborationVault(Path.Combine(root, "two"));
        Assert.Equal(identity, other.Restore(vault.Export(), Password));
        using var key = other.Unlock(Password);
        Assert.Equal(identity.KeyId, CollaborationSignatures.KeyId(key.ExportSubjectPublicKeyInfo()));
    }
    [Fact]
    public void RevisionConflictAndOwnerOnlyClosureAreEnforced()
    {
        var workspace = new DriveWorkspace(root);
        var owner = workspace.Vault.Create("Owner", 1, Password);
        var invite = workspace.Create("Research", "test:team", Password);
        var id = Guid.NewGuid().ToString();
        var project = new JsonObject { ["metadata"] = new JsonObject { ["id"] = id } };
        var revision = new DriveWorkspace.Revision(id, "Review", Array.Empty<string>(), project);
        var hash = workspace.Save(invite.Id, revision, 0, Password);
        Assert.Throws<InvalidOperationException>(() => workspace.Save(invite.Id, revision, 0, Password));
        workspace.ChangeMembership(invite.Id, null, true, null, Password);
        Assert.True(workspace.View(invite.Id).Ended);
        Assert.Single(workspace.View(invite.Id).Heads);
        Assert.Throws<InvalidOperationException>(() => workspace.Save(invite.Id, revision with { Parents = new[] { hash } }, 0, Password));
        workspace.Save(invite.Id, revision with { Parents = new[] { hash } }, 1, Password);
        Assert.Single(workspace.View(invite.Id).Heads);
        Assert.Equal(owner.KeyId, workspace.View(invite.Id).OwnerKeyId);
    }
    [Fact]
    public void FrozenAuthorityRejectsNewOldEpochChanges()
    {
        var workspace = new DriveWorkspace(root);
        var owner = workspace.Vault.Create("Owner", 1, Password);
        var invite = workspace.Create("Research", "test:team", Password);
        using var signingKey = workspace.Vault.Unlock(Password);
        workspace.ChangeMembership(invite.Id, null, true, null, Password);
        var id = Guid.NewGuid().ToString();
        var revision = new DriveWorkspace.Revision(id, "Forged old epoch", Array.Empty<string>(), new JsonObject { ["metadata"] = new JsonObject { ["id"] = id } });
        var envelope = CollaborationSignatures.Sign(new(1, invite.Id, owner.KeyId, 0, Guid.NewGuid().ToString(), "change", System.Text.Json.JsonSerializer.Serialize(revision, DriveWorkspace.Json)), signingKey);
        var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(envelope.PayloadBase64)));
        File.WriteAllText(Path.Combine(root, "teams", invite.Id, "objects", hash + ".json"), System.Text.Json.JsonSerializer.Serialize(envelope, DriveWorkspace.Json));
        Assert.Empty(workspace.View(invite.Id).Heads);
        Assert.NotEmpty(workspace.View(invite.Id).Warnings);
    }
    [Theory]
    [InlineData(":local:/tmp")]
    [InlineData("drive:../secret")]
    [InlineData("--config=secret")]
    [InlineData("drive:folder\n--delete")]
    public void RejectsUnsafeRemoteArguments(string remote) => Assert.Throws<ArgumentException>(() => RcloneTransport.ValidateRemote(remote));

    [Fact]
    public async Task TwoPeersPreserveConcurrentHeadsAndEnforceRevocation()
    {
        // rclone's local backend exercises the real transport without touching a user's Drive.
        var remoteName = "poolrtest" + Guid.NewGuid().ToString("N");
        var variable = "RCLONE_CONFIG_" + remoteName.ToUpperInvariant() + "_TYPE";
        Environment.SetEnvironmentVariable(variable, "local");
        try
        {
            var remote = remoteName + ":" + Path.Combine(root, "remote");
            var owner = new DriveWorkspace(Path.Combine(root, "owner"));
            var peer = new DriveWorkspace(Path.Combine(root, "peer"));
            owner.Vault.Create("Owner", 1, Password);
            var identity = peer.Vault.Create("Editor", 2, Password);
            var invitation = owner.Create("Team", remote, Password);
            owner.ChangeMembership(invitation.Id, new(identity.KeyId, identity.PublicKey, identity.Name, "editor"), null, null, Password);
            await owner.Sync(invitation.Id);
            await peer.Join(owner.Invite(invitation.Id), remote);
            var id = Guid.NewGuid().ToString();
            var revision = new DriveWorkspace.Revision(id, "Review", Array.Empty<string>(), new JsonObject { ["metadata"] = new JsonObject { ["id"] = id } });
            owner.Save(invitation.Id, revision, 1, Password);
            peer.Save(invitation.Id, revision, 1, Password);
            await owner.Sync(invitation.Id);
            await peer.Sync(invitation.Id);
            var state = await owner.Sync(invitation.Id);
            Assert.Equal(2, state.Heads.Count);
            owner.Save(invitation.Id, revision with { Parents = state.Heads.Select(h => h.Hash).ToArray() }, 1, Password);
            await owner.Sync(invitation.Id);
            Assert.Single((await peer.Sync(invitation.Id)).Heads);
            owner.ChangeMembership(invitation.Id, null, true, identity.KeyId, Password);
            await owner.Sync(invitation.Id);
            var revoked = await peer.Sync(invitation.Id);
            Assert.True(revoked.Ended);
            Assert.Throws<UnauthorizedAccessException>(() => peer.Save(invitation.Id, revision with { Parents = revoked.Heads.Select(h => h.Hash).ToArray() }, revoked.Epoch, Password));
        }
        finally { Environment.SetEnvironmentVariable(variable, null); }
    }
}
