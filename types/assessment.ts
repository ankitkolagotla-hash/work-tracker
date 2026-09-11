export type AssessmentType = 'Quiz' | 'Test' | 'Exam' | 'Assignment';
export type AssessmentStatus = 'Upcoming' | 'Studying' | 'Completed';
export type StudyMethod =
  | 'Flashcard Drill'
  | 'Active Recall Prompt'
  | 'Diagnostic Quiz'
  | 'Case Study Mock';

export interface CourseRef {
  id: string;
  name: string;
  code: string;
  color: string;
}

export const REGISTERED_COURSES: CourseRef[] = [
  { id: 'cw', name: 'Creative Writing', code: 'CW-S1', color: '#F472B6' },
  { id: 'ib-econ', name: 'IB Economics', code: 'ECON-S1', color: '#38BDF8' },
  { id: 'civics', name: 'Civics', code: 'CIV-S1', color: '#FBBF24' },
  { id: 'ib-math-hl', name: 'IB HL 2 Math', code: 'MATH-HL2', color: '#818CF8' },
  { id: 'ib-french-sl', name: 'IB SL French', code: 'FR-SL', color: '#A78BFA' },
  { id: 'ib-bio', name: 'IB Biology', code: 'BIO-HL', color: '#34D399' },
  { id: 'ib-bus', name: 'IB Business', code: 'BUS-HL', color: '#FB923C' },
];

export interface DrillCard {
  id: string;
  prompt: string;
  answer: string;
  confidenceScore?: 1 | 2 | 3;
}

/**
 * The four-stage mastery progression every assessment moves through.
 * Readiness only advances on stage completion, never on individual card interactions.
 */
export type PrepStage = 'intake' | 'review' | 'diagnostic' | 'mastery';

export interface StageMeta {
  id: PrepStage;
  order: number;
  title: string;
  shortLabel: string;
  description: string;
  weight: number;
}

export const PREP_STAGES: StageMeta[] = [
  {
    id: 'intake',
    order: 1,
    title: 'Note Intake & Structural Encoding',
    shortLabel: 'Intake',
    description: 'Validate source materials and encode key concepts into structured prep modules.',
    weight: 25,
  },
  {
    id: 'review',
    order: 2,
    title: 'Deep Note Review & Two-Column Recall',
    shortLabel: 'Review',
    description: 'Work through masked term/definition pairs to reinforce initial encoding.',
    weight: 25,
  },
  {
    id: 'diagnostic',
    order: 3,
    title: 'Diagnostic Drill & Quizzing',
    shortLabel: 'Diagnostic',
    description: 'Timed, multi-question active testing to surface weak concepts.',
    weight: 25,
  },
  {
    id: 'mastery',
    order: 4,
    title: 'Mastery Exam Simulation',
    shortLabel: 'Mastery',
    description: 'Full-length, exam-conditions recall simulation.',
    weight: 25,
  },
];

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  courseId: string;
  unitsCovered: string[];
  dueDate: string;
  status: AssessmentStatus;
  points: number;
  actualScore?: number;
  readinessIndex: number;
  pastedMaterials: string;
  generatedDrills: DrillCard[];
  completedStages: PrepStage[];
}

export interface StudySessionLog {
  id: string;
  assessmentId: string;
  courseId: string;
  timestamp: string;
  durationMinutes: number;
  methodUsed: StudyMethod;
  performanceScore: number;
  summarySnippet: string;
}
