using System;
using System.IO;
using System.Text.Json;

namespace Poolr.Engine.Api;

/// <summary>
/// Persistence for poolr.json. Atomic write (temp file + rename) with a rolling .bak,
/// so a multi-day MA survives a force-close (Phase E requirement). Matches the
/// python/poolr/main.py project_data schema (loose dictionary round-trip).
/// </summary>
public static class ProjectStore
{
    private static readonly JsonSerializerOptions Opt = new() { WriteIndented = true };

    public static object Load(string path)
    {
        // Primary load; fall back to the rolling .bak if the primary is missing or corrupt
        // (Phase E acceptance: a multi-day MA must survive a force-close / bad primary).
        if (File.Exists(path))
        {
            try
            {
                var txt = File.ReadAllText(path);
                return JsonSerializer.Deserialize<object>(txt)
                    ?? throw new InvalidDataException("poolr.json is empty or invalid.");
            }
            catch (Exception ex)
            {
                var bak = path + ".bak";
                if (File.Exists(bak))
                {
                    try
                    {
                        var bakTxt = File.ReadAllText(bak);
                        var restored = JsonSerializer.Deserialize<object>(bakTxt)
                            ?? throw new InvalidDataException("poolr.json.bak is also invalid.", ex);
                        // Promote the good backup to primary so the next save is clean.
                        try { File.Copy(bak, path, overwrite: true); } catch { /* best-effort */ }
                        return restored;
                    }
                    catch { /* fall through to throw below */ }
                }
                throw new InvalidDataException($"Could not load poolr.json or its backup: {ex.Message}", ex);
            }
        }

        var bakOnly = path + ".bak";
        if (File.Exists(bakOnly))
        {
            var bakTxt = File.ReadAllText(bakOnly);
            return JsonSerializer.Deserialize<object>(bakTxt)
                ?? throw new InvalidDataException("poolr.json.bak is invalid.");
        }

        throw new FileNotFoundException("No poolr.json found at the given path.", path);
    }

    public static string Save(string path, object project)
    {
        var dir = Path.GetDirectoryName(Path.GetFullPath(path)) ?? ".";
        Directory.CreateDirectory(dir);
        var json = JsonSerializer.Serialize(project, Opt);
        var tmp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        var bak = path + ".bak";

        // rolling backup of the previous good file (written BEFORE the temp swap,
        // so a crash mid-write always leaves the last good copy at <path>.bak)
        if (File.Exists(path))
        {
            try { File.Copy(path, bak, overwrite: true); } catch { /* best-effort */ }
        }
        // atomic write: fully materialise the temp file, then replace the target in a
        // single move. File.Move(overwrite:true) maps to MoveFileEx/REPLACE_EXISTING, so
        // there is no window where <path> is missing (the old Delete+Move had one).
        File.WriteAllText(tmp, json);
        try
        {
            File.Move(tmp, path, overwrite: true);
        }
        finally
        {
            if (File.Exists(tmp)) File.Delete(tmp);
        }
        return path;
    }
}
