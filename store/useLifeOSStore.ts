import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ACTSectionScore,
  ACTErrorLogEntry,
  ACTMockExam,
  ACTSection,
  ACT_SECTIONS,
  MatchLog,
  HighlightClip,
  CoachContact,
  CoachContactStatus,
  TrainingLog,
  TargetUniversity,
  UniversityStatus,
  SupplementalEssay,
  ColdEmailLog,
  ColdEmailStatus,
  AdvocacyDraft,
  AdvocacyDraftType,
} from '../types/lifeOs';

interface LifeOSState {
  // --- ACT Intensive Mastery Station ---
  actSectionScores: ACTSectionScore[];
  actErrorLog: ACTErrorLogEntry[];
  actMockExams: ACTMockExam[];

  updateSectionScore: (section: ACTSection, current: number) => void;
  logACTError: (entry: Omit<ACTErrorLogEntry, 'id'>) => void;
  deleteACTError: (id: string) => void;
  toggleMockExamComplete: (id: string) => void;

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
  updateCoachStatus: (id: string, status: CoachContactStatus) => void;
  deleteCoachContact: (id: string) => void;
  addTrainingLog: (log: Omit<TrainingLog, 'id'>) => void;
  deleteTrainingLog: (id: string) => void;

  // --- College Admissions, Outreach & Strategy Hub ---
  targetUniversities: TargetUniversity[];
  supplementalEssays: SupplementalEssay[];
  coldEmailLogs: ColdEmailLog[];
  advocacyDrafts: AdvocacyDraft[];

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
}

export const useLifeOSStore = create<LifeOSState>()(
  persist(
    (set) => ({
      actSectionScores: ACT_SECTIONS.map((section) => ({ section, target: 34, current: 0 })),
      actErrorLog: [],
      actMockExams: [
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
      ],

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
    }),
    {
      name: 'chronoflow-lifeos-store',
      version: 1,
    }
  )
);
