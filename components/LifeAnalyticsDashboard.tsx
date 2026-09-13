'use client';
import React, { useMemo } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useSystemDate } from '../store/useSystemDateStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { ACT_TARGET_PREP_HOURS } from '../types/lifeOs';
import { addDays, toDateOnly, formatDayLabel } from '../lib/date';
import { BarChart3, Flame, Gauge, TrendingUp } from 'lucide-react';

const LOOKBACK_DAYS = 7;
/** 6 focus blocks/day x 50 min is this app's planned daily deep-work capacity — the denominator for the efficiency rating. */
const PLANNED_MINUTES_PER_DAY = 6 * 50;

/**
 * Self-updating analytics: recomputed live from each domain's own store on
 * every render (via useMemo keyed to the underlying data), never a snapshot
 * that goes stale. Custom CSS/SVG only — no charting library needed for
 * this small a set of visualizations.
 */
export const LifeAnalyticsDashboard: React.FC = () => {
  const today = useSystemDate();
  const assessments = useAssessmentStore((s) => s.assessments);
  const studyLogs = useAssessmentStore((s) => s.studyLogs);
  const actSectionSessions = useLifeOSStore((s) => s.actSectionSessions);
  const trainingLogs = useLifeOSStore((s) => s.trainingLogs);

  const last7Days = useMemo(() => Array.from({ length: LOOKBACK_DAYS }, (_, i) => addDays(today, i - (LOOKBACK_DAYS - 1))), [today]);

  const dailyVelocity = useMemo(
    () =>
      last7Days.map((day) => {
        const academic = studyLogs.filter((l) => toDateOnly(l.timestamp) === day).reduce((a, l) => a + l.durationMinutes, 0);
        const act = actSectionSessions.filter((s) => s.date === day).reduce((a, s) => a + s.minutesSpent, 0);
        const athletics = trainingLogs.filter((t) => t.date === day).reduce((a, t) => a + t.durationMinutes, 0);
        const tasksCompleted = assessments.filter((asmt) => asmt.completedAt === day).length;
        return { day, academic, act, athletics, total: academic + act + athletics, tasksCompleted };
      }),
    [last7Days, studyLogs, actSectionSessions, trainingLogs, assessments]
  );

  const studiedDaySet = useMemo(() => new Set(studyLogs.map((l) => toDateOnly(l.timestamp))), [studyLogs]);

  const efficiencyPct = useMemo(() => {
    const plannedTotal = PLANNED_MINUTES_PER_DAY * LOOKBACK_DAYS;
    const actualTotal = dailyVelocity.reduce((acc, d) => acc + d.total, 0);
    return Math.min(100, Math.round((actualTotal / plannedTotal) * 100));
  }, [dailyVelocity]);

  const maxDailyTotal = Math.max(1, ...dailyVelocity.map((d) => d.total));
  const maxTasksCompleted = Math.max(1, ...dailyVelocity.map((d) => d.tasksCompleted));

  const readinessTrajectories = useMemo(() => {
    const byCourse = new Map<string, { date: string; score: number }[]>();
    studyLogs
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .forEach((log) => {
        const list = byCourse.get(log.courseId) ?? [];
        list.push({ date: toDateOnly(log.timestamp), score: log.performanceScore });
        byCourse.set(log.courseId, list);
      });
    return Array.from(byCourse.entries())
      .filter(([, points]) => points.length >= 2)
      .map(([courseId, points]) => ({
        courseId,
        course: REGISTERED_COURSES.find((c) => c.id === courseId),
        points,
      }));
  }, [studyLogs]);

  const actTotalHours = useMemo(
    () => actSectionSessions.reduce((acc, s) => acc + s.minutesSpent, 0) / 60,
    [actSectionSessions]
  );

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-cf-accent" /> Life Analytics
      </h2>
      <p className="text-xs text-slate-400 mb-5">Self-updating velocity, readiness trajectory, and ACT prep progress — recomputed live from your logged activity.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-cf-bg border border-cf-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Focus Hours (7 days)</p>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-cf-accent">
              <Gauge className="w-3 h-3" /> {efficiencyPct}% of planned capacity
            </span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-32">
            {dailyVelocity.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${Math.max(2, (d.total / maxDailyTotal) * 100)}%` }} title={`${d.total}m total`}>
                  {d.athletics > 0 && <div style={{ height: `${(d.athletics / (d.total || 1)) * 100}%`, backgroundColor: '#34D399' }} />}
                  {d.act > 0 && <div style={{ height: `${(d.act / (d.total || 1)) * 100}%`, backgroundColor: '#FBBF24' }} />}
                  {d.academic > 0 && <div style={{ height: `${(d.academic / (d.total || 1)) * 100}%`, backgroundColor: '#38BDF8' }} />}
                </div>
                <span className="text-[9px] text-slate-500">{formatDayLabel(d.day).split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Legend color="#38BDF8" label="Academic" />
            <Legend color="#FBBF24" label="ACT" />
            <Legend color="#34D399" label="Athletics" />
          </div>
        </div>

        <div className="bg-cf-bg border border-cf-border rounded-lg p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Tasks Completed &amp; Study Streak</p>
          <div className="flex items-end justify-between gap-1.5 h-32 mb-3">
            {dailyVelocity.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-cf-accent rounded-t"
                  style={{ height: `${Math.max(2, (d.tasksCompleted / maxTasksCompleted) * 100)}%` }}
                  title={`${d.tasksCompleted} completed`}
                />
                <span className="text-[9px] text-slate-500">{d.tasksCompleted}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <div className="flex gap-1">
              {last7Days.map((day) => (
                <span
                  key={day}
                  title={day}
                  className={`w-4 h-4 rounded ${studiedDaySet.has(day) ? 'bg-orange-400' : 'bg-cf-card border border-cf-border'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-500 ml-1">study-day streak, last {LOOKBACK_DAYS} days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-cf-bg border border-cf-border rounded-lg p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Readiness Trajectory (by course)
          </p>
          {readinessTrajectories.length === 0 ? (
            <p className="text-[11px] text-slate-500">Log at least 2 study sessions for a course to chart its trajectory.</p>
          ) : (
            <ReadinessSvgChart series={readinessTrajectories} />
          )}
        </div>

        <div className="bg-cf-bg border border-cf-border rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 self-start">Cumulative ACT Prep vs. Target</p>
          <ACTHoursGauge hours={actTotalHours} target={ACT_TARGET_PREP_HOURS} />
        </div>
      </div>
    </div>
  );
};

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}

const CHART_COLORS = ['#38BDF8', '#F472B6', '#FBBF24', '#34D399', '#818CF8', '#FB923C', '#94A3B8'];

function ReadinessSvgChart({
  series,
}: {
  series: { courseId: string; course: ReturnType<typeof REGISTERED_COURSES.find>; points: { date: string; score: number }[] }[];
}) {
  const width = 320;
  const height = 140;
  const padding = 8;

  const allDates = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.date)))).sort();
  const xFor = (date: string) => {
    const idx = allDates.indexOf(date);
    return allDates.length <= 1 ? padding : padding + (idx / (allDates.length - 1)) * (width - padding * 2);
  };
  const yFor = (score: number) => height - padding - (score / 100) * (height - padding * 2);

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgb(var(--cf-border))" strokeWidth={1} />
        {series.map((s, i) => {
          const color = CHART_COLORS[i % CHART_COLORS.length];
          const pathD = s.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xFor(p.date)} ${yFor(p.score)}`).join(' ');
          return (
            <g key={s.courseId}>
              <path d={pathD} fill="none" stroke={s.course?.color ?? color} strokeWidth={2} />
              {s.points.map((p, idx) => (
                <circle key={idx} cx={xFor(p.date)} cy={yFor(p.score)} r={2.5} fill={s.course?.color ?? color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s) => (
          <Legend key={s.courseId} color={s.course?.color ?? '#94A3B8'} label={s.course?.name ?? s.courseId} />
        ))}
      </div>
    </div>
  );
}

function ACTHoursGauge({ hours, target }: { hours: number; target: number }) {
  const pct = Math.min(1, hours / target);
  const radius = 70; // must match the SVG arc path's radius below
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <svg width={160} height={90} viewBox="0 0 160 90">
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="rgb(var(--cf-border))" strokeWidth={12} strokeLinecap="round" />
        <path
          d="M 10 80 A 70 70 0 0 1 150 80"
          fill="none"
          stroke="rgb(var(--cf-accent))"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="text-2xl font-mono font-bold text-white -mt-2">{hours.toFixed(1)}h</p>
      <p className="text-[10px] text-slate-500">of {target}h target ({Math.round(pct * 100)}%)</p>
    </div>
  );
}
