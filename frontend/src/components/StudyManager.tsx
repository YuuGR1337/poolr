import { useState, useCallback, useEffect } from "react";
import type { Project } from "../lib/project";
import { Loader2, AlertCircle, Trash2, FolderOpen, Plus } from "lucide-react";

const F = (n: number, d = 3) => n.toFixed(d);

export interface Study {
  id: string;
  name: string;
  project: Project;
  lastModified: Date;
}

export function useStudyManager() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);

  const activeStudy = studies.find(s => s.id === activeStudyId) || null;

  const loadStudies = useCallback(() => {
    const stored = localStorage.getItem("poolr.studies");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudies(parsed.studies || []);
        setActiveStudyId(parsed.activeStudyId || null);
      } catch { /* ignore corrupt storage */ }
    }
  }, []);

  const saveStudies = useCallback((newStudies: Study[], newActiveId: string | null) => {
    localStorage.setItem("poolr.studies", JSON.stringify({ studies: newStudies, activeStudyId: newActiveId }));
    setStudies(newStudies);
    setActiveStudyId(newActiveId);
  }, []);

  const addStudy = useCallback((name: string, project: Project) => {
    const id = `study_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newStudy: Study = { id, name, project, lastModified: new Date() };
    const newStudies = [...studies, newStudy];
    saveStudies(newStudies, id);
    return id;
  }, [studies, saveStudies]);

  const removeStudy = useCallback((id: string) => {
    const newStudies = studies.filter(s => s.id !== id);
    const newActiveId = activeStudyId === id ? (newStudies[0]?.id || null) : activeStudyId;
    saveStudies(newStudies, newActiveId);
  }, [studies, activeStudyId, saveStudies]);

  const updateStudy = useCallback((id: string, project: Project) => {
    const newStudies = studies.map(s =>
      s.id === id ? { ...s, project, lastModified: new Date() } : s
    );
    saveStudies(newStudies, activeStudyId);
  }, [studies, activeStudyId, saveStudies]);

  const switchStudy = useCallback((id: string) => {
    setActiveStudyId(id);
    saveStudies(studies, id);
  }, [studies, saveStudies]);

  useEffect(() => { loadStudies(); }, [loadStudies]);

  return { studies, activeStudy, activeStudyId, addStudy, removeStudy, updateStudy, switchStudy, loadStudies };
}

export function StudySelector({
  studies,
  activeStudyId,
  onSwitch,
  onAdd,
  onRemove,
  onImport
}: {
  studies: Study[];
  activeStudyId: string | null;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onImport: () => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors text-sm"
      >
        <FolderOpen size={14} />
        <span className="max-w-32 truncate">
          {studies.find(s => s.id === activeStudyId)?.name || "Review library"}
        </span>
        <span className="text-xs text-[var(--color-muted-foreground)]">({studies.length})</span>
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl z-50 text-[var(--color-text)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-2 border-b border-[var(--color-border)]">
            <div className="text-xs text-[var(--color-muted-foreground)] px-2 py-1">Studies</div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {studies.map(study => (
              <div key={study.id} className={`flex items-center justify-between px-3 py-2 hover:bg-[var(--color-surface-2)] cursor-pointer ${study.id === activeStudyId ? "bg-[var(--color-surface-2)]" : ""}`}>
                <button onClick={() => { onSwitch(study.id); setShowDropdown(false); }} className="flex-1 text-left text-sm truncate">
                  {study.name}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(study.id); }} className="p-1 hover:text-red-400 text-[var(--color-muted-foreground)]">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-[var(--color-border)] space-y-1">
            <button onClick={() => { onAdd(); setShowDropdown(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[var(--color-surface-2)]">
              <Plus size={12} /> New Study
            </button>
            <button onClick={() => { onImport(); setShowDropdown(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[var(--color-surface-2)]">
              <FolderOpen size={12} /> Import Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorDisplay({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg">
      <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm text-red-400 font-medium">Something went wrong</div>
        <div className="text-xs text-red-300/70 mt-1">{error}</div>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-xs text-red-400 underline hover:text-red-300">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 text-[var(--color-muted-foreground)]">
      <Loader2 size={16} className="animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function ResultCard({ title, value, ci, subtitle }: { title: string; value: string | number; ci?: [number, number]; subtitle?: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-3">
      <div className="text-xs text-[var(--color-muted-foreground)]">{title}</div>
      <div className="text-lg font-semibold">{typeof value === 'number' ? F(value) : value}</div>
      {ci && <div className="text-xs text-[var(--color-muted-foreground)]">[{F(ci[0])}, {F(ci[1])}]</div>}
      {subtitle && <div className="text-xs text-[var(--color-muted-foreground)] mt-1">{subtitle}</div>}
    </div>
  );
}
