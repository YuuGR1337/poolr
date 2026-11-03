# v0.6.4 release candidate verification

Branch: `release/v0.6.4`; pull request: https://github.com/harisawan-bit/poolr/pull/73

## Implemented

- [x] Profile/team header, supplied wordmark, pin-only collapsed sidebar, generated pin app icons and theme controls
- [x] Readable analysis hub and provider favicons with text labels
- [x] Review/outcome presets, research discovery and learning workspace
- [x] Stable project identities and advanced-data migration preservation
- [x] Project-scoped manuscript sections, assignments, reviewers, dates, comments and checkpoints
- [x] Team create/join/switch/end/reopen; native signature and membership checks
- [x] Native rclone transport, durable outbox, periodic synchronization and explicit conflict handling
- [x] New updater trust key, private GitHub signing secret and signed artifact workflow
- [x] README screen-by-screen guide, standalone wordmark asset, collaboration architecture, release notes, citation and screenshots

## Verified

- [x] 227 engine tests, including two independent signing peers over actual rclone local transport
- [x] 42 frontend tests, production build, lint gate and dependency audit
- [x] C# format/security checks; Rust format and Clippy with warnings denied
- [x] Browser routes, light/dark themes, sidebar collapse and screenshots
- [x] Browser-to-engine hazard-ratio input preservation and zero-event analysis
- [x] Removed HTTP file endpoint returns 404; unauthorized web origin returns 403
- [x] Real Google Drive transport with two app identities using one Google account; disposable fixture moved to Drive trash
- [x] Six-target signed installer matrix passed on commit 70922ea; all 25 release assets, 11 updater signatures and 13 manifest entries verified

## External acceptance gates

- [ ] Real two-account Google folder ACL/revocation test
- [x] Linux x64 AppImage installed and launched on Omarchy; WebKit remained alive without EGL error and bundled engine health passed
- [ ] Native install/update acceptance on remaining OS and architectures
- [ ] Independent security audit and thousand-user load benchmark
- [ ] Apple notarization / Windows platform code-signing certificates (updater signatures are configured)

Keep the release draft until acceptance. Existing installations trusting the lost updater key must manually install a verified new release. This checklist does not claim cryptographic permission records prevent external Drive deletion or reading; Drive ACLs and optional crypt remotes remain essential.
