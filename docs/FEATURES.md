# Poolr Feature Plan — Future Versions

Derived from: codebase audit (Nov 2026), `docs/SRMA_GAP_ANALYSIS.md`, `STRESS_TEST_REPORT.md`, competitor positioning (RevMan, Covidence, Rayyan, EPPI-Reviewer, JASP/metafor).

**Strategic premise.** The statistical engine is already ahead of every competitor (90+ engines incl. NMA, DTA, IPD, Bayesian MCMC). The scarce resource in a real systematic review is not math — it is **screening hours, extraction hours, and peer-review defense**. Features below target those three bottlenecks, in priority order. New engines are deliberately deprioritized until v0.9.

---

## v0.6.6 — Hardening (see ROADMAP.md)
Security (CORS allowlist + sidecar auth token, error envelope), version SoT + CI drift check, stress suite → CI, `Meta.tsx` decomposition, Covidence/Rayyan import, Zotero/Mendeley + living-review completion. **No new features.**

---

## v0.7.0 — "Screening fast-forward"
The biggest cost of a review is screening. Make it 5× faster.

| # | Feature | What it is | Why it wins |
|---|---|---|---|
| F1 | **Active-learning ranked screening** | Real implementation of `/api/ai/screening` (currently a stub): embed each title/abstract, classifier ranks most-likely-included first; every human vote retrains it. Records shown = ranked queue. | Rayyan/Covidence charge for this; ours is offline via the existing Ollama provider preset (`ai.ts`). Defensible sensitivity for a methods section. |
| F2 | **Screening completion projection** | Estimates "records left to screen to reach target recall" from votes so far. | Answers the question every team asks on day 20. No competitor does it in-tool. |
| F3 | **PDF retrieval pipeline + Library** | DOI → OpenAlex/Semantic Scholar/Unpaywall open-access resolution; downloads into a project Library tab; full-text screening reads from it. Makes `PDFExtraction.tsx` real (Rust-side parser via Tauri command). | Full-text retrieval is the other unstructured cost sink; nothing in the pipeline does it today. |
| F4 | **Reviewer assignment routing** | Team lead allocates record batches to reviewers, masked double-screening, auto-promote-on-agreement → conflict queue otherwise; per-reviewer progress quotas. | Core Covidence workflow, currently missing despite the DRIVE/RBAC sync backbone existing. |
| F5 | **Grey-literature & registry connectors** | Europe PMC, OpenCitations, EU Clinical Trials Register, WHO ICTRP alongside existing PubMed/OpenAlex/Crossref. | Broadens retrievable base; cheap parser work. |

## v0.7.x — "Extraction that doesn't hurt"

| # | Feature | What it is | Why it wins |
|---|---|---|---|
| F6 | **LLM-assisted extraction with quoted evidence** | For each included full text, the model proposes arm-level fields (n, events, mean, SD, HR) **with the source sentence quoted**; human confirms; the quote is stored in `poolr.json` as provenance. Table reading via Ollama vision models (e.g. qwen2.5-VL, minicpm-v). | Extraction is the next bottleneck after screening. Quotes make numbers auditable — every figure traces to a PDF sentence. Offline, python-free (models live in the user's Ollama). |
| F7 | **KM digitizer** | Interactive point-and-click digitizer over published survival-curve images → feeds the **existing** `IpdFromKmEngine.Reconstruct`. | Time-to-event SRMAs currently need WebPlotDigitizer + manual work; the reconstruction math already exists — only the UI is missing. Unique differentiator. |
| F8 | **Extraction sanity guards** | Auto-detectors: "looks like SEM not SD" (compares against n/means), unit mismatches, swapped arms, duplicate rows; confirmation prompts. | Most common data-entry errors die before they reach the pooled estimate. Reviewers love this. |
| F9 | **Converter expansion** | Beta/SE → MD inverse-variance entries; adjusted estimates; association measures → OR. Builds on the existing Wan et al. converter. | Common "we only have adjusted outputs" scenarios become self-serve. |

## v0.8.0 — "Defensible by design"
Aim: make Poolr projects survive Reviewer 2.

| # | Feature | What it is | Why it wins |
|---|---|---|---|
| F10 | **Analysis ledger (provenance stamps)** | Every pooled estimate auto-saved with {data snapshot hash, engine version, settings, user, timestamp}; hash-chained for tamper evidence; manuscript export cites ledger IDs; "re-run exactly" button. | Reproducibility as a product feature — nobody else has it, journals increasingly expect it. |
| F11 | **Methods Auditor ("Reviewer-2 shield")** | Rule-based scan of method choices: Peto with large effects, DL on k<5 without KHSJ, SMD sign mixing, zero-cell continuity inconsistencies, unit-of-analysis errors in cluster/multi-arm data, multiplicity issues; output with Cochrane Handbook citations. | Catches pitfalls before submission; doubles as methodological training. |
| F12 | **SAP manifest** | Pre-register planned analyses in-app; unplanned runs flagged post hoc with a reason field; methods section pre-generated from the SAP. | Aligns with preregistration culture (PROSPERO page exists); prevents outcome-switching criticism. |
| F13 | **CSL bibliography engine** | Journal-style formatted references (100+ CSL styles) inside Word/LaTeX/HTML exports; duplicate-reference hygiene. | removes the manual reference-formatting step between "export" and "submit". |
| F14 | **SWiM narrative synthesis** | Vote counting by direction of effect, harvest-style summaries, evidence maps — extends `QualitativeSynthesisEngine`. | Covers reviews where pooling isn't appropriate; SWiM reporting is becoming an expectation. |
| F15 | **Team dashboards** | Records/day, projected completion date, per-reviewer κ trends, workload balance. | Team leads manage the review instead of guessing. |
| F16 | **Undo/redo wired in** | `useUndoRedo.ts` exists but is unwired; connect extraction + screening mutations. Data-loss confidence. | Small effort, high emotional payoff. |

## v0.8.x — Platform quality batch
- **Performance**: engine ReadyToRun/AOT cold-start; table virtualization ≥ 5k studies; chart rendering off the main thread (web worker); versioned autosave backups with restore UI.
- **Accessibility + i18n**: WCAG 2.1 AA audit, translated UI (community-driven string files).
- **Opt-in telemetry + crash reporting**: privacy-preserving feature-usage counters and crash uploader; published data policy. Informs roadmap with real usage data.

## v0.9.0 — Frontier (per ROADMAP)
- Wasm engine mode; HMC/NUTS beyond-Gibbs (bivariate/HSROC DTA, dose-response splines, NMA); method-pack SDK for community estimators; import helpers for published-review data.
- **Explicitly not planned**: hosted/cloud services (would contradict the 100%-local privacy edge), subscription-pushed features, more raw engines without validated workflows.

## v1.0.0 LTS — Credibility version
Exit criteria as defined in `ROADMAP.md` (schema v1 freeze, golden-dataset parity CI, security review, docs, a11y), plus:
- **Certified parity program**: DOI'd validation corpus; parity CI gate on every commit; peer-reviewed validation paper.
- **DOI per release** via Zenodo–GitHub integration (`CITATION.cff` exists; add DOI field).
- **Licensing model decision** (currently contradictory: README claims open-source, LICENSE is proprietary). Recommended: free single-user analysis; paid collaboration/PDF-library features; offline AI stays free.

---

## Non-feature improvements

### Honesty & hygiene
- README "Free & Open-Source" table row vs proprietary LICENSE — pick one story.
- Root-tidying: release checklists, stress scripts → `docs/`, `testing/`.
- Roadmap maintenance rule adopted (already in ROADMAP.md).

### Engineering
- Error envelope + CORS allowlist/auth token (P0, see roadmap).
- Sanitize Galbraith placeholder/dead code; strip console-only leftovers.
- Frontend tests for `lib/meta/*`; Playwright E2E happy path; endpoint fuzz tests in CI.
- `Meta.tsx` + MetaWorkbench (optimization plan Phases 3–4); unused `useUndoRedo`.
- Move AI provider keys from `localStorage` to the OS keychain (Tauri secure store).

### Credibility
- Golden-dataset parity CI (`metafor`/RevMan/Stata) not just at release time.
- Analysis ledger + validation paper + DOIs (F10 above).
- Methods transparency: document estimator defaults and priors in-app (footnote-level, not marketing).

### Go-to-market
- Documentation site (mkdocs) + 3 in-app sample projects + short video tutorials.
- Distribution: winget, Homebrew cask, Flatpak, Microsoft Store.
- Community: Cochrane methods list posts, r/epidemiology-focused writeups, conference workshop kit.

## Priority top-5 (execution order)
1. CORS/token + error envelope (P0 security, ~1 day).
2. Version SoT + CI drift check (~half day; drift bit us twice).
3. F1 + F2 (active-learning screening + projection) — flagship differentiator.
4. F7 KM digitizer — unique, leverages existing engine, moderate effort.
5. F10 Analysis ledger — unassailable credibility feature for v1.0.
