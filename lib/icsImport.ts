import { AssessmentType, CourseRef, REGISTERED_COURSES } from '../types/assessment';
import { classifyAssessmentType } from './dashboardParse';

export interface ParsedICSEvent {
  title: string;
  type: AssessmentType;
  courseId: string;
  dueDateISO: string;
  points: number;
}

function parseICSDate(value: string): string | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?Z?$/);
  if (!m) return null;
  const [, y, mo, d, h = '23', mi = '59', s = '00'] = m;
  const ts = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  if (Number.isNaN(ts)) return null;
  return new Date(ts).toISOString();
}

function matchCourse(title: string): CourseRef | undefined {
  const lower = title.toLowerCase();
  return REGISTERED_COURSES.find((c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.code.toLowerCase()));
}

/** Unfolds RFC 5545 line continuations — a line starting with a space/tab extends the previous line. */
function unfoldLines(raw: string): string[] {
  const rawLines = raw.split(/\r\n|\n|\r/);
  const unfolded: string[] = [];
  rawLines.forEach((line) => {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  });
  return unfolded;
}

/**
 * Minimal RFC 5545 VEVENT parser: pulls SUMMARY + DTSTART out of each event
 * block. No recurrence expansion, no timezone database — enough to round-trip
 * calendars this app itself exports, and to read SUMMARY/DTSTART out of most
 * real-world exports (Canvas, Google Calendar, Apple Calendar).
 */
export function parseICSFile(raw: string): ParsedICSEvent[] {
  const lines = unfoldLines(raw);
  const events: ParsedICSEvent[] = [];
  let inEvent = false;
  let summary = '';
  let dtstart: string | null = null;

  lines.forEach((line) => {
    if (/^BEGIN:VEVENT/i.test(line)) {
      inEvent = true;
      summary = '';
      dtstart = null;
      return;
    }
    if (/^END:VEVENT/i.test(line)) {
      if (inEvent && summary && dtstart) {
        const cleanTitle = summary.replace(/^due:\s*/i, '').trim();
        const course = matchCourse(cleanTitle);
        events.push({
          title: cleanTitle,
          type: classifyAssessmentType(cleanTitle),
          courseId: course?.id ?? REGISTERED_COURSES[5].id,
          dueDateISO: dtstart,
          points: 0,
        });
      }
      inEvent = false;
      return;
    }
    if (!inEvent) return;

    const summaryMatch = line.match(/^SUMMARY(?:;[^:]*)?:(.*)$/i);
    if (summaryMatch) {
      summary = summaryMatch[1].replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ').trim();
      return;
    }
    const dtstartMatch = line.match(/^DTSTART(?:;[^:]*)?:(.*)$/i);
    if (dtstartMatch) {
      dtstart = parseICSDate(dtstartMatch[1].trim());
    }
  });

  return events;
}
