import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Assessment,
  StudySessionLog,
  StudyMethod,
  StudyPacing,
  DayOfWeek,
  REGISTERED_COURSES,
} from '../types/assessment';
import { generateStudyPack, EMPTY_STUDY_PACK } from '../lib/studyGenerator';
import { isPast } from '../lib/date';

interface AssessmentState {
  assessments: Assessment[];
  studyLogs: StudySessionLog[];
  activeSession: {
    assessmentId: string | null;
    elapsedSeconds: number;
    lastLoggedSeconds: number;
    isRunning: boolean;
  };
  canvasFeedUrl: string;
  verifiedBlocks: string[];

  addAssessment: (data: Omit<Assessment, 'id' | 'readinessIndex' | 'studyPack'>) => void;
  importCanvasEvents: (events: Assessment[]) => void;
  regenerateStudyPack: (assessmentId: string, rawText: string) => void;
  appendMaterials: (assessmentId: string, additionalText: string) => void;
  startStudySession: (assessmentId: string) => void;
  tickTimer: () => void;
  logStudySession: (assessmentId: string, method: StudyMethod, performanceScore: number) => void;
  cancelSession: () => void;
  deleteAssessment: (id: string) => void;
  toggleBlockVerified: (key: string) => void;
}

const DEFAULT_PLAN = {
  totalPrepTimeMinutes: 60,
  studySessionPacing: '25m Pomodoro' as StudyPacing,
  targetStudyDays: [] as DayOfWeek[],
};

const BIO_QUIZ_MATERIALS = `Attention: The conscious bottleneck limiting stimuli into working memory
Encoding: Transferring working memory to long-term storage via schemas
Emergent Property: Novel characteristics arising strictly from component interactions
Morphological Species Concept: Linnaeus definition of species based on physical form
Taxonomic Hierarchy: Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species`;

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      canvasFeedUrl:
        'https://issaquah.instructure.com/feeds/calendars/user_QeloAEpfBFMRDzKfi2PNj6w6C236vTQofVfALMl0.ics',

      // Fresh baseline: Friday, September 11, 2026. No historical completions —
      // every assessment starts at 0% readiness. This is the user's real active
      // schedule, not mock data.
      assessments: [
        // --- Today: Friday, September 11, 2026 ---
        {
          id: 'seed-cw-outline',
          title: 'Short Story Outline',
          type: 'Assignment',
          courseId: 'cw',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-11T10:00:00.000Z',
          status: 'Upcoming',
          points: 10,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-cw-character',
          title: 'Character Creation',
          type: 'Assignment',
          courseId: 'cw',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-11T22:00:00.000Z',
          status: 'Upcoming',
          points: 15,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-econ-graphing',
          title: 'Ch 3 Graphing',
          type: 'Assignment',
          courseId: 'ib-econ',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-11T21:00:00.000Z',
          status: 'Upcoming',
          points: 25,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-math-diffeq-discussion',
          title: 'Differential Equations Discussion',
          type: 'Assignment',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-11T23:30:00.000Z',
          status: 'Upcoming',
          points: 5,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },

        // --- Sunday, September 13, 2026 ---
        {
          id: 'seed-bio-ab-activities',
          title: 'A&B Activities',
          type: 'Assignment',
          courseId: 'ib-bio',
          unitsCovered: [
            'Dark Matter',
            'A Passion for Order',
            'History of Classification',
            'Offensive Species Names',
            "What's in a Name",
            'AI Consciousness',
            'Animal Consciousness',
          ],
          dueDate: '2026-09-13T22:00:00.000Z',
          status: 'Upcoming',
          points: 0,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-bio-fka',
          title: 'FKA Science of Biology',
          type: 'Assignment',
          courseId: 'ib-bio',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-13T22:00:00.000Z',
          status: 'Upcoming',
          points: 5,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },

        // --- Monday, September 14, 2026 ---
        {
          id: 'seed-civics-annotate',
          title: 'Annotate Understanding Tribal Treaty Rights in Western WA',
          type: 'Assignment',
          courseId: 'civics',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-14T08:00:00.000Z',
          status: 'Upcoming',
          points: 5,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-french-trois-ours',
          title: 'Les Trois Ours',
          type: 'Assignment',
          courseId: 'ib-french-sl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-14T23:59:00.000Z',
          status: 'Upcoming',
          points: 30,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-french-structures2',
          title: 'Structures II - Passé Composé',
          type: 'Assignment',
          courseId: 'ib-french-sl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-14T23:59:00.000Z',
          status: 'Upcoming',
          points: 10,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-bio-1pager',
          title: '1-pager: Science of Biology',
          type: 'Assignment',
          courseId: 'ib-bio',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-14T14:00:00.000Z',
          status: 'Upcoming',
          points: 25,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          // The pre-loaded multi-format study pack (notes, flashcards, MCQs) lives here.
          id: 'seed-bio-quiz',
          title: 'Quiz: Science of Biology',
          type: 'Quiz',
          courseId: 'ib-bio',
          unitsCovered: ['Mechanisms of Learning', 'Emergence', 'Taxonomy'],
          dueDate: '2026-09-14T14:00:00.000Z',
          status: 'Upcoming',
          points: 35,
          readinessIndex: 0,
          pastedMaterials: BIO_QUIZ_MATERIALS,
          studyPack: generateStudyPack(BIO_QUIZ_MATERIALS),
          totalPrepTimeMinutes: 90,
          studySessionPacing: '50m Ultradian',
          targetStudyDays: ['Saturday', 'Sunday'],
        },
        {
          id: 'seed-math-ch1-quiz',
          title: 'Ch 1: Quiz',
          type: 'Quiz',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-14T21:00:00.000Z',
          status: 'Upcoming',
          points: 0,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },

        // --- Major upcoming deadlines & milestones ---
        {
          id: 'seed-math-explore-outline',
          title: 'IB Exploration Preliminary Outline',
          type: 'Assignment',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-17T23:59:00.000Z',
          status: 'Upcoming',
          points: 5,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-cw-short-story',
          title: 'Short Story',
          type: 'Assignment',
          courseId: 'cw',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-18T23:59:00.000Z',
          status: 'Upcoming',
          points: 20,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-ee-rough-draft',
          title: 'Rough Draft — 3,000 words',
          type: 'Assignment',
          courseId: 'ib-ee',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-18T07:00:00.000Z',
          status: 'Upcoming',
          points: 0,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-math-ch1-test',
          title: 'Ch 1: Test',
          type: 'Test',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-09-21T23:59:00.000Z',
          status: 'Upcoming',
          points: 100,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          totalPrepTimeMinutes: 120,
          studySessionPacing: '50m Ultradian',
          targetStudyDays: [],
        },
        {
          id: 'seed-math-explore-peer-edit',
          title: 'IB Math Exploration Peer Edit',
          type: 'Assignment',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-10-22T23:59:00.000Z',
          status: 'Upcoming',
          points: 20,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-bio-binder-check',
          title: 'Q1 Binder Check',
          type: 'Assignment',
          courseId: 'ib-bio',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-10-29T23:59:00.000Z',
          status: 'Upcoming',
          points: 75,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-bio-q1-cumulative-test',
          title: 'Test: Q1 Cumulative',
          type: 'Test',
          courseId: 'ib-bio',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-10-30T23:59:00.000Z',
          status: 'Upcoming',
          points: 60,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          totalPrepTimeMinutes: 120,
          studySessionPacing: '50m Ultradian',
          targetStudyDays: [],
        },
        {
          id: 'seed-math-explore-first-draft',
          title: 'IB Exploration First Draft',
          type: 'Assignment',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-11-20T23:59:00.000Z',
          status: 'Upcoming',
          points: 20,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
        {
          id: 'seed-math-explore-final-draft',
          title: 'IB Exploration Final Draft',
          type: 'Assignment',
          courseId: 'ib-math-hl',
          unitsCovered: ['Direct Schedule Seed'],
          dueDate: '2026-12-11T23:59:00.000Z',
          status: 'Upcoming',
          points: 20,
          readinessIndex: 0,
          pastedMaterials: '',
          studyPack: EMPTY_STUDY_PACK,
          ...DEFAULT_PLAN,
        },
      ],
      studyLogs: [],
      activeSession: {
        assessmentId: null,
        elapsedSeconds: 0,
        lastLoggedSeconds: 0,
        isRunning: false,
      },
      verifiedBlocks: [],

      addAssessment: (data) => {
        const newId = `asym-${Date.now()}`;
        const newAssessment: Assessment = {
          ...data,
          id: newId,
          readinessIndex: 0,
          studyPack: generateStudyPack(data.pastedMaterials),
        };
        set((state) => ({ assessments: [newAssessment, ...state.assessments] }));
      },

      importCanvasEvents: (incomingEvents) => {
        set((state) => {
          const existingTitles = new Set(state.assessments.map((a) => a.title));
          const uniqueNew = incomingEvents.filter((e) => !existingTitles.has(e.title) && !isPast(e.dueDate));
          return { assessments: [...uniqueNew, ...state.assessments] };
        });
      },

      regenerateStudyPack: (assessmentId, rawText) => {
        const studyPack = generateStudyPack(rawText);
        set((state) => ({
          assessments: state.assessments.map((a) =>
            a.id === assessmentId ? { ...a, studyPack, pastedMaterials: rawText } : a
          ),
        }));
      },

      appendMaterials: (assessmentId, additionalText) => {
        const target = get().assessments.find((a) => a.id === assessmentId);
        if (!target) return;
        const combined = `${target.pastedMaterials}\n${additionalText}`.trim();
        get().regenerateStudyPack(assessmentId, combined);
      },

      startStudySession: (assessmentId) => {
        set({
          activeSession: {
            assessmentId,
            elapsedSeconds: 0,
            lastLoggedSeconds: 0,
            isRunning: true,
          },
        });
      },

      tickTimer: () => {
        set((state) => ({
          activeSession: {
            ...state.activeSession,
            elapsedSeconds: state.activeSession.elapsedSeconds + 1,
          },
        }));
      },

      logStudySession: (assessmentId, method, performanceScore) => {
        set((state) => {
          const target = state.assessments.find((a) => a.id === assessmentId);
          if (!target) return {};

          const course = REGISTERED_COURSES.find((c) => c.id === target.courseId);
          const hadSession = state.activeSession.assessmentId === assessmentId;
          const incrementSeconds = hadSession
            ? Math.max(0, state.activeSession.elapsedSeconds - state.activeSession.lastLoggedSeconds)
            : 0;
          const durationMinutes = Math.max(1, Math.round(incrementSeconds / 60));

          const newLog: StudySessionLog = {
            id: `log-${Date.now()}`,
            assessmentId,
            courseId: target.courseId,
            timestamp: new Date().toISOString(),
            durationMinutes,
            methodUsed: method,
            performanceScore,
            summarySnippet: `${target.title} — ${method} (${course?.name ?? ''})`,
          };

          const readinessIndex = Math.min(100, Math.round(target.readinessIndex * 0.5 + performanceScore * 0.5));

          return {
            studyLogs: [newLog, ...state.studyLogs],
            assessments: state.assessments.map((a) =>
              a.id === assessmentId
                ? { ...a, readinessIndex, status: readinessIndex >= 100 ? 'Completed' : 'Studying' }
                : a
            ),
            activeSession: hadSession
              ? { ...state.activeSession, lastLoggedSeconds: state.activeSession.elapsedSeconds }
              : state.activeSession,
          };
        });
      },

      cancelSession: () => {
        set({ activeSession: { assessmentId: null, elapsedSeconds: 0, lastLoggedSeconds: 0, isRunning: false } });
      },

      deleteAssessment: (id) => {
        set((state) => ({
          assessments: state.assessments.filter((a) => a.id !== id),
        }));
      },

      toggleBlockVerified: (key) => {
        set((state) => ({
          verifiedBlocks: state.verifiedBlocks.includes(key)
            ? state.verifiedBlocks.filter((k) => k !== key)
            : [...state.verifiedBlocks, key],
        }));
      },
    }),
    {
      name: 'chronoflow-store',
      version: 4,
    }
  )
);
