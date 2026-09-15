import { Assessment, AssessmentType, CourseRef, REGISTERED_COURSES } from '../types/assessment';
import { EMPTY_STUDY_PACK } from './studyGenerator';
import { classifyAssessmentType, extractAttachmentUrl } from './dashboardParse';
import { toDateOnly } from './date';

/**
 * Live Canvas calendar sync: server-side .ics parsing (called from
 * app/api/calendar-sync/route.ts, so it must stay dependency-free of any
 * browser-only APIs) plus the client-side reconciliation engine that
 * decides what's new and what's been submitted. No file import/export here
 * anymore — the feed is fetched live by URL.
 */

export interface ParsedCalendarEvent {
  title: string;
  type: AssessmentType;
  courseId: string;
  dueDateISO: string;
  points: number;
  description: string;
  attachmentUrl?: string;
}

/** Tag on `unitsCovered` marking an assessment as sourced from the live Canvas feed, so the sync engine never touches manually-created or pasted-in cards. */
export const CANVAS_SYNC_TAG = 'Canvas Calendar Sync';

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

function unescapeICSText(text: string): string {
  return text.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ').replace(/\\\\/g, '\\').trim();
}

/**
 * Minimal RFC 5545 VEVENT parser: pulls SUMMARY, DTSTART, and DESCRIPTION out
 * of each event block. No recurrence expansion, no timezone database — enough
 * to read most real-world exports (Canvas, Google Calendar, Apple Calendar).
 */
export function parseICSFeed(raw: string): ParsedCalendarEvent[] {
  const lines = unfoldLines(raw);
  const events: ParsedCalendarEvent[] = [];
  let inEvent = false;
  let summary = '';
  let description = '';
  let url = '';
  let dtstart: string | null = null;

  lines.forEach((line) => {
    if (/^BEGIN:VEVENT/i.test(line)) {
      inEvent = true;
      summary = '';
      description = '';
      url = '';
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
          description,
          attachmentUrl: url || extractAttachmentUrl(description),
        });
      }
      inEvent = false;
      return;
    }
    if (!inEvent) return;

    const summaryMatch = line.match(/^SUMMARY(?:;[^:]*)?:(.*)$/i);
    if (summaryMatch) {
      summary = unescapeICSText(summaryMatch[1]);
      return;
    }
    const descMatch = line.match(/^DESCRIPTION(?:;[^:]*)?:(.*)$/i);
    if (descMatch) {
      description = unescapeICSText(descMatch[1]);
      return;
    }
    const urlMatch = line.match(/^URL(?:;[^:]*)?:(.*)$/i);
    if (urlMatch) {
      url = unescapeICSText(urlMatch[1]);
      return;
    }
    const dtstartMatch = line.match(/^DTSTART(?:;[^:]*)?:(.*)$/i);
    if (dtstartMatch) {
      dtstart = parseICSDate(dtstartMatch[1].trim());
    }
  });

  return events;
}

function buildSyncedAssessment(event: ParsedCalendarEvent, idx: number): Assessment {
  return {
    id: `canvas-sync-${Date.now()}-${idx}`,
    title: event.title,
    type: event.type,
    courseId: event.courseId,
    unitsCovered: [CANVAS_SYNC_TAG],
    dueDate: event.dueDateISO,
    status: 'Upcoming',
    difficulty: 'Medium',
    points: event.points,
    readinessIndex: 0,
    pastedMaterials: event.description,
    studyPack: EMPTY_STUDY_PACK,
    totalPrepTimeMinutes: 60,
    studySessionPacing: '25m Pomodoro',
    targetStudyDays: [],
    attachmentUrl: event.attachmentUrl,
  };
}

export interface SyncReconciliation {
  /** Brand-new assessments to add — never a duplicate of an existing title. */
  newAssessments: Assessment[];
  /** IDs of existing, previously-synced assessments to flip to Completed. Nothing else about them is touched. */
  completedIds: string[];
}

/**
 * Cross-references a freshly-fetched feed against what's already tracked:
 *   - New titles become new assessments (tagged so future syncs recognize them).
 *   - A previously-synced assessment that has either dropped off the live
 *     feed or passed its due date is treated as submitted/handled — Canvas
 *     feeds typically stop surfacing an assignment once it's graded or past,
 *     so "gone from the feed" is the strongest completion signal available
 *     without a real submission API. This only ever flips `status` and
 *     `completedAt`; readinessIndex, studyPack, and everything else the
 *     student has built up stays exactly as it was.
 *   - Manually-created or pasted-in assessments (no CANVAS_SYNC_TAG) are
 *     never touched by this engine.
 */
export function reconcileCalendarSync(
  existingAssessments: Assessment[],
  feedEvents: ParsedCalendarEvent[],
  todayStr: string
): SyncReconciliation {
  const existingTitles = new Set(existingAssessments.map((a) => a.title));
  const feedTitles = new Set(feedEvents.map((e) => e.title));

  const newAssessments = feedEvents
    .filter((e) => !existingTitles.has(e.title))
    .map((e, idx) => buildSyncedAssessment(e, idx));

  const completedIds = existingAssessments
    .filter((a) => a.unitsCovered.includes(CANVAS_SYNC_TAG) && a.status !== 'Completed')
    .filter((a) => !feedTitles.has(a.title) || toDateOnly(a.dueDate) < todayStr)
    .map((a) => a.id);

  return { newAssessments, completedIds };
}
