import { Assessment, PACING_MINUTES } from '../types/assessment';
import { addDays, dateStrToTimestamp, formatShortDate, toDateOnly } from './date';

export interface StudyRoadmapDay {
  date: string;
  label: string;
  focusBlocks: number;
}

export interface StudyRoadmap {
  daysUntilDue: number;
  sessionDates: StudyRoadmapDay[];
  eveningRecallReminder: boolean;
}

/**
 * A focused multi-day study plan for a Quiz/Test/Exam: evenly spaces study
 * sessions between today and the due date, sizing each day's 50/10-style
 * focus blocks off the assessment's own totalPrepTimeMinutes budget. Kept
 * deliberately simple — no adaptive difficulty weighting — since the
 * underlying readiness/drill data already drives what to actually study.
 */
export function buildStudyRoadmap(assessment: Assessment, todayStr: string): StudyRoadmap {
  const dueDateStr = toDateOnly(assessment.dueDate);
  const daysUntilDue = Math.max(
    0,
    Math.round((dateStrToTimestamp(dueDateStr) - dateStrToTimestamp(todayStr)) / 86400000)
  );

  const blockMinutes = PACING_MINUTES[assessment.studySessionPacing] || 50;
  const studyDayCount = Math.max(1, Math.min(daysUntilDue, 4));
  const totalBlocks = Math.max(1, Math.round(assessment.totalPrepTimeMinutes / blockMinutes));
  const blocksPerDay = Math.max(1, Math.round(totalBlocks / studyDayCount));

  const sessionDates: StudyRoadmapDay[] = [];
  for (let i = 0; i < studyDayCount; i++) {
    const offset = daysUntilDue <= 1 ? 0 : Math.round(((i + 1) * daysUntilDue) / (studyDayCount + 1));
    const date = addDays(todayStr, Math.min(offset, Math.max(daysUntilDue - 1, 0)));
    sessionDates.push({ date, label: formatShortDate(date), focusBlocks: blocksPerDay });
  }

  return {
    daysUntilDue,
    sessionDates,
    eveningRecallReminder: daysUntilDue <= 2,
  };
}
