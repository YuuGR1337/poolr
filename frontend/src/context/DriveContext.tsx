import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Project } from "../lib/project";

export interface DriveIdentity { name: string; avatar: number; publicKey: string; keyId: string }
export interface DriveMember extends Omit<DriveIdentity, "avatar"> { role: "owner" | "editor" | "reviewer" | "viewer" }
export interface DriveRevision { hash: string; author: string; epoch: number; data: { reviewId: string; title: string; parents: string[]; project: Project } }
export interface DriveTeam { id: string; name: string; ended: boolean; ownerKeyId: string; epoch: number; remote: string; members: DriveMember[]; heads: DriveRevision[]; pending: number; warnings: string[] }
interface DriveState { identity: DriveIdentity | null; teams: DriveTeam[] }
type Request = Record<string, unknown>;
interface DriveValue extends DriveState {
  native: boolean; activeTeam: DriveTeam | undefined; selectTeam: (id: string) => void;
  unlocked: boolean; unlock: (password: string) => Promise<void>; lock: () => void;
  command: <T>(request: Request) => Promise<T>; refresh: () => Promise<void>; sync: () => Promise<void>;
  status: string; error: string; canEdit: boolean; binding: { teamId: string; reviewId: string; parents: string[] } | null;
  openReview: (team: DriveTeam, revision: DriveRevision) => void;
  shareReview: (project: Project, parents?: string[]) => Promise<void>;
  queueReview: (project: Project) => void;
}
const Context = createContext<DriveValue | null>(null);
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
export function DriveProvider({ children }: { children: ReactNode }) {
  const native = isTauri();
  const [state, setState] = useState<DriveState>({ identity: null, teams: [] });
  const [activeId, setActiveId] = useState(stored("poolr.activeTeam") || "");
  const [binding, setBinding] = useState<DriveValue["binding"]>(null);
  const [status, setStatus] = useState("Not connected");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const secret = useRef("");
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queued = useRef<Project | null>(null);
  const publishing = useRef(false);
  const publishRef = useRef<(project: Project) => Promise<void>>(async () => {});
  const bindingRef = useRef(binding);
  bindingRef.current = binding;
  const activeTeam = state.teams.find(t => t.id === activeId);
  const member = activeTeam?.members.find(m => m.keyId === state.identity?.keyId);
  const canEdit = !activeTeam || !!member && member.role !== "viewer" && (!activeTeam.ended || member.role === "owner");
  const command = useCallback(async <T,>(request: Request): Promise<T> => {
    if (!native) throw new Error("Drive collaboration requires the desktop app. The browser preview cannot access native identities or rclone.");
    return invoke<T>("collaboration_command", { request: { ...request, password: request.password ?? secret.current } });
  }, [native]);
  const refresh = useCallback(async () => { const next = await command<DriveState>({ action: "status" }); setState(next); }, [command]);
  const unlock = async (password: string) => { await command({ action: "identity.unlock", password }); secret.current = password; setUnlocked(true); await refresh(); };
  const lock = () => { secret.current = ""; setUnlocked(false); };
  const selectTeam = (id: string) => {
    if (queued.current) throw new Error("Wait for pending changes to be queued before switching teams.");
    if (timer.current) clearTimeout(timer.current);
    setActiveId(id); setBinding(null); setError("");
    try { localStorage.setItem("poolr.activeTeam", id); } catch { /* preference only */ }
  };
  const sync = useCallback(async () => {
    if (!activeId || inFlight.current) return;
    inFlight.current = true; setStatus("Syncing…");
    try { const result = await command<DriveTeam>({ action: "sync", teamId: activeId }); await refresh(); setStatus(result.pending ? `${result.pending} retained revisions need attention` : "Up to date at " + new Date().toLocaleTimeString()); setError(result.pending ? "Some revisions were created under an older team policy. Review your local draft with the owner before republishing." : ""); }
    catch(e) { setError(e instanceof Error ? e.message : "Sync failed"); setStatus("Waiting for connection / attention"); }
    finally { inFlight.current = false; }
  }, [activeId, command, refresh]);
  useEffect(() => { if (native) void refresh().catch(e => setError(String(e))); }, [native, refresh]);
  useEffect(() => {
    if (!native || !activeId) return;
    void sync();
    const interval = setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) void sync(); }, 45000 + Math.random() * 15000);
    const reconnect = () => { void sync(); };
    window.addEventListener("online", reconnect);
    return () => { clearInterval(interval); window.removeEventListener("online", reconnect); };
  }, [native, activeId, sync]);
  useEffect(() => () => { secret.current = ""; if (timer.current) clearTimeout(timer.current); }, []);
  const shareReview = async (project: Project, parents?: string[]) => {
    if (publishing.current) throw new Error("A revision is still being saved. Your newer draft is retained; publish it after this save finishes.");
    if (!activeTeam || !unlocked || !canEdit) throw new Error("Select a writable team and unlock your signing identity first.");
    const reviewId = project.metadata.id;
    if (!reviewId) throw new Error("Save and reopen this review to assign an identity.");
    const currentBinding = bindingRef.current;
    const base = parents ?? (currentBinding?.teamId === activeTeam.id && currentBinding.reviewId === reviewId ? currentBinding.parents : []);
    publishing.current = true;
    try {
    const hash = await command<string>({ action: "review.save", teamId: activeTeam.id, epoch: activeTeam.epoch, revision: { reviewId, title: project.metadata.title || "Untitled review", parents: base, project } });
    bindingRef.current = { teamId: activeTeam.id, reviewId, parents: [hash] };
    setBinding(bindingRef.current);
    if (queued.current === project) queued.current = null;
    setStatus("Saved locally · queued for Drive"); await refresh(); void sync();
    } finally { publishing.current = false; }
  };
  useEffect(() => {
    if (!binding || queued.current || publishing.current) return;
    const heads = state.teams.find(t => t.id === binding.teamId)?.heads.filter(h => h.data.reviewId === binding.reviewId) ?? [];
    if (heads.length !== 1 || binding.parents.includes(heads[0].hash)) return;
    setBinding({ ...binding, parents: [heads[0].hash] });
    window.dispatchEvent(new CustomEvent("poolr:loadProject", { detail: heads[0].data.project }));
  }, [state.teams, binding]);
  const queueReview = (project: Project) => {
    if (!binding || binding.reviewId !== project.metadata.id) return;
    queued.current = project;
    if (timer.current) clearTimeout(timer.current);
    setStatus("Local draft · waiting to publish");
    const flush = async () => {
      if (publishing.current) { timer.current = setTimeout(() => void flush(), 750); return; }
      const draft = queued.current;
      if (!draft) return;
      try { await publishRef.current(draft); if (queued.current) timer.current = setTimeout(() => void flush(), 750); }
      catch(e) { setError(String(e)); setStatus("Draft retained · needs attention"); }
    };
    timer.current = setTimeout(() => void flush(), 1500);
  };
  publishRef.current = shareReview;
  const openReview = (team: DriveTeam, revision: DriveRevision) => {
    if (queued.current) throw new Error("Publish or export your pending draft before opening another revision.");
    setActiveId(team.id); setBinding({ teamId: team.id, reviewId: revision.data.reviewId, parents: [revision.hash] });
    window.dispatchEvent(new CustomEvent("poolr:loadProject", { detail: revision.data.project }));
  };
  return <Context.Provider value={{ ...state, native, activeTeam, selectTeam, unlocked, unlock, lock, command, refresh, sync, status, error, canEdit, binding, openReview, shareReview, queueReview }}>{children}</Context.Provider>;
}
export function useDrive() { const value = useContext(Context); if (!value) throw new Error("DriveProvider is missing"); return value; }
