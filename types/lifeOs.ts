// ChronoFlow OS — Life OS extension types: ACT prep, athletics/recruiting, and
// college admissions/outreach. Academic assessments, study packs, theme, and
// audio remain in types/assessment.ts, store/useThemeStore.ts, and
// store/useFocusStore.ts — this file only covers the genuinely new domains.

import { CourseRef } from './assessment';

// --- Course workflow classification ---

export type CourseWorkflow = 'DeepStudy' | 'ExecutiveReview';

/** STEM courses get the high-depth DeepStudy workflow; humanities get ExecutiveReview. */
export const COURSE_WORKFLOWS: Record<string, CourseWorkflow> = {
  'ib-math-hl': 'DeepStudy',
  'ib-bio': 'DeepStudy',
  'ib-ee': 'DeepStudy',
  'ib-econ': 'ExecutiveReview',
  'ib-bus': 'ExecutiveReview',
  civics: 'ExecutiveReview',
  cw: 'ExecutiveReview',
  'ib-french-sl': 'ExecutiveReview',
};

export function getCourseWorkflow(courseId: string): CourseWorkflow {
  return COURSE_WORKFLOWS[courseId] ?? 'ExecutiveReview';
}

export function filterCoursesByWorkflow(courses: CourseRef[], workflow: CourseWorkflow): CourseRef[] {
  return courses.filter((c) => getCourseWorkflow(c.id) === workflow);
}

// ---------------------------------------------------------------------------
// ACT Intensive Mastery Station
// ---------------------------------------------------------------------------

export const ACT_TARGET_DATE = '2026-10-17';

export type ACTSection = 'English' | 'Math' | 'Reading' | 'Science';
export const ACT_SECTIONS: ACTSection[] = ['English', 'Math', 'Reading', 'Science'];

export interface ACTSectionScore {
  section: ACTSection;
  target: number;
  current: number;
}

export type ACTRootCause = 'Content Gap' | 'Time Pressure' | 'Misread Stem' | 'Trap Answer';
export const ACT_ROOT_CAUSES: ACTRootCause[] = ['Content Gap', 'Time Pressure', 'Misread Stem', 'Trap Answer'];

export interface ACTErrorLogEntry {
  id: string;
  testDate: string;
  section: ACTSection;
  questionType: string;
  rootCause: ACTRootCause;
  notes: string;
}

export interface ACTDrillQuestion {
  id: string;
  questionType: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface ACTMockExam {
  id: string;
  date: string;
  scheduledTime: string;
  sectionSplits: { section: ACTSection; minutes: number }[];
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Athletics, Recruiting & Performance Hub
// ---------------------------------------------------------------------------

export interface MatchLog {
  id: string;
  date: string;
  opponent: string;
  competition: string;
  minutesPlayed: number;
  position: string;
  tacticalNotes: string;
  filmReviewed: boolean;
}

export const HIGHLIGHT_SKILLS = [
  'Distribution',
  'Transitional Defending',
  'Set Pieces',
  'Ball Progression',
  '1v1 Defending',
  'Aerial Duels',
] as const;
export type HighlightSkill = (typeof HIGHLIGHT_SKILLS)[number];

export interface HighlightClip {
  id: string;
  matchId?: string;
  timestamp: string;
  clipUrl: string;
  skillsShown: HighlightSkill[];
  notes: string;
}

export type CoachContactStatus = 'Not Contacted' | 'Emailed' | 'Responded' | 'Following Up' | 'No Response';

export interface CoachContact {
  id: string;
  schoolName: string;
  coachName: string;
  email: string;
  status: CoachContactStatus;
  lastContactDate: string | null;
  notes: string;
}

export type TrainingSessionType = 'Strength' | 'Conditioning' | 'Technical' | 'Recovery';

export interface TrainingLog {
  id: string;
  date: string;
  sessionType: TrainingSessionType;
  durationMinutes: number;
  sorenessLevel: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  notes: string;
}

// ---------------------------------------------------------------------------
// College Admissions, Outreach & Strategy Hub
// ---------------------------------------------------------------------------

export type DeadlineCategory = 'ED' | 'EA' | 'RD' | 'Rolling';
export const DEADLINE_CATEGORIES: DeadlineCategory[] = ['ED', 'EA', 'RD', 'Rolling'];

export type UniversityStatus = 'Researching' | 'Essays In Progress' | 'Submitted' | 'Decision Received';

export interface TargetUniversity {
  id: string;
  name: string;
  deadlineCategory: DeadlineCategory;
  deadlineDate: string;
  status: UniversityStatus;
  notes: string;
}

export type EssayStatus = 'Not Started' | 'Brainstorming' | 'Drafting' | 'Final';

export interface SupplementalEssay {
  id: string;
  universityId: string;
  prompt: string;
  wordLimit: number;
  draft: string;
  status: EssayStatus;
}

export type ColdEmailCategory = 'Socioeconomic Inequality Research' | 'Urban Heat Islands' | 'Public Policy Research';

export interface ColdEmailTemplate {
  id: string;
  category: ColdEmailCategory;
  subject: string;
  body: string;
}

export type ColdEmailStatus = 'Draft' | 'Sent' | 'Replied' | 'No Response';

export interface ColdEmailLog {
  id: string;
  templateId: string;
  recipientName: string;
  institution: string;
  sentDate: string | null;
  status: ColdEmailStatus;
}

export type AdvocacyDraftType = 'Recommendation Request' | 'Contextual Framing' | 'Medical Justification';

export interface AdvocacyDraft {
  id: string;
  type: AdvocacyDraftType;
  title: string;
  content: string;
  updatedAt: string;
}

export const COLD_EMAIL_TEMPLATES: ColdEmailTemplate[] = [
  {
    id: 'tmpl-socioeconomic',
    category: 'Socioeconomic Inequality Research',
    subject: 'Prospective student interest in your research on socioeconomic inequality',
    body: `Dear Professor {{PROFESSOR_NAME}},

My name is {{YOUR_NAME}}, a high school student researching socioeconomic inequality for an independent project. I came across your work, {{PAPER_TITLE}}, and found your analysis of {{SPECIFIC_FINDING}} especially clarifying.

I'm exploring {{YOUR_RESEARCH_QUESTION}} and would value your perspective on {{SPECIFIC_QUESTION}}. Would you be open to a brief 15-minute call, or could you point me toward foundational readings in this area?

Thank you for considering this — I know your time is limited.

Best,
{{YOUR_NAME}}`,
  },
  {
    id: 'tmpl-urban-heat',
    category: 'Urban Heat Islands',
    subject: 'Question about urban heat island research for a student project',
    body: `Dear Professor {{PROFESSOR_NAME}},

I'm {{YOUR_NAME}}, a high school student studying urban heat islands and their disproportionate impact on under-resourced neighborhoods. Your paper, {{PAPER_TITLE}}, shaped how I'm thinking about {{SPECIFIC_FINDING}}.

I'm currently investigating {{YOUR_RESEARCH_QUESTION}}. If you have a moment, I'd appreciate your thoughts on {{SPECIFIC_QUESTION}}, or a pointer to data sources you'd recommend.

Thank you for your time and for the work you do.

Best,
{{YOUR_NAME}}`,
  },
  {
    id: 'tmpl-public-policy',
    category: 'Public Policy Research',
    subject: 'Student researcher seeking guidance on public policy research',
    body: `Dear Professor {{PROFESSOR_NAME}},

My name is {{YOUR_NAME}}, and I'm a high school student researching {{YOUR_RESEARCH_QUESTION}} as part of an independent policy project. Your work on {{PAPER_TITLE}} directly informed my thinking on {{SPECIFIC_FINDING}}.

Would you be willing to share your perspective on {{SPECIFIC_QUESTION}}? I'd be glad to work around your schedule for even a short call.

Thank you for considering my request.

Best,
{{YOUR_NAME}}`,
  },
];
