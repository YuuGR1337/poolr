using System.Text.Json;
using System.Text.Json.Nodes;

namespace Poolr.Engine.Api;

public static class CollaborationCommand
{
    public static async Task<int> Run()
    {
        try
        {
            // Invoked only through the native stdio bridge, never an unauthenticated HTTP route.
            var input = new char[2 * 1024 * 1024 + 1]; var count = 0; int n;
            while (count < input.Length && (n = await Console.In.ReadAsync(input.AsMemory(count, input.Length - count))) > 0) count += n;
            if (count == input.Length) throw new InvalidDataException("Request is too large.");
            var request = JsonNode.Parse(new string(input, 0, count))?.AsObject() ?? throw new InvalidDataException();
            var root = Environment.GetEnvironmentVariable("POOLR_COLLAB_DATA") ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "poolr", "collaboration");
            Directory.CreateDirectory(root);
            if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(root, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            using var gate = new FileStream(Path.Combine(root, "workspace.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
            var workspace = new DriveWorkspace(root);
            string Field(string name) => request[name]?.GetValue<string>() ?? "";
            T Data<T>(string name) where T : class => request[name]?.Deserialize<T>(DriveWorkspace.Json) ?? throw new InvalidDataException("Missing " + name);
            object? result = null;
            switch (Field("action"))
            {
                case "project.load": result = ProjectStore.Load(Field("path")); break;
                case "project.save": result = ProjectStore.Save(Field("path"), Data<JsonObject>("project")); break;
                case "status": result = new { identity = workspace.Vault.PublicIdentity(), teams = workspace.Teams().Select(id => workspace.View(id)).ToArray() }; break;
                case "identity.create": result = workspace.Vault.Create(Field("name"), request["avatar"]?.GetValue<int>() ?? 1, Field("password")); break;
                case "identity.unlock": using (workspace.Vault.Unlock(Field("password"))) result = workspace.Vault.PublicIdentity(); break;
                case "identity.export": using (workspace.Vault.Unlock(Field("password"))) result = workspace.Vault.Export(); break;
                case "identity.restore": result = workspace.Vault.Restore(Field("backup"), Field("password")); break;
                case "remotes": result = (await RcloneTransport.Run(new[] { "listremotes" })).Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries); break;
                case "team.create": result = workspace.Create(Field("name"), Field("remote"), Field("password")); break;
                case "team.join": result = await workspace.Join(Data<DriveWorkspace.Invitation>("invitation"), Field("remote")); break;
                case "team.invite": result = workspace.Invite(Field("teamId")); break;
                case "team.update": workspace.ChangeMembership(Field("teamId"), request["member"]?.Deserialize<DriveWorkspace.Member>(DriveWorkspace.Json), request["ended"]?.GetValue<bool>(), request["removeKey"]?.GetValue<string>(), Field("password")); result = workspace.View(Field("teamId")); break;
                case "review.save": result = workspace.Save(Field("teamId"), Data<DriveWorkspace.Revision>("revision"), request["epoch"]!.GetValue<long>(), Field("password")); break;
                case "sync": result = await workspace.Sync(Field("teamId")); break;
                default: throw new ArgumentException("Unknown collaboration command.");
            }
            Console.WriteLine(JsonSerializer.Serialize(new { ok = true, result }, DriveWorkspace.Json)); return 0;
        }
        catch (Exception e)
        {
            var message = e is ArgumentException or InvalidDataException or InvalidOperationException or UnauthorizedAccessException ? e.Message : "Collaboration operation failed. Check storage access, rclone installation, and whether another operation is active.";
            Console.WriteLine(JsonSerializer.Serialize(new { ok = false, error = message }, DriveWorkspace.Json)); return 1;
        }
    }
}
