import { useEffect, useState } from "react";
import type { Project, RobAssessment } from "../lib/project";
import { Card, Select, Pill, EmptyState, Button, Input } from "../components/ui";
import { RadarChart } from "../components/charts/radar-chart";
import { RadarGrid } from "../components/charts/radar-grid";
import { RadarAxis } from "../components/charts/radar-axis";
import { RadarLabels } from "../components/charts/radar-labels";
import { RadarArea } from "../components/charts/radar-area";
import { suggestRoB } from "../lib/ai";
import { fetchRobFigure } from "../lib/api";
import { downloadText } from "../lib/project";
import { Sparkles, Loader2, Download } from "lucide-react";
import { StepCommentsButton } from "../components/StepCommentsDrawer";

const TOOLS = ["RoB2", "NOS", "PROBAST", "ROBINS-I", "QUADAS-2", "AMSTAR-2"] as const;
const OVERALL = ["Low", "Some concerns", "High", "Critical", "—"] as const;

const DOMAINS: Record<(typeof TOOLS)[number], string[]> = {
  RoB2: ["Randomization", "Deviations from intended", "Missing outcome", "Measurement of outcome", "Selection of reported result"],
  NOS: ["Selection", "Comparability", "Exposure / Outcome"],
  PROBAST: ["Participants", "Predictors", "Outcome", "Analysis"],
  "ROBINS-I": ["Confounding", "Selection of participants", "Classification of interventions", "Deviations from intended interventions", "Missing data", "Measurement of outcomes", "Selection of reported result"],
  "QUADAS-2": ["Patient selection", "Index test", "Reference standard", "Flow and timing"],
  "AMSTAR-2": ["Protocol a priori", "Comprehensive literature search", "Study selection in duplicate", "Data extraction in duplicate", "Excluded studies listed", "Risk of bias assessed", "Publication bias assessed", "Certainty of evidence reported"],
};

function blank(study: string, tool: (typeof TOOLS)[number]): RobAssessment {
  const domains: Record<string, string> = {};
  for (const d of DOMAINS[tool]) domains[d] = "Low";
  return { id: `r${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, study, tool, overall: "—", domains };
}

export default function Rob({ project, onChange }: { project: Project; onChange: (p: Project) => void }) {
  const list = project.rob.assessments;
  const studyNames = Array.from(new Set([
    ...project.extraction.studies.map((s) => s.study),
    ...list.map((a) => a.study),
  ])).filter(Boolean);
  const [tool, setTool] = useState<(typeof TOOLS)[number]>("RoB2");
  const [busyDomain, setBusyDomain] = useState<string | null>(null);
  const [abstracts, setAbstracts] = useState<Record<string, string>>({});
  const [vizTab, setVizTab] = useState<"traffic" | "summary" | "radar">("traffic");
  const [robSvg, setRobSvg] = useState<string | null>(null);
  const [svgLoading, setSvgLoading] = useState(false);

  useEffect(() => {
    if (vizTab === "radar" || list.length === 0) return;
    const forTool = list.filter((a) => a.tool === tool);
    if (forTool.length === 0) {
      setRobSvg(null);
      return;
    }
    const domains = DOMAINS[tool];
    const studies = forTool.map((a) => a.study);
    const judgements = forTool.map((a) => domains.map((d) => a.domains[d] ?? "Low"));
    setSvgLoading(true);
    fetchRobFigure({ studies, domains, judgements }, vizTab)
      .then((svg) => setRobSvg(svg))
      .catch((e) => {
        console.error("Failed to fetch RoB figure", e);
        setRobSvg(null);
      })
      .finally(() => setSvgLoading(false));
  }, [vizTab, list, tool]);

  const add = () => {
    const name = studyNames[0] ?? "New study";
    onChange({ ...project, rob: { assessments: [...list, blank(name, tool)] } });
  };

  const update = (id: string, patch: Partial<RobAssessment>) => {
    onChange({ ...project, rob: { assessments: list.map((a) => (a.id === id ? { ...a, ...patch } : a)) } });
  };

  const remove = (id: string) => {
    onChange({ ...project, rob: { assessments: list.filter((a) => a.id !== id) } });
  };

  const handleSuggestRating = async (assessmentId: string, domain: string) => {
    const abstract = abstracts[assessmentId] || "";
    if (!abstract.trim()) return;
    setBusyDomain(domain);
    try {
      const { rating } = await suggestRoB(abstract, domain);
      const assessment = list.find(a => a.id === assessmentId);
      if (assessment) {
        update(assessmentId, { domains: { ...assessment.domains, [domain]: rating } });
      }
    } finally {
      setBusyDomain(null);
    }
  };

  const counts = list.reduce((acc, a) => { acc[a.overall] = (acc[a.overall] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-3">
      <Card title="Risk of bias" right={
        <div className="flex items-center gap-2">
          <Select className="w-auto" value={tool} onChange={(e) => setTool(e.target.value as (typeof TOOLS)[number])}>
            {TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <button className="btn-primary" onClick={add}>+ Add</button>
          <StepCommentsButton step="rob" stepTitle="Risk of Bias" />
        </div>
      }>
        <p className="mb-3 text-[12.5px] text-[var(--color-text-muted)]">
          Rate each study with the {tool} tool. Overall rating feeds the GRADE certainty on the PRISMA page.
        </p>

        {list.length === 0 ? (
          <EmptyState>No assessments. Add a study to begin — studies from Extraction are pre-listed.</EmptyState>
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <div key={a.id} className="rounded-[5px] border border-[var(--color-border)] bg-[var(--input-bg)] p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Select className="max-w-[220px]" value={a.study} onChange={(e) => update(a.id, { study: e.target.value })}>
                    {studyNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    <option value="New study">New study</option>
                  </Select>
                  <Select className="w-auto" value={a.tool} onChange={(e) => { const t = e.target.value as (typeof TOOLS)[number]; update(a.id, { tool: t, domains: Object.fromEntries(DOMAINS[t].map((d) => [d, "Low"])) }); }}>
                    {TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10.5px] text-[var(--color-text-muted)]">Overall</span>
                    <Select className="w-auto" value={a.overall} onChange={(e) => update(a.id, { overall: e.target.value as RobAssessment["overall"] })}>
                      {OVERALL.map((o) => <option key={o} value={o}>{o}</option>)}
                    </Select>
                    <button className="btn-ghost" onClick={() => remove(a.id)}>remove</button>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] text-[var(--color-text-muted)]">Paste abstract for AI RoB suggestions:</span>
                                  <Input
                                    className="w-80"
                                    placeholder="Study abstract…"
                                    value={abstracts[a.id] ?? ""}
                                    onChange={(e) => setAbstracts({ ...abstracts, [a.id]: e.target.value })}
                                  />
                                </div>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                  {DOMAINS[a.tool].map((d) => (
                                    <div key={d} className="flex items-center gap-2">
                                      <span className="flex-1 text-[12px] text-[var(--color-text-muted)]">{d}</span>
                                      <Select className="w-auto" value={a.domains[d] ?? "Low"} onChange={(e) => update(a.id, { domains: { ...a.domains, [d]: e.target.value } })}>
                                        <option>Low</option><option>Some concerns</option><option>High</option>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSuggestRating(a.id, d)}
                                        disabled={busyDomain === d || !(abstracts[a.id] ?? "").trim()}
                                      >
                                        {busyDomain === d ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                        Suggest
                                      </Button>
                                    </div>
                                  ))}
                                </div>
              </div>
            ))}
          </div>
        )}

        {list.length > 0 && (
          <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
            <span className="text-[11px] text-[var(--color-text-muted)]">Distribution:</span>
            {(["Low", "Some concerns", "High"] as const).map((o) => (
              <Pill key={o} tone={o === "Low" ? "include" : o === "High" ? "exclude" : "unsure"}>{o}: {counts[o] ?? 0}</Pill>
            ))}
          </div>
        )}
      </Card>

      {list.length > 0 && (
        <Card
          title="Risk of Bias Visualization"
          right={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--input-bg)] p-0.5 text-[11px]">
                <button
                  className={`rounded px-2.5 py-1 transition-colors ${
                    vizTab === "traffic"
                      ? "bg-blue-600 dark:bg-blue-500 text-white font-medium shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                  onClick={() => setVizTab("traffic")}
                >
                  Traffic Light
                </button>
                <button
                  className={`rounded px-2.5 py-1 transition-colors ${
                    vizTab === "summary"
                      ? "bg-blue-600 dark:bg-blue-500 text-white font-medium shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                  onClick={() => setVizTab("summary")}
                >
                  Summary Bar
                </button>
                <button
                  className={`rounded px-2.5 py-1 transition-colors ${
                    vizTab === "radar"
                      ? "bg-blue-600 dark:bg-blue-500 text-white font-medium shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                  onClick={() => setVizTab("radar")}
                >
                  Radar
                </button>
              </div>
              {vizTab !== "radar" && robSvg && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(`rob_${vizTab}_${tool.toLowerCase()}.svg`, robSvg, "image/svg+xml")}
                  title="Download publication-quality SVG"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export SVG
                </Button>
              )}
            </div>
          }
        >
          {vizTab === "radar" ? (
            <DomainRadar list={list} tool={tool} />
          ) : svgLoading ? (
            <div className="flex h-64 items-center justify-center text-[12px] text-[var(--color-text-muted)]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--color-accent)]" />
              Generating Cochrane {vizTab === "traffic" ? "traffic light" : "summary bar"} figure…
            </div>
          ) : robSvg ? (
            <div className="flex flex-col items-center">
              <div
                className="max-w-full overflow-x-auto rounded-lg bg-[var(--color-surface)] p-2 shadow-inner"
                dangerouslySetInnerHTML={{ __html: robSvg }}
              />
              <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
                Standard Cochrane robvis-style figure ({tool}) • Fully vector Scalable Vector Graphics (SVG)
              </p>
            </div>
          ) : (
            <EmptyState>No {tool} data available to render figure.</EmptyState>
          )}
        </Card>
      )}
    </div>
  );
}

/** Bklit RadarChart: one axis per RoB domain, value = % of studies at "Low". */
function DomainRadar({ list, tool }: { list: RobAssessment[]; tool: (typeof TOOLS)[number] }) {
  const domains = DOMAINS[tool];
  const forTool = list.filter((a) => a.tool === tool);
  if (forTool.length === 0) {
    return <EmptyState>No {tool} assessments yet.</EmptyState>;
  }
  const metrics = domains.map((d, i) => ({ key: `d${i}`, label: d }));
  const values: Record<string, number> = {};
  domains.forEach((d, i) => {
    const low = forTool.filter((a) => (a.domains[d] ?? "Low") === "Low").length;
    values[`d${i}`] = Math.round((low / forTool.length) * 100);
  });
  return (
    <div className="mx-auto max-w-[380px]">
      <RadarChart data={[{ label: `${tool} — low risk`, values }]} metrics={metrics} margin={64} levels={4}>
        <RadarGrid />
        <RadarAxis />
        <RadarLabels />
        <RadarArea index={0} />
      </RadarChart>
      <p className="mt-1 text-center text-[10.5px] text-[var(--color-text-muted)]">
        {forTool.length} {tool} assessment{forTool.length === 1 ? "" : "s"} — outer edge = 100% low risk
      </p>
    </div>
  );
}
