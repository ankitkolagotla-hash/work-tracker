'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useSystemDate } from '../store/useSystemDateStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { toDateOnly } from '../lib/date';
import { SmartIntakeDrawer } from './SmartIntakeDrawer';
import { Sunrise, CheckCircle2, Circle, Clock, PlayCircle } from 'lucide-react';

/** Streamlined top-of-app daily action briefing: progress bar, today's tasks, hours logged. */
export const DailyBriefing: React.FC = () => {
  const today = useSystemDate();
  const assessments = useAssessmentStore((s) => s.assessments);
  const studyLogs = useAssessmentStore((s) => s.studyLogs);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);
  const [openId, setOpenId] = useState<string | null>(null);

  const todaysTasks = useMemo(
    () => assessments.filter((a) => toDateOnly(a.dueDate) === today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assessments, today]
  );
  const doneCount = todaysTasks.filter((a) => a.status === 'Completed').length;
  const progressPct = todaysTasks.length === 0 ? 100 : Math.round((doneCount / todaysTasks.length) * 100);

  const totalMinutesToday = useMemo(
    () => studyLogs.filter((l) => toDateOnly(l.timestamp) === today).reduce((acc, l) => acc + l.durationMinutes, 0),
    [studyLogs, today]
  );

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-cf-accent" /> Daily Action Briefing
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cf-accent" /> {totalMinutesToday}m logged today
        </span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 bg-cf-bg rounded-full h-2.5 overflow-hidden border border-cf-border">
          <div className="bg-cf-accent h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs font-mono text-cf-accent shrink-0">{doneCount}/{todaysTasks.length} done</span>
      </div>

      {todaysTasks.length === 0 ? (
        <p className="text-xs text-slate-500">Nothing due today — clean slate.</p>
      ) : (
        <div className="space-y-1.5">
          {todaysTasks.map((a) => {
            const course = REGISTERED_COURSES.find((c) => c.id === a.courseId);
            const done = a.status === 'Completed';
            return (
              <div key={a.id} className="flex items-center gap-2 bg-cf-bg border border-cf-border rounded-lg px-3 py-2">
                <button onClick={() => toggleTaskComplete(a.id)} className="shrink-0" title="Toggle done">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 hover:text-cf-accent transition" />
                  )}
                </button>
                <span className={`text-xs flex-1 truncate ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {a.title} <span style={{ color: course?.color }}>· {course?.code}</span>
                </span>
                {!done && (
                  <button
                    onClick={() => setOpenId(a.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-cf-accent hover:text-black text-slate-200 text-[10px] font-semibold rounded transition shrink-0"
                  >
                    <PlayCircle className="w-3 h-3" /> Start Study / Generate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {openId && <SmartIntakeDrawer assessmentId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
};
