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
  { id: 'ib-bio', name: 'IB Biology HL', code: 'BIO-HL', color: '#10B981' },
  { id: 'ib-math-hl', name: 'IB HL 2 Math', code: 'MATH-HL2', color: '#6366F1' },
  { id: 'ib-econ', name: 'IB Economics SL', code: 'ECON-SL', color: '#0EA5E9' },
  { id: 'ib-bus', name: 'IB Business Management', code: 'BUS-HL', color: '#F59E0B' },
  { id: 'ib-french', name: 'IB SL French', code: 'FR-SL', color: '#8B5CF6' },
  { id: 'civics', name: 'Civics', code: 'CIV-S1', color: '#EAB308' },
  { id: 'lit-cw', name: 'Literature & Creative Writing', code: 'LIT-CW', color: '#EC4899' },
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

/** One optional pick inside a "pick N of M" consolidated task (e.g. IB Biology's weekly A&B activity). */
export interface ChecklistOption {
  id: string;
  label: string;
  done: boolean;
}

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  courseId: string;
  unitsCovered: string[];
  dueDate: string;
  status: AssessmentStatus;
  /** Set the moment a task is marked Completed (virtual system date, not raw device clock) — powers daily completion analytics. */
  completedAt?: string | null;
  difficulty: AssessmentDifficulty;
  points: number;
  actualScore?: number;
  readinessIndex: number;
  pastedMaterials: string;
  studyPack: StudyPack;
  totalPrepTimeMinutes: number;
  studySessionPacing: StudyPacing;
  targetStudyDays: DayOfWeek[];
  /** Optional "pick N of M" checklist for a consolidated task (e.g. Biology's weekly A&B activity). */
  checklist?: ChecklistOption[];
  checklistPickLimit?: number;
  /** A downloadable Canvas document/worksheet link discovered during import, if any. */
  attachmentUrl?: string;
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

/** A flashcard/MCQ item missed during a Smart Intake drill, captured for mandatory follow-up review. */
export interface NeedsReviewItem {
  id: string;
  assessmentId: string;
  courseId: string;
  prompt: string;
  answer: string;
  addedAt: string;
}
