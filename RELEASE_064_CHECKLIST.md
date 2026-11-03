# v0.6.4 release work

Branch: release/v0.6.4. Preserve the existing UI changes from main.

Architecture update: no hosted identity service or cPanel. Follow `docs/DRIVE_COLLABORATION.md`: pinned signing identities, owner-authorized membership, local working databases and immutable Drive change exchange. The earlier hosted-service prototype is excluded from this release.

- [ ] Profile/team header, shared avatar/logo, collapsible sidebar and accessible themes
- [ ] Readable analysis hub and provider identity
- [ ] Guided review presets, research discovery and learning workspace
- [ ] Stable identities and lossless project migrations
- [ ] Project-scoped manuscripts, assignments, review states and revision history
- [ ] Team create/join/switch/end/reopen and enforceable membership permissions
- [ ] Native rclone transport, persistent queue, continuous sync and conflict handling
- [ ] Updater trust recovery/rotation and signed update workflow
- [ ] Frontend build/lint/tests and security audit
- [ ] C# build/tests/format and Rust build/tests/clippy/format
- [ ] Browser workflow, keyboard, light/dark and narrow-window checks
- [ ] Cross-platform installer builds and artifact verification
- [ ] README, architecture, roadmap, release notes, citation and screenshots

Do not mark remote collaboration verified without two independently authorized accounts.
Do not claim signed updater migration from old installations without inspecting their trust key.
Do not publish a release with failing checks or missing required installers.
