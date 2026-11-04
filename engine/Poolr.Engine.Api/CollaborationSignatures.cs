using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Poolr.Engine.Api;

/// <summary>
/// Verifies immutable collaboration envelopes against an already trusted public key.
/// Key enrollment, replay tracking and authorization are separate checks; a valid signature alone grants no permissions.
/// </summary>
public static class CollaborationSignatures
{
    public const int MaxPayloadBytes = 1024 * 1024;
    private static readonly byte[] Domain = Encoding.UTF8.GetBytes("poolr.collaboration.v1\0");
    public sealed record Payload(int Version, string ProjectId, string AuthorKeyId, long Epoch, string OperationId, string Kind, string Body);
    public sealed record Envelope(string PayloadBase64, string SignatureBase64);

    public static string KeyId(byte[] subjectPublicKeyInfo) => Convert.ToHexString(SHA256.HashData(subjectPublicKeyInfo));

    public static Envelope Sign(Payload payload, ECDsa privateKey)
    {
        Validate(payload);
        if (privateKey.ExportParameters(false).Curve.Oid.Value != ECCurve.NamedCurves.nistP256.Oid.Value) throw new ArgumentException("Expected a P-256 signing key.");
        if (payload.AuthorKeyId != KeyId(privateKey.ExportSubjectPublicKeyInfo())) throw new ArgumentException("Author does not match signing key.");
        var bytes = JsonSerializer.SerializeToUtf8Bytes(payload);
        if (bytes.Length > MaxPayloadBytes) throw new ArgumentException("Collaboration payload is too large.");
        return new(Convert.ToBase64String(bytes), Convert.ToBase64String(privateKey.SignData(Message(bytes), HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation)));
    }

    public static Payload Verify(Envelope envelope, byte[] pinnedPublicKey, string expectedProject, long expectedEpoch)
    {
        if (pinnedPublicKey.Length > 1024 || envelope.PayloadBase64.Length > ((MaxPayloadBytes + 2) / 3) * 4 || envelope.SignatureBase64.Length > 128) throw new InvalidDataException("Envelope exceeds allowed size.");
        try
        {
            var bytes = Convert.FromBase64String(envelope.PayloadBase64);
            var signature = Convert.FromBase64String(envelope.SignatureBase64);
            using var key = ECDsa.Create();
            key.ImportSubjectPublicKeyInfo(pinnedPublicKey, out var consumed);
            if (consumed != pinnedPublicKey.Length || key.ExportParameters(false).Curve.Oid.Value != ECCurve.NamedCurves.nistP256.Oid.Value || bytes.Length > MaxPayloadBytes || signature.Length != 64 || !key.VerifyData(Message(bytes), signature, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation)) throw new InvalidDataException("Invalid collaboration signature.");
            var payload = JsonSerializer.Deserialize<Payload>(bytes) ?? throw new InvalidDataException("Empty payload.");
            Validate(payload);
            if (payload.AuthorKeyId != KeyId(pinnedPublicKey) || payload.ProjectId != expectedProject || payload.Epoch != expectedEpoch) throw new InvalidDataException("Unexpected author, project or membership epoch.");
            return payload;
        }
        catch (Exception e) when (e is FormatException or CryptographicException or JsonException or ArgumentException)
        {
            throw new InvalidDataException("Malformed collaboration envelope.", e);
        }
    }

    private static byte[] Message(byte[] payload)
    {
        var message = new byte[Domain.Length + payload.Length];
        Domain.CopyTo(message, 0); payload.CopyTo(message, Domain.Length); return message;
    }

    private static void Validate(Payload payload)
    {
        if (payload.Version != 1 || !Guid.TryParseExact(payload.ProjectId, "D", out _) || !Guid.TryParseExact(payload.OperationId, "D", out _) || payload.Epoch < 0 || payload.AuthorKeyId?.Length != 64 || payload.Kind is not ("membership" or "change" or "checkpoint") || payload.Body is null) throw new InvalidDataException("Invalid collaboration payload fields.");
    }
}
