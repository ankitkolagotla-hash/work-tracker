import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Assessment,
  StudySessionLog,
  PrepStage,
  PREP_STAGES,
  StudyMethod,
  REGISTERED_COURSES,
} from '../types/assessment';
import { parseDrillLines } from '../lib/notes';

const STAGE_METHOD_MAP: Partial<Record<PrepStage, StudyMethod>> = {
  review: 'Active Recall Prompt',
  diagnostic: 'Diagnostic Quiz',
  mastery: 'Case Study Mock',
};

interface AssessmentState {
  assessments: Assessment[];
  studyLogs: StudySessionLog[];
  activeSession: {
    assessmentId: string | null;
    elapsedSeconds: number;
    isRunning: boolean;
  };
  canvasFeedUrl: string;
  verifiedBlocks: string[];

  addAssessment: (
    data: Omit<Assessment, 'id' | 'readinessIndex' | 'generatedDrills' | 'completedStages'>
  ) => void;
  importCanvasEvents: (events: Assessment[]) => void;
  parseMaterialsToDrills: (assessmentId: string, rawText: string) => void;
  appendMaterials: (assessmentId: string, additionalText: string) => void;
  startStudySession: (assessmentId: string) => void;
  tickTimer: () => void;
  completeStage: (assessmentId: string, stage: PrepStage, performanceScore?: number) => void;
  cancelSession: () => void;
  deleteAssessment: (id: string) => void;
  toggleBlockVerified: (key: string) => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      canvasFeedUrl:
        'https://issaquah.instructure.com/feeds/calendars/user_QeloAEpfBFMRDzKfi2PNj6w6C236vTQofVfALMl0.ics',

      // Fresh baseline: Thursday, September 10, 2026. No historical completions —
      // every assessment starts at 0% readiness with no prep stages completed.
      assessments: [
        {
          id: 'init-bio-1',
          title: 'Science of Biology Unit Quiz',
          type: 'Quiz',
          courseId: 'ib-bio',
          unitsCovered: ['Mechanisms of Learning', 'Emergence', 'Taxonomy'],
          dueDate: '2026-09-14T09:00:00.000Z',
          status: 'Upcoming',
          points: 35,
          readinessIndex: 0,
          pastedMaterials: `Attention: The conscious bottleneck limiting stimuli into working memory
Encoding: Transferring working memory to long-term storage via schemas
Emergent Property: Novel characteristics arising strictly from component interactions
Morphological Species Concept: Linnaeus definition of species based on physical form
Taxonomic Hierarchy: Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species`,
          generatedDrills: [
            { id: 'd1', prompt: 'Attention', answer: 'The conscious bottleneck limiting stimuli into working memory' },
            { id: 'd2', prompt: 'Encoding', answer: 'Transferring working memory to long-term storage via schemas' },
            { id: 'd3', prompt: 'Emergent Property', answer: 'Novel characteristics arising strictly from component interactions' },
            { id: 'd4', prompt: 'Morphological Species Concept', answer: 'Linnaeus definition of species based on physical form' },
            { id: 'd5', prompt: 'Taxonomic Hierarchy', answer: 'Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species' },
          ],
          completedStages: [],
        },
      ],
      studyLogs: [],
      activeSession: {
        assessmentId: null,
        elapsedSeconds: 0,
        isRunning: false,
      },
      verifiedBlocks: [],

      addAssessment: (data) => {
        const newId = `asym-${Date.now()}`;
        const newAssessment: Assessment = {
          ...data,
          id: newId,
          readinessIndex: 0,
          generatedDrills: [],
          completedStages: [],
        };
        set((state) => ({ assessments: [newAssessment, ...state.assessments] }));
        get().parseMaterialsToDrills(newId, data.pastedMaterials);
      },

      importCanvasEvents: (incomingEvents) => {
        set((state) => {
          const existingTitles = new Set(state.assessments.map((a) => a.title));
          const uniqueNew = incomingEvents
            .filter((e) => !existingTitles.has(e.title))
            .map((e) => ({ ...e, readinessIndex: 0, completedStages: [] as PrepStage[] }));
          return { assessments: [...uniqueNew, ...state.assessments] };
        });
      },

      parseMaterialsToDrills: (assessmentId, rawText) => {
        const drills = parseDrillLines(rawText).map((d, idx) => ({
          id: `drill-${assessmentId}-${idx}`,
          prompt: d.prompt,
          answer: d.answer,
        }));

        set((state) => ({
          assessments: state.assessments.map((a) =>
            a.id === assessmentId ? { ...a, generatedDrills: drills, pastedMaterials: rawText } : a
          ),
        }));
      },

      appendMaterials: (assessmentId, additionalText) => {
        const target = get().assessments.find((a) => a.id === assessmentId);
        if (!target) return;
        const combined = `${target.pastedMaterials}\n${additionalText}`.trim();
        get().parseMaterialsToDrills(assessmentId, combined);
      },

      startStudySession: (assessmentId) => {
        set({
          activeSession: {
            assessmentId,
            elapsedSeconds: 0,
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

      completeStage: (assessmentId, stage, performanceScore) => {
        set((state) => {
          const target = state.assessments.find((a) => a.id === assessmentId);
          if (!target || target.completedStages.includes(stage)) return {};

          const completedStages = [...target.completedStages, stage];
          const readinessIndex = Math.min(100, completedStages.length * 25);
          const allDone = completedStages.length === PREP_STAGES.length;

          const hadSession = state.activeSession.assessmentId === assessmentId;
          let studyLogs = state.studyLogs;

          if (stage !== 'intake' && hadSession) {
            const course = REGISTERED_COURSES.find((c) => c.id === target.courseId);
            const stageMeta = PREP_STAGES.find((s) => s.id === stage);
            const newLog: StudySessionLog = {
              id: `log-${Date.now()}`,
              assessmentId,
              courseId: target.courseId,
              timestamp: new Date().toISOString(),
              durationMinutes: Math.max(1, Math.round(state.activeSession.elapsedSeconds / 60)),
              methodUsed: STAGE_METHOD_MAP[stage] ?? 'Active Recall Prompt',
              performanceScore: performanceScore ?? 0,
              summarySnippet: `${target.title} — ${stageMeta?.title ?? stage} (${course?.name ?? ''})`,
            };
            studyLogs = [newLog, ...state.studyLogs];
          }

          return {
            assessments: state.assessments.map((a) =>
              a.id === assessmentId
                ? { ...a, completedStages, readinessIndex, status: allDone ? 'Completed' : 'Studying' }
                : a
            ),
            studyLogs,
            activeSession:
              stage === 'intake' || !hadSession
                ? state.activeSession
                : { assessmentId: null, elapsedSeconds: 0, isRunning: false },
          };
        });
      },

      cancelSession: () => {
        set({ activeSession: { assessmentId: null, elapsedSeconds: 0, isRunning: false } });
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
      version: 2,
    }
  )
);
