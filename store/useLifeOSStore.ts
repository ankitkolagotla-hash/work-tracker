import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ACTSectionScore,
  ACTErrorLogEntry,
  ACTMockExam,
  ACTSection,
  ACT_SECTIONS,
  ACTSectionSession,
  MatchLog,
  HighlightClip,
  CoachContact,
  CoachPipelineStage,
  TrainingLog,
  TargetUniversity,
  UniversityStatus,
  SupplementalEssay,
  ColdEmailLog,
  ColdEmailStatus,
  AdvocacyDraft,
  AdvocacyDraftType,
  StudentProfile,
  CommonAppActivityEntry,
} from '../types/lifeOs';

interface LifeOSState {
  // --- ACT Intensive Mastery Station ---
  actSectionScores: ACTSectionScore[];
  actErrorLog: ACTErrorLogEntry[];
  actMockExams: ACTMockExam[];
  actSectionSessions: ACTSectionSession[];

  updateSectionScore: (section: ACTSection, current: number) => void;
  logACTError: (entry: Omit<ACTErrorLogEntry, 'id'>) => void;
  deleteACTError: (id: string) => void;
  toggleMockExamComplete: (id: string) => void;
  addACTSectionSession: (session: Omit<ACTSectionSession, 'id'>) => void;
  deleteACTSectionSession: (id: string) => void;

  // --- Athletics, Recruiting & Performance Hub ---
  matchLogs: MatchLog[];
  highlightClips: HighlightClip[];
  coachContacts: CoachContact[];
  trainingLogs: TrainingLog[];

  addMatchLog: (log: Omit<MatchLog, 'id'>) => void;
  deleteMatchLog: (id: string) => void;
  addHighlightClip: (clip: Omit<HighlightClip, 'id'>) => void;
  deleteHighlightClip: (id: string) => void;
  addCoachContact: (contact: Omit<CoachContact, 'id'>) => void;
  updateCoachStatus: (id: string, status: CoachPipelineStage) => void;
  scheduleFollowUp: (id: string, date: string) => void;
  markTapeSent: (id: string) => void;
  deleteCoachContact: (id: string) => void;
  addTrainingLog: (log: Omit<TrainingLog, 'id'>) => void;
  deleteTrainingLog: (id: string) => void;

  // --- College Admissions, Outreach & Strategy Hub ---
  targetUniversities: TargetUniversity[];
  supplementalEssays: SupplementalEssay[];
  coldEmailLogs: ColdEmailLog[];
  advocacyDrafts: AdvocacyDraft[];
  studentProfile: StudentProfile | null;
  commonAppActivities: CommonAppActivityEntry[];
  bragSheetNotes: string;

  addUniversity: (u: Omit<TargetUniversity, 'id'>) => void;
  updateUniversityStatus: (id: string, status: UniversityStatus) => void;
  deleteUniversity: (id: string) => void;
  addEssay: (e: Omit<SupplementalEssay, 'id'>) => void;
  updateEssayDraft: (id: string, draft: string) => void;
  updateEssayStatus: (id: string, status: SupplementalEssay['status']) => void;
  deleteEssay: (id: string) => void;
  addColdEmailLog: (log: Omit<ColdEmailLog, 'id'>) => void;
  updateColdEmailStatus: (id: string, status: ColdEmailStatus) => void;
  deleteColdEmailLog: (id: string) => void;
  upsertAdvocacyDraft: (draft: { id?: string; type: AdvocacyDraftType; title: string; content: string }) => void;
  deleteAdvocacyDraft: (id: string) => void;
  setStudentProfile: (profile: StudentProfile) => void;
  addCommonAppActivity: (entry: Omit<CommonAppActivityEntry, 'id'>) => void;
  updateCommonAppActivity: (id: string, optimizedText: string) => void;
  deleteCommonAppActivity: (id: string) => void;
  setBragSheetNotes: (notes: string) => void;
}

const DEFAULT_MOCK_EXAMS: ACTMockExam[] = [
  { id: 'mock-sep19', date: '2026-09-19', scheduledTime: '8:00 AM', sectionSplits: [
    { section: 'English', minutes: 45 }, { section: 'Math', minutes: 60 }, { section: 'Reading', minutes: 35 }, { section: 'Science', minutes: 35 },
  ], completed: false },
  { id: 'mock-sep26', date: '2026-09-26', scheduledTime: '8:00 AM', sectionSplits: [
    { section: 'English', minutes: 45 }, { section: 'Math', minutes: 60 }, { section: 'Reading', minutes: 35 }, { section: 'Science', minutes: 35 },
  ], completed: false },
  { id: 'mock-oct03', date: '2026-10-03', scheduledTime: '8:00 AM', sectionSplits: [
    { section: 'English', minutes: 45 }, { section: 'Math', minutes: 60 }, { section: 'Reading', minutes: 35 }, { section: 'Science', minutes: 35 },
  ], completed: false },
  { id: 'mock-oct10', date: '2026-10-10', scheduledTime: '8:00 AM', sectionSplits: [
    { section: 'English', minutes: 45 }, { section: 'Math', minutes: 60 }, { section: 'Reading', minutes: 35 }, { section: 'Science', minutes: 35 },
  ], completed: false },
];

/** Old highlight clip shape (pre matchName/opponent/timestampStart/timestampEnd split). */
interface LegacyHighlightClip {
  id: string;
  timestamp?: string;
  clipUrl: string;
  skillsShown: string[];
  notes: string;
  matchName?: string;
  opponent?: string;
  timestampStart?: string;
  timestampEnd?: string;
}

function migrateHighlightClip(c: LegacyHighlightClip): HighlightClip {
  return {
    id: c.id,
    matchName: c.matchName ?? '',
    opponent: c.opponent ?? '',
    timestampStart: c.timestampStart ?? c.timestamp ?? '',
    timestampEnd: c.timestampEnd ?? '',
    clipUrl: c.clipUrl,
    skillsShown: (c.skillsShown ?? []) as HighlightClip['skillsShown'],
    notes: c.notes ?? '',
  };
}

/** Old coach contact status values, from before the CRM pipeline rename. */
const LEGACY_COACH_STATUS_MAP: Record<string, CoachPipelineStage> = {
  'Not Contacted': 'Prospecting',
  Emailed: 'Initial Email Sent',
  'Following Up': 'Film Sent',
  Responded: 'Campus Visit',
  'No Response': 'Prospecting',
};

interface LegacyCoachContact {
  id: string;
  schoolName: string;
  coachName: string;
  email: string;
  status: string;
  lastContactDate: string | null;
  tapeSentDate?: string | null;
  nextFollowUpDate?: string | null;
  notes: string;
}

function migrateCoachContact(c: LegacyCoachContact): CoachContact {
  const isCurrentStage = (s: string): s is CoachPipelineStage =>
    ['Prospecting', 'Initial Email Sent', 'Film Sent', 'Campus Visit', 'Offer / Closing'].includes(s);
  return {
    id: c.id,
    schoolName: c.schoolName,
    coachName: c.coachName,
    email: c.email,
    status: isCurrentStage(c.status) ? c.status : LEGACY_COACH_STATUS_MAP[c.status] ?? 'Prospecting',
    lastContactDate: c.lastContactDate ?? null,
    tapeSentDate: c.tapeSentDate ?? null,
    nextFollowUpDate: c.nextFollowUpDate ?? null,
    notes: c.notes ?? '',
  };
}

interface LegacyMatchLog {
  id: string;
  date: string;
  opponent: string;
  competition: string;
  minutesPlayed: number;
  position: string;
  tacticalNotes: string;
  filmReviewed: boolean;
  teamResult?: string;
  selfRating?: 1 | 2 | 3 | 4 | 5;
}

function migrateMatchLog(m: LegacyMatchLog): MatchLog {
  return { ...m, teamResult: m.teamResult ?? '', selfRating: m.selfRating ?? 3 };
}

function migrateACTErrorRootCause(e: ACTErrorLogEntry): ACTErrorLogEntry {
  // 'Time Pressure' was renamed to 'Pacing Panic'; remap any older logged entries.
  if ((e.rootCause as string) === 'Time Pressure') return { ...e, rootCause: 'Pacing Panic' };
  return e;
}

/**
 * Additive reconciliation, run via the `merge` option (NOT `migrate`) so it
 * applies on every hydration regardless of the stored version number — this
 * store's version is intentionally never bumped again, since a version bump
 * only matters here as a trigger for zustand's migrate callback, and a wipe
 * is exactly what this function exists to avoid. Every field below falls
 * back to a sensible default only when genuinely absent from the persisted
 * blob; anything the user already has (scores, logs, contacts, streak-
 * feeding session data) is preserved and shape-migrated in place rather than
 * discarded.
 */
function mergeAdditiveState(persistedState: unknown): Partial<LifeOSState> {
  const p = (persistedState ?? {}) as Partial<LifeOSState> & { highlightClips?: LegacyHighlightClip[]; coachContacts?: LegacyCoachContact[]; matchLogs?: LegacyMatchLog[] };
  return {
    actSectionScores: p.actSectionScores ?? ACT_SECTIONS.map((section) => ({ section, target: 34, current: 0 })),
    actErrorLog: (p.actErrorLog ?? []).map(migrateACTErrorRootCause),
    actMockExams: p.actMockExams ?? DEFAULT_MOCK_EXAMS,
    actSectionSessions: p.actSectionSessions ?? [],
    matchLogs: (p.matchLogs ?? []).map(migrateMatchLog),
    highlightClips: (p.highlightClips ?? []).map(migrateHighlightClip),
    coachContacts: (p.coachContacts ?? []).map(migrateCoachContact),
    trainingLogs: p.trainingLogs ?? [],
    targetUniversities: p.targetUniversities ?? [],
    supplementalEssays: p.supplementalEssays ?? [],
    coldEmailLogs: p.coldEmailLogs ?? [],
    advocacyDrafts: p.advocacyDrafts ?? [],
    studentProfile: p.studentProfile ?? null,
    commonAppActivities: p.commonAppActivities ?? [],
    bragSheetNotes: p.bragSheetNotes ?? '',
  };
}

export const useLifeOSStore = create<LifeOSState>()(
  persist(
    (set) => ({
      actSectionScores: ACT_SECTIONS.map((section) => ({ section, target: 34, current: 0 })),
      actErrorLog: [],
      actMockExams: DEFAULT_MOCK_EXAMS,
      actSectionSessions: [],

      updateSectionScore: (section, current) => {
        set((state) => ({
          actSectionScores: state.actSectionScores.map((s) => (s.section === section ? { ...s, current } : s)),
        }));
      },

      logACTError: (entry) => {
        set((state) => ({
          actErrorLog: [{ ...entry, id: `act-err-${Date.now()}` }, ...state.actErrorLog],
        }));
      },

      deleteACTError: (id) => {
        set((state) => ({ actErrorLog: state.actErrorLog.filter((e) => e.id !== id) }));
      },

      toggleMockExamComplete: (id) => {
        set((state) => ({
          actMockExams: state.actMockExams.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
        }));
      },

      addACTSectionSession: (session) => {
        set((state) => ({
          actSectionSessions: [{ ...session, id: `act-sess-${Date.now()}` }, ...state.actSectionSessions],
        }));
      },

      deleteACTSectionSession: (id) => {
        set((state) => ({ actSectionSessions: state.actSectionSessions.filter((s) => s.id !== id) }));
      },

      matchLogs: [],
      highlightClips: [],
      coachContacts: [],
      trainingLogs: [],

      addMatchLog: (log) => {
        set((state) => ({ matchLogs: [{ ...log, id: `match-${Date.now()}` }, ...state.matchLogs] }));
      },
      deleteMatchLog: (id) => {
        set((state) => ({ matchLogs: state.matchLogs.filter((m) => m.id !== id) }));
      },
      addHighlightClip: (clip) => {
        set((state) => ({ highlightClips: [{ ...clip, id: `clip-${Date.now()}` }, ...state.highlightClips] }));
      },
      deleteHighlightClip: (id) => {
        set((state) => ({ highlightClips: state.highlightClips.filter((c) => c.id !== id) }));
      },
      addCoachContact: (contact) => {
        set((state) => ({ coachContacts: [{ ...contact, id: `coach-${Date.now()}` }, ...state.coachContacts] }));
      },
      updateCoachStatus: (id, status) => {
        set((state) => ({
          coachContacts: state.coachContacts.map((c) =>
            c.id === id ? { ...c, status, lastContactDate: new Date().toISOString() } : c
          ),
        }));
      },
      scheduleFollowUp: (id, date) => {
        set((state) => ({
          coachContacts: state.coachContacts.map((c) => (c.id === id ? { ...c, nextFollowUpDate: date } : c)),
        }));
      },
      markTapeSent: (id) => {
        set((state) => ({
          coachContacts: state.coachContacts.map((c) =>
            c.id === id ? { ...c, tapeSentDate: new Date().toISOString() } : c
          ),
        }));
      },
      deleteCoachContact: (id) => {
        set((state) => ({ coachContacts: state.coachContacts.filter((c) => c.id !== id) }));
      },
      addTrainingLog: (log) => {
        set((state) => ({ trainingLogs: [{ ...log, id: `train-${Date.now()}` }, ...state.trainingLogs] }));
      },
      deleteTrainingLog: (id) => {
        set((state) => ({ trainingLogs: state.trainingLogs.filter((t) => t.id !== id) }));
      },

      targetUniversities: [],
      supplementalEssays: [],
      coldEmailLogs: [],
      advocacyDrafts: [],
      studentProfile: null,
      commonAppActivities: [],
      bragSheetNotes: '',

      addUniversity: (u) => {
        set((state) => ({ targetUniversities: [{ ...u, id: `univ-${Date.now()}` }, ...state.targetUniversities] }));
      },
      updateUniversityStatus: (id, status) => {
        set((state) => ({
          targetUniversities: state.targetUniversities.map((u) => (u.id === id ? { ...u, status } : u)),
        }));
      },
      deleteUniversity: (id) => {
        set((state) => ({ targetUniversities: state.targetUniversities.filter((u) => u.id !== id) }));
      },
      addEssay: (e) => {
        set((state) => ({ supplementalEssays: [{ ...e, id: `essay-${Date.now()}` }, ...state.supplementalEssays] }));
      },
      updateEssayDraft: (id, draft) => {
        set((state) => ({
          supplementalEssays: state.supplementalEssays.map((e) => (e.id === id ? { ...e, draft } : e)),
        }));
      },
      updateEssayStatus: (id, status) => {
        set((state) => ({
          supplementalEssays: state.supplementalEssays.map((e) => (e.id === id ? { ...e, status } : e)),
        }));
      },
      deleteEssay: (id) => {
        set((state) => ({ supplementalEssays: state.supplementalEssays.filter((e) => e.id !== id) }));
      },
      addColdEmailLog: (log) => {
        set((state) => ({ coldEmailLogs: [{ ...log, id: `email-${Date.now()}` }, ...state.coldEmailLogs] }));
      },
      updateColdEmailStatus: (id, status) => {
        set((state) => ({
          coldEmailLogs: state.coldEmailLogs.map((l) => (l.id === id ? { ...l, status } : l)),
        }));
      },
      deleteColdEmailLog: (id) => {
        set((state) => ({ coldEmailLogs: state.coldEmailLogs.filter((l) => l.id !== id) }));
      },
      upsertAdvocacyDraft: (draft) => {
        set((state) => {
          const id = draft.id ?? `advocacy-${Date.now()}`;
          const existingIdx = state.advocacyDrafts.findIndex((d) => d.id === id);
          const updated: AdvocacyDraft = {
            id,
            type: draft.type,
            title: draft.title,
            content: draft.content,
            updatedAt: new Date().toISOString(),
          };
          if (existingIdx === -1) {
            return { advocacyDrafts: [updated, ...state.advocacyDrafts] };
          }
          const next = [...state.advocacyDrafts];
          next[existingIdx] = updated;
          return { advocacyDrafts: next };
        });
      },
      deleteAdvocacyDraft: (id) => {
        set((state) => ({ advocacyDrafts: state.advocacyDrafts.filter((d) => d.id !== id) }));
      },
      setStudentProfile: (profile) => set({ studentProfile: profile }),
      addCommonAppActivity: (entry) => {
        set((state) => ({
          commonAppActivities: [{ ...entry, id: `activity-${Date.now()}` }, ...state.commonAppActivities],
        }));
      },
      updateCommonAppActivity: (id, optimizedText) => {
        set((state) => ({
          commonAppActivities: state.commonAppActivities.map((a) => (a.id === id ? { ...a, optimizedText } : a)),
        }));
      },
      deleteCommonAppActivity: (id) => {
        set((state) => ({ commonAppActivities: state.commonAppActivities.filter((a) => a.id !== id) }));
      },
      setBragSheetNotes: (notes) => set({ bragSheetNotes: notes }),
    }),
    {
      name: 'chronoflow-lifeos-store',
      version: 2,
      merge: (persistedState, currentState) => ({ ...currentState, ...mergeAdditiveState(persistedState) }),
    }
  )
);
