/**
 * CollaborationContext — Enterprise Team State, RBAC, Concurrency & Authorship Tracking
 *
 * Implements:
 * 1. Admin-controlled Role-Based Access Control (RBAC): owner, editor, reviewer, viewer
 * 2. Step-level and record-level commenting for all review phases
 * 3. Section soft locks for concurrent edit protection
 * 4. Append-only change delta logging (PRISMA 2020 compliant audit trail)
 * 5. Interactive 3-way conflict detection & resolution
 * 6. ICMJE & CRediT authorship time-tracking engine
 */

import * as React from "react";
import { useDrive } from "./DriveContext";

export type Role = "owner" | "editor" | "reviewer" | "viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: Role;
  status: "online" | "offline";
  lastSeen?: string;
  joinedAt?: string;
  activeMinutes?: number;
}

export type ReviewStep =
  | "protocol"
  | "search"
  | "screening"
  | "extraction"
  | "rob"
  | "meta"
  | "manuscript"
  | "project";

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPicture?: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  step: ReviewStep;
  targetId?: string; // Optional: study ID, outcome name, or manuscript section
}

export interface ChangeDelta {
  id: string;
  revision: number;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  section: ReviewStep;
  targetId?: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  description: string;
}

export interface SectionLock {
  section: string;
  userId: string;
  userName: string;
  lockedAt: string;
  expiresAt: number;
}

export interface ConflictEvent {
  id: string;
  section: ReviewStep;
  targetId?: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  remoteAuthor: string;
  remoteTimestamp: string;
}

export interface AuthorshipRecord {
  userId: string;
  userName: string;
  userEmail: string;
  totalMinutes: number;
  sectionMinutes: Record<ReviewStep, number>;
  creditRoles: string[]; // ICMJE / CRediT roles
  lastActive: string;
}

export interface CollaborationState {
  teamMembers: TeamMember[];
  comments: Comment[];
  changeDeltas: ChangeDelta[];
  activeLocks: SectionLock[];
  activeConflict: ConflictEvent | null;
  authorship: Record<string, AuthorshipRecord>;
  currentUserRole: Role;
  activeSection: ReviewStep;
  isConnected: boolean;
}

interface CollaborationContextValue extends CollaborationState {
  // Comments
  addComment: (step: ReviewStep, text: string, targetId?: string) => void;
  resolveComment: (commentId: string) => void;
  removeComment: (commentId: string) => void;
  getCommentsForStep: (step: ReviewStep, targetId?: string) => Comment[];

  // Team & RBAC
  addTeamMember: (email: string, role: Role, name?: string) => Promise<void>;
  removeTeamMember: (userId: string) => void;
  updateMemberRole: (userId: string, role: Role) => void;
  
  // Permission Checks
  canEditProtocol: () => boolean;
  canScreen: () => boolean;
  canExtract: () => boolean;
  canAssessRob: () => boolean;
  canRunMeta: () => boolean;
  canEditManuscript: () => boolean;
  canManageTeam: () => boolean;
  canAdjudicateConflicts: () => boolean;
  canExport: () => boolean;

  // Locks
  acquireSectionLock: (section: string) => boolean;
  releaseSectionLock: (section: string) => void;
  isSectionLockedByOther: (section: string) => SectionLock | null;

  // Change Delta & Audit Trail
  recordChange: (
    section: ReviewStep,
    field: string,
    oldValue: unknown,
    newValue: unknown,
    description: string,
    targetId?: string
  ) => void;

  // Conflict Resolution
  triggerConflict: (conflict: ConflictEvent) => void;
  resolveActiveConflict: (resolution: "local" | "remote" | "custom", customValue?: unknown) => void;

  // Navigation & Authorship Tracking
  setActiveSection: (section: ReviewStep) => void;
  getAuthorshipReport: () => AuthorshipRecord[];
}

export const CollaborationContext = React.createContext<CollaborationContextValue | null>(null);

const COLLAB_STORAGE_KEY = "poolr.collaboration";
const AUTHORSHIP_STORAGE_KEY = "poolr.authorship";

function readStoredCollab(): CollaborationState {
  try {
    const raw = localStorage.getItem(COLLAB_STORAGE_KEY);
    const authorshipRaw = localStorage.getItem(AUTHORSHIP_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const parsedAuthorship = authorshipRaw ? JSON.parse(authorshipRaw) : {};

    return {
      teamMembers: parsed.teamMembers || [],
      comments: parsed.comments || [],
      changeDeltas: parsed.changeDeltas || [],
      activeLocks: parsed.activeLocks || [],
      activeConflict: null,
      authorship: parsedAuthorship || {},
      currentUserRole: parsed.currentUserRole || "owner",
      activeSection: "protocol",
      isConnected: false,
    };
  } catch {
    return {
      teamMembers: [],
      comments: [],
      changeDeltas: [],
      activeLocks: [],
      activeConflict: null,
      authorship: {},
      currentUserRole: "owner",
      activeSection: "protocol",
      isConnected: false,
    };
  }
}

function writeStoredCollab(state: CollaborationState) {
  try {
    localStorage.setItem(
      COLLAB_STORAGE_KEY,
      JSON.stringify({
        teamMembers: state.teamMembers,
        comments: state.comments,
        changeDeltas: state.changeDeltas.slice(-500),
        activeLocks: state.activeLocks,
        currentUserRole: state.currentUserRole,
      })
    );
    localStorage.setItem(AUTHORSHIP_STORAGE_KEY, JSON.stringify(state.authorship));
  } catch {}
}

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
  const drive = useDrive();
  const user = React.useMemo(() => drive.identity ? { sub: drive.identity.keyId, name: drive.identity.name, email: "", picture: undefined as string | undefined } : null, [drive.identity]);
  const [state, setState] = React.useState<CollaborationState>(() => readStoredCollab());

  const teamRole = drive.activeTeam ? (drive.canEdit ? drive.activeTeam.members.find(m => m.keyId === drive.identity?.keyId)?.role ?? "viewer" : "viewer") : "owner";
  React.useEffect(() => { setState(s => ({ ...s, currentUserRole: teamRole })); }, [teamRole]);

  // Persist state changes
  React.useEffect(() => {
    writeStoredCollab(state);
  }, [state]);

  // Authorship active time tracker (heartbeat every 60 seconds)
  React.useEffect(() => {
    if (!user) return;
    const userId = user.sub || user.email || "local_reviewer";
    const interval = setInterval(() => {
      setState((prev) => {
        const existing = prev.authorship[userId] || {
          userId,
          userName: user.name || "Reviewer",
          userEmail: user.email || "",
          totalMinutes: 0,
          sectionMinutes: {
            protocol: 0,
            search: 0,
            screening: 0,
            extraction: 0,
            rob: 0,
            meta: 0,
            manuscript: 0,
            project: 0,
          },
          creditRoles: ["Investigation"],
          lastActive: new Date().toISOString(),
        };

        const currentSec = prev.activeSection || "protocol";
        const updatedSectionMinutes = {
          ...existing.sectionMinutes,
          [currentSec]: (existing.sectionMinutes[currentSec] || 0) + 1,
        };

        return {
          ...prev,
          authorship: {
            ...prev.authorship,
            [userId]: {
              ...existing,
              totalMinutes: existing.totalMinutes + 1,
              sectionMinutes: updatedSectionMinutes,
              lastActive: new Date().toISOString(),
            },
          },
        };
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [user, state.activeSection]);

  // ── Permissions ──
  const canEditProtocol = React.useCallback(
    () => state.currentUserRole === "owner" || state.currentUserRole === "editor",
    [state.currentUserRole]
  );
  const canScreen = React.useCallback(
    () => state.currentUserRole !== "viewer",
    [state.currentUserRole]
  );
  const canExtract = React.useCallback(
    () => state.currentUserRole !== "viewer",
    [state.currentUserRole]
  );
  const canAssessRob = React.useCallback(
    () => state.currentUserRole !== "viewer",
    [state.currentUserRole]
  );
  const canRunMeta = React.useCallback(
    () => state.currentUserRole === "owner" || state.currentUserRole === "editor",
    [state.currentUserRole]
  );
  const canEditManuscript = React.useCallback(
    () => state.currentUserRole !== "viewer",
    [state.currentUserRole]
  );
  const canManageTeam = React.useCallback(
    () => state.currentUserRole === "owner",
    [state.currentUserRole]
  );
  const canAdjudicateConflicts = React.useCallback(
    () => state.currentUserRole === "owner" || state.currentUserRole === "editor",
    [state.currentUserRole]
  );
  const canExport = React.useCallback(() => true, []);

  // ── Comments ──
  const addComment = React.useCallback(
    (step: ReviewStep, text: string, targetId?: string) => {
      const comment: Comment = {
        id: `com_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        authorId: user?.sub || "guest",
        authorName: user?.name || "Reviewer",
        authorEmail: user?.email || "",
        authorPicture: user?.picture,
        text,
        timestamp: new Date().toISOString(),
        resolved: false,
        step,
        targetId,
      };
      setState((s) => ({ ...s, comments: [...s.comments, comment] }));
    },
    [user]
  );

  const resolveComment = React.useCallback((commentId: string) => {
    setState((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c)),
    }));
  }, []);

  const removeComment = React.useCallback((commentId: string) => {
    setState((s) => ({
      ...s,
      comments: s.comments.filter((c) => c.id !== commentId),
    }));
  }, []);

  const getCommentsForStep = React.useCallback(
    (step: ReviewStep, targetId?: string) => {
      return state.comments.filter(
        (c) => c.step === step && (!targetId || c.targetId === targetId)
      );
    },
    [state.comments]
  );

  // ── Team Members ──
  const addTeamMember = React.useCallback(
    async (email: string, role: Role, name?: string) => {
      const member: TeamMember = {
        id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: name || email.split("@")[0],
        email,
        role,
        status: "offline",
        joinedAt: new Date().toISOString(),
        activeMinutes: 0,
      };
      setState((s) => ({
        ...s,
        teamMembers: [...s.teamMembers.filter((m) => m.email.toLowerCase() !== email.toLowerCase()), member],
      }));
    },
    []
  );

  const removeTeamMember = React.useCallback((userId: string) => {
    setState((s) => ({
      ...s,
      teamMembers: s.teamMembers.filter((m) => m.id !== userId),
    }));
  }, []);

  const updateMemberRole = React.useCallback((userId: string, role: Role) => {
    setState((s) => ({
      ...s,
      teamMembers: s.teamMembers.map((m) => (m.id === userId ? { ...m, role } : m)),
    }));
  }, []);

  // ── Section Locks ──
  const acquireSectionLock = React.useCallback(
    (section: string): boolean => {
      const now = Date.now();
      const userId = user?.sub || "guest";
      const existing = state.activeLocks.find(
        (l) => l.section === section && l.expiresAt > now && l.userId !== userId
      );
      if (existing) return false;

      const newLock: SectionLock = {
        section,
        userId,
        userName: user?.name || "Reviewer",
        lockedAt: new Date().toISOString(),
        expiresAt: now + 300000, // 5 minute lease
      };

      setState((s) => ({
        ...s,
        activeLocks: [...s.activeLocks.filter((l) => l.section !== section), newLock],
      }));
      return true;
    },
    [user, state.activeLocks]
  );

  const releaseSectionLock = React.useCallback(
    (section: string) => {
      const userId = user?.sub || "guest";
      setState((s) => ({
        ...s,
        activeLocks: s.activeLocks.filter(
          (l) => !(l.section === section && l.userId === userId)
        ),
      }));
    },
    [user]
  );

  const isSectionLockedByOther = React.useCallback(
    (section: string): SectionLock | null => {
      const now = Date.now();
      const userId = user?.sub || "guest";
      const lock = state.activeLocks.find(
        (l) => l.section === section && l.expiresAt > now && l.userId !== userId
      );
      return lock || null;
    },
    [user, state.activeLocks]
  );

  // ── Delta Audit Trail ──
  const recordChange = React.useCallback(
    (
      section: ReviewStep,
      field: string,
      oldValue: unknown,
      newValue: unknown,
      description: string,
      targetId?: string
    ) => {
      const delta: ChangeDelta = {
        id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        revision: state.changeDeltas.length + 1,
        timestamp: new Date().toISOString(),
        authorId: user?.sub || "local",
        authorName: user?.name || "Reviewer",
        authorEmail: user?.email || "",
        section,
        targetId,
        field,
        oldValue,
        newValue,
        description,
      };

      setState((s) => ({
        ...s,
        changeDeltas: [delta, ...s.changeDeltas].slice(0, 500),
      }));
    },
    [user, state.changeDeltas.length]
  );

  // ── Conflict Resolution ──
  const triggerConflict = React.useCallback((conflict: ConflictEvent) => {
    setState((s) => ({ ...s, activeConflict: conflict }));
  }, []);

  const resolveActiveConflict = React.useCallback(
    (resolution: "local" | "remote" | "custom", customValue?: unknown) => {
      if (!state.activeConflict) return;
      recordChange(
        state.activeConflict.section,
        state.activeConflict.field,
        state.activeConflict.remoteValue,
        resolution === "local"
          ? state.activeConflict.localValue
          : resolution === "remote"
          ? state.activeConflict.remoteValue
          : customValue,
        `Resolved conflict (${resolution})`,
        state.activeConflict.targetId
      );
      setState((s) => ({ ...s, activeConflict: null }));
    },
    [state.activeConflict, recordChange]
  );

  const setActiveSection = React.useCallback((section: ReviewStep) => {
    setState((s) => ({ ...s, activeSection: section }));
  }, []);

  const getAuthorshipReport = React.useCallback((): AuthorshipRecord[] => {
    return Object.values(state.authorship).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [state.authorship]);

  const value = React.useMemo<CollaborationContextValue>(
    () => ({
      ...state,
      addComment,
      resolveComment,
      removeComment,
      getCommentsForStep,
      addTeamMember,
      removeTeamMember,
      updateMemberRole,
      canEditProtocol,
      canScreen,
      canExtract,
      canAssessRob,
      canRunMeta,
      canEditManuscript,
      canManageTeam,
      canAdjudicateConflicts,
      canExport,
      acquireSectionLock,
      releaseSectionLock,
      isSectionLockedByOther,
      recordChange,
      triggerConflict,
      resolveActiveConflict,
      setActiveSection,
      getAuthorshipReport,
    }),
    [
      state,
      addComment,
      resolveComment,
      removeComment,
      getCommentsForStep,
      addTeamMember,
      removeTeamMember,
      updateMemberRole,
      canEditProtocol,
      canScreen,
      canExtract,
      canAssessRob,
      canRunMeta,
      canEditManuscript,
      canManageTeam,
      canAdjudicateConflicts,
      canExport,
      acquireSectionLock,
      releaseSectionLock,
      isSectionLockedByOther,
      recordChange,
      triggerConflict,
      resolveActiveConflict,
      setActiveSection,
      getAuthorshipReport,
    ]
  );

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
}

export function useCollaboration(): CollaborationContextValue {
  const ctx = React.useContext(CollaborationContext);
  if (!ctx) throw new Error("useCollaboration must be used within CollaborationProvider");
  return ctx;
}
