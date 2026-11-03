import { DriveProvider, useDrive } from "./context/DriveContext";
const TeamWorkspace = lazy(() => import("./pages/TeamWorkspace"));

const Learn = lazy(() => import("./pages/Learn"));
import { avatars } from "./components/kokonut/ProfileSetup";
import { lazy, Suspense, Component, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import {
  ClipboardList,
  FileDown,
  FilePlus2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  Moon,
  Settings2,
  Sigma,
  Sparkles,
  Sun,
  Save,
  Search as SearchIcon,
  ShieldAlert,
  Table2,
  Workflow,
  Activity,
  Zap,
  Scale,
  Cloud,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  engineHealth,
  openProjectDialog,
  saveProject,
  getProject,
} from "./lib/api";
import { emptyProject, normalizeProject, type Project, type ProjectConfig } from "./lib/project";
import { APP_VERSION } from "./lib/version";
import { useUpdater } from "./lib/updater";
import UpdateModal from "./components/UpdateModal";
import { ThemeProvider, useTheme } from "./lib/theme";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Protocol = lazy(() => import("./pages/Protocol"));
const Search = lazy(() => import("./pages/Search"));
const Screening = lazy(() => import("./pages/Screening"));
const Extraction = lazy(() => import("./pages/Extraction"));
const Rob = lazy(() => import("./pages/Rob"));
const Meta = lazy(() => import("./pages/Meta"));
const Prisma = lazy(() => import("./pages/Prisma"));
const ManuscriptHelper = lazy(() => import("./pages/ManuscriptHelper"));
const Settings = lazy(() => import("./pages/Settings"));
const NetworkMeta = lazy(() => import("./pages/NetworkMeta"));
const IPDMeta = lazy(() => import("./pages/IPDMeta"));
const MultilevelMeta = lazy(() => import("./pages/MultilevelMeta"));
const DiagnosticMeta = lazy(() => import("./pages/DiagnosticMeta"));
const ProportionsMeta = lazy(() => import("./pages/ProportionsMeta"));
const QualitativeMeta = lazy(() => import("./pages/QualitativeMeta"));
const ManualMode = lazy(() => import("./pages/ManualMode"));
const AdvancedBayesian = lazy(() => import("./pages/AdvancedBayesian"));
const AnalysisHub = lazy(() => import("./pages/AnalysisHub"));
const Legal = lazy(() => import("./pages/Legal"));
const DriveSync = lazy(() => import("./pages/DriveSync"));
const Collaboration = lazy(() => import("./pages/Collaboration"));
import { StudySelector, useStudyManager } from "./components/StudyManager";
import DisclaimerModal from "./components/DisclaimerModal";
import NewProjectWizard from "./components/NewProjectWizard";
import ProfileModal from "./components/ProfileModal";
import SpecializedAnalysesModal from "./components/SpecializedAnalysesModal";
import ExportCenterModal from "./components/ExportCenterModal";
import { CollaborationProvider, useCollaboration } from "./context/CollaborationContext";
import { ConflictResolverModal } from "./components/ConflictResolverModal";

// v0.5.3 kokonutui component family (adapted, MIT — see file headers)

import BootScreen from "./components/BootScreen";
import ProfileSetup, { type ProfileData } from "./components/kokonut/ProfileSetup";

import SwitchButton from "./components/kokonut/SwitchButton";
import CommandSearch, { type CommandAction } from "./components/kokonut/CommandSearch";


const LAST_PATH_KEY = "poolr.lastProjectPath";
const PROFILE_KEY = "poolr.profile";

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "protocol", label: "Protocol", Icon: ClipboardList },
  { key: "search", label: "Search", Icon: SearchIcon },
  { key: "screening", label: "Screening", Icon: ListChecks },
  { key: "extraction", label: "Extraction", Icon: Table2 },
  { key: "rob", label: "Risk of Bias", Icon: ShieldAlert },
  { key: "meta", label: "Meta-Analysis", Icon: Sigma },
  { key: "advanced", label: "Advanced", Icon: Activity },
  { key: "analysisHub", label: "Analysis Hub", Icon: Zap },
  { key: "prisma", label: "PRISMA", Icon: Workflow },
  { key: "manuscript", label: "Manuscript", Icon: FileText },
  { key: "collaboration", label: "Team", Icon: Users },
  { key: "driveSync", label: "Drive Sync", Icon: Cloud },
  { key: "legal", label: "Legal", Icon: Scale },
  { key: "settings", label: "Settings", Icon: Settings2 },
  { key: "learn", label: "Learn", Icon: FileText },
] as const;

type PageKey = (typeof NAV)[number]["key"];

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  protocol: "Protocol / PICO Definition",
  search: "Search Strategy Builder",
  screening: "Screening",
  extraction: "Data Extraction",
  rob: "Risk of Bias Assessment",
  meta: "Meta-Analysis",
  advanced: "Advanced Analyses",
  analysisHub: "Analysis Hub",
  prisma: "PRISMA 2020",
  manuscript: "Collaborative Manuscript Studio",
  collaboration: "Team Collaboration & Roles",
  driveSync: "Google Drive Sync & Storage",
  legal: "Legal & Policies",
  settings: "Settings",
  learn: "Learn meta-analysis & Poolr",
};

/** localStorage can throw (private mode / disabled storage) — never let it break boot. */
const store = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* quota or blocked — non-fatal */ }
  },
};

interface StoredProfile extends ProfileData {}

function readProfile(): StoredProfile | null {
  try {
    const raw = store.get(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredProfile;
    return p && typeof p.username === "string" && typeof p.avatarId === "number" ? p : null;
  } catch {
    return null;
  }
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Keeps one broken page from white-screening the whole shell. */
class PageBoundary extends Component<{ pageKey: string; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("page crashed", error, info); }
  componentDidUpdate(prev: { pageKey: string }) {
    if (prev.pageKey !== this.props.pageKey && this.state.error) {
      // Reset error when switching pages (intentional setState in componentDidUpdate for error boundary)
      this.setState({ error: null });
    }
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card p-4">
        <h2 className="text-[14px] font-semibold">This page hit an error</h2>
        <p className="mt-1 text-[12.5px] text-[var(--color-text-muted)]">
          {this.state.error.message || "Unknown error"} — your project data is untouched. Switch pages or reload.
        </p>
        <button className="btn-ghost mt-3" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <DriveProvider>
        <CollaborationProvider>
          <Shell />
        </CollaborationProvider>
      </DriveProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const { theme, toggleTheme } = useTheme();
  const drive = useDrive();
  const { setActiveSection } = useCollaboration();
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialPage = (queryParams?.get("page") as PageKey) || "dashboard";
  const [page, setPage] = useState<PageKey>(initialPage);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // v0.5.3 boot experience: splash (greeting) → first-run setup (optional) → app.
  const [splashDone, setSplashDone] = useState(() => queryParams?.get("nosplash") === "1");
  const [profile, setProfile] = useState<StoredProfile | null>(() => readProfile() || (queryParams?.get("demo") === "1" ? { username: "Dr. Haris", avatarId: 1 } : null));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => store.get("poolr.sidebarCollapsed") === "true");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [specializedOpen, setSpecializedOpen] = useState(() => queryParams?.get("modal") === "specialized");
  const [exportCenterOpen, setExportCenterOpen] = useState(() => queryParams?.get("modal") === "export");

  const { updateInfo, downloadUpdate } = useUpdater();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const { studies, activeStudyId, addStudy, removeStudy, switchStudy, updateStudy } = useStudyManager();

  const handleStudySwitch = (id: string) => {
    switchStudy(id);
    const target = studies.find((s) => s.id === id);
    if (target?.project) {
      setProject(target.project);
    }
  };

  const handleStudyAdd = () => {
    const name = prompt("New study dataset name:");
    if (name) {
      const newId = addStudy(name, project ?? emptyProject());
      switchStudy(newId);
    }
  };

  const handleStudyRemove = (id: string) => {
    if (confirm("Remove this study dataset from the workspace?")) {
      removeStudy(id);
    }
  };



  // Engine cold-start polling (v0.5.2 behavior kept verbatim).
  useEffect(() => {
    let alive = true;
    let delay = 500;
    const tick = async () => {
      const ok = await engineHealth();
      if (!alive) return;
      setConnected(ok);
      if (!ok && delay < 15000) {
        setTimeout(() => { if (alive) { delay = Math.min(delay * 1.5, 15000); tick(); } }, delay);
      }
    };
    void tick();
    return () => { alive = false; };
  }, []);

  // Phase E (E3): load the last project on boot so a multi-day MA resumes after restart.
  useEffect(() => {
    let alive = true;
    const last = store.get(LAST_PATH_KEY);
    if (!last) return;
    getProject(last)
      .then((data) => {
        if (!alive) return;
        setProject(normalizeProject(data));
        setProjectPath(last);
        setSaveState("saved");
      })
      .catch(() => { /* no prior project / corrupt — start fresh */ });
    return () => { alive = false; };
  }, []);

  // Debounced autosave (Phase E behaviour wired into the shell).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeq = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // In-app navigation and project load event bus
  useEffect(() => {
    const onGoPage = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const target = typeof detail === "string" ? detail : detail?.page;
      if (target) {
        setPage(target as PageKey);
      }
    };
    const onLoadProject = (e: Event) => {
      const p = (e as CustomEvent).detail as Project;
      if (p) {
        cancelPendingSave();
        setProject(normalizeProject(p));
        setProjectPath(null);
        setSaveState("idle");
        setBanner(null);
      }
    };
    window.addEventListener("poolr:gopage", onGoPage);
    window.addEventListener("poolr:loadProject", onLoadProject);
    return () => {
      window.removeEventListener("poolr:gopage", onGoPage);
      window.removeEventListener("poolr:loadProject", onLoadProject);
    };
  }, []);

  // Sync active section to collaboration context
  useEffect(() => {
    setActiveSection(page as any);
  }, [page, setActiveSection]);

  const cancelPendingSave = () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    saveSeq.current++;
  };

  const onProjectChange = (p: Project) => {
    if (drive.binding?.reviewId === p.metadata.id && !drive.canEdit) { setNotice("This team is read-only for your identity."); return; }
    store.set("poolr.recoveryDraft", JSON.stringify(p));
    drive.queueReview(p);
    setProject(p);
    if (activeStudyId) {
      updateStudy(activeStudyId, p);
    }
    if (!projectPath) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    const seq = ++saveSeq.current;
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await saveProject(projectPath, p);
        if (!mounted.current || seq !== saveSeq.current) return;
        setProjectPath(saved); setSaveState("saved");
        store.set(LAST_PATH_KEY, saved);
      } catch (e) {
        if (!mounted.current || seq !== saveSeq.current) return;
        setSaveState("error"); setBanner(errText(e));
        setNotice(`Save error: ${errText(e)}`);
      }
    }, 300);
  };

  const handleOpen = async () => {
    setBusy(true); setBanner(null);
    cancelPendingSave();
    try {
      const res = await openProjectDialog();
      if (res.data) {
        setProject(normalizeProject(res.data));
        setProjectPath(res.path);
        setSaveState("saved");
        if (res.path) store.set(LAST_PATH_KEY, res.path);
      }
    } catch (e) { console.error(e); setSaveState("error"); setBanner(errText(e)); }
    finally { if (mounted.current) setBusy(false); }
  };

  const [showWizard, setShowWizard] = useState(false);

  const handleNew = async () => {
    setShowWizard(true);
  };

  const handleWizardComplete = async (config: ProjectConfig) => {
    setShowWizard(false);
    cancelPendingSave();
    const p = emptyProject();
    p.metadata.title = config.title;
    p.metadata.studyType = config.studyType;
    p.metadata.config = config;
    p.meta.settings.measure = config.effectMeasure || "OR";
    p.protocol.databases = config.databases.join(", ");
    p.pico = { ...p.pico, ...config.pico };
    setProject(p); setSaveState("idle"); setBanner(null);
    const seq = ++saveSeq.current;
    try {
      const saved = await saveProject(`poolr-${p.metadata.id}.json`, p);
      if (!mounted.current || seq !== saveSeq.current) return;
      setProjectPath(saved); setSaveState("saved");
      store.set(LAST_PATH_KEY, saved);
    } catch (e) {
      if (!mounted.current || seq !== saveSeq.current) return;
      setSaveState("error"); setBanner(errText(e));
    }
  };

  const loadDemo = async () => {
    cancelPendingSave();
    try {
      const r = await fetch("demo-project.json", { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`demo asset missing (HTTP ${r.status})`);
      const raw = await r.json();
      setProject(normalizeProject(raw));
      setProjectPath(null);
      setSaveState("idle"); setBanner(null);
    } catch (e) {
      console.error(e);
      setSaveState("error");
      setBanner("Could not load the bundled demo project. Reinstall poolr or use Open with a saved project file.");
    }
  };

  // Load demo project if requested via URL param
  const queryParamsRef = useRef(queryParams);
  useEffect(() => {
    if (queryParamsRef.current?.get("demo") === "1") {
      void loadDemo();
    }
  }, []);

  const handleSave = async () => {
    if (!project) return;
    cancelPendingSave();
    setSaveState("saving"); setBanner(null);
    const seq = ++saveSeq.current;
    try {
      const saved = await saveProject(projectPath ?? "poolr.json", project);
      if (!mounted.current || seq !== saveSeq.current) return;
      setProjectPath(saved); setSaveState("saved");
      store.set(LAST_PATH_KEY, saved);
    } catch (e) {
      if (!mounted.current || seq !== saveSeq.current) return;
      setSaveState("error"); setBanner(errText(e));
    }
  };

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const saveLabel =
    saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : saveState === "error" ? "save error" : "unsaved";

  const blank = useMemo(() => emptyProject(), []);
  const current = project ?? blank;

  const pages: Record<string, () => React.ReactElement> = {
    dashboard: () => <Dashboard project={current} onChange={onProjectChange} />,
    protocol: () => <Protocol project={current} onChange={onProjectChange} />,
    search: () => <Search project={current} onChange={onProjectChange} />,
    screening: () => <Screening project={current} onChange={onProjectChange} />,
    extraction: () => <Extraction project={current} onChange={onProjectChange} />,
    rob: () => <Rob project={current} onChange={onProjectChange} />,
    meta: () => <Meta project={current} onChange={onProjectChange} />,
    prisma: () => <Prisma project={current} onChange={onProjectChange} />,
    settings: () => <Settings />,
    network: () => <NetworkMeta project={current} onChange={onProjectChange} />,
    ipd: () => <IPDMeta project={current} onChange={onProjectChange} />,
    multilevel: () => <MultilevelMeta project={current} onChange={onProjectChange} />,
    diagnostic: () => <DiagnosticMeta project={current} onChange={onProjectChange} />,
    proportions: () => <ProportionsMeta project={current} onChange={onProjectChange} />,
    qualitative: () => <QualitativeMeta project={current} onChange={onProjectChange} />,
    advanced: () => <AdvancedBayesian project={current} onChange={onProjectChange} />,
    analysisHub: () => <AnalysisHub project={current} onProjectChange={onProjectChange} />,
    manual: () => <ManualMode project={current} onChange={onProjectChange} />,
    legal: () => <Legal />,
    driveSync: () => <TeamWorkspace project={current} />,
    collaboration: () => <TeamWorkspace project={current} />,
    manuscript: () => <ManuscriptHelper project={current} onChange={onProjectChange} />,
    learn: () => <Learn onDemo={() => { void loadDemo(); }} />,
  };

  // Dynamic nav based on study type
  const studyType = current.metadata.studyType || 'standard';
  const advancedNavItems: Record<string, typeof NAV> = {
    standard: NAV,
    network: [...NAV.filter(n => n.key !== 'meta'), { key: 'network', label: 'Network MA', Icon: Sigma }] as any,
    ipd: [...NAV.filter(n => n.key !== 'meta'), { key: 'ipd', label: 'IPD Meta', Icon: Sigma }] as any,
    multilevel: [...NAV.filter(n => n.key !== 'meta'), { key: 'multilevel', label: 'Multilevel', Icon: Sigma }] as any,
    diagnostic: [...NAV.filter(n => n.key !== 'meta'), { key: 'diagnostic', label: 'Diagnostic', Icon: Sigma }] as any,
    proportions: [...NAV.filter(n => n.key !== 'meta'), { key: 'proportions', label: 'Proportions', Icon: Sigma }] as any,
    qualitative: [...NAV.filter(n => n.key !== 'meta'), { key: 'qualitative', label: 'Qualitative', Icon: Sigma }] as any,
    manual: NAV,
  };
  const activeNav = advancedNavItems[studyType] || NAV;

  /* Command palette actions (Ctrl+K). */
    const paletteActions: CommandAction[] = useMemo(
      () => [
        ...NAV.map((n) => ({
          id: `go-${n.key}`,
          label: n.label,
          description: n.key === page ? "current page" : undefined,
          end: "Go to",
          short: n.key === "dashboard" ? "Ctrl+1" : n.key === "protocol" ? "Ctrl+2" : n.key === "search" ? "Ctrl+3" : n.key === "screening" ? "Ctrl+4" : n.key === "extraction" ? "Ctrl+5" : n.key === "rob" ? "Ctrl+6" : n.key === "meta" ? "Ctrl+7" : n.key === "prisma" ? "Ctrl+8" : undefined,
          icon: <n.Icon className="h-4 w-4" />,
          onSelect: () => setPage(n.key),
        })),
        { id: "file-open", label: "Open project…", end: "File", short: "Ctrl+O", icon: <FolderOpen className="h-4 w-4" />, onSelect: () => void handleOpen() },
        { id: "file-demo", label: "Load demo review", description: "BCG dataset", end: "File", icon: <Sparkles className="h-4 w-4" />, onSelect: () => void loadDemo() },
        { id: "file-new", label: "New workspace", end: "File", short: "Ctrl+N", icon: <FilePlus2 className="h-4 w-4" />, onSelect: () => void handleNew() },
        { id: "file-save", label: "Save project", end: "File", short: "Ctrl+S", icon: <Save className="h-4 w-4" />, onSelect: () => void handleSave() },
        { id: "analysis-hub", label: "Analysis Hub…", description: "Bayesian, Diagnostics, Network, Complex Data, Quality & GRADE", end: "Analysis", icon: <Zap className="h-4 w-4" />, onSelect: () => setPage("analysisHub") },
        { id: "analysis-specialized", label: "Specialized Analyses…", description: "Dose-response, Survival RMST, Economics, Adverse, DCA", end: "Analysis", icon: <Activity className="h-4 w-4" />, onSelect: () => setSpecializedOpen(true) },
        { id: "file-export", label: "Universal Export Center…", description: "DOCX, LaTeX, HTML, R, Stata, Python, BibTeX", end: "File", short: "Ctrl+E", icon: <FileDown className="h-4 w-4" />, onSelect: () => setExportCenterOpen(true) },
        { id: "app-theme", label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme", end: "Appearance", short: "Ctrl+T", icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />, onSelect: toggleTheme },
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [theme, page, project]
    );

  const connLabel = connected === null ? "connecting…" : connected ? "engine online" : "engine offline";

  /* ── Boot splash: greeting cycles while services spin up ── */
  const showSplash = !splashDone;

  /* ── First-run personalization ── */
  const showSetup = splashDone && !profile;

  return (
    <div className={`workspace-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""} relative z-10 flex h-full w-full flex-col overflow-hidden text-[var(--color-text)]`}>
      <aside className="workspace-sidebar">
        <button className="sidebar-toggle" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!sidebarCollapsed} onClick={() => { setSidebarCollapsed(!sidebarCollapsed); store.set("poolr.sidebarCollapsed", String(!sidebarCollapsed)); }}>{sidebarCollapsed ? "»" : "«"}</button><div className="workspace-brand"><img className="brand-full brand-light" src="/poolr-brand.png" alt="poolr — Research workspace" /><img className="brand-full brand-dark" src="/poolr-brand-dark.png" alt="poolr — Research workspace" /><img className="brand-mark brand-light" src="/poolr-mark.svg" alt="poolr" /><img className="brand-mark brand-dark" src="/poolr-mark-dark.svg" alt="poolr" /></div>
        <div className="mb-4"><StudySelector studies={studies} activeStudyId={activeStudyId} onSwitch={handleStudySwitch} onAdd={handleStudyAdd} onRemove={handleStudyRemove} onImport={handleOpen} /></div>
        <button className="workspace-search" onClick={() => setPaletteOpen(true)}><SearchIcon size={15} /> Find a page or action <kbd>⌘ K</kbd></button>
        <div className="workspace-nav-label">YOUR REVIEW</div>
        <nav aria-label="Review workflow">{activeNav.map((n) => <button key={n.key} title={n.label} aria-label={n.label} aria-current={page === n.key ? "page" : undefined} onClick={() => setPage(n.key)}><n.Icon size={17} /><span>{n.label}</span></button>)}</nav>
        <div className="workspace-sidebar-footer"><span>{drive.activeTeam ? drive.status : ""}</span><br /><span className={connected ? "status-online" : ""}>●</span> {connLabel}<br /><span>{saveLabel}</span></div>
      </aside>

      <header className="workspace-header z-20 flex items-center justify-between border-b px-6 py-3">
        <div><p className="text-[10px] text-[var(--color-text-muted)]">Workspace / {TITLES[page]}</p><h1 className="text-[15px] font-medium mt-1">{current.metadata.title || "Untitled review"}</h1></div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setPaletteOpen(true)} title="Search commands (Ctrl+K)"><SearchIcon size={16}/></button>
          <details className="relative"><summary className="btn-ghost cursor-pointer">Project</summary><div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
            <button className="btn-ghost w-full text-left" onClick={handleNew}>New review</button><button className="btn-ghost w-full text-left" onClick={() => { try { const raw = store.get("poolr.recoveryDraft"); if (!raw) { setNotice("No recovery draft is stored."); return; } if (confirm("Open the saved local recovery draft? Export your current review first if it has unsaved changes.")) { cancelPendingSave(); setProject(normalizeProject(JSON.parse(raw))); setProjectPath(null); } } catch { setNotice("The recovery draft could not be read."); } }}>Recover local draft</button>
            <button className="btn-ghost w-full text-left" disabled={busy} onClick={handleOpen}>Open review</button>
            <button className="btn-ghost w-full text-left" disabled={busy} onClick={loadDemo}>Load demo</button>
            <button className="btn-ghost w-full text-left" onClick={() => setShowProfile(true)}>Your profile</button>
            <button className="btn-ghost w-full text-left" onClick={() => setPage("driveSync")}>Storage & sharing</button>
          </div></details>
          <button className="btn-ghost" disabled={!project} onClick={handleSave}>Save</button>
          <button className="btn-primary flex items-center gap-2" disabled={!project || busy} onClick={() => setExportCenterOpen(true)}><FileDown size={14}/> Export</button>
          <SwitchButton size="sm" showLabel={false} />
          <details className="relative"><summary className="flex items-center gap-2 cursor-pointer rounded-md p-1"><span className="overflow-hidden rounded-full w-8 h-8 [&>svg]:w-8 [&>svg]:h-8">{avatars.find(a => a.id === (drive.identity?.avatar || profile?.avatarId))?.svg ?? avatars[0].svg}</span><span className="text-xs">{drive.identity?.name || profile?.username || "Reviewer"}<span className="block text-[10px] text-[var(--color-text-muted)]">{drive.activeTeam?.name || "Choose a team"}</span></span></summary><div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg"><button className="btn-ghost w-full text-left" onClick={() => setShowProfile(true)}>Edit profile</button>
            <label className="block text-xs p-2">Active team<select className="select w-full mt-1" value={drive.activeTeam?.id || ""} onChange={e => { try { drive.selectTeam(e.target.value); } catch(error) { setNotice(String(error)); } }}><option value="">Personal reviews</option>{drive.teams.map(team => <option value={team.id} key={team.id}>{team.name}{team.ended ? " (ended)" : ""}</option>)}</select></label><button className="btn-ghost w-full text-left" onClick={() => setPage("collaboration")}>Teams & members</button><button className="btn-ghost w-full text-left" onClick={() => setPage("driveSync")}>Connect storage</button><button className="btn-ghost w-full text-left" onClick={() => setPage("settings")}>Settings & updates</button></div></details>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="workspace-main relative z-10 flex-1 overflow-auto">
        {updateInfo?.available && (
          <div className="mb-3 flex items-center gap-2 rounded-[3px] border border-blue-500/30 bg-blue-900/20 px-2.5 py-1.5 text-[12px] text-blue-400">
            <Sparkles size={14} className="shrink-0" />
            <span className="flex-1">Poolr {updateInfo.version} is available. Update now to get the latest features.</span>
            <button className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-blue-500" onClick={() => setShowUpdateModal(true)}>Update</button>
            <button className="shrink-0 text-blue-400/70 hover:text-blue-400" onClick={() => setShowUpdateModal(false)} aria-label="Dismiss">✕</button>
          </div>
        )}
        {banner && (
          <div className="mb-3 flex items-start gap-2 rounded-[3px] border border-[var(--color-exclude)]/30 bg-[var(--color-exclude)]/10 px-2.5 py-1.5 text-[12px] text-[var(--color-exclude)]">
            <span className="flex-1">{banner}</span>
            <button className="shrink-0 text-[var(--color-exclude)]/70 hover:text-[var(--color-exclude)]" onClick={() => setBanner(null)} aria-label="Dismiss">✕</button>
          </div>
        )}
        <PageBoundary pageKey={page}><Suspense fallback={<p role="status">Loading workspace…</p>}>{pages[page]()}</Suspense></PageBoundary>
      </main>

      {/* ── Command palette (Ctrl+K) ── */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-28 backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setPaletteOpen(false)}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-xl px-4"
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              initial={{ opacity: 0, scale: 0.98, y: -8 }}
              onClick={(e) => e.stopPropagation()}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <CommandSearch actions={paletteActions} hint="↑↓ navigate · Enter select · Ctrl+K toggle" placeholder="Jump to a page or run a command…" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notice banner ── */}
      <AnimatePresence>
        {notice && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-lg border border-[var(--color-border)] bg-[var(--color-chrome)] px-4 py-2 text-[12px] text-[var(--color-text)] shadow-lg"
            role="status"
            transition={{ duration: 0.2 }}
          >
            <span>{notice}</span>
            <button
              className="ml-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Boot splash (system check) ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1 }}
            style={{ background: "var(--color-bg)" }}
            transition={{ duration: 0.35 }}
          >
            <BootScreen onFinish={() => setSplashDone(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── First-run avatar/name setup ── */}
      <AnimatePresence>
        {showSetup && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[55] flex items-center justify-center overflow-auto p-6"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            style={{ background: "var(--color-bg)" }}
            transition={{ duration: 0.25 }}
          >
            <ProfileSetup
              onComplete={(data) => {
                store.set(PROFILE_KEY, JSON.stringify(data));
                setProfile(data);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}
            {showWizard && <NewProjectWizard onComplete={handleWizardComplete} onCancel={() => setShowWizard(false)} />}
            {showProfile && (
              <ProfileModal
                profile={profile}
                onClose={() => setShowProfile(false)}
                onSave={(data) => {
                  store.set(PROFILE_KEY, JSON.stringify(data));
                  setProfile(data);
                  setShowProfile(false);
                }}
              />
            )}
            {project && (
              <>
                <SpecializedAnalysesModal
                  open={specializedOpen}
                  onClose={() => setSpecializedOpen(false)}
                  project={project}
                />
                <ExportCenterModal
                  open={exportCenterOpen}
                  onClose={() => setExportCenterOpen(false)}
                  project={project}
                />
              </>
            )}
            <UpdateModal
              info={updateInfo}
              open={showUpdateModal}
              onClose={() => setShowUpdateModal(false)}
              onUpdate={downloadUpdate}
            />
            <ConflictResolverModal />
          </div>
        );
      }
