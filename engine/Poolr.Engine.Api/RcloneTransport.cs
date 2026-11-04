using System.Diagnostics;

namespace Poolr.Engine.Api;

public static class RcloneTransport
{
    public static async Task<string> Run(string[] args, CancellationToken cancellation = default)
    {
        var bundled = Path.Combine(AppContext.BaseDirectory, OperatingSystem.IsWindows() ? "rclone.exe" : "rclone");
        using var process = new Process { StartInfo = new(File.Exists(bundled) ? bundled : "rclone") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true, CreateNoWindow = true } };
        foreach (var arg in args) process.StartInfo.ArgumentList.Add(arg);
        process.Start();
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellation);
        timeout.CancelAfter(TimeSpan.FromMinutes(2));
        var stdout = ReadBounded(process.StandardOutput, timeout.Token);
        var stderr = ReadBounded(process.StandardError, timeout.Token);
        try { await process.WaitForExitAsync(timeout.Token); await Task.WhenAll(stdout, stderr); }
        catch { if (!process.HasExited) process.Kill(true); throw new IOException("Storage operation was cancelled or exceeded its limits."); }
        if (process.ExitCode != 0) throw new IOException("Rclone could not complete the transfer. Check the remote, connectivity and Drive permissions. Your local changes are retained.");
        return await stdout;
    }
    private static async Task<string> ReadBounded(StreamReader reader, CancellationToken cancellation)
    {
        var result = new System.Text.StringBuilder();
        var buffer = new char[4096]; int read;
        while ((read = await reader.ReadAsync(buffer.AsMemory(), cancellation)) > 0)
        {
            if (result.Length + read > 2 * 1024 * 1024) throw new IOException("Command output exceeds the limit.");
            result.Append(buffer, 0, read);
        }
        return result.ToString();
    }
    public static void ValidateRemote(string remote)
    {
        if (string.IsNullOrWhiteSpace(remote) || remote.Length > 512 || remote.StartsWith(':') || remote.StartsWith('-') || !remote.Contains(':') || remote.Contains('\n') || remote.Contains('\r') || remote.Contains('\0') || remote.Split('/', '\\').Any(p => p == "..")) throw new ArgumentException("Select a configured rclone remote and a dedicated team folder.");
        var name = remote[..remote.IndexOf(':')];
        if (remote[(remote.IndexOf(':') + 1)..].Split('/', '\\').Any(p => p == "..")) throw new ArgumentException("Parent paths are not allowed in a remote.");
        if (!System.Text.RegularExpressions.Regex.IsMatch(name, "^[a-zA-Z0-9 _.-]+$")) throw new ArgumentException("Invalid remote name.");
    }
    public static Task Upload(string local, string remote) => Run(new[] { "copyto", local, remote, "--immutable", "--retries", "2", "--contimeout", "10s", "--timeout", "30s" });
    public static Task Fetch(string remote, string local) => Run(new[] { "copy", remote, local, "--ignore-existing", "--include", "*.json", "--max-size", "2M", "--max-transfer", "32M", "--checkers", "2", "--transfers", "2", "--retries", "2", "--contimeout", "10s", "--timeout", "30s" });
}
