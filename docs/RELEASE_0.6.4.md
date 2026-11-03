# Poolr 0.6.4 release candidate

## User-visible changes

Redesigned dashboard and navigation; profile/team controls on the right; shared avatar/logo; collapsible sidebar; repaired theme controls and analysis-label wrapping; learning workspace; existing-review discovery from Protocol; native Drive workspace; team create/join/switch/end/reopen; encrypted identity recovery; signed membership and revisions; review conflict preservation; project-backed manuscript assignments, reviewer, due date, comments and checkpoints.

## Data and security changes

Project normalization retains advanced-analysis branches and stable project IDs. Saves are serialized, use unique temporary files and do not delete the original on rename failure. Arbitrary file load/save is native-only. Obsolete HTTP Google token and browser-launch endpoints were removed. HTTP origins are allowlisted and JSON content is required for POSTs. The desktop applies a content security policy and external URLs are restricted to HTTP(S).

Rclone runs with explicit arguments, bounded output and timeouts. Immutable, signed files are exchanged instead of synchronizing an open database. Owner-signed policy revisions freeze accepted old-epoch changes; revoked members cannot mint new backdated changes accepted by updated clients. Local authority checkpoints reject rollback. Conflicting owner policies fail closed. Missing/cross-project revision parents cannot hide another review.

## Validation and remaining release gates

Local checks: frontend production build, 42 frontend tests, 227 engine tests including actual rclone transport between isolated peers, Rust check and Clippy with warnings denied. Rerun after final modifications; CI is the authoritative record for the release commit. Existing frontend/.NET warnings are not a zero-warning claim.

Required before public release: successful artifacts for every matrix target, native install smoke tests, real two-account Google Drive/OAuth verification, screenshot refresh and update-install migration test. No thousand-user benchmark or independent security audit has been completed. Do not publish the draft as fully validated until these gates are satisfied.

## Setup and migration

Use rclone-configured shared folders. Rclone handles OAuth, but Google still requires authorization and may require a custom OAuth client. Existing browser OAuth tokens are no longer used for collaboration. Local-only old discussion metadata is not silently transformed into verified team data. Export old drafts before migration.

Back up project files and identity vaults. The updater trust key was replaced because the earlier private key was unavailable. Old clients require a manual verified installation to establish the new trust key. Update signing does not imply Windows Authenticode or Apple notarization.

## Known limits

Snapshot revisions are bounded to 1 MiB signed payloads and 10,000 objects per team. There is no automatic compaction, key rotation, rich-text CRDT merge, invitation email service, or background synchronization when the app is closed. Sync intervals are jittered approximately 45–60 seconds when visible/online. A failed transfer retains the local outbox. Editors/reviewers have equal content scope; only the owner changes assignments. The UI does not grant/revoke Google folder ACLs. Drive readers can read unencrypted content, writers can delete objects, and remote availability depends on the provider. Use Drive permissions and optional rclone crypt accordingly.

Linux AppImage packaging omits the optional .NET LTTng profiling provider, whose obsolete liblttng-ust.so.0 dependency is unavailable on modern distributions. Statistical execution, encryption and ordinary application logging remain enabled.

Validation update, 3 November 2026: live Google Drive transport passed using two separate Poolr identities with one configured Google account. Upload/download, shared review propagation and ended-team policy propagation succeeded; the disposable remote fixture was moved to Drive trash. This does not verify cross-account ACL behavior. The refreshed six-target installer matrix and signing checks passed at commit 70922ea. All 25 published draft assets and 11 updater signatures verified; the Linux x64 AppImage was installed and smoke-tested on Omarchy.

## Linux AppImage and branding refresh

The first Linux AppImage bundled host display-stack libraries that conflict with newer Mesa/WebKit EGL initialization. Tauri CLI 2.12.1 or newer supplies the updated AppImage bundler. CI inspects the finished AppImage and fails if the incompatible bundled `libwayland-client` is present. The final Linux AppImage excludes that library, passed the CI check, and launched on the target Omarchy Wayland/Mesa laptop. WebKit stayed alive and the bundled engine health check succeeded. The same full native install/update acceptance is still outstanding for the other OS/architecture targets.

The supplied wordmark is used in the expanded workspace and README. The pin-only mark is used in collapsed navigation and generated Windows, macOS and Linux app icons.
