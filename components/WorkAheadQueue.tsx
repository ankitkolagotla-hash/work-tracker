'use client';
import React, { useMemo } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useSystemDate } from '../store/useSystemDateStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { addDays, toDateOnly, formatShortDate } from '../lib/date';
import { FastForward, ArrowRight, X } from 'lucide-react';

const LOOKAHEAD_DAYS = 7;

/**
 * Work Ahead / Extra Credit Buffer: lets a student pull next-week's tasks
 * into today's active sprint queue to get ahead, without ever touching the
 * task's real chronological due date. Queued state lives in its own
 * `queuedAheadIds` list, separate from `dueDate`.
 */
export const WorkAheadQueue: React.FC = () => {
  const today = useSystemDate();
  const { assessments, queuedAheadIds, toggleQueuedAhead } = useAssessmentStore();

  const horizon = addDays(today, LOOKAHEAD_DAYS);

  const pullable = useMemo(
    () =>
      assessments
        .filter((a) => {
          const due = toDateOnly(a.dueDate);
          return due > today && due <= horizon && a.status !== 'Completed' && !queuedAheadIds.includes(a.id);
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assessments, today, horizon, queuedAheadIds]
  );

  const queued = useMemo(
    () => assessments.filter((a) => queuedAheadIds.includes(a.id)),
    [assessments, queuedAheadIds]
  );

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <FastForward className="w-4 h-4 text-cf-accent" /> Work Ahead / Extra Credit Buffer
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Pull next week's tasks into today's active queue to get ahead. Queuing never changes the task's real due date — it just
        surfaces it early.
      </p>

      {queued.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cf-accent mb-1.5">In Today's Queue ({queued.length})</p>
          <div className="space-y-1.5">
            {queued.map((a) => {
              const course = REGISTERED_COURSES.find((c) => c.id === a.courseId);
              return (
                <div key={a.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
                  <span className="text-slate-200">
                    {a.title} <span style={{ color: course?.color }}>· {course?.code}</span>{' '}
                    <span className="text-slate-500">(actually due {formatShortDate(toDateOnly(a.dueDate))})</span>
                  </span>
                  <button onClick={() => toggleQueuedAhead(a.id)} className="text-slate-500 hover:text-red-400 shrink-0 ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Available to Pull Ahead (next 7 days)</p>
      {pullable.length === 0 ? (
        <p className="text-xs text-slate-500">Nothing due in the next 7 days to pull ahead.</p>
      ) : (
        <div className="space-y-1.5">
          {pullable.map((a) => {
            const course = REGISTERED_COURSES.find((c) => c.id === a.courseId);
            return (
              <div key={a.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
                <span className="text-slate-300">
                  {a.title} <span style={{ color: course?.color }}>· {course?.code}</span>{' '}
                  <span className="text-slate-500">— due {formatShortDate(toDateOnly(a.dueDate))}</span>
                </span>
                <button
                  onClick={() => toggleQueuedAhead(a.id)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-cf-accent hover:opacity-80 shrink-0 ml-2"
                >
                  Pull to Today <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
