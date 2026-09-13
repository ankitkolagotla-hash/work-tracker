export const BASELINE_DATE_STR = '2026-09-11';
export const BASELINE_LABEL = 'Friday, September 11, 2026';
export const BASELINE_TIMESTAMP = Date.UTC(2026, 8, 11);

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * `todayStr` defaults to the fixed install baseline for callers that don't
 * carry the live system date (e.g. one-off parsing utilities) — dashboard
 * components should pass the live value from useSystemDate() instead.
 */
export function isUpcoming(dueDateISO: string, todayStr: string = BASELINE_DATE_STR): boolean {
  return toDateOnly(dueDateISO) >= todayStr;
}

export function isPast(dueDateISO: string, todayStr: string = BASELINE_DATE_STR): boolean {
  return !isUpcoming(dueDateISO, todayStr);
}

export function dateStrToTimestamp(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const ts = dateStrToTimestamp(dateStr) + days * 86400000;
  return new Date(ts).toISOString().slice(0, 10);
}

/** 0 = Monday ... 6 = Sunday */
export function getWeekdayIndex(dateStr: string): number {
  const jsDay = new Date(dateStrToTimestamp(dateStr)).getUTCDay();
  return (jsDay + 6) % 7;
}

export function isSaturday(dateStr: string): boolean {
  return getWeekdayIndex(dateStr) === 5;
}

/** Rolling 7-day window starting at the anchor date (today), not calendar-week aligned. */
export function buildWeekDays(anchorDateStr: string = BASELINE_DATE_STR): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(anchorDateStr, i));
}

export function formatDayLabel(dateStr: string): string {
  return new Date(dateStrToTimestamp(dateStr)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStrToTimestamp(dateStr)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStrToTimestamp(dateStr)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface MonthCell {
  dateStr: string | null;
  inMonth: boolean;
}

export function buildMonthGrid(year: number, monthIndex: number): MonthCell[] {
  const firstWeekday = getWeekdayIndex(
    new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10)
  );
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: MonthCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ dateStr: null, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: new Date(Date.UTC(year, monthIndex, d)).toISOString().slice(0, 10), inMonth: true });
  }
  while (cells.length % 7 !== 0) cells.push({ dateStr: null, inMonth: false });
  return cells;
}
