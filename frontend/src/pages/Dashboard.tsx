import { ArrowRight } from "lucide-react";
import type { Project } from "../lib/project";

const go = (page: string) => window.dispatchEvent(new CustomEvent("poolr:gopage", { detail: page }));
export default function Dashboard({ project }: { project: Project; onChange: (p: Project) => void }) {
  const ta = project.screening.title_abstract;
  const pending = ta.filter(r => r.decision === "unset").length;
  const conflicts = [...ta, ...project.screening.full_text].filter(r => r.conflictStatus === "pending" || r.conflictStatus === "discuss").length;
  const studies = project.extraction.studies.length;
  const next = !project.pico.population ? "protocol" : !ta.length ? "search" : pending || conflicts ? "screening" : !studies ? "extraction" : "meta";
  const nextLabel: Record<string, string> = { protocol: "Define your research question", search: "Find and import references", screening: "Continue screening", extraction: "Extract study data", meta: "Review your analysis" };
  return <div className="review-overview">
    <div className="review-heading"><p>REVIEW OVERVIEW</p><h2>{project.metadata.title || "Untitled review"}</h2><span>{project.protocol.objective || "A clear question is the starting point of a good review."}</span></div>
    <section className="review-next"><div><small>NEXT STEP</small><h3>{nextLabel[next]}</h3><p>{pending ? pending + " references are waiting for a decision." : "Work through your review, with the evidence kept in context."}</p></div><button className="btn-primary" onClick={() => go(next)}>Continue <ArrowRight size={15}/></button></section>
    <div className="review-metrics">{[
      {label:"References imported",value:ta.length,detail:"Title & abstract stage",page:"search"},
      {label:"Awaiting screening",value:pending,detail:conflicts + " unresolved conflicts",page:"screening"},
      {label:"Studies extracted",value:studies,detail:"Review outcomes and source data",page:"extraction"},
      {label:"Bias assessments",value:project.rob.assessments.length,detail:"Review judgments and rationale",page:"rob"}
    ].map(m => <button key={m.page} onClick={() => go(m.page)}><span>{m.label}</span><strong>{m.value}</strong><small>{m.detail}</small></button>)}</div>
    <div className="review-columns"><section className="review-panel"><h3>Research question <button onClick={() => go("protocol")}>Edit protocol →</button></h3><dl>{Object.entries(project.pico).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value || "Not defined yet"}</dd></div>)}</dl></section>
    <section className="review-panel"><h3>Review workspace</h3>{[{title:"Search & screening",note:"Find evidence and record eligibility decisions",page:"search"},{title:"Data & assessment",note:"Extract outcomes and evaluate risk of bias",page:"extraction"},{title:"Analysis & reporting",note:"Inspect results and prepare your manuscript",page:"meta"}].map(item => <button className="review-workflow-row" key={item.page} onClick={() => go(item.page)}><div><strong>{item.title}</strong><small>{item.note}</small></div><ArrowRight size={16}/></button>)}</section></div>
    <p className="review-footnote">Counts are shown by review stage. Analysis results and method settings are available in Meta-Analysis.</p>
  </div>;
}
