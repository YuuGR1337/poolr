# Drive-backed collaboration: v0.6.4 implementation contract

Status: implementation in progress. This supersedes the hosted Poolr identity-service proposal. No cPanel account, database or credentials are needed. The server prototype has been moved outside the repository to the local work directory; it is not a deployment component.

## Honest guarantees

Poolr can authenticate signed edits, reject unauthorized operations in conforming clients, encrypt project content, recover from interrupted transfers and work offline. It cannot guarantee uninterrupted connectivity, prevent a Drive writer from deleting remote objects, stop a modified client from editing its own local copy, or revoke already downloaded plaintext. Google Drive is the exchange service, so this is decentralized ownership with Drive-mediated sync, not direct peer-to-peer networking.

Passwords are not team authority. Hashing/salting does not prevent permission-file tampering. Do not put password databases, private signing keys, OAuth tokens or unencrypted recovery secrets into a shared project folder.

## Storage layout

Each review has an immutable project UUID and a separate project folder owned by its creator. Team metadata references projects without merging their permissions or data.

```
Poolr/projects/<project-uuid>/
  authority/     owner-signed, chained membership revisions
  events/        immutable, author-signed change batches
  checkpoints/   verified compact snapshots of accepted history
  attachments/   content-addressed encrypted files
```

The working database stays on each device's local disk. Never open a live SQLite database through an rclone mount and never synchronize its WAL/SHM files. Upload immutable snapshots or change batches; restore into a new local database after validation. The published snapshots are not concurrent mutable databases.

## Identity and authority

1. Generate signing keys with the operating system cryptographic library. The prototype uses .NET P-256 ECDSA/SHA-256, with a versioned domain separator and exact serialized payload bytes. No handwritten cryptographic primitives.
2. Keep private keys in OS-backed secret storage or a passphrase-encrypted portable key vault. Never browser localStorage or a shared Drive folder. Enrollment/recovery must be implemented before enabling production sharing.
3. Pin the owner's public-key fingerprint from an invitation verified outside the untrusted project folder. Do not trust a public key supplied by the same file being verified.
4. The owner signs membership revisions: project ID, previous revision hash, monotonically increasing epoch, member public keys, roles and permitted sections.
5. Every edit carries a project ID, unique operation ID, author key ID, authority epoch and base revision. Verify its signature, current membership, scope and replay status before applying it.
6. An admin may request/end a team according to an owner-signed delegation. Only the owner may reopen it. Ended-team clients accept new edits only from the owner, and underlying Drive access is downgraded where possible.
7. An epoch change suspends old-epoch queued writes. Preserve offline work as a local draft; ask an authorized member to rebase/approve it. Do not trust author timestamps as proof that a write preceded revocation.
8. A remembered newer authority head prevents rollback on that device. A newly enrolled device must obtain a current trusted checkpoint. A partitioned client cannot know about a revocation it has not received; UI must disclose that limitation.

## Confidentiality and key lifecycle

Use authenticated encryption and unique nonces through a reviewed library, with per-project keys wrapped to authorized members. Separate signing and encryption keys. Rotate project encryption keys after membership revocation for future content. Old content already decrypted cannot be taken back. Recovery is an explicitly exported, encrypted owner backup; losing all owner keys must not create a silent administrator bypass.

Rclone crypt is useful for transport-level encryption but sharing one crypt password gives every holder equivalent decryption access; it is not a replacement for signed roles, per-member grants or revocation. Do not claim end-to-end encryption until key distribution, rotation, recovery and attachment handling are implemented and tested.

## Sync and cache

- Durable local outbox; mark changes pending before attempting network transfer.
- One worker per project; coalesce edits and upload unique immutable batches. Retry with jitter and exponential backoff; never destructive whole-folder sync.
- Fetch authority changes before content; quarantine unknown signers, invalid signatures, missing parents and forked authority histories.
- Maintain deduplication by operation ID and content hash. Validate sizes, schemas and paths before allocation or persistence.
- Merge independent fields/sections against their common base. Preserve same-field conflicts for review; do not use last-writer-wins for eligibility, extracted values, permissions or manuscript text.
- Keep verified local snapshots and bounded attachment caches. Never evict unsynced data; explicit user-controlled offline pinning is separate from cache eviction.
- Poll active projects adaptively, slow down inactive/background work and pause on throttling. Persist cursors/checkpoints. Drive push requires an HTTPS receiver, so the no-server design cannot assume webhooks.
- Show separate states: saved locally, uploading, waiting for network, synchronized to last check, conflict, revoked access, corrupt remote content.
- Configuration is external: selected rclone remote, folder IDs, polling policy, cache budget and OAuth client settings. No embedded credentials or account IDs. Safe defaults and protocol constants are not secrets.

## Scale and security checks

Thousands of users across independent teams are not the same as thousands of simultaneous editors in one project. Benchmark both before making scale claims. Measure requests/user/minute, bytes transferred, cold start/rebuild time, memory, outbox recovery and provider quota behavior. Avoid full remote listings on every keystroke and unbounded per-operation files without checkpointing/compaction.

Required adversarial cases: changed payload, substituted owner key, copied cross-project event, old membership epoch, duplicate operation, revoked writer, ended-team write, malicious checkpoint, remote deletion, same-field conflict, replay after reinstall, key loss, failed key rotation, oversized input and path traversal. Native process calls must use argument arrays and bounded execution; rclone credentials must never be returned to the renderer. Signed application updates and restrictive native capabilities remain mandatory.

## Current implementation boundary

The release candidate implements a native encrypted identity vault, pinned-owner membership chain, immutable signed snapshot revisions, bounded rclone transport, persistent outbox, periodic synchronization and explicit concurrent-version resolution. Manuscript data travels inside each project snapshot. Two isolated peers have been tested through rclone's local backend; this is not a real Google OAuth or two-account Drive test.

Editor and reviewer roles currently share content-write rights. Only the owner changes assignments, team membership or closure. Assignment metadata is coordination, not per-section confidentiality. The owner cannot prevent a person with Drive write permission from deleting remote files. Local caches preserve previously fetched records; newly installed clients depend on available remote history and a trustworthy invitation.

Limits: 1 MiB signed payload, 10,000 objects/team, no compaction or live SQLite replication. New edits are debounced and sync is jittered 45–60 seconds while visible and online. There is no guaranteed always-online peer, global live-presence service or verified thousand-user capacity. See RELEASE_0.6.4.md for remaining gates.

## Sources checked 2 November 2026

- SQLite network database caveats: https://www.sqlite.org/useovernet.html
- Drive roles: https://developers.google.com/workspace/drive/api/guides/ref-roles
- Drive push notifications / HTTPS receiver: https://developers.google.com/workspace/drive/api/guides/push
- Rclone Drive / custom OAuth client: https://rclone.org/drive/
- Rclone crypt and its scope: https://rclone.org/crypt/

The installed local rclone version was 1.75.2. Current documentation includes newer behavior; validate features against the packaged version. Real Google OAuth and two-account access tests remain required.

Validation update, 3 November 2026: live Google Drive transport passed using two separate Poolr identities with one configured Google account. Upload/download, shared review propagation and ended-team policy propagation succeeded; the disposable remote fixture was moved to Drive trash. This does not verify cross-account ACL behavior. The six-target installer matrix passed at commit 3ce55c8.
