using System.Security.Cryptography;
using System.Text.Json;

namespace Poolr.Engine.Api;

public sealed class CollaborationVault
{
    public sealed record Identity(string Name, int Avatar, string PublicKey, string KeyId);
    private sealed record VaultFile(Identity Identity, string EncryptedKey);
    private readonly string path;
    public CollaborationVault(string root) { Directory.CreateDirectory(root); path = Path.Combine(root, "identity.json"); }
    public Identity? PublicIdentity() => File.Exists(path) ? JsonSerializer.Deserialize<VaultFile>(File.ReadAllText(path))!.Identity : null;
    public Identity Create(string name, int avatar, string password)
    {
        if (File.Exists(path)) throw new InvalidOperationException("An identity already exists. Back it up before creating another.");
        if (string.IsNullOrWhiteSpace(name) || name.Length > 80 || avatar is < 1 or > 4 || password.Length < 12 || password.Length > 256) throw new ArgumentException("Use a name, avatar and a 12–256 character vault passphrase.");
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var pub = key.ExportSubjectPublicKeyInfo();
        var identity = new Identity(name.Trim(), avatar, Convert.ToBase64String(pub), CollaborationSignatures.KeyId(pub));
        var encrypted = key.ExportEncryptedPkcs8PrivateKey(password, new PbeParameters(PbeEncryptionAlgorithm.Aes256Cbc, HashAlgorithmName.SHA256, 600_000));
        using (var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
            JsonSerializer.Serialize(stream, new VaultFile(identity, Convert.ToBase64String(encrypted)));
            stream.Flush(true);
        }
        return identity;
    }
    public ECDsa Unlock(string password)
    {
        var file = JsonSerializer.Deserialize<VaultFile>(File.ReadAllText(path)) ?? throw new InvalidDataException("Invalid identity vault.");
        var key = ECDsa.Create();
        try
        {
            var bytes = Convert.FromBase64String(file.EncryptedKey);
            key.ImportEncryptedPkcs8PrivateKey(password, bytes, out var consumed);
            if (consumed != bytes.Length || CollaborationSignatures.KeyId(key.ExportSubjectPublicKeyInfo()) != file.Identity.KeyId) throw new CryptographicException();
            return key;
        }
        catch { key.Dispose(); throw new InvalidOperationException("Could not unlock identity. Check your passphrase or restore your encrypted backup."); }
    }
    public string Export() => File.ReadAllText(path);
    public Identity Restore(string backup, string password)
    {
        if (File.Exists(path)) throw new InvalidOperationException("An identity already exists; restoration will not overwrite it.");
        if (backup.Length > 32_768) throw new InvalidDataException("Invalid backup size.");
        var file = JsonSerializer.Deserialize<VaultFile>(backup) ?? throw new InvalidDataException("Invalid backup.");
        using var key = ECDsa.Create();
        var bytes = Convert.FromBase64String(file.EncryptedKey);
        key.ImportEncryptedPkcs8PrivateKey(password, bytes, out var consumed);
        if (consumed != bytes.Length || CollaborationSignatures.KeyId(key.ExportSubjectPublicKeyInfo()) != file.Identity.KeyId || Convert.ToBase64String(key.ExportSubjectPublicKeyInfo()) != file.Identity.PublicKey) throw new InvalidDataException("Backup identity mismatch.");
        using var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
        JsonSerializer.Serialize(stream, file); stream.Flush(true); return file.Identity;
    }
}
