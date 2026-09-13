import { Assessment } from '../types/assessment';
import { ACTMockExam } from '../types/lifeOs';
import { addDays, dateStrToTimestamp, toDateOnly } from './date';

/**
 * Builds a standard .ics (RFC 5545) calendar file covering assessment due
 * dates, ACT mock exams, and a suggested prep-block the evening before each
 * assessment. Deterministic string generation — no external calendar library
 * needed for a feed this small.
 */

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Formats a date + time-of-day as a UTC .ics DATE-TIME stamp: YYYYMMDDTHHMMSSZ */
function toICSDateTime(dateStr: string, hour: number, minute: number): string {
  const ts = dateStrToTimestamp(dateStr) + hour * 3600000 + minute * 60000;
  const d = new Date(ts);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

interface ICSEvent {
  uid: string;
  start: string;
  end: string;
  summary: string;
  description?: string;
}

function buildVEvent(e: ICSEvent): string {
  return [
    'BEGIN:VEVENT',
    `UID:${e.uid}@chronoflow-os`,
    `DTSTAMP:${toICSDateTime(new Date().toISOString().slice(0, 10), 0, 0)}`,
    `DTSTART:${e.start}`,
    `DTEND:${e.end}`,
    `SUMMARY:${escapeICSText(e.summary)}`,
    e.description ? `DESCRIPTION:${escapeICSText(e.description)}` : null,
    'END:VEVENT',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function parseMockExamTime(scheduledTime: string): { hour: number; minute: number } {
  const match = scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hour: 8, minute: 0 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (/PM/i.test(match[3]) && hour !== 12) hour += 12;
  if (/AM/i.test(match[3]) && hour === 12) hour = 0;
  return { hour, minute };
}

export function buildICSCalendar(assessments: Assessment[], actMockExams: ACTMockExam[]): string {
  const events: ICSEvent[] = [];

  assessments.forEach((a) => {
    const dateStr = toDateOnly(a.dueDate);
    const dueDate = new Date(a.dueDate);
    const hour = dueDate.getUTCHours();
    const minute = dueDate.getUTCMinutes();
    events.push({
      uid: `assessment-${a.id}`,
      start: toICSDateTime(dateStr, hour, minute),
      end: toICSDateTime(dateStr, hour, minute + 30),
      summary: `Due: ${a.title}`,
      description: `${a.type} — course ${a.courseId}`,
    });

    // Suggested prep block the evening before, honestly labeled as a
    // heuristic suggestion rather than the literal 50/10 schedule.
    const prepDay = addDays(dateStr, -1);
    events.push({
      uid: `prep-${a.id}`,
      start: toICSDateTime(prepDay, 16, 0),
      end: toICSDateTime(prepDay, 17, 0),
      summary: `Suggested prep block: ${a.title}`,
      description: 'Auto-suggested study block — adjust to fit your real schedule.',
    });
  });

  actMockExams.forEach((exam) => {
    const { hour, minute } = parseMockExamTime(exam.scheduledTime);
    const totalMinutes = exam.sectionSplits.reduce((acc, s) => acc + s.minutes, 0);
    const endMinuteOfDay = hour * 60 + minute + totalMinutes;
    events.push({
      uid: `mock-${exam.id}`,
      start: toICSDateTime(exam.date, hour, minute),
      end: toICSDateTime(exam.date, Math.floor(endMinuteOfDay / 60), endMinuteOfDay % 60),
      summary: 'ACT Full-Length Mock Exam',
      description: exam.sectionSplits.map((s) => `${s.section}: ${s.minutes}m`).join(', '),
    });
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronoFlow OS//Study Calendar//EN',
    'CALSCALE:GREGORIAN',
    ...events.map(buildVEvent),
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(assessments: Assessment[], actMockExams: ACTMockExam[]): void {
  const ics = buildICSCalendar(assessments, actMockExams);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chronoflow-study-calendar.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
