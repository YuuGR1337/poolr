import type { Project } from "../lib/project";
import ResearchDiscovery from "../components/ResearchDiscovery";
import { Card, Input, Textarea, SectionLabel, Button } from "../components/ui";
import { suggestPICO } from "../lib/ai";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { StepCommentsButton } from "../components/StepCommentsDrawer";

export default function Protocol({ project, onChange }: { project: Project; onChange: (p: Project) => void }) {
  const set = (patch: Partial<Project>) => onChange({ ...project, ...patch });
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<Partial<Project["pico"]> | null>(null);
  const [error, setError] = useState("");

  const handleSuggestPICO = async () => {
    const question = project.metadata.title || project.protocol.objective;
    if (!question.trim()) return;
    setBusy(true); setError("");
    try {
      const pico = await suggestPICO(question);
      setSuggestion(pico);
    } catch (e) { setError(String(e)); } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm">{error}</p>}
      {suggestion && <Card title="Review the AI suggestion"><p className="text-xs mb-2">Verify this proposal and search for existing reviews before applying it.</p>{Object.entries(suggestion).map(([key, value]) => <p key={key} className="text-sm mb-2"><strong>{key}:</strong> {value}</p>)}<Button onClick={() => { set({ pico: { ...project.pico, ...suggestion } }); setSuggestion(null); }}>Apply reviewed suggestion</Button><Button onClick={() => setSuggestion(null)}>Discard</Button></Card>}
      <ResearchDiscovery topic={project.metadata.title || project.protocol.objective} />
      <Card title="Review title" right={<StepCommentsButton step="protocol" stepTitle="Protocol & PICO" />}>
        <Input
          value={project.metadata.title ?? ""}
          placeholder="e.g. Effect of X on Y in Z populations"
          onChange={(e) => set({ metadata: { ...project.metadata, title: e.target.value } })}
        />
      </Card>

      <Card
        title="PICO definition"
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggestPICO}
            disabled={busy || !(project.metadata.title || project.protocol.objective).trim()}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? "Suggesting…" : "Suggest PICO"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <SectionLabel>Population</SectionLabel>
            <Textarea rows={3} value={project.pico.population}
              onChange={(e) => set({ pico: { ...project.pico, population: e.target.value } })}
              placeholder="Participants / patients" />
          </div>
          <div>
            <SectionLabel>Intervention</SectionLabel>
            <Textarea rows={3} value={project.pico.intervention}
              onChange={(e) => set({ pico: { ...project.pico, intervention: e.target.value } })}
              placeholder="Experimental exposure / treatment" />
          </div>
          <div>
            <SectionLabel>Comparator</SectionLabel>
            <Textarea rows={3} value={project.pico.comparator}
              onChange={(e) => set({ pico: { ...project.pico, comparator: e.target.value } })}
              placeholder="Control / standard of care" />
          </div>
          <div>
            <SectionLabel>Outcomes</SectionLabel>
            <Textarea rows={3} value={project.pico.outcomes}
              onChange={(e) => set({ pico: { ...project.pico, outcomes: e.target.value } })}
              placeholder="Primary & secondary outcomes" />
          </div>
        </div>
      </Card>

      <Card title="Protocol details">
        <div className="space-y-3">
          <div>
            <SectionLabel>Objective</SectionLabel>
            <Textarea rows={2} value={project.protocol.objective}
              onChange={(e) => set({ protocol: { ...project.protocol, objective: e.target.value } })}
              placeholder="State the primary research question." />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <SectionLabel>Databases</SectionLabel>
              <Input value={project.protocol.databases}
                onChange={(e) => set({ protocol: { ...project.protocol, databases: e.target.value } })} />
            </div>
            <div>
              <SectionLabel>Registration</SectionLabel>
              <Input value={project.protocol.registration}
                onChange={(e) => set({ protocol: { ...project.protocol, registration: e.target.value } })}
                placeholder="PROSPERO ID or 'Not registered'" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
