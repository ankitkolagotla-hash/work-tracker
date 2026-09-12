export type AssessmentType = 'Quiz' | 'Test' | 'Exam' | 'Assignment';
export type AssessmentStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Archived';
export type AssessmentDifficulty = 'Easy' | 'Medium' | 'Hard';
export type StudyMethod = 'Notes Review' | 'Flashcard Drill' | 'MCQ Quiz' | 'Speed Drill' | 'Free Response';

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
  { id: 'ib-ee', name: 'IBDP Extended Essay', code: 'EE', color: '#94A3B8' },
];

// --- Study pack: the multi-format content generated from pasted materials ---

export interface DrillCard {
  id: string;
  prompt: string;
  answer: string;
}

export interface NotePoint {
  /** Bold anchor term, or empty string for a plain bullet with no anchor. */
  term: string;
  text: string;
}

export interface SynthesisNote {
  id: string;
  heading: string;
  points: NotePoint[];
}

export interface MCQQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface FreeResponsePrompt {
  id: string;
  prompt: string;
  marks: number | null;
  markscheme: string;
  keywordRubric: string[];
  exemplar: string;
  minWords: number;
}

export interface StudyPack {
  notes: SynthesisNote[];
  flashcards: DrillCard[];
  mcqs: MCQQuestion[];
  freeResponse: FreeResponsePrompt[];
}

// --- Study time & schedule planning ---

export type StudyPacing = '50m Ultradian' | '25m Pomodoro' | '15m Micro-Spam';

export const PACING_MINUTES: Record<StudyPacing, number> = {
  '50m Ultradian': 50,
  '25m Pomodoro': 25,
  '15m Micro-Spam': 15,
};

export const STUDY_PACING_OPTIONS: StudyPacing[] = ['50m Ultradian', '25m Pomodoro', '15m Micro-Spam'];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  courseId: string;
  unitsCovered: string[];
  dueDate: string;
  status: AssessmentStatus;
  difficulty: AssessmentDifficulty;
  points: number;
  actualScore?: number;
  readinessIndex: number;
  pastedMaterials: string;
  studyPack: StudyPack;
  totalPrepTimeMinutes: number;
  studySessionPacing: StudyPacing;
  targetStudyDays: DayOfWeek[];
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
