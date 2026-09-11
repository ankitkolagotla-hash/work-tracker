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
