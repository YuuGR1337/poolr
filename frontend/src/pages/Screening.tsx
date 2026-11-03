import { useEffect, useMemo, useRef, useState } from "react";
import type { Project, ScreeningItem, ScreenDecision } from "../lib/project";
import { CITATION_ACCEPT, importCitationText, mergeScreeningItems, dedupeRecords } from "../lib/project";
import { readTextFiles, runPriorityScreening } from "../lib/api";
import { Card, Pill, Input, Textarea, EmptyState } from "../components/ui";
import FunnelChart from "../components/charts/FunnelChart";
import TeamSelector, { REVIEWER_MEMBERS } from "../components/kokonut/TeamSelector";
import AIScreeningPanel from "../components/ai/AIScreeningPanel";
import ConflictDashboard from "../components/ConflictDashboard";
import LivingReviews from "../components/LivingReviews";
import { StepCommentsButton } from "../components/StepCommentsDrawer";

const DECISIONS: ScreenDecision[] = ["include", "exclude", "unsure"];
const DEC_LABEL: Record<ScreenDecision, string> = { include: "Include", exclude: "Exclude", unsure: "Unsure", unset: "Unset" };
const DEC_TONE: Record<ScreenDecision, "include" | "exclude" | "unsure" | "neutral"> = {
  include: "include", exclude: "exclude", unsure: "unsure", unset: "neutral",
};
// v0.6.3 — structured PICO-failure exclusion reasons (PRISMA-reportable)
const EXCLUSION_REASONS = [
  "Population not relevant",
  "Intervention not relevant",
  "Comparator not relevant",
  "Outcome not reported",
  "Study design not eligible",
  "Review / meta-analysis (not primary)",
  "Case report / series",
  "Insufficient data for extraction",
  "Wrong language",
  "Duplicate publication",
] as const;

// Lightweight windowing virtualization (no external dep) — only renders visible rows.
const ROW_H = 64;
const OVERSCAN = 6;

function StageTabs({ stage, setStage }: { stage: "title_abstract" | "full_text"; setStage: (s: "title_abstract" | "full_text") => void }) {
  return (
    <div className="flex items-center gap-1">
      {(["title_abstract", "full_text"] as const).map((s) => (
        <button key={s} className={`btn-ghost ${stage === s ? "!text-[var(--color-text)] !border-[var(--color-border-strong)]" : ""}`}
          onClick={() => setStage(s)}>{s === "title_abstract" ? "Title / Abstract" : "Full text"}</button>
      ))}
    </div>
  );
}

export default function Screening({ project, onChange }: { project: Project; onChange: (p: Project) => void }) {
  const [stage, setStage] = useState<"title_abstract" | "full_text">("title_abstract");
  const [filter, setFilter] = useState<"all" | ScreenDecision>("all");
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => () => { if (noticeTimer.current != null) window.clearTimeout(noticeTimer.current); }, []);
  // v0.5.3 — number of independent reviewers screening (dual screening support).
  const [reviewers, setReviewers] = useState(2);
  const [tab, setTab] = useState<"screening" | "dual_entry" | "conflicts" | "living_review">("screening");
  const [activeReviewerIdx, setActiveReviewerIdx] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = project.screening?.[stage] ?? [];
  const itemsRef = useRef(items);
  if (items !== itemsRef.current) itemsRef.current = items;
  const visible = useMemo(() => {
    let list = itemsRef.current;
    if (filter !== "all") list = list.filter((i) => i.decision === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.abstract.toLowerCase().includes(q));
    }
    return list;
  }, [filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: itemsRef.current.length, include: 0, exclude: 0, unsure: 0, unset: 0 };
    for (const it of itemsRef.current) c[it.decision]++;
    return c;
  }, []);

  const setDecision = (id: string, decision: ScreenDecision) => {
    const next = items.map((it) => (it.id === id ? { ...it, decision } : it));
    onChange({ ...project, screening: { ...project.screening, [stage]: next } });
  };

  const setNote = (id: string, note: string) => {
    const next = items.map((it) => (it.id === id ? { ...it, note } : it));
    onChange({ ...project, screening: { ...project.screening, [stage]: next } });
  };

  // v0.5.5 — dual screening: record a reviewer's decision independently
  const setReviewerDecision = (id: string, reviewerIdx: number, decision: ScreenDecision, note?: string, exclusion_reason?: string) => {
    const member = REVIEWER_MEMBERS[reviewerIdx];
    if (!member) return;
    const next = items.map((it) => {
      if (it.id !== id) return it;
      const existing = it.reviewerDecisions ?? [];
      const others = existing.filter((d) => d.reviewerId !== member.id);
      const newDecision = {
        reviewerId: member.id,
        reviewerName: member.name,
        decision,
        note,
        exclusion_reason,
        timestamp: new Date().toISOString(),
      };
      const reviewerDecisions = [...others, newDecision];
      // Determine conflict status
      const settled = reviewerDecisions.filter((d) => d.decision !== "unset");
      let conflictStatus: "pending" | "resolved" | "discuss" | undefined;
      if (settled.length >= 2) {
        const first = settled[0].decision;
        const hasConflict = settled.some((d) => d.decision !== first);
        conflictStatus = hasConflict ? "pending" : "resolved";
      }
      return {
        ...it,
        reviewerDecisions,
        conflictStatus,
        // Auto-set decision when reviewers agree
        decision: conflictStatus === "resolved" ? decision : "unset" as const,
      };
    });
    onChange({ ...project, screening: { ...project.screening, [stage]: next } });
  };

  const addSample = () => {
    const n = items.length + 1;
    const next: ScreeningItem = {
      id: `s${Date.now()}_${n}`,
      title: `Screening record #${n} — ${stage === "title_abstract" ? "title/abstract" : "full-text"} candidate`,
      abstract: "Paste or import the citation abstract here. Decision persists in the project and is auto-saved.",
      decision: "unset",
      stage,
    };
    onChange({ ...project, screening: { ...project.screening, [stage]: [...items, next] } });
  };

  const promoteToFullText = () => {
    const taIncluded = (project.screening?.title_abstract ?? []).filter((i) => i.decision === "include");
    if (taIncluded.length === 0) {
      setNotice("No records marked as 'Include' in Title/Abstract stage yet.");
      return;
    }
    const ftExisting = project.screening?.full_text ?? [];
    const ftIds = new Set(ftExisting.map((i) => i.id));
    const ftTitles = new Set(ftExisting.map((i) => i.title.toLowerCase().trim()));

    const toAdd: ScreeningItem[] = taIncluded
      .filter((i) => !ftIds.has(i.id) && !ftTitles.has(i.title.toLowerCase().trim()))
      .map((i) => ({
        ...i,
        stage: "full_text" as const,
        decision: "unset" as const,
        reviewerDecisions: [],
        conflictStatus: undefined,
        exclusion_reason: undefined,
      }));

    if (toAdd.length === 0) {
      setNotice("All included Title/Abstract records are already in Full-Text screening.");
      return;
    }

    const nextFt = [...ftExisting, ...toAdd];
    onChange({
      ...project,
      screening: {
        ...project.screening,
        full_text: nextFt,
      },
    });
    setNotice(`Promoted ${toAdd.length} included record${toAdd.length === 1 ? "" : "s"} to Full-Text screening!`);
    setStage("full_text");
  };

  const handlePrioritySort = async () => {
    const picoTerms = [
      project.pico?.population,
      project.pico?.intervention,
      project.pico?.comparator,
      project.pico?.outcomes,
      project.protocol?.objective,
    ].filter(Boolean) as string[];

    if (picoTerms.length === 0) {
      setNotice("Please define Population or Intervention in Protocol/PICO first.");
      return;
    }

    const payload = items.map((it) => ({
      id: it.id,
      title: it.title,
      abstract: it.abstract,
      decision: it.decision,
    }));

    try {
      const res = await runPriorityScreening({ items: payload, picoTerms });
      if (Array.isArray(res) && res.length > 0) {
        const orderMap = new Map(res.map((r, idx) => [r.id, idx]));
        const sorted = [...items].sort((a, b) => {
          const rankA = orderMap.get(a.id) ?? 999999;
          const rankB = orderMap.get(b.id) ?? 999999;
          return rankA - rankB;
        });
        onChange({
          ...project,
          screening: {
            ...project.screening,
            [stage]: sorted,
          },
        });
        setNotice(`Ranked ${sorted.length} records by AI priority relevance.`);
      }
    } catch {
      // Deterministic client-side term frequency fallback
      const keywords = picoTerms
        .flatMap((p) => p.toLowerCase().split(/[\s,;]+/))
        .filter((w) => w.length > 3);
      const sorted = [...items].sort((a, b) => {
        const textA = (a.title + " " + a.abstract).toLowerCase();
        const textB = (b.title + " " + b.abstract).toLowerCase();
        const scoreA = keywords.reduce((acc, k) => acc + (textA.includes(k) ? 1 : 0), 0);
        const scoreB = keywords.reduce((acc, k) => acc + (textB.includes(k) ? 1 : 0), 0);
        return scoreB - scoreA;
      });
      onChange({
        ...project,
        screening: {
          ...project.screening,
          [stage]: sorted,
        },
      });
      setNotice(`Ranked ${sorted.length} records by PICO keyword relevance.`);
    }
  };

  // ── Citation import: MEDLINE .txt, CSV, RIS/.nbib, EndNote .txt ──
  const onImportFiles = async (fileList: FileList | null) => {
    const files = await readTextFiles(fileList);
    if (files.length === 0) return;

    let next = project;
    let imported = 0;
    let dupes = 0;
    const formats = new Set<string>();
    for (const f of files) {
      const stageItems = next.screening[stage] ?? [];
      const res = importCitationText(f.text, f.name, stage, stageItems.length + 1);
      if (res.items.length > 0) {
        // v0.6.3 — de-duplicate against what is already in the stage before merging
        const { kept, duplicatesRemoved } = dedupeRecords(res.items, stageItems);
        if (kept.length > 0) next = mergeScreeningItems(next, stage, kept);
        imported += kept.length;
        dupes += duplicatesRemoved;
        formats.add(res.format);
      }
    }

    if (imported > 0) onChange(next);
    const fmt = formats.size > 0 ? ` (${Array.from(formats).join(", ")})` : "";
    const dupeNote = dupes > 0 ? ` — ${dupes} duplicate${dupes === 1 ? "" : "s"} removed automatically` : "";
    setNotice(imported > 0 ? `Imported ${imported} records${fmt}${dupeNote}` : "Imported 0 records — no citations recognised");
  };

  // Resolve the selected record id to its position in the current visible list.
  // Tracked by id (not index) so filter/import/decision changes can't silently
  // repoint selection at the wrong record.
  const selIndex = selectedId != null ? visible.findIndex((it) => it.id === selectedId) : -1;

  const total = visible.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const end = Math.min(total, Math.ceil((scrollTop + 520) / ROW_H) + OVERSCAN);
  const slice = visible.slice(start, end);
  const sel = selIndex >= 0 ? selIndex : null;

  const funnelData = [
    { label: "Identified", value: Math.max(items.length, counts.all) || 0 },
    { label: "Screened", value: counts.all },
    { label: "Included", value: counts.include },
    { label: "Excluded", value: counts.exclude },
  ];

  return (
      <div className="space-y-3">
        {/* v0.5.5 — AI Screening Assistant (prominent, at top) */}
        <AIScreeningPanel
          items={items}
          pico={project.pico}
          inclusionCriteria={project.protocol.objective || ""}
          exclusionCriteria=""
          onDecisions={(decisions) => {
            const next = items.map(item => {
              const d = decisions.find(x => x.id === item.id);
              if (d) return { ...item, decision: d.decision };
              return item;
            });
            onChange({ ...project, screening: { ...project.screening, [stage]: next } });
          }}
        />

        {/* v0.5.3 — screening funnel + reviewer team, kokonutui-style */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card title="Screening funnel" className="lg:col-span-2">
            <FunnelChart
              color="var(--chart-1)"
              data={funnelData}
              layers={3}
            />
          </Card>
          <Card title="Reviewers">
            <TeamSelector defaultValue={reviewers} members={REVIEWER_MEMBERS} onChange={setReviewers} />
            <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
              {reviewers > 1 ? "Dual screening — records should be agreed by both reviewers." : "Single reviewer screening."}
            </p>
          </Card>
        </div>

      {/* v0.5.5 — Screening workflow tabs */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
        <div className="flex items-center gap-1">
          <button
            className={`btn-ghost ${tab === "screening" ? "!text-[var(--color-text)] !border-[var(--color-border-strong)]" : ""}`}
            onClick={() => setTab("screening")}
          >
            Single Screening
          </button>
          <button
            className={`btn-ghost ${tab === "living_review" ? "!text-[var(--color-text)] !border-[var(--color-border-strong)]" : ""}`}
            onClick={() => setTab("living_review")}
          >
            Living Review
          </button>
          <button
            className={`btn-ghost ${tab === "dual_entry" ? "!text-[var(--color-text)] !border-[var(--color-border-strong)]" : ""}`}
            onClick={() => setTab("dual_entry")}
          >
            Dual Entry
          </button>
          <button
            className={`btn-ghost ${tab === "conflicts" ? "!text-[var(--color-text)] !border-[var(--color-border-strong)]" : ""}`}
            onClick={() => setTab("conflicts")}
          >
            Conflicts
          </button>
        </div>
        <StepCommentsButton step="screening" stepTitle="Screening" />
      </div>

      {/* v0.5.5 — Conflict Dashboard */}
      {tab === "conflicts" && (
        <ConflictDashboard
          project={project}
          onChange={onChange}
          stage={stage}
          reviewers={reviewers}
        />
      )}

      {/* v0.5.5 — Dual Entry Mode */}
      {tab === "dual_entry" && (
        <Card title="Dual Screening Entry" right={
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-text-muted)]">Active reviewer:</span>
            <select
              className="rounded-[3px] border border-[var(--color-border)] bg-[var(--input-bg)] px-2 py-1 text-[12px] text-[var(--color-text)]"
              value={activeReviewerIdx}
              onChange={(e) => setActiveReviewerIdx(Number(e.target.value))}
            >
              {REVIEWER_MEMBERS.slice(0, reviewers).map((m, i) => (
                <option key={m.id} value={i}>{m.name}</option>
              ))}
            </select>
          </div>
        }>
          <div className="mb-3 text-[12px] text-[var(--color-text-muted)]">
            Record decisions independently for each reviewer. Conflicts will be flagged automatically.
          </div>
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState>No records to screen.</EmptyState>
            ) : (
              items.map((it) => {
                const rDecs = it.reviewerDecisions ?? [];
                const myDec = rDecs.find((d) => d.reviewerId === REVIEWER_MEMBERS[activeReviewerIdx]?.id);
                const statusTone = it.conflictStatus === "resolved" ? "include" : it.conflictStatus === "pending" ? "unsure" : "neutral";
                return (
                  <div key={it.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium text-[var(--color-text)]">{it.title}</div>
                        <div className="truncate text-[11px] text-[var(--color-text-muted)]">{it.abstract}</div>
                      </div>
                      {it.conflictStatus && (
                        <Pill tone={statusTone}>
                          {it.conflictStatus}
                        </Pill>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {DECISIONS.map((d) => (
                        <button
                          key={d}
                          className={`btn-ghost ${myDec?.decision === d ? "!border-[var(--color-border-strong)]" : ""}`}
                          style={myDec?.decision === d ? { color: decisionColor(d) } : undefined}
                          onClick={() => setReviewerDecision(it.id, activeReviewerIdx, d)}
                        >
                          {DEC_LABEL[d]}
                        </button>
                      ))}
                    </div>
                    {myDec?.decision === "exclude" && (
                      <select
                        className="mt-2 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--input-bg)] px-2 py-1.5 text-[12px] text-[var(--color-text)]"
                        value={myDec.exclusion_reason ?? ""}
                        onChange={(e) => setReviewerDecision(it.id, activeReviewerIdx, myDec!.decision, myDec!.note, e.target.value)}
                      >
                        <option value="">Exclusion reason…</option>
                        {EXCLUSION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                    <Textarea
                      className="mt-2"
                      rows={2}
                      placeholder="Note (optional)"
                      value={myDec?.note ?? ""}
                      onChange={(e) => setReviewerDecision(it.id, activeReviewerIdx, myDec?.decision ?? "unset", e.target.value, myDec?.exclusion_reason)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* v0.5.5 — Single Screening (original) */}
      {tab === "screening" && (
        <Card title="Screening" right={
          <div className="flex items-center gap-2">
            <StageTabs stage={stage} setStage={(s) => { setStage(s); setSelectedId(null); }} />
            {stage === "title_abstract" && counts.include > 0 && (
              <button
                className="btn-ghost !border-[var(--color-include)]/50 !text-[var(--color-include)]"
                onClick={promoteToFullText}
                title="Promote all included Title/Abstract records to Full-Text screening stage"
              >
                Promote Included ({counts.include})
              </button>
            )}
            <button
              className="btn-ghost"
              onClick={handlePrioritySort}
              title="Sort unreviewed records by relevance to PICO criteria (Living Review ML)"
            >
              Priority Sort
            </button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>Import</button>
            <button className="btn-primary" onClick={addSample}>+ Add</button>
          </div>
        }>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={CITATION_ACCEPT}
            multiple
            onChange={(e) => {
              const fl = e.target.files;
              void onImportFiles(fl);
              e.target.value = "";
            }}
          />
          {notice && (
            <div className="mb-2 rounded-[3px] border border-[var(--color-border)] bg-white/[0.04] px-2.5 py-1.5 text-[12.5px] text-[var(--color-text)]">
              {notice}
            </div>
          )}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {(["all", "include", "exclude", "unsure", "unset"] as const).map((f) => (
              <button key={f} className={`btn-ghost ${filter === f ? "!text-[var(--color-text)] !border-[var(--color-border-strong)]" : ""}`}
                onClick={() => setFilter(f)}>
                {f === "all" ? `All ${counts.all}` : `${DEC_LABEL[f]} ${counts[f]}`}
              </button>
            ))}
            <Input className="ml-auto w-44" placeholder="Filter titles…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {total === 0 ? (
            <EmptyState>
              No records at this stage. Use <span className="text-[var(--color-text)]">+ Add</span> to create screening items, or{" "}
              <span className="text-[var(--color-text)]">Import</span> a PubMed MEDLINE / RIS / .nbib / CSV / EndNote export.
            </EmptyState>
          ) : (
            <div className="flex gap-3" style={{ height: 520 }}>
              {/* Virtualized list */}
              <div ref={viewportRef}
                onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
                className="w-[56%] overflow-y-auto rounded-[5px] border border-[var(--color-border)] bg-[var(--input-bg)]">
                <div style={{ height: total * ROW_H, position: "relative" }}>
                  <div style={{ transform: `translateY(${start * ROW_H}px)` }}>
                    {slice.map((it) => {
                      const idx = visible.indexOf(it);
                      return (
                        <div key={it.id}
                          onClick={() => setSelectedId(it.id)}
                          className={`flex cursor-pointer items-start gap-2 border-b border-[var(--color-border)] px-3 py-2 transition-colors ${sel === idx ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
                          style={{ height: ROW_H }}>
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass(it.decision)}`} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12.5px] text-[var(--color-text)]">{it.title}</div>
                            <div className="truncate text-[11px] text-[var(--color-text-muted)]">{it.abstract}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detail + decisions */}
              <div className="flex w-[44%] flex-col rounded-[5px] border border-[var(--color-border)] bg-[var(--input-bg)] p-3">
                {sel == null ? (
                  <EmptyState>Select a record to screen.</EmptyState>
                ) : (
                  (() => {
                    const it = visible[sel];
                    return (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <Pill tone={DEC_TONE[it.decision]}>{DEC_LABEL[it.decision]}</Pill>
                          <span className="text-[10.5px] text-[var(--color-text-muted)]">{sel + 1} / {total}</span>
                        </div>
                        <div className="text-[13px] font-semibold text-[var(--color-text)]">{it.title}</div>
                        <Textarea className="mt-2 flex-1" rows={8} value={it.abstract} onChange={(e) => {
                          const next = items.map((x) => (x.id === it.id ? { ...x, abstract: e.target.value } : x));
                          onChange({ ...project, screening: { ...project.screening, [stage]: next } });
                        }} />
                        <Input className="mt-2" placeholder="Note (optional)" value={it.note ?? ""} onChange={(e) => setNote(it.id, e.target.value)} />
                        {it.decision === "exclude" && (
                          <select
                            className="mt-2 w-full rounded-[3px] border border-[var(--color-border)] bg-[var(--input-bg)] px-2 py-1.5 text-[12px] text-[var(--color-text)]"
                            value={(it as ScreeningItem).exclusion_reason ?? ""}
                            onChange={(e) => {
                              const next = items.map((x) => (x.id === it.id ? { ...x, exclusion_reason: e.target.value } : x));
                              onChange({ ...project, screening: { ...project.screening, [stage]: next } });
                            }}>
                            <option value="">Exclusion reason…</option>
                            {EXCLUSION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                        {(it as ScreeningItem).exclusion_reason && (
                          <div className="mt-1 text-[10.5px] text-[var(--color-text-muted)]">Reason: {(it as ScreeningItem).exclusion_reason}</div>
                        )}
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          {DECISIONS.map((d) => (
                            <button key={d} className={`btn-ghost ${it.decision === d ? "!border-[var(--color-border-strong)]" : ""}`}
                              style={it.decision === d ? { color: decisionColor(d) } : undefined}
                              onClick={() => setDecision(it.id, d)}>{DEC_LABEL[d]}</button>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <button className="btn-ghost" disabled={sel <= 0} onClick={() => setSelectedId(visible[sel - 1].id)}>↑ Prev</button>
                          <button className="btn-ghost" disabled={sel >= total - 1} onClick={() => setSelectedId(visible[sel + 1].id)}>Next ↓</button>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* v0.6.0 — Living Review Update Detection */}
      {tab === "living_review" && (
        <LivingReviews />
      )}
    </div>
  );
}

function dotClass(d: ScreenDecision) {
  return d === "include" ? "bg-[var(--color-include)]" : d === "exclude" ? "bg-[var(--color-exclude)]" : d === "unsure" ? "bg-[var(--color-unsure)]" : "bg-[var(--color-text-muted)]";
}
function decisionColor(d: ScreenDecision) {
  return d === "include" ? "var(--color-include)" : d === "exclude" ? "var(--color-exclude)" : d === "unsure" ? "var(--color-unsure)" : "#e6e7ea";
}