# Poolr

<div align="center">

<p align="center">
  <a href="https://poolr.mehvar.store">
    <img src="docs/poolr-brand-dark.png#gh-dark-mode-only" alt="Poolr Logo" width="340">
    <img src="docs/poolr-brand.png#gh-light-mode-only" alt="Poolr Logo" width="340">
  </a>
</p>

### *From search to forest plot.*

[![Release](https://img.shields.io/github/v/release/harisawan-bit/poolr?color=007ACC&label=release)](https://github.com/harisawan-bit/poolr/releases)
[![CI](https://github.com/harisawan-bit/poolr/actions/workflows/ci.yml/badge.svg)](https://github.com/harisawan-bit/poolr/actions/workflows/ci.yml)
[![Build & Release](https://github.com/harisawan-bit/poolr/actions/workflows/build.yml/badge.svg)](https://github.com/harisawan-bit/poolr/actions/workflows/build.yml)
[![PRISMA 2020](https://img.shields.io/badge/PRISMA%202020-Compliant-success.svg)](https://www.prisma-statement.org/)
[![Cochrane Handbook](https://img.shields.io/badge/Cochrane%20Handbook-v6.4-success.svg)](https://training.cochrane.org/handbook)
[![.NET 8 / C# 12](https://img.shields.io/badge/.NET%208-C%23%2012-512BD4.svg)](https://dotnet.microsoft.com/)
[![Tauri 2 / Rust](https://img.shields.io/badge/Tauri%202-Rust-DEA584.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React%2019-TypeScript-61DAFB.svg)](https://react.dev/)
[![100% Python-Free](https://img.shields.io/badge/100%25-Python--Free-brightgreen.svg)]()
| [![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)

**Proprietary desktop application for Systematic Reviews & Meta-Analyses (SRMA)**

*From PICO protocol definition to publication-ready PRISMA 2020 manuscripts, vector diagnostics, and reproducible statistical scripts.*

[Download Installers (poolr.mehvar.store)](https://poolr.mehvar.store) • [Direct Downloads](#direct-downloads) • [Features](#key-features-by-srma-phase) • [Screenshots](#screenshots) • [Architecture](#architecture) • [How to Cite](#how-to-cite-poolr) • [Releases](https://github.com/harisawan-bit/poolr/releases)

</div>

---

> **Current release — v0.6.5.** Commercial Systematic Reviews & Meta-Analysis Platform with Team Collaboration. Built for clinicians, epidemiologists, biostatisticians, and research teams. Features native multi-format PubMed & citation imports, reactive dual screening with Cohen's Kappa ($\kappa$), continuous study sample size tracking (`Int. n` / `Ctrl n`), Bring-Your-Own-Storage (BYOS) Google Drive sync with cryptographic Ed25519 signatures, 4-tier Role-Based Access Control, visual 3-way conflict resolution, zero-warning .NET 8 / C# 12 statistical engine with gold-standard parity tests, vector Cochrane *robvis* Traffic Light & Summary Bar plots, Interactive Figure Studio (Contour-Enhanced Funnel, Galbraith, L'Abbé, Baujat), Higgins 95% Prediction Intervals, Trial Sequential Analysis (TSA), Model Averaging across 6 $\tau^2$ estimators, AI-powered plain-language statistical interpretation, Specialized Analyses Hub (Dose-Response, Survival RMST, Health Economics, Adverse Events, DCA), PRISMA 2020 auto-synced flow diagrams, and 1-click manuscript export to Word (.docx), LaTeX (.tex), Standalone HTML, R metafor (.R), Stata (.do), Python (.py), BibTeX, and RIS. 100% offline-first, native desktop build, and 100% Python-free.

---

## Table of Contents

1. [Screenshots & Visual Tour](#screenshots)
2. [Direct Downloads (v0.6.5)](#direct-downloads)
3. [What's New in v0.6.5](#whats-new-in-v065)
4. [Key Features by SRMA Phase](#key-features-by-srma-phase)
5. [Interactive Figure Studio & Visualizations](#interactive-figure-studio)
6. [Specialized Analyses Suite](#specialized-analyses-suite)
7. [Universal Manuscript & Script Export Center](#universal-export-center)
8. [How Poolr Compares](#how-poolr-compares)
9. [Architecture & Technology Stack](#architecture)
10. [How to Cite Poolr](#how-to-cite-poolr)
11. [Local Development & Testing](#local-development)
12. [Community & Contributing](#contributing)

---

## Screenshots

| **Dashboard** — Stage Milestones, PICO Overview & Team Activity | **Meta-Analysis** — Forest Plot, Pooled Diamond & 95% Prediction Interval |
|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png?v=0.6.5) | ![Meta-Analysis](docs/screenshots/meta-forest.png?v=0.6.5) |

| **Screening** — Multi-Format PubMed Import & Reactive Filters | **Dual Screening** — Cohen's $\kappa$ Agreement & Conflict Dashboard |
|:---:|:---:|
| ![Screening](docs/screenshots/screening.png?v=0.6.5) | ![Screening & Conflicts](docs/screenshots/screening-conflicts.png?v=0.6.5) |

| **Cochrane robvis** — Vector Traffic Light & Weighted Summary Plots | **PRISMA 2020** — Interactive Flow & Reporting Checklists |
|:---:|:---:|
| ![Risk of Bias](docs/screenshots/rob-robvis.png?v=0.6.5) | ![PRISMA 2020 Flow](docs/screenshots/prisma-flow.png?v=0.6.5) |

| **Interactive Figure Studio** — Publication Bias Funnel Plot | **Diagnostic Accuracy** — SROC, Galbraith Radial & Baujat Diagnostics |
|:---:|:---:|
| ![Funnel Plot](docs/screenshots/meta-funnel.png?v=0.6.5) | ![Figure Studio Diagnostics](docs/screenshots/meta-diagnostics.png?v=0.6.5) |

| **Specialized Analyses Hub** — Dose-Response, Survival RMST & Bayesian | **Manuscript Helper** — Section Assignments & Checkpoints |
|:---:|:---:|
| ![Specialized Analyses](docs/screenshots/specialized-hub.png?v=0.6.5) | ![Manuscript Workspace](docs/screenshots/manuscript.png?v=0.6.5) |

| **Team Collaboration** — Drive-Based Sync & Cryptographic Signing | **Universal Export Center** — Word, LaTeX, HTML, R, Stata, Python |
|:---:|:---:|
| ![Team Collaboration](docs/screenshots/collaboration.png?v=0.6.5) | ![Universal Export Center](docs/screenshots/export-center.png?v=0.6.5) |

---

## Direct Downloads

Official releases are hosted at [poolr.mehvar.store](https://poolr.mehvar.store) and on [GitHub Releases](https://github.com/harisawan-bit/poolr/releases/tag/v0.6.5). Poolr runs natively on Windows, macOS, and Linux without requiring Python, R, Docker, or external runtimes.

| Operating System | Architecture | Package Format | Direct Download (v0.6.5) |
|---|---|---|---|
| **Windows** | x64 (Standard Intel/AMD) | `.msi` (Enterprise) / `.exe` (NSIS) | [poolr_0.6.5_x64_en-US.msi](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_x64_en-US.msi) · [poolr_0.6.5_x64-setup.exe](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_x64-setup.exe) |
| **Windows** | ARM64 (Surface / Copilot+ PC) | `.msi` / `.exe` | [poolr_0.6.5_arm64_en-US.msi](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_arm64_en-US.msi) · [poolr_0.6.5_arm64-setup.exe](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_arm64-setup.exe) |
| **Windows** | x86 (32-bit Legacy) | `.msi` / `.exe` | [poolr_0.6.5_x86_en-US.msi](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_x86_en-US.msi) · [poolr_0.6.5_x86-setup.exe](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_x86-setup.exe) |
| **macOS** | Apple Silicon (M1/M2/M3/M4) | `.dmg` | [poolr_0.6.5_aarch64.dmg](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_aarch64.dmg) |
| **macOS** | Intel x64 | `.dmg` | [poolr_0.6.5_x64.dmg](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_x64.dmg) |
| **Linux** | x86_64 (Debian / Ubuntu / Mint) | `.deb` | [poolr_0.6.5_amd64.deb](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_amd64.deb) |
| **Linux** | x86_64 (Portable AppImage) | `.AppImage` | [poolr_0.6.5_amd64.AppImage](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr_0.6.5_amd64.AppImage) |
| **Linux** | x86_64 (Fedora / RHEL / openSUSE)| `.rpm` | [poolr-0.6.5-1.x86_64.rpm](https://github.com/harisawan-bit/poolr/releases/download/v0.6.5/poolr-0.6.5-1.x86_64.rpm) |

*All binaries include cryptographic `.sig` signatures verified by the built-in Tauri updater.*

---

## What's New in v0.6.5

- **Multi-Format PubMed Importer**: Native parser supporting PubMed Summary (`1: ...`), Abstract (`1. ...`), PMID lists (`^\d{6,10}$`), MEDLINE (`PMID- ...`), RIS, and CSV exports with automated PMID/DOI metadata extraction and duplicate elimination.
- **Reactive Title & Abstract Screening**: Instantly reactive record badges, real-time status filtering (Unscreened, Included, Excluded, Uncertain), and dual-reviewer conflict detection without state lag.
- **Continuous Study Data Extraction**: Dedicated sample size tracking (`Int. n`, `Ctrl n`) alongside Mean and SD for accurate Inverse-Variance continuous meta-analyses.
- **Unblocked Risk of Bias (RoB) Workflows**: Evaluate studies across RoB 2, ROBINS-I, and QUADAS-2 domains with live traffic-light and weighted summary visualizations.
- **AI-Powered Statistical Interpretation**: Route and model safety for the `Interpret` workspace, providing plain-language synthesis of complex statistical estimates and heterogeneity.
- **Data Persistence Continuity**: Extended mode preservation (`metadata.studyType`, network, IPD, multilevel, diagnostic, qualitative, manuscript) across project reopen and save cycles.
- **Drive-Based Crypt Collaboration**: Peer-to-peer sync over Google Drive with cryptographic identity verification, client-side encryption support, and zero third-party cloud lock-in.
- **Verified Cross-Platform Binaries**: Signed native builds for Linux (`.AppImage`, `.deb`, `.rpm`), macOS (Apple Silicon & Intel), and Windows (`x64`, `x86`, `arm64`) with persistent updater signatures.

---

## Key Features by SRMA Phase

### 1. Protocol & PICO Formulation
- Structured input for **Population**, **Intervention**, **Comparator**, and **Outcomes**.
- Protocol tracking: PROSPERO registration ID, publication date boundaries, inclusion criteria, and language restrictions.
- Live protocol discovery links for PubMed, PROSPERO, and Google Scholar.
- All state auto-persisted to standard, human-readable `poolr.json` project files.

### 2. Multi-Database Search & Citation Import
- Multi-format citation parsing for PubMed Summary, PubMed Abstract, PMID lists, MEDLINE/nbib, RIS, EndNote, and CSV files.
- Automated search query generator converting PICO parameters into optimized boolean expressions for:
  - PubMed / MEDLINE (with MeSH expansion)
  - Embase
  - Cochrane CENTRAL
  - Scopus
  - Web of Science
- Real-time API retrieval from NCBI Entrez E-utilities, OpenAlex, Crossref, and ClinicalTrials.gov.
- Automated deduplication using exact title matching, normalized Levenshtein similarity, and PMID/DOI resolution.

### 3. Dual Screening & Inter-Rater Reliability
- Independent Title & Abstract and Full-Text screening stages.
- Multi-reviewer configuration (1 to 4 independent reviewers) with blind voting.
- Conflict Resolution UI: Automated 2×2 contingency table calculating:
  - Observed percent agreement ($P_o$)
  - Cohen's Kappa ($\kappa$) and Standard Error
  - 95% Confidence Intervals
  - Landis & Koch qualitative strength classification (*Slight, Fair, Moderate, Substantial, Almost Perfect*)
- 1-click **Copy Methods Statement** button for copy-pasting into manuscript methodology.
- **Promote Included (N)**: 1-click progression of title/abstract includes directly to full-text screening.

### 4. Structured Data Extraction
- Multi-type study extraction: Binary (2×2), Continuous (Mean ± SD, Sample sizes $n_1, n_2$), Time-to-Event (HR, Log[HR], SE), Proportions, and Diagnostic Accuracy.
- **Import from Screening**: 1-click populator creating study records directly from screened inclusions.
- Flexible CSV/TSV table importer with automated column header detection and mapping.
- Automatic missing summary completion: Wan et al. (2014) median and IQR to mean and SD converter.

### 5. Risk of Bias Assessment (Cochrane robvis)
- Domain-level assessments for standard evidence synthesis tools:
  - **RoB 2** (Randomized Controlled Trials)
  - **ROBINS-I** (Non-Randomized Studies of Interventions)
  - **QUADAS-2** (Diagnostic Accuracy Studies)
  - **AMSTAR-2** (Systematic Review Quality)
  - **Newcastle-Ottawa Scale (NOS)** (Cohort / Case-Control Studies)
- Publication-grade vector graphics complying with McGuinness & Higgins (2021) *robvis*:
  - **Traffic Light Plots**: Domain-by-study colored circle matrices.
  - **Weighted Summary Bar Plots**: Proportion of studies / sample weights at Low, Some Concerns, High, or Critical risk of bias.
- 1-click Scalable Vector Graphics (`.svg`) vector download.

### 6. Classical & Advanced Meta-Analysis Engine
- **Effect Measures**: Odds Ratio (OR), Risk Ratio (RR), Risk Difference (RD), Mean Difference (MD), Standardized Mean Difference (SMD / Hedges' g), Hazard Ratio (HR), Single-Arm Proportions (Freeman-Tukey double arcsine), Correlation (z), and Generic Inverse-Variance.
- **Statistical Pooling Models**: Fixed-Effect (Inverse Variance, Mantel-Haenszel, Peto) and Random-Effects.
- **Between-Study Variance ($\tau^2$) Estimators**:
  - DerSimonian-Laird (DL)
  - Restricted Maximum Likelihood (REML)
  - Paule-Mandel (PM)
  - Empirical Bayes (EB)
  - Hunter-Schmidt (HS)
  - Sidik-Jonkman (SJ)
- **Small-Sample Adjustment**: Knapp-Hartung-Sidik-Jonkman (KHSJ) t-distribution adjustments.
- **Heterogeneity Evaluation**: Cochran's Q, $I^2$ (with Jackson 95% CI), $\tau^2$, $H^2$.
- **Higgins 95% Prediction Interval**: $\text{PI} = \hat{\theta} \pm t_{k-2}\sqrt{\text{SE}^2 + \tau^2}$ predicting the treatment effect in a future clinical trial.
- **Sensitivity Analyses**: Leave-one-out influence analysis ranking, cumulative meta-analysis, and fixed vs. random discordance diagnostics.
- **Publication Bias & Small-Study Diagnostics**: Egger's regression test, Begg's rank test, Duval & Tweedie trim-and-fill, PET/PEESE meta-regression, p-curve analysis, and 3-parameter selection models (3PSM).

---

## Interactive Figure Studio

Poolr features an integrated vector graphics studio that renders publication-ready charts in real time with 1-click SVG download:

- **Forest Plots**: Proportional study weight markers, individual confidence intervals, pooled diamond summary, reference lines (1.0 for ratios, 0.0 for differences), and study weight percentages.
- **Standard Funnel Plots**: Pseudo-95% confidence intervals centered on the pooled estimate.
- **Contour-Enhanced Funnel Plots**: Overlays $p<0.10, p<0.05, p<0.01$ statistical significance zones (Peters et al. 2008) to assist in differentiating publication bias from other causes of funnel plot asymmetry.
- **Galbraith Radial Plots**: Standardized effect size z-scores plotted against precision (1/SE) for instant graphical outlier identification outside the $\pm 2$ error corridor.
- **L'Abbé Plots**: Plots experimental event rates vs. control event rates to inspect treatment homogeneity across study baselines.
- **Baujat Heterogeneity Diagnostics**: Compares each study's contribution to overall Cochran's Q against its influence on the pooled effect size.

---

## Specialized Analyses Suite

Accessible from the top header or via Command Palette (`Ctrl+K`):

- **Dose-Response Meta-Analysis**: Greenland & Longnecker linear trend estimation and 3-knot restricted cubic spline / Emax modeling (`/api/dose`).
- **Survival RMST Meta-Analysis**: Restricted Mean Survival Time differences pooled up to truncation horizon $\tau$ (`/api/survival`).
- **Health Economics Evaluation**: Bivariate cost-effectiveness pooling, Incremental Cost-Effectiveness Ratio (ICER), and Incremental Net Monetary Benefit (INMB) across willingness-to-pay thresholds $\lambda$ (`/api/specialized/economic`).
- **Adverse Events & Peto Odds Ratios**: Peto one-step pooling with zero-event continuity corrections and Number Needed to Harm (NNH) (`/api/specialized/adverse`).
- **Decision Curve Analysis (DCA)**: Net Benefit curves evaluated across clinical decision threshold probabilities $p_t$ (`/api/advanced/dca`).
- **Trial Sequential Analysis (TSA)**: Calculates Required Information Size (RIS) based on $\alpha=0.05, \beta=0.20$ and tracks cumulative Z-curve crossing against Lan-DeMets O'Brien-Fleming monitoring boundaries.
- **Multimodel Inference (Model Averaging)**: Computes AICc-weighted pooled estimates across 6 $\tau^2$ estimators to eliminate single-estimator selection bias.

---

## Universal Export Center

Generate complete manuscript files and replication packages with one click (`Ctrl+E`):

| Format | Output Type | Description |
|---|---|---|
| **Word (.docx)** | PRISMA 2020 Manuscript | Formatted Word document containing Title, Structured Abstract, PICO, Search Strategy, Screening Flow, Extraction Table, Meta-Analysis summary, and GRADE SoF table. |
| **LaTeX (.tex)** | Academic Article | Publication-grade LaTeX template with `booktabs`, `amsmath`, and PGF/TikZ figure wrappers. |
| **HTML (.html)** | Standalone Interactive Report | Self-contained HTML report with embedded CSS, interactive vector charts, and offline tables. |
| **R Script (.R)** | `metafor` Replication Code | Executable R script recreating the exact analysis, forest plot, and funnel plot using `metafor::rma()`. |
| **Stata (.do)** | Stata Meta Script | Executable Stata do-file using official `meta esize` and `meta forestplot` syntax. |
| **Python (.py)** | `statsmodels` Replication Code | Python script using `pandas` and `statsmodels` for reproducible independent recalculation. |
| **BibTeX (.bib)** | Citation Bibliography | Formatted BibTeX bibliography of all included studies. |
| **RIS (.ris)** | Reference Manager Archive | Standard RIS file compatible with EndNote, Zotero, Mendeley, and Rayyan. |

---

## How Poolr Compares

| Feature | Poolr | Cochrane RevMan | R (metafor) | JASP | Covidence / Rayyan |
|---|---|---|---|---|---|
| **Price** | **100% Free & Open-Source** | Free (Web only) / Subscription | Free & Open-Source | Free & Open-Source | Commercial / Freemium |
| **Installation** | **Standalone Native Desktop** | Web browser | CLI / IDE required | Native Desktop | Web browser |
| **No-Code Interface** | **✅** | ✅ | ❌ | ✅ | ✅ |
| **Data Privacy (100% Local)** | **✅** | ❌ (Cloud-stored) | ✅ | ✅ | ❌ (Cloud-stored) |
| **Full PRISMA 2020 Pipeline** | **✅ (All 8 stages)** | Partial (No search/screening) | ❌ (Analysis only) | ❌ (Analysis only) | Screening only |
| **Dual Screening + Cohen's $\kappa$** | **✅** | ❌ | ❌ | ❌ | ✅ |
| **Cochrane robvis Vector Figures** | **✅** | ❌ (Separate tool) | Via robvis package | ❌ | ❌ |
| **Figure Studio (Contour/Galbraith/Baujat)** | **✅** | ❌ | Via scripts | Partial | ❌ |
| **Trial Sequential Analysis (TSA)** | **✅** | ❌ | Via tsa package | ❌ | ❌ |
| **Dose-Response / Survival RMST / DCA** | **✅** | ❌ | Via complex scripts | ❌ | ❌ |
| **1-Click Word / LaTeX Manuscript Export** | **✅** | ❌ | ❌ | ❌ | ❌ |
| **1-Click R & Stata Replication Script** | **✅** | ❌ | Self | ❌ | ❌ |
| **Python Dependency Free** | **✅ (100% Python-free)** | ✅ | ✅ | ✅ | ✅ |

---

## Architecture & Technology Stack

Poolr is designed as a modular, multi-tier native desktop application with decoupled UI and statistical computation layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Tauri 2 Native Desktop Shell                         │
│           (Rust / Windows WebView2, WebKitGTK, WKWebView)              │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
┌─────────────────────────────────┐   HTTP REST   ┌──────────────────────────────┐
│       Frontend User Interface   │ ────────────> │     C# 12 / .NET 8 Engine    │
│  React 19 · TypeScript · Vite   │ <──────────── │  ASP.NET Core (127.0.0.1:5180│
│  Tailwind CSS · Bklit UI Charts │ (JSON/Vector) │  Math.NET · SkiaSharp SVG    │
└─────────────────────────────────┘               └──────────────────────────────┘
                 │                                               │
                 ▼                                               ▼
     ┌────────────────────────┐                    ┌────────────────────────────┐
     │  Local File Storage    │                    │ Process Lifecycle Sentinel │
     │  Project poolr.json    │                    │ Win32 JobObject / POSIX    │
     │  Autosave & LocalStore │                    │ Auto-reaping on App Close  │
     └────────────────────────┘                    └────────────────────────────┘
```

For in-depth technical documentation regarding inter-process communication, zero-zombie process guarantees, and statistical precision validation, read [ARCHITECTURE.md](ARCHITECTURE.md).

---

## How to Cite Poolr

If you use Poolr to conduct, screen, analyze, or report evidence in your systematic review or meta-analysis, please cite the software:

### APA Format
> Awan, M. H. (2026). *Poolr: Desktop platform for systematic reviews & meta-analyses* (Version 0.6.5) [Computer software]. https://github.com/harisawan-bit/poolr

### BibTeX
```bibtex
@software{Awan_Poolr_2026,
  author = {Awan, Muhammad Haris},
  title = {{Poolr: Desktop Platform for Systematic Reviews & Meta-Analyses}},
  version = {0.6.5},
  year = {2026},
  url = {https://github.com/harisawan-bit/poolr},
  publisher = {GitHub}
}
```

Standardized machine-readable citation metadata is maintained in [CITATION.cff](CITATION.cff).

---

## Local Development & Testing

### Prerequisites
- **Node.js**: >= 20.x (v24 LTS recommended)
- **.NET SDK**: 8.0.x
- **Rust**: 1.77+ with Cargo
- **Tauri Prerequisites**: See [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Step-by-Step Setup
```bash
# Clone repository
git clone https://github.com/harisawan-bit/poolr.git
cd poolr

# 1. Install frontend dependencies and run dev server
cd frontend
npm ci
npm run dev

# 2. In a separate terminal, launch the .NET 8 statistics engine (port 5180)
cd engine
dotnet run --project Poolr.Engine.Api/Poolr.Engine.Api.csproj

# 3. Or launch the full native desktop environment (Tauri 2 + bundled engine)
cd src-tauri
cargo tauri dev
```

### Running the Test & Verification Matrix
```bash
# 1. C# 12 Engine mathematical parity suite (xUnit)
dotnet test engine/Poolr.Engine.Tests/Poolr.Engine.Tests.csproj -c Release

# 2. C# Engine code formatting check (enforced in CI)
dotnet format engine/Poolr.Engine.Api/Poolr.Engine.Api.csproj --verify-no-changes

# 3. Frontend linting, type-checking, and unit tests
cd frontend
npm run lint
npm run build
npm test -- --run

# 4. Rust desktop shell formatting and clippy
cd src-tauri
cargo fmt --check
cargo clippy --all-targets -- -D warnings
```

---

## Contributing

We warmly welcome contributions from the medical research, biostatistics, and open-source software communities. Please review:
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines, conventional commit rules, and PR workflow.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Contributor Covenant v2.1.
- [ROADMAP.md](ROADMAP.md) — Upcoming feature milestones and version plans.
- [SECURITY.md](SECURITY.md) — Vulnerability disclosure policy.
- [SUPPORT.md](SUPPORT.md) — Support channels and triage matrix.

---

## License

This project is licensed under a **Proprietary License** — see the [LICENSE](LICENSE) file for details. All rights reserved.

© 2026 Muhammad Haris Awan.
