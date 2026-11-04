import React, { useState, useMemo, useEffect } from "react";
import { Card, Button, Pill } from "../components/ui";
import {
  Download,
  Copy,
  Check,
  FileText,
  Pen,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  PlusCircle,
  Eye,
  Edit3,
  UserCheck,
  Share2,
  Printer,
  Sparkles,
} from "lucide-react";
import type { Project } from "../lib/project";
import { draftManuscriptTemplate } from "../lib/manuscript";
import { useCollaboration } from "../context/CollaborationContext";

import { useDrive } from "../context/DriveContext";

interface SectionMeta {
  assignedTo?: string;
  reviewer?: string;
  dueDate?: string;
  status: "draft" | "review" | "changes_requested" | "approved";
}

export default function ManuscriptHelper({
  project,
  onChange,
}: {
  project: Project;
  onChange: (p: Project) => void;
}) {
  const { recordChange, setActiveSection: setCollabSection } = useCollaboration();
  const drive = useDrive();
  const team = drive.binding?.reviewId === project.metadata.id ? drive.activeTeam : undefined;
  const teamMembers = team?.members ?? [];
  const canAssign = !team || team.ownerKeyId === drive.identity?.keyId;
  const canEditManuscript = () => !team || drive.canEdit;

  const [activeTab, setActiveTab] = useState<
    "title" | "abstract" | "introduction" | "methods" | "results" | "discussion" | "conclusion" | "references"
  >("introduction");

  const [editMode, setEditMode] = useState<"edit" | "preview" | "split">("split");
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Initialize draft from template or existing project manuscript data
  const defaultTemplate = useMemo(() => draftManuscriptTemplate(project, ""), [project]);

  const sections: Record<string, string> = project.manuscript?.sections ?? { ...defaultTemplate };
  const sectionMetas: Record<string, SectionMeta> = project.manuscript?.sectionMetas ?? {};
  useEffect(() => { setCollabSection("manuscript"); }, [setCollabSection]);

  const currentText = sections[activeTab] ?? defaultTemplate[activeTab as keyof typeof defaultTemplate] ?? "";

  const updateCurrentText = (newVal: string) => {
    if (!canEditManuscript()) return;
    onChange({ ...project, manuscript: { ...project.manuscript, sections: { ...sections, [activeTab]: newVal }, sectionMetas, history: project.manuscript?.history ?? [] } });
    recordChange("manuscript", activeTab, currentText, newVal, `Edited ${activeTab} section`);
  };

  const updateSectionMeta = (tab: string, patch: Partial<SectionMeta>) => {
    if (!canEditManuscript() || ((patch.assignedTo !== undefined || patch.reviewer !== undefined || patch.dueDate !== undefined) && !canAssign)) return;
    onChange({ ...project, manuscript: { ...project.manuscript, sections, sectionMetas: { ...sectionMetas, [tab]: { ...(sectionMetas[tab] || { status: "draft" }), ...patch } }, history: project.manuscript?.history ?? [] } });
  };

  // ── Formatting Toolbar Helpers ──
  const applyFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("manuscript-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentText.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const next = currentText.substring(0, start) + replacement + currentText.substring(end);

    updateCurrentText(next);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const insertForestPlotData = () => {
    const meta = project.meta.results;
    if (!meta) {
      applyFormat("\n\n*Pooled Effect:* Meta-analysis pending.\n\n");
      return;
    }
    const snippet = `\n\n**Pooled Analysis Results:**\n- **Model:** ${meta.model} effect (${meta.method})\n- **Pooled Effect Size:** ${meta.pooled.effect.toFixed(2)} [95% CI: ${meta.pooled.ci_lower.toFixed(2)} to ${meta.pooled.ci_upper.toFixed(2)}]\n- **Z-value:** ${meta.pooled.z.toFixed(2)}, *p* = ${meta.pooled.p < 0.001 ? "< 0.001" : meta.pooled.p.toFixed(3)}\n- **Heterogeneity:** I² = ${meta.heterogeneity.i2.toFixed(1)}%, τ² = ${meta.heterogeneity.tau2.toFixed(3)}, Q = ${meta.heterogeneity.q.toFixed(2)} (p = ${meta.heterogeneity.q_p.toFixed(3)})\n\n`;
    applyFormat(snippet);
  };

  const insertPrismaData = () => {
    const flow = project.prisma.flow;
    const snippet = `\n\n**PRISMA 2020 Study Flow:**\n- Records identified: ${flow.identified ?? "N/A"}\n- Duplicates removed: ${flow.duplicates ?? "N/A"}\n- Records screened: ${flow.screened ?? "N/A"}\n- Excluded at title/abstract: ${flow.excludedTa ?? "N/A"}\n- Full-text reports assessed: ${flow.fullText ?? "N/A"}\n- Excluded at full-text: ${flow.excludedFt ?? "N/A"}\n- Studies included in qualitative synthesis: ${project.extraction.studies.length}\n\n`;
    applyFormat(snippet);
  };

  const insertCitation = () => {
    const studies = project.extraction.studies;
    if (studies.length === 0) {
      applyFormat(" (Author et al., Year)");
      return;
    }
    const names = studies.slice(0, 3).map((s) => s.study).join("; ");
    applyFormat(` (${names}${studies.length > 3 ? " et al." : ""})`);
  };

  // ── Exports ──
  const exportMarkdown = () => {
    const full = Object.entries(sections)
      .map(([k, text]) => `## ${k.toUpperCase()}\n\n${text}`)
      .join("\n\n---\n\n");
    const blob = new Blob([`# ${project.metadata.title || "Systematic Review"}\n\n${full}`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.metadata.title?.replace(/\s+/g, "_") || "manuscript"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  const exportDoc = () => {
    const contentHtml = Object.entries(sections)
      .map(
        ([k, text]) =>
          `<h2 style="color: #1a1c20; font-family: Calibri, sans-serif; margin-top: 24px;">${k.toUpperCase()}</h2><p style="line-height: 1.6; font-size: 11pt; color: #222;">${escapeHtml(text).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
      )
      .join("\n");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(project.metadata.title || "Manuscript")}</title></head><body style="font-family: Calibri, sans-serif; max-width: 6.5in; margin: 1in auto; color: #111;">
      <h1 style="font-size: 20pt; text-align: center; margin-bottom: 30px;">${escapeHtml(project.metadata.title || "Systematic Review & Meta-Analysis")}</h1>
      ${contentHtml}
      </body></html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.metadata.title?.replace(/\s+/g, "_") || "manuscript"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    window.print();
  };

  const sectionTabs = [
    { key: "title" as const, label: "Title & Authors" },
    { key: "abstract" as const, label: "Abstract" },
    { key: "introduction" as const, label: "Introduction" },
    { key: "methods" as const, label: "Methods (PRISMA)" },
    { key: "results" as const, label: "Results" },
    { key: "discussion" as const, label: "Discussion" },
    { key: "conclusion" as const, label: "Conclusion" },
    { key: "references" as const, label: "References" },
  ];

  return (
    <div className="space-y-4">
      <details className="card p-3"><summary className="cursor-pointer text-sm">Section discussion & saved checkpoints</summary>
        <div className="space-y-2 mt-3">{(project.manuscript?.comments ?? []).filter(c => c.section === activeTab).map(c => <p key={c.id} className="text-sm whitespace-pre-wrap"><strong>{c.author}</strong> · {new Date(c.timestamp).toLocaleString()}<br/>{c.text}</p>)}
        <textarea aria-label="Section comment" className="input w-full" value={comment} onChange={e => setComment(e.target.value)} />
        <button className="btn-ghost" disabled={!comment.trim() || !canEditManuscript()} onClick={() => { onChange({ ...project, manuscript: { ...project.manuscript, sections, sectionMetas, comments: [...(project.manuscript?.comments ?? []), { id: crypto.randomUUID(), section: activeTab, text: comment.trim(), author: drive.identity?.name || "Local reviewer", timestamp: new Date().toISOString() }] } }); setComment(""); }}>Add comment</button>
        {(project.manuscript?.history ?? []).filter(h => h.section === activeTab).map(h => <div key={h.id} className="text-xs"><span>{new Date(h.timestamp).toLocaleString()}</span><button className="btn-ghost" disabled={!canEditManuscript()} onClick={() => { if (confirm("Restore this checkpoint into the current draft?")) updateCurrentText(h.text); }}>Restore checkpoint</button></div>)}</div>
      </details>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Pen className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-semibold text-[var(--color-text)]">
              Collaborative Manuscript Studio
            </h2>
            <p className="text-[11.5px] text-[var(--color-text-muted)]">
              Draft your manuscript with section assignments, review states, comments, and multi-format exports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={exportMarkdown} title="Export Markdown">
            <Download className="h-3.5 w-3.5 mr-1" /> .md
          </Button>
          <Button variant="ghost" size="sm" onClick={exportDoc} title="Export Word Document">
            <FileText className="h-3.5 w-3.5 mr-1" /> .doc
          </Button>
          <Button variant="primary" size="sm" onClick={printPdf} title="Print or Save as PDF">
            <Printer className="h-3.5 w-3.5 mr-1" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Main Workspace Card */}
      <Card>
        {/* Section Navigation & Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
          <div className="flex flex-wrap gap-1">
            {sectionTabs.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveTab(s.key)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  activeTab === s.key
                    ? "bg-[var(--color-accent)] text-white shadow-xs"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--hover-surface)] hover:text-[var(--color-text)]"
                }`}
              >
                <span>{s.label}</span>
                {sectionMetas[s.key]?.status === "approved" && (
                  <Check className="h-3 w-3 text-green-400" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contributor Assignment */}
            <select
              value={sectionMetas[activeTab]?.assignedTo || ""}
              onChange={(e) => updateSectionMeta(activeTab, { assignedTo: e.target.value })}
              className="h-7 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11.5px] text-[var(--color-text)]"
              title="Assign section to co-author"
              disabled={!canAssign}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.keyId} value={m.keyId}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>

            <select aria-label="Section reviewer" className="select" disabled={!canAssign} value={sectionMetas[activeTab]?.reviewer || ""} onChange={e => updateSectionMeta(activeTab, { reviewer: e.target.value })}><option value="">Choose reviewer</option>{teamMembers.map(m => <option key={m.keyId} value={m.keyId}>{m.name}</option>)}</select>
            <input aria-label="Section due date" type="date" className="input" disabled={!canAssign} value={sectionMetas[activeTab]?.dueDate || ""} onChange={e => updateSectionMeta(activeTab, { dueDate: e.target.value })} />
            {/* Status Selector */}
            <select
              value={sectionMetas[activeTab]?.status || "draft"}
              onChange={(e) => updateSectionMeta(activeTab, { status: e.target.value as any })}
              className="h-7 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11.5px] text-[var(--color-text)] font-medium"
            >
              <option value="draft">Drafting</option>
              <option value="review">In Review</option>
              <option value="changes_requested">Changes requested</option><option value="approved">Approved</option>
            </select>

            {/* Comments for this section */}
            <button className="btn-ghost" disabled={!canEditManuscript()} onClick={() => onChange({ ...project, manuscript: { ...project.manuscript, sections, sectionMetas, history: [...(project.manuscript?.history ?? []), { id: crypto.randomUUID(), section: activeTab, text: currentText, timestamp: new Date().toISOString() }] } })}>Save section checkpoint</button>
          </div>
        </div>

        {/* Word-like Formatting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] py-2 bg-[var(--color-surface-2)] px-2 rounded-md mt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormat("**", "**")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => applyFormat("*", "*")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-[var(--color-border)] mx-1" />
            <button
              onClick={() => applyFormat("# ")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Heading 1"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => applyFormat("## ")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Heading 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-[var(--color-border)] mx-1" />
            <button
              onClick={() => applyFormat("- ")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Bullet list"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => applyFormat("1. ")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Numbered list"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => applyFormat("> ")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Quote block"
            >
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => applyFormat("\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Data 1 | Data 2 |\n")}
              className="rounded p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Insert table"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick-Insert Academic Data Helpers */}
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={insertCitation}>
              <PlusCircle className="h-3 w-3 mr-1" /> Cite Study
            </Button>
            <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={insertForestPlotData}>
              <Sparkles className="h-3 w-3 mr-1" /> Insert Pooled Effect
            </Button>
            <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={insertPrismaData}>
              <TableIcon className="h-3 w-3 mr-1" /> Insert PRISMA Flow
            </Button>
            <div className="h-4 w-px bg-[var(--color-border)] mx-1" />
            <div className="flex rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
              <button
                onClick={() => setEditMode("edit")}
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  editMode === "edit" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)]"
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => setEditMode("split")}
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  editMode === "split" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)]"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setEditMode("preview")}
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  editMode === "preview" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)]"
                }`}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Editor & Live Preview Area */}
        <div className="mt-3 grid grid-cols-1 gap-3 min-h-[420px]" style={{ gridTemplateColumns: editMode === "split" ? "1fr 1fr" : "1fr" }}>
          {/* Editor Column */}
          {(editMode === "edit" || editMode === "split") && (
            <div className="flex flex-col">
              <textarea
                id="manuscript-editor"
                value={currentText}
                onChange={(e) => updateCurrentText(e.target.value)}
                disabled={!canEditManuscript()}
                placeholder={`Write or refine ${activeTab} text here using Markdown...`}
                className="h-full min-h-[380px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--input-bg)] p-3 text-[12.5px] leading-relaxed font-mono text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          )}

          {/* Rendered Preview Column */}
          {(editMode === "preview" || editMode === "split") && (
            <div className="h-full min-h-[380px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-[12.5px] leading-relaxed text-[var(--color-text)]">
              <div className="border-b border-[var(--color-border)] pb-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Formatted Typeset Preview
                </span>
              </div>
              <div className="prose dark:prose-invert max-w-none space-y-3 whitespace-pre-wrap font-serif text-[13px] leading-relaxed">
                {currentText || <em className="text-[var(--color-text-muted)]">No content yet. Type in the editor or insert templates above.</em>}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
