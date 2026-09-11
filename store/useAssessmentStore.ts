import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Assessment, StudySessionLog, DrillCard, REGISTERED_COURSES } from '../types/assessment';

interface AssessmentState {
  assessments: Assessment[];
  studyLogs: StudySessionLog[];
  activeSession: {
    assessmentId: string | null;
    elapsedSeconds: number;
    isRunning: boolean;
  };
  canvasFeedUrl: string;

  addAssessment: (data: Omit<Assessment, 'id' | 'readinessIndex' | 'generatedDrills'>) => void;
  importCanvasEvents: (events: Assessment[]) => void;
  parseMaterialsToDrills: (assessmentId: string, rawText: string) => void;
  startStudySession: (assessmentId: string) => void;
  tickTimer: () => void;
  stopStudySession: (performanceScore: number, method: StudySessionLog['methodUsed']) => void;
  deleteAssessment: (id: string) => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      canvasFeedUrl:
        'https://issaquah.instructure.com/feeds/calendars/user_QeloAEpfBFMRDzKfi2PNj6w6C236vTQofVfALMl0.ics',
      assessments: [
        {
          id: 'init-bio-1',
          title: 'Science of Biology Unit Quiz',
          type: 'Quiz',
          courseId: 'ib-bio',
          unitsCovered: ['Mechanisms of Learning', 'Emergence', 'Taxonomy'],
          dueDate: '2026-09-14T09:00:00.000Z',
          status: 'Studying',
          points: 35,
          readinessIndex: 65,
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
        },
      ],
      studyLogs: [
        {
          id: 'log-1',
          assessmentId: 'init-bio-1',
          courseId: 'ib-bio',
          timestamp: '2026-09-10T20:00:00.000Z',
          durationMinutes: 50,
          methodUsed: 'Active Recall Prompt',
          performanceScore: 85,
          summarySnippet: 'Science of Biology Unit Quiz (IB Biology)',
        },
      ],
      activeSession: {
        assessmentId: null,
        elapsedSeconds: 0,
        isRunning: false,
      },

      addAssessment: (data) => {
        const newId = `asym-${Date.now()}`;
        const newAssessment: Assessment = {
          ...data,
          id: newId,
          readinessIndex: 0,
          generatedDrills: [],
        };
        set((state) => ({ assessments: [newAssessment, ...state.assessments] }));
        get().parseMaterialsToDrills(newId, data.pastedMaterials);
      },

      importCanvasEvents: (incomingEvents) => {
        set((state) => {
          const existingTitles = new Set(state.assessments.map((a) => a.title));
          const uniqueNew = incomingEvents.filter((e) => !existingTitles.has(e.title));
          return { assessments: [...uniqueNew, ...state.assessments] };
        });
      },

      parseMaterialsToDrills: (assessmentId, rawText) => {
        const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
        const drills: DrillCard[] = [];

        lines.forEach((line, idx) => {
          if (line.includes(':')) {
            const [p, ...rest] = line.split(':');
            drills.push({ id: `drill-${idx}`, prompt: p.trim(), answer: rest.join(':').trim() });
          } else if (line.includes(' - ')) {
            const [p, ...rest] = line.split(' - ');
            drills.push({ id: `drill-${idx}`, prompt: p.trim(), answer: rest.join(' - ').trim() });
          }
        });

        set((state) => ({
          assessments: state.assessments.map((a) =>
            a.id === assessmentId ? { ...a, generatedDrills: drills, pastedMaterials: rawText } : a
          ),
        }));
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

      stopStudySession: (performanceScore, method) => {
        const { activeSession, assessments } = get();
        if (!activeSession.assessmentId) return;

        const target = assessments.find((a) => a.id === activeSession.assessmentId);
        if (!target) return;

        const sessionDurationMins = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));
        const course = REGISTERED_COURSES.find((c) => c.id === target.courseId);

        const newLog: StudySessionLog = {
          id: `log-${Date.now()}`,
          assessmentId: target.id,
          courseId: target.courseId,
          timestamp: new Date().toISOString(),
          durationMinutes: sessionDurationMins,
          methodUsed: method,
          performanceScore,
          summarySnippet: `${target.title} (${course?.name})`,
        };

        const updatedReadiness = Math.min(
          100,
          Math.round(target.readinessIndex * 0.5 + performanceScore * 0.5)
        );

        set((state) => ({
          studyLogs: [newLog, ...state.studyLogs],
          assessments: state.assessments.map((a) =>
            a.id === target.id ? { ...a, readinessIndex: updatedReadiness, status: 'Studying' } : a
          ),
          activeSession: { assessmentId: null, elapsedSeconds: 0, isRunning: false },
        }));
      },

      deleteAssessment: (id) => {
        set((state) => ({
          assessments: state.assessments.filter((a) => a.id !== id),
        }));
      },
    }),
    {
      name: 'chronoflow-store',
    }
  )
);
