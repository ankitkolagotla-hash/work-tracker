'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { Assessment, REGISTERED_COURSES } from '../types/assessment';
import {
  BASELINE_DATE_STR,
  BASELINE_LABEL,
  MONTH_NAMES,
  buildMonthGrid,
  buildWeekDays,
  formatDayLabel,
  formatFullDate,
  formatShortDate,
  isSaturday,
  toDateOnly,
} from '../lib/date';
import { CalendarDays, CalendarRange, Calendar as CalendarIcon, GraduationCap } from 'lucide-react';

type ViewMode = 'daily' | 'weekly' | 'monthly';

interface DailyBlock {
  id: string;
  startLabel: string;
  endLabel: string;
  type: 'focus' | 'break';
}

function formatClock(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Visual timeline from after school to shutdown: 3:30 PM through 9:30 PM, 50/10 cycles. */
function buildDailyBlocks(startHour: number, startMinute: number, cycles: number): DailyBlock[] {
  const blocks: DailyBlock[] = [];
  let hour = startHour;
  let minute = startMinute;
  for (let i = 0; i < cycles; i++) {
    const startLabel = formatClock(hour, minute);
    let endMinute = minute + 50;
    let endHour = hour + Math.floor(endMinute / 60);
    endMinute %= 60;
    blocks.push({ id: `focus-${i}`, startLabel, endLabel: formatClock(endHour, endMinute), type: 'focus' });

    const breakStart = formatClock(endHour, endMinute);
    let bMinute = endMinute + 10;
    let bHour = endHour + Math.floor(bMinute / 60);
    bMinute %= 60;
    blocks.push({ id: `break-${i}`, startLabel: breakStart, endLabel: formatClock(bHour, bMinute), type: 'break' });

    hour = bHour;
    minute = bMinute;
  }
  return blocks;
}

const DAILY_BLOCKS = buildDailyBlocks(15, 30, 6);

export const CalendarView: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [monthIndex, setMonthIndex] = useState<8 | 9>(8); // 8 = September, 9 = October

  const { assessments, studyLogs, verifiedBlocks, toggleBlockVerified } = useAssessmentStore();

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6 text-cf-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-cf-text flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cf-accent" /> Study Calendar
          </h2>
          <p className="text-xs text-cf-text-muted mt-0.5">System date: {BASELINE_LABEL}</p>
        </div>
        <div className="flex items-center gap-1 bg-cf-bg border border-cf-border rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                viewMode === mode ? 'bg-cf-accent text-black' : 'text-cf-text-muted hover:text-cf-text'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'daily' && (
        <DailyView
          assessments={assessments}
          verifiedBlocks={verifiedBlocks}
          onToggle={toggleBlockVerified}
        />
      )}
      {viewMode === 'weekly' && <WeeklyView assessments={assessments} studyLogs={studyLogs} />}
      {viewMode === 'monthly' && (
        <MonthlyView assessments={assessments} monthIndex={monthIndex} setMonthIndex={setMonthIndex} />
      )}
    </div>
  );
};

function courseFor(courseId: string) {
  return REGISTERED_COURSES.find((c) => c.id === courseId);
}

function DailyView({
  assessments,
  verifiedBlocks,
  onToggle,
}: {
  assessments: Assessment[];
  verifiedBlocks: string[];
  onToggle: (key: string) => void;
}) {
  const todaysAssessments = assessments.filter((a) => toDateOnly(a.dueDate) === BASELINE_DATE_STR);
  const upcoming = assessments
    .filter((a) => a.status !== 'Completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const focusBlocks = DAILY_BLOCKS.filter((b) => b.type === 'focus');
  const verifiedFocusCount = focusBlocks.filter((b) => verifiedBlocks.includes(`${BASELINE_DATE_STR}::${b.id}`)).length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <p className="text-sm text-cf-text font-semibold">{formatFullDate(BASELINE_DATE_STR)}</p>
        <span className="text-xs text-cf-text-muted font-mono">{verifiedFocusCount} / {focusBlocks.length} verified</span>
      </div>
      <p className="text-xs text-cf-text-muted mb-4">After-school to shutdown timeline — 50/10 focus blocks.</p>

      {todaysAssessments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {todaysAssessments.map((a) => {
            const course = courseFor(a.courseId);
            return (
              <span
                key={a.id}
                className="text-[11px] font-semibold px-2 py-1 rounded border"
                style={{ color: course?.color, borderColor: `${course?.color}40`, backgroundColor: `${course?.color}10` }}
              >
                Due today: {a.title}
              </span>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {DAILY_BLOCKS.map((block) => {
          const key = `${BASELINE_DATE_STR}::${block.id}`;
          const verified = verifiedBlocks.includes(key);
          const sprintAssessment =
            block.type === 'focus' && upcoming.length > 0
              ? upcoming[(focusBlocks.findIndex((b) => b.id === block.id)) % upcoming.length]
              : null;
          const course = sprintAssessment ? courseFor(sprintAssessment.courseId) : null;

          if (block.type === 'break') {
            return (
              <div key={block.id} className="flex items-center gap-3 pl-4 py-1 text-[11px] text-cf-text-muted">
                <span className="w-24 font-mono">{block.startLabel}</span>
                <span>10-min break</span>
              </div>
            );
          }

          return (
            <label
              key={block.id}
              className="flex items-center gap-3 bg-cf-bg border border-cf-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-slate-600 transition"
            >
              <input
                type="checkbox"
                checked={verified}
                onChange={() => onToggle(key)}
                className="w-4 h-4"
                style={{ accentColor: 'rgb(var(--cf-accent))' }}
              />
              <span className="w-28 text-xs font-mono text-cf-text-muted">
                {block.startLabel} – {block.endLabel}
              </span>
              <span className={`text-sm ${verified ? 'text-cf-text-muted line-through' : 'text-cf-text'}`}>
                {sprintAssessment ? `Focus Sprint — ${sprintAssessment.title}` : 'Open Focus Block'}
              </span>
              {course && (
                <span
                  className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                  style={{ color: course.color, borderColor: `${course.color}40`, backgroundColor: `${course.color}10` }}
                >
                  {course.name}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyView({ assessments, studyLogs }: { assessments: Assessment[]; studyLogs: ReturnType<typeof useAssessmentStore.getState>['studyLogs'] }) {
  const weekDays = useMemo(() => buildWeekDays(BASELINE_DATE_STR), []);
  const lastDay = weekDays[weekDays.length - 1];

  const upcomingBeyondWeek = assessments
    .filter((a) => toDateOnly(a.dueDate) > lastDay)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => {
          const isToday = day === BASELINE_DATE_STR;
          const dueToday = assessments.filter((a) => toDateOnly(a.dueDate) === day);
          const studiedToday = studyLogs.some((log) => toDateOnly(log.timestamp) === day);

          return (
            <div
              key={day}
              className={`bg-cf-bg border rounded-lg p-3 min-h-[120px] flex flex-col ${
                isToday ? 'border-cf-accent' : 'border-cf-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isToday ? 'text-cf-accent' : 'text-cf-text'}`}>
                  {formatDayLabel(day)}
                </span>
                {studiedToday && <span className="w-2 h-2 rounded-full bg-orange-400" title="Study streak day" />}
              </div>
              <div className="space-y-1">
                {dueToday.map((a) => {
                  const course = courseFor(a.courseId);
                  return (
                    <div
                      key={a.id}
                      className="text-[10px] font-semibold px-1.5 py-1 rounded truncate"
                      style={{ color: course?.color, backgroundColor: `${course?.color}15` }}
                      title={a.title}
                    >
                      {a.title}
                    </div>
                  );
                })}
                {dueToday.length === 0 && <span className="text-[10px] text-cf-text-muted">No deadlines</span>}
              </div>
            </div>
          );
        })}
      </div>

      {upcomingBeyondWeek.length > 0 && (
        <div className="bg-cf-bg border border-cf-border rounded-lg p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-cf-text-muted mb-2">Next Up After This Week</h4>
          <div className="space-y-1.5">
            {upcomingBeyondWeek.map((a) => {
              const course = courseFor(a.courseId);
              return (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="text-cf-text">{a.title}</span>
                  <span style={{ color: course?.color }}>{formatShortDate(toDateOnly(a.dueDate))}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyView({
  assessments,
  monthIndex,
  setMonthIndex,
}: {
  assessments: Assessment[];
  monthIndex: 8 | 9;
  setMonthIndex: (m: 8 | 9) => void;
}) {
  const cells = useMemo(() => buildMonthGrid(2026, monthIndex), [monthIndex]);
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-cf-text">{MONTH_NAMES[monthIndex]} 2026</h3>
        <div className="flex items-center gap-1 bg-cf-bg border border-cf-border rounded-lg p-1">
          <button
            onClick={() => setMonthIndex(8)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              monthIndex === 8 ? 'bg-cf-accent text-black' : 'text-cf-text-muted hover:text-cf-text'
            }`}
          >
            September
          </button>
          <button
            onClick={() => setMonthIndex(9)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              monthIndex === 9 ? 'bg-cf-accent text-black' : 'text-cf-text-muted hover:text-cf-text'
            }`}
          >
            October
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekdayLabels.map((w) => (
          <div key={w} className="text-center text-[10px] uppercase tracking-wider text-cf-text-muted font-semibold">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.dateStr) return <div key={i} className="min-h-[80px]" />;

          const isToday = cell.dateStr === BASELINE_DATE_STR;
          const dueThatDay = assessments.filter((a) => toDateOnly(a.dueDate) === cell.dateStr);
          const act = isSaturday(cell.dateStr);

          return (
            <div
              key={i}
              className={`min-h-[80px] bg-cf-bg border rounded-lg p-1.5 flex flex-col gap-1 ${
                isToday ? 'border-cf-accent ring-1 ring-cf-accent/50' : 'border-cf-border'
              }`}
            >
              <span className={`text-[11px] font-mono ${isToday ? 'text-cf-accent font-bold' : 'text-cf-text-muted'}`}>
                {Number(cell.dateStr.slice(8, 10))}
              </span>
              {act && (
                <span className="text-[9px] font-semibold text-purple-300 bg-purple-950/50 border border-purple-800/60 rounded px-1 py-0.5 flex items-center gap-0.5">
                  <GraduationCap className="w-2.5 h-2.5" /> ACT Practice
                </span>
              )}
              {dueThatDay.map((a) => {
                const course = courseFor(a.courseId);
                return (
                  <span
                    key={a.id}
                    className="text-[9px] font-semibold rounded px-1 py-0.5 truncate"
                    style={{ color: course?.color, backgroundColor: `${course?.color}18` }}
                    title={a.title}
                  >
                    {a.title}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[10px] text-cf-text-muted">
        <span className="flex items-center gap-1">
          <CalendarRange className="w-3 h-3" /> Course milestone
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3 text-purple-300" /> Recurring Saturday ACT timed practice, 8:00 AM
        </span>
      </div>
    </div>
  );
}
