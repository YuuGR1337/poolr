# Poolr Product Roadmap

Our mission is to establish Poolr as the world's most accessible, reliable, and comprehensive desktop platform for systematic reviews and meta-analyses.

---

## Status Legend & Maintenance

- ✅ **Shipped** — merged and included in a tagged release.
- 🔄 **In progress** — partial implementation in the tree; the gap is described under the item.
- ⏳ **Planned** — designed, not started.

**Maintenance rule:** this document is reviewed at every minor release (v0.x.y). `RELEASES.md` and `CHANGELOG.md` are the source of truth for what shipped; items are only moved to ✅ after the release tag exists. Last reviewed: **2026-11-09 (v0.6.5)**.

---

## Current Release: v0.6.5 (November 2026)

### Recently shipped (v0.6.0 → v0.6.5)
- ✅ RevMan 5 / RevMan Web (`.rm5` XML + CSV) two-way import/export (`RevManEngine.cs`).
- ✅ Bayesian MCMC meta-analysis — Gibbs sampling, normal/½-Cauchy priors, multi-chain, RoPE (`BayesianMcmcEngine.cs`).
- ✅ PRISMA-DTA (diagnostic accuracy) and PRISMA-ScR (scoping review) flow diagrams and checklists.
- ✅ Local Ollama / llama.cpp AI provider preset (OpenAI-compatible endpoint, 100% off-device option).
- ✅ Multi-format PubMed/MEDLINE/RIS/CSV importer with deduplication; reactive dual screening with Cohen's κ.
- ✅ Higgins 95% prediction interval, TSA, AICc model averaging, 6 τ² estimators.
- ✅ Google Drive BYOS team sync with Ed25519 signing, 4-tier RBAC, 3-way conflict resolution.
- ✅ Universal Export Center (Word/LaTeX/HTML/R/Stata/Python/BibTeX/RIS) and Interactive Figure Studio.

---

## Near-Term — v0.6.6 (Q4 2026) :lock_and_shield:

> Theme: **hardening before new frontiers.** No new analytics until the platform is trustworthy, versioned, and regression-tested end to end.

### Security & correctness (P0)
- ⏳ **Sidecar hardening**: replace origin-echo CORS in `Program.cs` with a strict allowlist (`tauri://`, dev origin); add a shared Tauri↔engine auth token so arbitrary local web pages cannot call the engine.
- ⏳ **Structured error envelope**: sanitized error codes + safe messages on all `catch (Exception)` routes; no raw exception text to the client outside dev builds.
- 🔄 **Engine/CI security posture**: keep dependabot + signed updater; add SBOM + CodeQL job to CI.

### Engineering health (P0)
- ⏳ **Version source of truth**: single `VERSION`/script that stamps csproj + frontend + README; CI check that fails on drift (this already occurred twice: v0.6.1 and v0.6.4↔v0.6.5).
- ⏳ **Stress suite → CI**: promote `testing/` port of the former root `stress_test.py` to integration tests against the engine in `ci.yml`; it found 6 real crash bugs (all fixed — regression-guard them).
- 🔄 **Meta.tsx decomposition** (`pages/Meta.tsx`, ~1.2k lines) into feature components per `docs/CODEBASE_OPTIMIZATION_PLAN.md` Phases 3–4.
- ⏳ **Frontend test coverage**: unit tests for `lib/meta/*` (the client-side math QA) + one Playwright E2E happy path (create project → screen → extract → forest plot).

### Feature completion (P1)
- 🔄 **Zotero & Mendeley local sync**: engine file exists (`ZoteroMendeleySyncEngine.cs`) but endpoints are stubs; wire the Zotero local HTTP API (port 23119) and Mendeley OAuth export flows end to end.
- 🔄 **Living reviews scheduling**: cumulative update + dedup engine and auto-import toggle are shipped; ship the actual background scheduler (search re-run alerting) in the Tauri shell.
- ⏳ **Covidence & Rayyan CSV import** — the final two gaps in `docs/SRMA_GAP_ANALYSIS.md`; both are pull-parsers, low effort, unblocks teams migrating off inventory tools.
- ⏳ **Repository hygiene**: move release checklists and test scripts out of repo root into `docs/` and `testing/`.

---

## Mid-Term — v0.7.x (2027) :compass:

- ⏳ **WebAssembly engine mode**: compile the C# engine via .NET Wasm SDK for zero-install in-browser analysis with local storage.
- ⏳ **Beyond-Gibbs Bayesian inference**: HMC/NUTS for multi-parameter models the Gibbs sampler can't cover — bivariate/HSROC DTA, dose-response splines, network meta-analysis.
- ⏳ **AI screening accuracy benchmarking**: gold-standard datasets with sensitivity/cost-of-misses reporting, so AI-assisted screening is defensible in a methods section.
- ⏳ **Project format v1 + migration framework**: versioned `poolr.json` schema with tested forward migrations and round-trip guarantees (prerequisite for v1.0).
- ⏳ **Full-text PDF retrieval & review**: pipeline from screening includes to retrievable/Open-Access full-text collection (Semantic Scholar / Unpaywall links), building on the existing PDF extraction component.
- ⏳ **Engine performance**: ReadyToRun/AOT cold-start for the sidecar and UI virtualization for ≥1,000-study projects.
- ⏳ **Internationalization + accessibility (WCAG 2.1 AA)**: RTL-safe layouts, screen-reader-labelled figures, first translated UI language.

## Long-Term — v1.0.0 LTS :rocket:

**Definition of done for v1.0** (all must hold):
1. Project schema v1 frozen with guaranteed migration path for at least one major cycle.
2. Golden-dataset parity CI: produced estimates statistically indistinguishable from `metafor`, RevMan, and Stata on a published benchmark corpus — run on every commit, not just release time.
3. Independent security review of the collaboration/sync path (Ed25519 chain, Drive transport, vault).
4. Documentation completeness: every user-visible feature documented; every engine endpoint contract documented.
5. Accessibility audit passed (WCAG 2.1 AA).

Beyond the exit criteria:
- ⏳ **Peer-reviewed validation publication**: methodological paper describing Poolr's estimators and parity evidence, to establish citation credibility.
- ⏳ **Multi-center collaborative sync**: peer-to-peer encrypted CRDT synchronization enabling simultaneous multi-investigator screening/extraction without central servers.
- ⏳ **Method-pack SDK**: configuration-driven extension format so community statisticians can add new analyses without touching engine internals.
- ⏳ **Cochrane & Campbell endorsement**: accreditation and compliance certification with Cochrane Methodological Innovation guidelines.

---

## Inputs consulted

- `docs/SRMA_GAP_ANALYSIS.md` — remaining feature gaps (Covidence, Rayyan).
- `STRESS_TEST_REPORT.md` — regression evidence and version-drift history.
- `docs/CODEBASE_OPTIMIZATION_PLAN.md` — Phases 1–2 shipped; Phases 3–4 tracked above.
- Public roadmap commitments in `README.md` comparison table (keep messaging aligned with the proprietary license).
