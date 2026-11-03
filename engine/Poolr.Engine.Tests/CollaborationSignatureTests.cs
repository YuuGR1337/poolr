using System.Security.Cryptography;
using Poolr.Engine.Api;
using Xunit;

namespace Poolr.Engine.Tests;

public class CollaborationSignatureTests
{
    private static CollaborationSignatures.Payload Payload(ECDsa key) => new(1, Guid.NewGuid().ToString(), CollaborationSignatures.KeyId(key.ExportSubjectPublicKeyInfo()), 3, Guid.NewGuid().ToString(), "change", "{\"section\":\"methods\"}");

    [Fact]
    public void ValidSignaturePreservesExactPayload()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var payload = Payload(key);
        var signed = CollaborationSignatures.Sign(payload, key);
        Assert.Equal(payload, CollaborationSignatures.Verify(signed, key.ExportSubjectPublicKeyInfo(), payload.ProjectId, payload.Epoch));
    }

    [Fact]
    public void EditingContentWithoutSigningIsRejected()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var payload = Payload(key);
        var signed = CollaborationSignatures.Sign(payload, key);
        var bytes = Convert.FromBase64String(signed.PayloadBase64);
        bytes[^3] ^= 1;
        Assert.Throws<InvalidDataException>(() => CollaborationSignatures.Verify(signed with { PayloadBase64 = Convert.ToBase64String(bytes) }, key.ExportSubjectPublicKeyInfo(), payload.ProjectId, 3));
    }

    [Fact]
    public void AttackerCannotReplacePinnedOwnerKey()
    {
        using var owner = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        using var attacker = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var payload = Payload(attacker);
        var signed = CollaborationSignatures.Sign(payload, attacker);
        Assert.Throws<InvalidDataException>(() => CollaborationSignatures.Verify(signed, owner.ExportSubjectPublicKeyInfo(), payload.ProjectId, 3));
    }

    [Fact]
    public void CrossProjectAndOldEpochReplayAreRejected()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var payload = Payload(key);
        var signed = CollaborationSignatures.Sign(payload, key);
        Assert.Throws<InvalidDataException>(() => CollaborationSignatures.Verify(signed, key.ExportSubjectPublicKeyInfo(), Guid.NewGuid().ToString(), 3));
        Assert.Throws<InvalidDataException>(() => CollaborationSignatures.Verify(signed, key.ExportSubjectPublicKeyInfo(), payload.ProjectId, 4));
    }

    [Fact]
    public void InvalidAndOversizedEnvelopesFailClosed()
    {
        using var key = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var payload = Payload(key);
        Assert.Throws<InvalidDataException>(() => CollaborationSignatures.Verify(new("not base64", "invalid"), key.ExportSubjectPublicKeyInfo(), payload.ProjectId, 3));
        Assert.Throws<ArgumentException>(() => CollaborationSignatures.Sign(payload with { Body = new string('x', CollaborationSignatures.MaxPayloadBytes) }, key));
    }
}
