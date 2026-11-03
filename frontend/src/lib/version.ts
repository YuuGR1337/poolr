// Single source of truth for poolr's version as displayed by the UI.
// Bumped together with package.json / tauri.conf.json / Cargo.toml /
// Program.cs at release time. The sidebar footer and copyright read this
// constant — they are never hardcoded again (v0.4.0 leaked into v0.5.1).
export const APP_VERSION = "0.6.4";
