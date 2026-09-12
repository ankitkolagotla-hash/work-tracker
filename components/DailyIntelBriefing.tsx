'use client';
import React, { useMemo } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { BASELINE_DATE_STR, toDateOnly } from '../lib/date';
import { Sunrise, CheckCircle2, Circle, BookOpen, Target, Dumbbell, GraduationCap } from 'lucide-react';

/**
 * The "Daily Intel" morning briefing: everything due or scheduled today,
 * pulled live from each domain's own store, plus a same-day hours breakdown.
 * This intentionally reuses the same BASELINE_DATE_STR "today" concept as
 * CalendarView's Daily view, rather than introducing a second notion of
 * "today" for this widget alone.
 */
export const DailyIntelBriefing: React.FC = () => {
  const assessments = useAssessmentStore((s) => s.assessments);
  const studyLogs = useAssessmentStore((s) => s.studyLogs);
  const actSectionSessions = useLifeOSStore((s) => s.actSectionSessions);
  const trainingLogs = useLifeOSStore((s) => s.trainingLogs);
  const coldEmailLogs = useLifeOSStore((s) => s.coldEmailLogs);
  const targetUniversities = useLifeOSStore((s) => s.targetUniversities);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);

  const todaysAssessments = useMemo(
    () => assessments.filter((a) => toDateOnly(a.dueDate) === BASELINE_DATE_STR).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assessments]
  );
  const completedToday = todaysAssessments.filter((a) => a.status === 'Completed').length;
  const completionPct = todaysAssessments.length === 0 ? 100 : Math.round((completedToday / todaysAssessments.length) * 100);

  const todaysACTMinutes = useMemo(
    () => actSectionSessions.filter((s) => s.date === BASELINE_DATE_STR).reduce((acc, s) => acc + s.minutesSpent, 0),
    [actSectionSessions]
  );
  const todaysTrainingMinutes = useMemo(
    () => trainingLogs.filter((t) => t.date === BASELINE_DATE_STR).reduce((acc, t) => acc + t.durationMinutes, 0),
    [trainingLogs]
  );
  const todaysAcademicMinutes = useMemo(
    () => studyLogs.filter((l) => toDateOnly(l.timestamp) === BASELINE_DATE_STR).reduce((acc, l) => acc + l.durationMinutes, 0),
    [studyLogs]
  );
  const todaysOutreach = useMemo(
    () =>
      coldEmailLogs.filter((l) => l.sentDate && toDateOnly(l.sentDate) === BASELINE_DATE_STR).length +
      targetUniversities.filter((u) => u.deadlineDate === BASELINE_DATE_STR).length,
    [coldEmailLogs, targetUniversities]
  );

  const totalMinutes = todaysAcademicMinutes + todaysACTMinutes + todaysTrainingMinutes;
  const segments = [
    { label: 'Academic Deep Work', minutes: todaysAcademicMinutes, color: '#38BDF8' },
    { label: 'ACT Prep', minutes: todaysACTMinutes, color: '#FBBF24' },
    { label: 'Soccer / Conditioning', minutes: todaysTrainingMinutes, color: '#34D399' },
  ];

  const ringCircumference = 2 * Math.PI * 26;
  const ringOffset = ringCircumference - (completionPct / 100) * ringCircumference;

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-cf-accent" /> Morning Briefing — The Daily Intel
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="flex items-center gap-4">
          <svg width={64} height={64} className="shrink-0 -rotate-90">
            <circle cx={32} cy={32} r={26} fill="none" stroke="rgb(var(--cf-border))" strokeWidth={6} />
            <circle
              cx={32}
              cy={32}
              r={26}
              fill="none"
              stroke="rgb(var(--cf-accent))"
              strokeWidth={6}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
            />
          </svg>
          <div>
            <p className="text-2xl font-mono font-bold text-white">{completionPct}%</p>
            <p className="text-[11px] text-slate-500">{completedToday}/{todaysAssessments.length} due today complete</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Today's Hours Logged ({totalMinutes}m)</p>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-cf-bg border border-cf-border">
            {totalMinutes === 0 ? (
              <div className="w-full h-full" />
            ) : (
              segments.map((seg) => (
                <div key={seg.label} style={{ width: `${(seg.minutes / totalMinutes) * 100}%`, backgroundColor: seg.color }} title={`${seg.label}: ${seg.minutes}m`} />
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {segments.map((seg) => (
              <span key={seg.label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                {seg.label}: {seg.minutes}m
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <BriefingColumn icon={BookOpen} title="IB Deadlines Today">
          {todaysAssessments.length === 0 ? (
            <p className="text-[11px] text-slate-500">Nothing due today.</p>
          ) : (
            todaysAssessments.map((a) => {
              const course = REGISTERED_COURSES.find((c) => c.id === a.courseId);
              const done = a.status === 'Completed';
              return (
                <button
                  key={a.id}
                  onClick={() => toggleTaskComplete(a.id)}
                  className="w-full flex items-center gap-1.5 text-left text-[11px] py-0.5 group"
                >
                  {done ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-slate-500 shrink-0 group-hover:text-cf-accent" />
                  )}
                  <span className={`truncate ${done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {a.title} <span style={{ color: course?.color }}>· {course?.code}</span>
                  </span>
                </button>
              );
            })
          )}
        </BriefingColumn>

        <BriefingColumn icon={Target} title="ACT Drill Blocks">
          {todaysACTMinutes === 0 ? (
            <p className="text-[11px] text-slate-500">No ACT prep logged yet today.</p>
          ) : (
            <p className="text-[11px] text-slate-300">{todaysACTMinutes} minutes logged today.</p>
          )}
        </BriefingColumn>

        <BriefingColumn icon={Dumbbell} title="Athletics Focus">
          {todaysTrainingMinutes === 0 ? (
            <p className="text-[11px] text-slate-500">No training logged yet today.</p>
          ) : (
            <p className="text-[11px] text-slate-300">{todaysTrainingMinutes} minutes of conditioning logged.</p>
          )}
        </BriefingColumn>

        <BriefingColumn icon={GraduationCap} title="College Outreach">
          {todaysOutreach === 0 ? (
            <p className="text-[11px] text-slate-500">No outreach tasks today.</p>
          ) : (
            <p className="text-[11px] text-slate-300">{todaysOutreach} outreach item(s) today.</p>
          )}
        </BriefingColumn>
      </div>
    </div>
  );
};

function BriefingColumn({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cf-bg border border-cf-border rounded-lg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-cf-accent mb-2 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
