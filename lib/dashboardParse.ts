import { AssessmentType, CourseRef, REGISTERED_COURSES } from '../types/assessment';
import { BASELINE_DATE_STR, addDays } from './date';

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

const MONTH_PATTERN = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');

export interface ParsedScheduleItem {
  title: string;
  type: AssessmentType;
  courseId: string;
  dueDateISO: string;
  points: number;
}

/** Quiz / Test / Cumulative / Discussion / Annotate / Outline / Draft classification, per the house rules. */
export function classifyAssessmentType(text: string): AssessmentType {
  const lower = text.toLowerCase();
  if (lower.includes('quiz')) return 'Quiz';
  if (lower.includes('test') || lower.includes('cumulative')) return 'Test';
  if (lower.includes('discussion') || lower.includes('annotate') || lower.includes('outline') || lower.includes('draft')) {
    return 'Assignment';
  }
  return 'Assignment';
}

// ---------------------------------------------------------------------------
// Tier 1: structured Canvas dashboard/to-do list format —
//   "Today" / "Tomorrow, September 12" / "Monday, September 14" / "October 29"
//   "1. CREATIVE WRITING" / "2. IB ECONOMICS" / ... / "IBDP EXTENDED ESSAY"
//   <title line>
//   ASSIGNMENT | 10 pts
//   Due 10:00 AM
// ---------------------------------------------------------------------------

interface CourseHeaderRule {
  pattern: RegExp;
  courseId: string;
}

const COURSE_HEADER_RULES: CourseHeaderRule[] = [
  { pattern: /1\.\s*CREATIVE WRITING|LITERATURE\s*&?\s*CREATIVE WRITING/i, courseId: 'lit-cw' },
  { pattern: /2\.\s*IB ECONOMICS/i, courseId: 'ib-econ' },
  { pattern: /3\.\s*CIVICS/i, courseId: 'civics' },
  { pattern: /4\.\s*IB HL\s*2\s*MATH/i, courseId: 'ib-math-hl' },
  { pattern: /5\.\s*IB SL FRENCH/i, courseId: 'ib-french' },
  { pattern: /6\.\s*IB BIOLOGY/i, courseId: 'ib-bio' },
  // IBDP Extended Essay is no longer an independent course — any legacy Canvas
  // header for it maps to a Literature & Creative Writing assignment instead.
  { pattern: /IBDP EXTENDED ESSAY/i, courseId: 'lit-cw' },
];

function matchCourseHeader(line: string): string | null {
  const rule = COURSE_HEADER_RULES.find((r) => r.pattern.test(line));
  return rule ? rule.courseId : null;
}

const MONTH_DAY_RE = new RegExp(`^(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?$`, 'i');

function parseMonthDay(text: string, fallbackYear: number): string | null {
  const m = text.trim().match(MONTH_DAY_RE);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const day = Number(m[2]);
  const year = m[3] ? Number(m[3]) : fallbackYear;
  const d = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const WEEKDAY_RE = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*(.*)$/i;

/** Only matches a line that IS a date header in its entirety, to avoid false positives on titles. */
function extractHeaderDate(line: string, fallbackYear: number): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (/^today,?$/i.test(trimmed)) return BASELINE_DATE_STR;
  if (/^tomorrow,?$/i.test(trimmed)) return addDays(BASELINE_DATE_STR, 1);

  const todayWithDate = trimmed.match(/^today,?\s+(.+)$/i);
  if (todayWithDate) {
    const d = parseMonthDay(todayWithDate[1], fallbackYear);
    if (d) return d;
  }
  const tomorrowWithDate = trimmed.match(/^tomorrow,?\s+(.+)$/i);
  if (tomorrowWithDate) {
    const d = parseMonthDay(tomorrowWithDate[1], fallbackYear);
    if (d) return d;
  }

  const weekdayMatch = trimmed.match(WEEKDAY_RE);
  if (weekdayMatch && weekdayMatch[2]) {
    const d = parseMonthDay(weekdayMatch[2], fallbackYear);
    if (d) return d;
  }

  return parseMonthDay(trimmed, fallbackYear);
}

const RELATIVE_OR_WEEKDAY_ONLY = /^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday),?$/i;
const BARE_MONTH_DAY_ONLY = new RegExp(`^(${MONTH_PATTERN})\\.?\\s+\\d{1,2}(st|nd|rd|th)?,?$`, 'i');

/** Canvas often splits a header across two lines ("Today" then "September 11") — merge those. */
function normalizeHeaderLines(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (next && RELATIVE_OR_WEEKDAY_ONLY.test(line) && BARE_MONTH_DAY_ONLY.test(next)) {
      out.push(`${line} ${next}`);
      i++;
    } else {
      out.push(line);
    }
  }
  return out;
}

const POINTS_RE = /(\d+(?:\.\d+)?)\s*pts?\b/i;
const DUE_TIME_RE = /due\s+(\d{1,2}:\d{2}\s*[ap]m)/i;

// Only strips ASSIGNMENT/ANNOUNCEMENT/DISCUSSION (never QUIZ — it's often a real word in the
// title itself, e.g. "Ch 1: Quiz") and only when it's a genuine trailing "TAG | N pts" marker
// on the same line, never when the word is organically part of the title (e.g. "... Discussion").
const TITLE_TAG_STRIP_RE = /\s*\b(ASSIGNMENT|ANNOUNCEMENT|DISCUSSION)\b\s*\|\s*\d+(?:\.\d+)?\s*pts?\b\s*$/i;

function combineDateAndTime(dateStr: string, timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  let hour = 23;
  let minute = 59;
  if (match) {
    hour = Number(match[1]) % 12;
    minute = Number(match[2]);
    if (match[3].toUpperCase() === 'PM') hour += 12;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour, minute)).toISOString();
}

function parseCanvasStructuredText(raw: string, fallbackYear: number): ParsedScheduleItem[] {
  const rawLines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const lines = normalizeHeaderLines(rawLines);

  const items: ParsedScheduleItem[] = [];
  let currentDate: string | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const headerDate = extractHeaderDate(line, fallbackYear);
    if (headerDate) {
      currentDate = headerDate;
      i++;
      continue;
    }

    const courseId = matchCourseHeader(line);
    if (courseId) {
      const blockLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !matchCourseHeader(lines[j]) && !extractHeaderDate(lines[j], fallbackYear)) {
        blockLines.push(lines[j]);
        j++;
      }

      if (blockLines.length > 0 && currentDate) {
        const title = blockLines[0]
          .replace(TITLE_TAG_STRIP_RE, '')
          .replace(/\s{2,}/g, ' ')
          .replace(/^[\s\-–—:|•.]+|[\s\-–—:|•.]+$/g, '')
          .trim() || 'Untitled Assignment';

        const blockText = blockLines.join(' ');
        const pointsMatch = blockText.match(POINTS_RE);
        const points = pointsMatch ? Math.round(Number(pointsMatch[1])) : 0;

        const dueMatch = blockText.match(DUE_TIME_RE);
        const dueDateISO = combineDateAndTime(currentDate, dueMatch ? dueMatch[1] : '11:59 PM');

        items.push({
          title,
          type: classifyAssessmentType(`${blockText} ${title}`),
          courseId,
          dueDateISO,
          points,
        });
      }

      i = j;
      continue;
    }

    i++;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Tier 2: freeform fallback — a single line per item, e.g. a custom schedule
// or weekly syllabus dump: "IB Biology — Cell Membrane Lab Report — Due Sep 16"
// ---------------------------------------------------------------------------

interface InlineDateMatch {
  iso: string;
  matchText: string;
}

function extractInlineDate(line: string, fallbackYear: number): InlineDateMatch | null {
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

  const monthRegex = new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`, 'i');
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

function matchInlineCourse(line: string): CourseRef | undefined {
  const lower = line.toLowerCase();
  return REGISTERED_COURSES.find((c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.code.toLowerCase()));
}

function extractInlineTitle(line: string, dateMatchText: string, course?: CourseRef): string {
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

function parseFreeformLines(raw: string, fallbackYear: number): ParsedScheduleItem[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3);

  const items: ParsedScheduleItem[] = [];

  for (const line of lines) {
    const dateInfo = extractInlineDate(line, fallbackYear);
    if (!dateInfo) continue;

    const course = matchInlineCourse(line);
    const title = extractInlineTitle(line, dateInfo.matchText, course);
    const pointsMatch = line.match(POINTS_RE);

    items.push({
      title,
      type: classifyAssessmentType(line),
      courseId: course?.id ?? REGISTERED_COURSES.find((c) => c.id === 'ib-bio')!.id,
      dueDateISO: dateInfo.iso,
      points: pointsMatch ? Math.round(Number(pointsMatch[1])) : 10,
    });
  }

  return items;
}

/**
 * Line-based parser for pasted Canvas dashboards, syllabi, or custom schedules.
 * Tries the structured Canvas to-do format first; falls back to single-line
 * freeform matching when nothing structured is found.
 */
export function parseDashboardText(raw: string, fallbackYear = 2026): ParsedScheduleItem[] {
  const structured = parseCanvasStructuredText(raw, fallbackYear);
  if (structured.length > 0) return structured;
  return parseFreeformLines(raw, fallbackYear);
}
