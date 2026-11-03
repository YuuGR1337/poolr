// Shared project model + engine client helpers for Phase D pages.

// ── Engine request/response types (mirror engine/Poolr.Engine.Api/*.cs) ──
export interface Study {
  study?: string;
  type?: "binary" | "continuous" | "survival" | "proportion" | "rate" | "correlation" | "generic";
  int_events?: number | null;
  int_n?: number | null;
  ctrl_events?: number | null;
  ctrl_n?: number | null;
  int_mean?: number | null;
  int_sd?: number | null;
  ctrl_mean?: number | null;
  ctrl_sd?: number | null;
  hr?: number | null;
  hr_lower?: number | null;
  hr_upper?: number | null;
  // v0.6.3 extensions
  aux_time_int?: number | null;   // person-time, intervention arm (IRR/IRD)
  aux_time_ctrl?: number | null;  // person-time, control arm (IRR/IRD)
  correlation?: number | null;    // raw r (Z_CORR)
  n_total?: number | null;        // total N (Z_CORR / single-arm)
  effect_size?: number | null;    // generic inverse-variance entry
  effect_se?: number | null;      // generic inverse-variance entry
  subgroup?: string;
  design?: string;
  year?: number | null;
}

export interface MetaRequest {
  model?: "random" | "fixed";
  measure?: string; // OR|RR|RD|MD|SMD|HR plus v0.6.0: MH_OR|PETO|GLASS|LOGIT_PROP|ARS_PROP|IRR|IRD|Z_CORR|GEN_IV
  method?: "DL" | "REML" | "PM" | "HS" | "ML" | "EB";
  subgroup?: string;
  pub_bias?: "none" | "egger" | "begg" | "all";
  data?: Study[];
}

/** v0.6.0 extended request (POST /api/meta2) */
export interface ExtendedMetaRequest extends MetaRequest {
  knapp_hartung?: boolean;
  exclude?: string[] | null;
  sensitivity?: boolean;
  bias_depth?: "" | "none" | "egger" | "all" | "full";
}

export interface StudyResult {
  study: string;
  effect: number;
  ci_lower: number;
  ci_upper: number;
  weight: number;
  subgroup: string;
}
export interface PooledResult {
  effect: number;
  ci_lower: number;
  ci_upper: number;
  se: number;
  z: number;
  p: number;
  model: string;
}
export interface Heterogeneity {
  q: number;
  df: number;
  q_p: number;
  i2: number;
  tau2: number;
  tau: number;
}
export interface SubgroupResult {
  name: string;
  measure: string;
  effect: number;
  ci_lower: number;
  ci_upper: number;
  k: number;
}
export interface EggerResult {
  intercept: number;
  p_value: number;
  significant: boolean;
  note?: string;
}
export interface BeggResult {
  tau: number;
  p_value: number;
  significant: boolean;
}
export interface PublicationBias {
  egger?: EggerResult | null;
  begg?: BeggResult | null;
  trimfill?: unknown | null;
}
/** v0.6.0 extended response shapes (subset — unknown fields pass through) */
export interface ExtendedPooledResult extends PooledResult {
  ci_method?: string;
  t_value?: number | null;
  df_t?: number | null;
}
export interface ExtendedHeterogeneity extends Heterogeneity {
  h?: number; h2?: number; i2_lower?: number | null; i2_upper?: number | null;
}
export interface SubgroupTest { q: number; df: number; p: number; method?: string }
export interface ExtendedSubgroupResult extends SubgroupResult {
  q_within?: number; df_within?: number; i2_within?: number; tau2_within?: number;
}
export interface LeaveOneOutEntry {
  excluded: string; k: number; effect: number; ci_lower: number; ci_upper: number; p: number; i2: number;
}
export interface CumulativeEntry {
  added: string; year?: number | null; k: number; effect: number; ci_lower: number; ci_upper: number; p: number;
}
export interface SensitivityPack {
  leave_one_out: LeaveOneOutEntry[];
  cumulative: CumulativeEntry[];
  fixed_vs_random?: {
    fe_effect: number; fe_ci_lower: number; fe_ci_upper: number; fe_p: number;
    re_effect: number; re_ci_lower: number; re_ci_upper: number; re_p: number; divergent: boolean;
  } | null;
  influence_max_change_pct: number;
  most_influential?: string | null;
}
export interface ExtendedMetaResponse extends MetaResponse {
  pooled: ExtendedPooledResult;
  heterogeneity: ExtendedHeterogeneity;
  subgroups_extended?: {
    groups: ExtendedSubgroupResult[];
    between?: SubgroupTest | null;
  } | null;
  knapp_hartung?: boolean;
  sensitivity?: SensitivityPack | null;
  notes?: string | null;
}

export interface MetaResponse {
  model: string;
  measure: string;
  method: string;
  k: number;
  studies: StudyResult[];
  pooled: PooledResult;
  heterogeneity: Heterogeneity;
  subgroups?: SubgroupResult[] | null;
  publication_bias?: PublicationBias | null;
}

// ── GRADE ──
export interface GradeOutcomeInput {
  outcome?: string;
  studies?: number;
  design?: string;
  risk_of_bias?: string;
  inconsistency?: string;
  indirectness?: string;
  imprecision?: string;
  publication_bias?: string;
}
export interface GradeRow {
  outcome: string;
  studies: number;
  design: string;
  risk_of_bias: string;
  inconsistency: string;
  indirectness: string;
  imprecision: string;
  publication_bias: string;
  starting_certainty: string;
  final_certainty: string;
  downgrade_reasons: string;
}

// ── Domain project model ──
export type ScreenDecision = "include" | "exclude" | "unsure" | "unset";

export interface Pico {
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
}
export interface ScreeningItem {
  id: string;
  title: string;
  abstract: string;
  decision: ScreenDecision;
  stage: "title_abstract" | "full_text";
  note?: string;
  // v0.6.3 — structured exclusion reason (PICO-failure tags) + dedup key
  exclusion_reason?: string;
  doi?: string;
  pmid?: string;
  // v0.5.5 — dual screening workflow fields
  reviewerDecisions?: { reviewerId: string; reviewerName: string; decision: ScreenDecision; note?: string; exclusion_reason?: string; timestamp: string }[];
  finalDecision?: ScreenDecision;
  conflictStatus?: "pending" | "resolved" | "ai_adjudicated" | "discuss";
  aiDecision?: { decision: ScreenDecision; reason: string; confidence: number; timestamp: string };
}
export interface ProtocolData {
  databases: string;
  registration: string;
  objective: string;
}
export interface ExtractedStudy {
  study: string;
  type: "binary" | "continuous" | "survival" | "proportion" | "rate" | "correlation" | "generic";
  int_events?: number | null;
  int_n?: number | null;
  ctrl_events?: number | null;
  ctrl_n?: number | null;
  int_mean?: number | null;
  int_sd?: number | null;
  ctrl_mean?: number | null;
  ctrl_sd?: number | null;
  hr?: number | null;
  hr_lower?: number | null;
  hr_upper?: number | null;
  aux_time_int?: number | null;
  aux_time_ctrl?: number | null;
  tp?: number | null;
  fp?: number | null;
  fn?: number | null;
  tn?: number | null;
  correlation?: number | null;
  n_total?: number | null;
  effect_size?: number | null;
  effect_se?: number | null;
  subgroup?: string;
  design?: string;
  year?: number | null;
}
export interface RobAssessment {
  id: string;
  study: string;
  tool: "RoB2" | "NOS" | "PROBAST" | "ROBINS-I" | "QUADAS-2" | "AMSTAR-2";
  overall: "Low" | "Some concerns" | "High" | "Critical" | "—";
  domains: Record<string, string>;
}
export interface SearchDb {
  name: string;
  query: string;
  results: number | null;
}
export interface PrismaFlow {
  identified: number | null;
  duplicates: number | null;
  screened: number | null;
  excludedTa: number | null;
  fullText: number | null;
  excludedFt: number | null;
  included: number | null;
}

// v0.5.5 — advanced mode data shapes
export interface NetworkData {
  treatments: string[];
  comparisons: { treatmentA: string; treatmentB: string; studies: Study[] }[];
  results: any | null;
}

export interface IPDData {
  datasets: { name: string; rows: Record<string, any>[] }[];
  results: any | null;
}

export interface MultilevelData {
  effectSizes: { study: string; outcome: string; effect: number; variance: number }[];
  results: any | null;
}

export interface DiagnosticData {
  studies: { study: string; tp: number; fp: number; fn: number; tn: number }[];
  results: any | null;
}

export interface ProportionsData {
  studies: { study: string; events: number; n: number }[];
  results: any | null;
}

export interface QualitativeData {
  codes: { id: string; name: string; description: string }[];
  themes: { id: string; name: string; codes: string[] }[];
  memos: { id: string; content: string; timestamp: string }[];
}

// v0.5.5 — AI screening result
export interface AIScreeningResult {
  recordId: string;
  providerId: string;
  providerName: string;
  model: string;
  decision: 'include' | 'exclude' | 'unsure';
  reason: string;
  confidence: number;
}

export interface Project {
  metadata: { id?: string; revision?: number; version: string; created: string; title?: string; studyType?: string; config?: ProjectConfig };
  manuscript?: { sections: Record<string, string>; sectionMetas: Record<string, { assignedTo?: string; reviewer?: string; dueDate?: string; status: "draft" | "review" | "changes_requested" | "approved" }>; comments?: { id: string; section: string; text: string; author: string; timestamp: string }[]; history?: { id: string; section: string; text: string; timestamp: string }[] };
  pico: Pico;
  protocol: ProtocolData;
  screening: { title_abstract: ScreeningItem[]; full_text: ScreeningItem[] };
  extraction: { studies: ExtractedStudy[] };
  rob: { assessments: RobAssessment[] };
  meta: { results: MetaResponse | null; settings: MetaRequest };
  prisma: { flow: PrismaFlow; grade: GradeOutcomeInput[] };
  search?: { databases: SearchDb[] };
  // v0.5.5 — advanced modes
  network?: NetworkData;
  ipd?: IPDData;
  multilevel?: MultilevelData;
  diagnostic?: DiagnosticData;
  proportions?: ProportionsData;
  qualitative?: QualitativeData;
}

export interface ProjectConfig {
  effectMeasure?: string;
  title: string;
  studyType: string;
  reviewType: string;
  reviewers: { id: string; name: string }[];
  dualScreening: boolean;
  aiEnabled: boolean;
  aiFeatures: string[];
  databases: string[];
  pico: { population: string; intervention: string; comparator: string; outcomes: string };
  searchStrategy: Record<string, string>;
}

export function emptyProject(): Project {
  return {
    metadata: { id: crypto.randomUUID(), revision: 0, version: "0.6.4", created: new Date().toISOString(), title: "Untitled review" },
    pico: { population: "", intervention: "", comparator: "", outcomes: "" },
    protocol: { databases: "PubMed, Embase, Cochrane CENTRAL, Scopus", registration: "Not registered", objective: "" },
    screening: { title_abstract: [], full_text: [] },
    extraction: { studies: [] },
    rob: { assessments: [] },
    meta: { results: null, settings: { model: "random", measure: "OR", method: "DL", subgroup: "none", pub_bias: "none", data: [] } },
    prisma: { flow: { identified: null, duplicates: null, screened: null, excludedTa: null, fullText: null, excludedFt: null, included: null }, grade: [] },
    search: { databases: [] },
        qualitative: { codes: [], themes: [], memos: [] },
      };
    }

/**
 * Coerce anything that came off disk / the engine / a user-picked .json into a
 * Project that every page can render without optional-chaining every access.
 * Missing or wrong-typed branches fall back to emptyProject() defaults, so a
 * truncated or older-schema poolr.json can never white-screen the app.
 */
export function normalizeProject(raw: unknown): Project {
  const base = emptyProject();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, any>;
  const obj = (v: unknown): Record<string, any> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, any>) : {});
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const str = (v: unknown, fb = ""): string => (typeof v === "string" ? v : fb);
  const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

  const metadata = obj(r.metadata);
  const pico = obj(r.pico);
  const protocol = obj(r.protocol);
  const screening = obj(r.screening);
  const extraction = obj(r.extraction);
  const rob = obj(r.rob);
  const meta = obj(r.meta);
  const prisma = obj(r.prisma);
  const search = obj(r.search);
  const flow = obj(prisma.flow);

  const validDecision = (v: unknown): ScreenDecision =>
    v === "include" || v === "exclude" || v === "unsure" ? v : "unset";

  const items = (v: unknown, stage: ScreeningItem["stage"]): ScreeningItem[] =>
      arr<Record<string, any>>(v)
        .filter((i) => i && typeof i === "object")
        .map((i, idx) => ({
          id: str(i.id) || `x${idx}_${Math.random().toString(36).slice(2, 8)}`,
          title: str(i.title),
          abstract: str(i.abstract),
          decision: validDecision(i.decision),
          stage: i.stage === "full_text" || i.stage === "title_abstract" ? i.stage : stage,
          ...(typeof i.note === "string" ? { note: i.note } : {}),
          ...(typeof i.exclusion_reason === "string" ? { exclusion_reason: i.exclusion_reason } : {}),
          ...(typeof i.doi === "string" ? { doi: i.doi } : {}),
          ...(typeof i.pmid === "string" ? { pmid: i.pmid } : {}),
          // v0.5.5 — dual screening fields
          ...(Array.isArray(i.reviewerDecisions) ? { reviewerDecisions: i.reviewerDecisions.map((rd: any) => ({
            reviewerId: str(rd.reviewerId),
            reviewerName: str(rd.reviewerName),
            decision: validDecision(rd.decision),
            ...(typeof rd.note === "string" ? { note: rd.note } : {}),
            ...(typeof rd.exclusion_reason === "string" ? { exclusion_reason: rd.exclusion_reason } : {}),
            timestamp: str(rd.timestamp),
          })).filter((rd: any) => rd.reviewerId && rd.reviewerName) } : {}),
          ...(i.finalDecision ? { finalDecision: validDecision(i.finalDecision) } : {}),
          ...(i.conflictStatus === "pending" || i.conflictStatus === "resolved" || i.conflictStatus === "ai_adjudicated" || i.conflictStatus === "discuss" ? { conflictStatus: i.conflictStatus } : {}),
          ...(i.aiDecision && typeof i.aiDecision === "object" ? { aiDecision: {
            decision: validDecision(i.aiDecision.decision),
            reason: str(i.aiDecision.reason),
            confidence: typeof i.aiDecision.confidence === "number" ? i.aiDecision.confidence : 0.5,
            timestamp: str(i.aiDecision.timestamp),
          } } : {}),
        }));

  const validTool = (v: unknown): RobAssessment["tool"] =>
    v === "NOS" || v === "PROBAST" || v === "ROBINS-I" || v === "QUADAS-2" || v === "AMSTAR-2" ? v : "RoB2";
  const validOverall = (v: unknown): RobAssessment["overall"] =>
    v === "Low" || v === "Some concerns" || v === "High" || v === "Critical" ? v : "—";

  return {
    metadata: {
      ...metadata,
      id: str(metadata.id) || base.metadata.id,
      revision: numOrNull(metadata.revision) ?? 0,
      version: str(metadata.version, base.metadata.version),
      created: str(metadata.created, base.metadata.created),
      title: str(metadata.title, base.metadata.title),
    },
    pico: {
      population: str(pico.population),
      intervention: str(pico.intervention),
      comparator: str(pico.comparator),
      outcomes: str(pico.outcomes),
    },
    protocol: {
      databases: str(protocol.databases, base.protocol.databases),
      registration: str(protocol.registration, base.protocol.registration),
      objective: str(protocol.objective),
    },
    screening: {
      title_abstract: items(screening.title_abstract, "title_abstract"),
      full_text: items(screening.full_text, "full_text"),
    },
    extraction: {
      studies: arr<Record<string, any>>(extraction.studies)
        .filter((s) => s && typeof s === "object")
        .map((s) => ({
          ...(s as ExtractedStudy),
          study: str(s.study),
          type: ["binary", "continuous", "survival", "proportion", "rate", "correlation", "generic"].includes(s.type) ? s.type : "binary",
        })),
    },
    rob: {
      assessments: arr<Record<string, any>>(rob.assessments)
        .filter((a) => a && typeof a === "object")
        .map((a, idx) => ({
          id: str(a.id) || `r${idx}_${Math.random().toString(36).slice(2, 8)}`,
          study: str(a.study),
          tool: validTool(a.tool),
          overall: validOverall(a.overall),
          domains: obj(a.domains) as Record<string, string>,
        })),
    },
    meta: {
      results: meta.results && typeof meta.results === "object" ? (meta.results as MetaResponse) : null,
      settings: { ...base.meta.settings, ...obj(meta.settings), data: arr<Study>(obj(meta.settings).data) },
    },
    prisma: {
      flow: {
        identified: numOrNull(flow.identified),
        duplicates: numOrNull(flow.duplicates),
        screened: numOrNull(flow.screened),
        excludedTa: numOrNull(flow.excludedTa),
        fullText: numOrNull(flow.fullText),
        excludedFt: numOrNull(flow.excludedFt),
        included: numOrNull(flow.included),
      },
      grade: arr<GradeOutcomeInput>(prisma.grade),
    },
    search: { databases: arr<Record<string, any>>(search.databases).filter((d) => d && typeof d === "object").map((d) => ({ name: str(d.name), query: str(d.query), results: numOrNull(d.results) })) },
    ...(r.network ? { network: { ...obj(r.network), treatments: arr<string>(r.network.treatments), comparisons: arr(r.network.comparisons), results: r.network.results ?? null } as NetworkData } : {}),
    ...(r.ipd ? { ipd: { datasets: arr(r.ipd.datasets), results: r.ipd.results ?? null } as IPDData } : {}),
    ...(r.multilevel ? { multilevel: { effectSizes: arr(r.multilevel.effectSizes), results: r.multilevel.results ?? null } as MultilevelData } : {}),
    ...(r.diagnostic ? { diagnostic: { studies: arr(r.diagnostic.studies), results: r.diagnostic.results ?? null } as DiagnosticData } : {}),
    ...(r.proportions ? { proportions: { studies: arr(r.proportions.studies), results: r.proportions.results ?? null } as ProportionsData } : {}),
    ...(r.qualitative ? { qualitative: { codes: arr(r.qualitative.codes), themes: arr(r.qualitative.themes), memos: arr(r.qualitative.memos) } as QualitativeData } : {}),
    ...(r.manuscript ? { manuscript: {
      sections: Object.fromEntries(Object.entries(obj(r.manuscript.sections)).filter(([, value]) => typeof value === "string")),
      sectionMetas: obj(r.manuscript.sectionMetas),
      history: arr(r.manuscript.history),
      comments: arr(r.manuscript.comments),
    } as Project["manuscript"] } : {}),
  };
}

// ── Engine client additions (extends api.ts) ──
import { ENGINE_URL, postJson } from "./api";

export async function runMeta(req: MetaRequest): Promise<MetaResponse> {
  return postJson<MetaResponse>("/api/meta", req);
}

/** v0.6.0 — extended analysis endpoint (KH, MH/Peto, sensitivity, bias depth, new outcome types). */
export async function runMetaExtended(req: ExtendedMetaRequest): Promise<ExtendedMetaResponse> {
  return postJson<ExtendedMetaResponse>("/api/meta2", req);
}

export async function runGrade(req: { outcomes?: GradeOutcomeInput[]; meta?: MetaResponse | null; rob?: { overall?: string }[] }): Promise<GradeRow[]> {
  return postJson<GradeRow[]>("/api/grade", req);
}

/** Fetch an SVG figure by kind (v0.6.0 adds galbraith/labbe/baujat/funnel_contour). */
export async function getFigure(kind: string, resp: MetaResponse): Promise<string> {
  let r: Response;
  try {
    r = await fetch(`${ENGINE_URL}/api/figure/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resp),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error(`Engine offline — could not render the ${kind} plot (${ENGINE_URL}).`);
  }
  if (!r.ok) throw new Error(`figure ${kind} failed (${r.status})`);
  return r.text();
}

/** v0.6.0 effect-size conversions (POST /api/convert). */
export interface ConvertResult { conversion: string; result: number; extra?: Record<string, number>; note?: string }
export async function runConvert(body: Record<string, unknown>): Promise<ConvertResult> {
  return postJson<ConvertResult>("/api/convert", body);
}

/**
 * v0.6.0 de-duplication across imported records.
 * A record is a duplicate of an earlier one when PMID or DOI match exactly,
 * or when the normalized titles (lowercase, alphanumeric-only) match.
 * Returns the deduped list plus how many were dropped and their ids.
 */
export function dedupeRecords(
  incoming: ScreeningItem[],
  existing: ScreeningItem[]
): { kept: ScreeningItem[]; duplicatesRemoved: number; duplicateIds: string[] } {
  const keyOf = (i: ScreeningItem): string => {
    if (i.pmid) return `pmid:${i.pmid}`;
    if (i.doi) return `doi:${i.doi.toLowerCase()}`;
    const t = i.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    return t.length >= 12 ? `t:${t}` : "";
  };
  const seen = new Set<string>();
  for (const e of existing) {
    const k = keyOf(e);
    if (k) seen.add(k);
  }
  const kept: ScreeningItem[] = [];
  const duplicateIds: string[] = [];
  for (const item of incoming) {
    const k = keyOf(item);
    if (k && seen.has(k)) { duplicateIds.push(item.id); continue; }
    if (k) seen.add(k);
    kept.push(item);
  }
  return { kept, duplicatesRemoved: incoming.length - kept.length, duplicateIds };
}

// ── Citation import (see lib/importScreening.ts) ──
export {
  CITATION_ACCEPT,
  citationsToScreeningItems,
  detectFormat,
  importCitationText,
  parseCitations,
  parseCsv,
  parseEndnote,
  parseMedline,
  parseRis,
} from "./importScreening";
export type { CitationFormat, CitationRecord, ImportResult } from "./importScreening";

/** Append screening items to a stage, returning a new Project (autosave-friendly). */
export function mergeScreeningItems(
  project: Project,
  stage: ScreeningItem["stage"],
  incoming: ScreeningItem[]
): Project {
  const existing = project.screening[stage] ?? [];
  const seen = new Set(existing.map((i) => i.id));
  const added = incoming
    .filter((i) => !seen.has(i.id))
    .map((i) => ({ ...i, stage }));
  return {
    ...project,
    screening: { ...project.screening, [stage]: [...existing, ...added] },
  };
}

// Tiny CSV builder helper.
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  // Firefox only fires the download for anchors attached to the document, and
  // revoking synchronously can cancel the transfer — defer the cleanup.
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 0);
}
