# v0.6.4 — release candidate

See [release notes](docs/RELEASE_0.6.4.md) and the draft installer builds. Prior releases below are historical.

# poolr Releases

## Latest Release

**poolr v0.6.3** — Commercial Platform, Google Drive BYOS & Team Collaboration
Release date: 2026-09-18

> Major milestone release introducing commercial foundation, Google OAuth identity, Bring-Your-Own-Storage (BYOS) Google Drive sync with structured directory hierarchies, 4-tier Role-Based Access Control (Owner, Editor, Reviewer, Viewer), visual 3-way conflict resolution, inline review step discussions, ICMJE/CRediT-compliant active-time authorship tracking, and Windows WebView2 solid background rendering.

### Native Desktop Installers (v0.6.3)

| Platform | Architecture | Installer Package | Direct Download |
|---|---|---|---|
| **Windows** | x64 (Standard) | `.msi` (Enterprise) / `.exe` (NSIS) | [poolr_0.6.3_x64_en-US.msi](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_x64_en-US.msi) · [poolr_0.6.3_x64-setup.exe](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_x64-setup.exe) |
| **Windows** | ARM64 (Surface / Snapdragon) | `.msi` / `.exe` | [poolr_0.6.3_arm64_en-US.msi](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_arm64_en-US.msi) · [poolr_0.6.3_arm64-setup.exe](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_arm64-setup.exe) |
| **Windows** | x86 (32-bit Legacy) | `.msi` / `.exe` | [poolr_0.6.3_x86_en-US.msi](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_x86_en-US.msi) · [poolr_0.6.3_x86-setup.exe](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_x86-setup.exe) |
| **macOS** | Apple Silicon (M1/M2/M3/M4) | `.dmg` | [poolr_0.6.3_aarch64.dmg](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_aarch64.dmg) |
| **macOS** | Intel x64 | `.dmg` | [poolr_0.6.3_x64.dmg](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_x64.dmg) |
| **Linux** | x86_64 (Debian / Ubuntu / Mint) | `.deb` | [poolr_0.6.3_amd64.deb](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr_0.6.3_amd64.deb) |
| **Linux** | x86_64 (Fedora / RHEL / openSUSE)| `.rpm` | [poolr_0.6.3-1.x86_64.rpm](https://github.com/harisawan-bit/poolr/releases/download/v0.6.3/poolr-0.6.3-1.x86_64.rpm) |

### What's New in v0.6.3

- **Google OAuth & Identity**: Integrated Sign-in with Google, dynamic Client ID configuration, runtime GIS token acquisition, and Bearer token user profile fetching.
- **Structured Google Drive BYOS**: Zero-server cloud sync into clean, structured folder trees (`Poolr Workspace/Projects/{Title}_{UUID}/`), RFC 2387 multipart uploads preventing data truncation, automated subfile sync (`changelog.json`, `permissions.json`, `comments.json`, `authorship.json`, `manuscript.json`), and Drive team sharing.
- **Enterprise RBAC**: 4 granular role tiers (`owner`, `editor`, `reviewer`, `viewer`) controlling edit privileges, member invitations, and stage promotion.
- **Concurrent Editing Protections**: Section soft locks with automatic heartbeat expiration, append-only delta logging with sha256 checksums, and visual 3-way conflict resolution.
- **Step-Level Review Comments**: Unified inline commenting drawer across Protocol, Screening, Extraction, Risk of Bias, and Meta-Analysis with resolved/unresolved filtering.
- **ICMJE Authorship & Active-Time Tracking**: Window focus and input monitoring generating CReDiT-compliant contribution statements with Markdown export.
- **Window Bug Fix**: Explicit solid background rendering for Windows WebView2 preventing transparent/blank windows.
- **Commercial Legal Protection**: Updated EULA, Terms of Service, and Privacy Policy for Muhammad Haris Awan (d/b/a The Method Lab) reserving unilateral monetization and feature gating rights.

---

## Previous Releases

### poolr v0.6.1
Release date: 2026-09-15

### What's New in v0.6.0

**Interactive Figure Studio & Visualizations**
- **Cochrane robvis Figures**: Real-time vector SVG Traffic Light and Weighted Summary Bar figures adhering to McGuinness & Higgins (2021) standards with 1-click SVG download.
- **Contour-Enhanced Funnel Plots**: Identifies publication bias vs small-study effects by mapping $p < 0.10, 0.05, 0.01$ significance contours.
- **Diagnostic Vector Plots**: Galbraith radial plots (outlier detection), L'Abbé plots (event-rate scatter), and Baujat plots (heterogeneity contribution vs effect influence).

**Statistical Rigor & Advanced Engines**
- **95% Prediction Interval**: Higgins (2009) and IntHout (2016) random-effects prediction intervals ($PI = \hat{\theta} \pm t_{k-2} \sqrt{SE^2 + \tau^2}$) displayed beneath pooled effects.
- **Trial Sequential Analysis (TSA)**: Evaluates Required Information Size (RIS), accrued fraction, and O'Brien-Fleming monitoring boundary crossing status.
- **Model Averaging (Multimodel Inference)**: Generates AICc-weighted pooled estimates across DL, REML, Paule-Mandel, Empirical Bayes, Hunter-Schmidt, and Sidik-Jonkman.
- **Specialized Analyses Hub**: Dedicated modals for Dose-Response (spline), Survival RMST, Health Economics (ICER/INMB), Adverse Events, and Decision Curve Analysis (DCA).

**Screening, Extraction & PRISMA 2020 Flow**
- **Promote Included to Full-Text**: 1-click promotion of title/abstract includes directly to full-text screening.
- **Priority Screening**: Machine-learning-assisted ranking of unreviewed citations against PICO criteria.
- **Inter-Rater Reliability**: $2 \times 2$ contingency table calculating Cohen's Kappa $\kappa$, 95% CI, observed agreement, Landis & Koch ratings, and copyable methods statements.
- **Auto-Sync PRISMA Flow**: Automatically extracts counts across identification, screening, and extraction into the PRISMA 2020 Sankey flow.
- **Cochrane Summary of Findings**: Automated GRADE evidence grading with OIS imprecision downgrades and copyable Markdown.

**Universal Manuscript & Replication Export**
- 1-click export of PRISMA 2020 Word Manuscripts (`.docx`), LaTeX journal templates (`.tex`), interactive standalone HTML reports (`.html`), R (`metafor`) replication scripts (`.R`), Stata scripts (`.do`), Python scripts (`.py`), BibTeX (`.bib`), and RIS (`.ris`).

**Engine Correctness & Zero-Warning Gate**
- Eliminated all 39 nullable dereference warnings (`CS8629`) across 15 engine components; `dotnet build` now runs with 0 warnings and 0 errors.
- Decision Curve Analysis (DCA): clamped evaluation threshold $p_t < 0.995$ to prevent infinity JSON serialization crashes.
- Safeguarded qualitative synthesis and trial sequential analysis against zero-division exceptions.
- Fitted dose-response points and survival sensitivity steps now serialize with named DTOs (`FittedPoint`, `TauSensitivityPoint`).
- Corrected within-subjects degrees of freedom in pre-post effect size calculation ($df = n - 1$).
- Health economics cost difference pooling restored to linear scale without logarithmic inversion.
- Freeman-Tukey double arcsine variance formula ($1/(n+0.5)$) and Miller back-transformation verified.
- Fixed-effect inverse-variance weights correctly applied in Cochran's $Q$ across IPD, Multilevel, and Cumulative engines.
- Fixed string interpolation in Stata script export and snapshot diffing in CollaborationEngine.
- Exposed `/api/advanced/*` HTTP routes in Program.cs.

**Frontend & User Experience**
- Eradicated mock random numbers (`Math.random()`) from Network, IPD, and Multilevel meta-analysis pages.
- Wired all advanced pages (`NetworkMeta`, `IPDMeta`, `MultilevelMeta`, `DiagnosticMeta`, `ProportionsMeta`, `QualitativeMeta`) to C# engine endpoints with rigorous offline fallbacks.
- Corrected Funnel Plot vertical axis orientation ($SE = 0$ apex at top).
- Adapted Forest Plot reference line to accurately position at $1$ for ratio measures and $0$ for continuous differences.
- Replaced mock literature generator with real NCBI E-utilities (PubMed), OpenAlex, Crossref, and ClinicalTrials.gov API integrations.
- Registered PubMed in `UnifiedSearch.tsx` search handlers.
- Corrected effect size conversion formulas (Zhang & Yu 1998, Chinn 2000) in `EffectSizeCalculator.tsx`.
- Auto-saved GRADE summary table and custom search strategies directly in `project.prisma.grade`.

### Validation

All CI gates pass:
- `dotnet test engine/Poolr.Engine.Tests/Poolr.Engine.Tests.csproj -c Release`: 67 passed, 0 failed.
- `dotnet format engine/Poolr.Engine.Api/Poolr.Engine.Api.csproj --verify-no-changes`: 0 warnings, verified clean.
- `npm run lint`: 0 errors.
- `npm run build`: verified clean.
- `npm test -- --run`: 38 passed, 0 failed.
- `cargo fmt --check`: verified clean.

---

**poolr v0.5.3** — Interface overhaul
Release date: 2026-08-26

> The same rigorous SRMA engine behind a completely reworked interface: light and dark themes with a persisted toggle, a floating dock instead of a sidebar, a boot splash and first-run personalization, a Ctrl+K command palette, live computation states while the engine works, a screening funnel with reviewer-team selection, and a live PRISMA flow diagram.

### What's New in v0.5.3

**Theming**
- Light and dark themes across every surface (pages, charts, canvas background field, native controls). One-click toggle in the header; choice persists between sessions. Dark remains poolr's signature monochrome look.
- All UI primitives rebuilt on design tokens so components and charts follow the theme automatically.

**Navigation & shell**
- Floating dock navigation (magnifying icon dock with tooltips and an active indicator) replaces the fixed sidebar; more room for content on every page.
- Boot splash greets you in multiple languages while local services start; optional first-run setup lets you pick an avatar and name (stored locally).
- Command palette on Ctrl+K for jumping to any page or running file actions.
- Profile menu (bottom-right): profile, appearance toggle, settings, and version/license information in one quiet place.
- Workspace options drawer: demo data, new workspace, theme — contextual panels without leaving your page.

**Working surfaces**
- Screening: animated PRISMA screening funnel plus a reviewer-count selector for dual screening.
- Meta-Analysis: shimmer state on the Run button while pooling computes, and a live stage panel showing exactly what the engine is doing (pooling, sensitivity, publication bias, figures).
- PRISMA: live Sankey flow diagram driven by your recorded numbers, plus a checklist/flow options drawer.

### Validation

All CI gates pass: C# format verification, frontend lint/type/build/Vitest, the engine xUnit suite, Rust fmt + clippy (-D warnings), and the .NET vulnerability scan. Packaged install smoke-tested end-to-end on Windows x64.

### Downloads (native installers)

| Platform | File | Notes |
|----------|------|-------|
| Windows x64 | `poolr_0.5.3_x64_en-US.msi` | Recommended for most PCs. Also ships `poolr_0.5.3_x64-setup.exe` (NSIS) installer. |
| Windows x86 | `poolr_0.5.3_x86_en-US.msi` | 32-bit Windows. |
| Windows ARM64 | `poolr_0.5.3_arm64_en-US.msi` | Windows on ARM. |
| macOS Apple Silicon | `poolr_0.5.3_aarch64.dmg` | Contains `poolr.app`. |
| macOS Intel | `poolr_0.5.3_x64.dmg` | Contains `poolr.app`. |
| Linux x86_64 | `poolr_0.5.3_amd64.deb` + `poolr-0.5.3-1.x86_64.rpm` | Debian or RPM package. |

---


**poolr v0.5.2** — Quality & correctness pass
Release date: 2026-08-26

> A focused maintenance release on top of v0.6.0's complete classical meta-analysis toolset: no more console-window flash on Windows launch, a truthful version string and connection indicator in the shell, and visible errors when the bundled demo project fails to load.

### What's New in v0.5.2

**Fixed**
- Launching poolr on Windows no longer opens (or flashes) a terminal window alongside the app. The bundled C# engine sidecar is spawned windowless (`CREATE_NO_WINDOW`, stdio detached) while keeping its crash-safe JobObject cleanup.
- The sidebar footer and copyright line now show the real app version from a single shared constant — they no longer display a stale hardcoded "v0.4.0".
- The connection indicator no longer sticks on "offline" right after launch: the shell polls the engine with backoff during cold start instead of giving up after one 1.5-second probe.
- Loading the bundled demo project surfaces an explicit error banner if it fails, instead of failing silently.

### Validation

All CI gates pass: C# format verification, frontend lint/type/build/Vitest, the engine xUnit suite, Rust fmt + clippy (-D warnings), and the .NET vulnerability scan. The packaged install was smoke-tested end-to-end: silent launch with no console window, engine health reporting 0.5.2, and demo-project load working.

### Downloads (native installers)

| Platform | File | Notes |
|----------|------|-------|
| Windows x64 | `poolr_0.5.2_x64_en-US.msi` | Recommended for most PCs. Also ships `poolr_0.5.2_x64-setup.exe` (NSIS) installer. |
| Windows x86 | `poolr_0.5.2_x86_en-US.msi` | 32-bit Windows. |
| Windows ARM64 | `poolr_0.5.2_arm64_en-US.msi` | Windows on ARM. |
| macOS Apple Silicon | `poolr_0.5.2_aarch64.dmg` | Contains `poolr.app`. |
| macOS Intel | `poolr_0.5.2_x64.dmg` | Contains `poolr.app`. |
| Linux x86_64 | `poolr_0.5.2_amd64.deb` + `poolr-0.5.2-1.x86_64.rpm` | Debian or RPM package. |

---


**poolr v0.6.0** — Complete classical meta-analysis
6|Release date: 2026-08-25
7|
8|> Everything a standard pairwise systematic review needs: Knapp-Hartung CIs, Mantel-Haenszel and Peto poolers validated against metafor's published outputs, leave-one-out/cumulative sensitivity, real trim-and-fill, PET/PEESE/p-curve/selection models/Henmi-Copas, proportions/rates/correlations/generic-IV outcomes, robvis-style RoB figures for six tools (now including ROBINS-I, QUADAS-2, AMSTAR-2), a GRADE Summary-of-Findings generator with OIS-based imprecision, R/metafor replication scripts, BibTeX/RIS citation export, structured exclusion reasons with automatic import de-duplication, a PRISMA 27-item checklist tracker, and a bundled demo project.
9|
10|### What's New in v0.6.0
11|
12|**Statistics engine**
13|- **Knapp-Hartung-Sidik-Jonman confidence intervals** (t-distribution on k-1 df) — recommended for random-effects pooling.
14|- **Mantel-Haenszel OR** (Robins-Breslow-Greenland variance) and **Peto one-step OR** — the RevMan defaults, numerically validated to match `metafor::rma.mh` / `rma.peto` on the classic BCG dataset (MH OR 0.6229 [0.5748, 0.6750]; Peto OR 0.6222).
15|- **Sensitivity suite**: leave-one-out table with influence ranking, cumulative meta-analysis by year, fixed-vs-random side-by-side comparison.
16|- **Publication-bias depth**: Egger + Begg, computed **trim-and-fill** (Duval-Tweedie L0), Peters & Harbord regressions, PET/PEESE, p-curve (right/left-skew tests), Henmi-Copas limit meta-analysis, and an experimental step-function selection model (3PSM). Fail-safe N (Rosenthal + Orwin).
17|- **Heterogeneity extensions**: H² statistic and I² 95% confidence interval (non-central chi-square method) alongside Q/I²/τ².
18|- **Subgroup analysis overhauled**: model-consistent per-group pooling with within-group heterogeneity and the **Q-between interaction test**.
19|- **New outcome types**: single-arm proportions (logit/arcsine), incidence rates (IRR/IRD), correlations (Fisher z), and generic inverse-variance entry; **Glass's delta** SMD variant.
20|- **Effect-size conversions**: OR↔RR↔RD↔NNT at a given control rate, SMD↔OR (Hasselblad-Hedges), median+IQR/range → mean/SD (Wan 2014), CI→SE.
21|
22|**Workflow**
23|- Structured exclusion reasons (PICO-failure tags) that feed PRISMA flow reporting.
24|- Automatic de-duplication on import (PMID / DOI / normalized-title matching) with duplicate counts surfaced.
25|- ROBINS-I, QUADAS-2 and AMSTAR-2 join RoB 2 / NOS / PROBAST as built-in tools.
26|
27|**Figures & reporting**
28|- **robvis-style traffic-light plot** and **weighted summary bar chart** for any RoB tool.
29|- Contour-enhanced funnel plot (p<.01/.05/.10 significance regions), Galbraith (radial), L'Abbe and Baujat plots in the engine API.
30|- **GRADE Summary-of-Findings generator**: Cochrane-style SoF tables with absolute-risk column, OIS-based imprecision assessment and explicit downgrade reasons.
31|- **R replication script export**: every analysis regenerable in `metafor` from the raw data.
32|- **Citation export**: BibTeX + RIS of included studies. Methods-section paragraph generator.
33|
34|**App**
35|- Meta-Analysis page: measure picker extended (MH/Peto/Glass/proportions/rates/correlations/generic IV), Knapp-Hartung toggle, sensitivity table with most-influential-study highlighting, I² CI + H² tiles, Q-between display, contour funnel card.
36|- Screening page: exclusion-reason dropdown on exclude decisions, dedup-aware imports.
37|- Risk of Bias page: six tools with correct domain sets incl. Critical overall rating.
38|- PRISMA page: interactive 27-item checklist tracker (auto-saved with the project).
39|- Bundled demo project (BCG vaccine dataset) loadable from the header — one click to explore a full review.
40|
41|### Validation
42|
43|Engine numerics are guarded by the xUnit suite (24 tests): MH and Peto poolers reproduce metafor's published BCG results; KH adjustment, subgroup Q-between, Wan 2014 conversions, OIS math and the noncentral-chi-square I² interval are benchmark-tested. The frontend parser/API suites (38 Vitest tests) continue to gate CI.
44|
45|### Downloads (native installers)
46|
47|| Platform | File | Notes |
48||----------|------|-------|
49|| Windows x64 | `poolr-windows-x64.msi` | Recommended for most PCs. Also ships `poolr-windows-x64.exe` (NSIS) installer. |
50|| Windows x86 | `poolr-windows-x86.msi` | 32-bit Windows. |
51|| Windows ARM64 | `poolr-windows-arm64.msi` | Windows on ARM. |
52|| macOS Apple Silicon | `poolr-macos-arm64.dmg` | Contains `poolr.app`. |
53|| macOS Intel | `poolr-macos-x64.dmg` | Contains `poolr.app`. |
54|| Linux x86_64 | `poolr-linux-x86_64.deb` + `poolr-linux-x86_64.rpm` | Debian or RPM package. |
55|
56|---
57|
58|
59|**poolr v0.5.0** — Quality & polish release  
60|Release date: 2026-08-24
61|
62|> Hardened CI with real gates, frontend unit-test suite, premium Bklit UI charts (screening rings, I² gauge, RoB radar, study-weight rings), pure-MIT license fix, and repo-professionalism pass.
63|
64|### What's New in v0.5.0
65|
66|- **Bklit UI charts** themed to poolr's monochrome palette: animated screening-progress rings + I² heterogeneity gauge on the Dashboard, per-study weight rings on Meta-Analysis, RoB domain-coverage radar.
67|- **Frontend unit tests** (Vitest, 38): citation parsers + engine API bridge — wired into CI as a required gate.
68|- **CI hardened**: every gate fails the build now (C# format without bypass, oxlint, Vitest, cargo fmt --check, clippy -D warnings, vulnerability scan that exits non-zero).
69|- **Fixed**: CSV import losing the first record when a header-less file mentioned "abstract"; Rust `static mut` undefined behaviour replaced with a safe `OnceLock`.
70|- **License**: pure MIT (contradictory footer removed) — GitHub now recognises the license correctly.
71|
72|### Downloads (native installers)
73|
74|| Platform | File | Notes |
75||----------|------|-------|
76|| Windows x64 | `poolr-windows-x64.msi` | Recommended for most PCs. Also ships `poolr-windows-x64.exe` (NSIS) installer. |
77|| Windows x86 | `poolr-windows-x86.msi` | 32-bit Windows. |
78|| Windows ARM64 | `poolr-windows-arm64.msi` | Windows on ARM. |
79|| macOS Apple Silicon | `poolr-macos-arm64.dmg` | Contains `poolr.app`. |
80|| macOS Intel | `poolr-macos-x64.dmg` | Contains `poolr.app`. |
81|| Linux x86_64 | `poolr-linux-x86_64.deb` + `poolr-linux-x86_64.rpm` | Debian or RPM package. |
82|
83|---
84|
85|

---

**poolr v0.4.0** — Native Tauri + React + C# overhaul  
Release date: 2026-08-02

> This release replaces the old Python / CustomTkinter app with a fully native desktop build: a **Tauri 2 (Rust)** window, a **React + TypeScript** UI, and a bundled **C# 12 / .NET 8** statistical engine sidecar. No Python runtime is required — the app runs on any stock machine. Project data auto-saves (`poolr.json` + rolling `.bak`) so multi-day reviews survive a force-close.

### Downloads (native installers — full, not portable zips)

| Platform | File | Notes |
|----------|------|-------|
| Windows x64 | `poolr-windows-x64.msi` | Recommended for most PCs. |
| macOS Apple Silicon | `poolr-macos-arm64.dmg` | Contains `poolr.app`. |
| macOS Intel | `poolr-macos-x64.dmg` | Contains `poolr.app`. |
| Linux x86_64 | `poolr-linux-x86_64.deb` + `poolr-linux-x86_64.rpm` | Debian or RPM package. |

### What's New in v0.4.0

- **Fully native stack**: Tauri 2 (Rust) shell + React/TypeScript UI + C# 12 / .NET 8 engine sidecar (localhost HTTP API). **100% Python-free**.
- **All 8 pages reimplemented** in React; screening import from PubMed/CSV/RIS/EndNote; in-app forest/funnel plots; auto-GRADE; 6-OS installers.

---

