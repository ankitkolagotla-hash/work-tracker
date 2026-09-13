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

export type ACTRootCause = 'Content Gap' | 'Pacing Panic' | 'Misread Stem' | 'Trap Answer';
export const ACT_ROOT_CAUSES: ACTRootCause[] = ['Content Gap', 'Pacing Panic', 'Misread Stem', 'Trap Answer'];

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

// --- ACT study hours & section log ---

export type ACTLogSection = ACTSection | 'Full Mock';
export const ACT_LOG_SECTIONS: ACTLogSection[] = ['English', 'Math', 'Reading', 'Science', 'Full Mock'];

export const ACT_TARGET_PREP_HOURS = 120;

export interface ACTSectionSession {
  id: string;
  date: string;
  section: ACTLogSection;
  minutesSpent: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

// --- ACT image/OCR intake grading ---

export interface ACTGradedItem {
  questionNumber: number;
  selectedAnswer: string;
  correctAnswer: string | null;
  isCorrect: boolean | null;
}

// --- Official standard pacing (metronome) ---

export interface ACTSectionPacing {
  section: ACTSection;
  questions: number;
  minutes: number;
  secondsPerQuestion: number;
}

export const ACT_SECTION_PACING: ACTSectionPacing[] = [
  { section: 'English', questions: 50, minutes: 35, secondsPerQuestion: 42 },
  { section: 'Math', questions: 45, minutes: 50, secondsPerQuestion: 67 },
  { section: 'Reading', questions: 36, minutes: 40, secondsPerQuestion: 67 },
  { section: 'Science', questions: 40, minutes: 40, secondsPerQuestion: 60 },
];

export const SECTION_REMEDIATION_TIPS: Record<ACTSection, string> = {
  English: 'Review comma usage, sentence boundaries, and rhetorical-skills questions (relevance, transitions).',
  Math: 'Re-derive the problem from scratch — check for sign errors, a misapplied formula, or a skipped units step.',
  Reading: 'Return to the cited line reference; the correct answer is almost always directly supported by the text, not inferred.',
  Science: 'Check whether the question asks about a specific figure/table vs. the general trend — mismatches here are the most common trap.',
};

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
  teamResult: string;
  selfRating: 1 | 2 | 3 | 4 | 5;
}

export const HIGHLIGHT_SKILLS = [
  'Distribution / Long Passing',
  'Transition Defense',
  'Tactical Positioning',
  'Set Pieces',
  'Leadership / Communication',
] as const;
export type HighlightSkill = (typeof HIGHLIGHT_SKILLS)[number];

/** Where a clip lands in the adaptive 3-part recruiting tape structure. */
export type ReelSegment = 'Hook' | 'Core Skill Isolation' | 'High-Pressure Sequences';

export interface HighlightClip {
  id: string;
  matchName: string;
  opponent: string;
  timestampStart: string;
  timestampEnd: string;
  clipUrl: string;
  skillsShown: HighlightSkill[];
  notes: string;
}

/** College Coach Communication CRM pipeline stages. */
export type CoachPipelineStage = 'Prospecting' | 'Initial Email Sent' | 'Film Sent' | 'Campus Visit' | 'Offer / Closing';
export const COACH_PIPELINE_STAGES: CoachPipelineStage[] = [
  'Prospecting',
  'Initial Email Sent',
  'Film Sent',
  'Campus Visit',
  'Offer / Closing',
];

export interface CoachContact {
  id: string;
  schoolName: string;
  coachName: string;
  email: string;
  status: CoachPipelineStage;
  lastContactDate: string | null;
  tapeSentDate: string | null;
  nextFollowUpDate: string | null;
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

export type ColdEmailCategory = 'Socioeconomic Inequality Research' | 'Urban Heat Islands' | 'Public Policy Research' | 'Custom';

export type EmailFormalityTone = 'Inquiring' | 'Assertive';
export type EmailRegisterTone = 'Scholarly' | 'Academic';

export interface ColdEmailBuilderInput {
  category: ColdEmailCategory;
  customTopic: string;
  professorName: string;
  university: string;
  paperFocus: string;
  studentAngle: string;
  formalityTone: EmailFormalityTone;
  registerTone: EmailRegisterTone;
}

// --- University Fit & Recommendation Engine ---

export type CampusSize = 'Small' | 'Medium' | 'Large';
export type LocationVibe = 'Urban' | 'Suburban' | 'Rural';
export type SelectivityTier = 'Extreme Reach' | 'Reach' | 'Target' | 'Safety';

export interface UniversityProfile {
  id: string;
  name: string;
  acceptanceRatePct: number;
  campusSize: CampusSize;
  locationVibe: LocationVibe;
  strongMajors: string[];
  essayRequirements: string[];
}

export interface UniversityFitPreferences {
  targetMajors: string[];
  campusSize: CampusSize | 'No Preference';
  locationVibe: LocationVibe | 'No Preference';
  selectivityTier: SelectivityTier | 'No Preference';
}

export interface UniversityMatch {
  university: UniversityProfile;
  tier: SelectivityTier;
  matchScore: number;
}

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

// --- Brutal Admissions Evaluator: student profile & red-flag evaluation ---

export type IBLevel = 'HL' | 'SL';

export interface IBCourseEntry {
  name: string;
  level: IBLevel;
}

export interface ExtracurricularEntry {
  description: string;
  impactLevel: 1 | 2 | 3 | 4 | 5;
}

export interface StudentProfile {
  unweightedGPA: number;
  weightedGPA: number;
  ibCourses: IBCourseEntry[];
  actComposite: number;
  topExtracurriculars: ExtracurricularEntry[];
}

export interface AdmissionsEvaluation {
  universityId: string;
  tier: SelectivityTier;
  chancePct: number;
  redFlags: string[];
}

// --- Common App activity description optimizer ---

export interface CommonAppActivityEntry {
  id: string;
  rawText: string;
  optimizedText: string;
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
  {
    id: 'tmpl-custom',
    category: 'Custom',
    subject: 'Prospective student interest in your research on {{TOPIC}}',
    body: `Dear Professor {{PROFESSOR_NAME}},

My name is {{YOUR_NAME}}, a high school student researching {{TOPIC}} for an independent project. Your work, {{PAPER_TITLE}}, shaped how I'm thinking about {{SPECIFIC_FINDING}}.

I'm exploring {{YOUR_RESEARCH_QUESTION}} and would value your perspective on {{SPECIFIC_QUESTION}}. Would you be open to a brief 15-minute call, or could you point me toward foundational readings in this area?

Thank you for considering this — I know your time is limited.

Best,
{{YOUR_NAME}}`,
  },
];
