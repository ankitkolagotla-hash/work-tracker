import { AssessmentType, CourseRef, REGISTERED_COURSES } from '../types/assessment';

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

interface DateMatch {
  iso: string;
  matchText: string;
}

function extractDate(line: string, fallbackYear: number): DateMatch | null {
  const slash = line.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const month = Number(slash[1]) - 1;
    const day = Number(slash[2]);
    let year = slash[3] ? Number(slash[3]) : fallbackYear;
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, month, day, 12));
    if (!Number.isNaN(d.getTime()) && month >= 0 && month < 12) {
      return { iso: d.toISOString(), matchText: slash[0] };
    }
  }

  const monthPattern = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
  const monthRegex = new RegExp(`\\b(${monthPattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`, 'i');
  const m = line.match(monthRegex);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = Number(m[2]);
    const year = m[3] ? Number(m[3]) : fallbackYear;
    const d = new Date(Date.UTC(year, month, day, 12));
    if (!Number.isNaN(d.getTime())) {
      return { iso: d.toISOString(), matchText: m[0] };
    }
  }

  return null;
}

function matchCourse(line: string): CourseRef | undefined {
  const lower = line.toLowerCase();
  return REGISTERED_COURSES.find((c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.code.toLowerCase()));
}

function guessType(line: string): AssessmentType {
  const lower = line.toLowerCase();
  if (lower.includes('exam')) return 'Exam';
  if (lower.includes('test')) return 'Test';
  if (lower.includes('quiz')) return 'Quiz';
  return 'Assignment';
}

function extractTitle(line: string, dateMatchText: string, course?: CourseRef): string {
  let cleaned = line.replace(dateMatchText, '');
  if (course) {
    cleaned = cleaned
      .replace(new RegExp(course.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
      .replace(new RegExp(course.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
  }
  cleaned = cleaned.replace(/\b(due|deadline)\b\s*:?/gi, '');
  cleaned = cleaned.replace(/[()]/g, ' ');
  cleaned = cleaned.replace(/^[\s\-–—:|•.]+|[\s\-–—:|•.]+$/g, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned || 'Untitled Assignment';
}

export interface ParsedScheduleItem {
  title: string;
  type: AssessmentType;
  courseId: string;
  dueDateISO: string;
}

/** Line-based heuristic parser for pasted Canvas dashboards, syllabi, or custom schedules. */
export function parseDashboardText(raw: string, fallbackYear = 2026): ParsedScheduleItem[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const items: ParsedScheduleItem[] = [];

  for (const line of lines) {
    const dateInfo = extractDate(line, fallbackYear);
    if (!dateInfo) continue;

    const course = matchCourse(line);
    const title = extractTitle(line, dateInfo.matchText, course);

    items.push({
      title,
      type: guessType(line),
      courseId: course?.id ?? REGISTERED_COURSES[5].id,
      dueDateISO: dateInfo.iso,
    });
  }

  return items;
}
