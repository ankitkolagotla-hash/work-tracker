'use client';
import React, { useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { SmartIntakeDrawer } from './SmartIntakeDrawer';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

/** Course-organized "Work by Class" dashboard — the primary execution surface. */
export const WorkByClassView: React.FC = () => {
  const assessments = useAssessmentStore((s) => s.assessments);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Work by Class</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {REGISTERED_COURSES.map((course) => {
          const tasks = assessments
            .filter((a) => a.courseId === course.id && a.status !== 'Completed')
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

          return (
            <div key={course.id} className="bg-cf-card border border-cf-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                <h3 className="text-sm font-bold text-white">{course.name}</h3>
                <span className="text-[10px] text-slate-500 ml-auto font-mono">{tasks.length} active</span>
              </div>

              {tasks.length === 0 ? (
                <p className="text-xs text-slate-500">Nothing active — all caught up.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 bg-cf-bg border border-cf-border rounded-lg px-3 py-2.5">
                      <button
                        onClick={() => toggleTaskComplete(a.id)}
                        title="Mark done"
                        className="text-slate-600 hover:text-emerald-400 transition shrink-0"
                      >
                        {a.status === 'Completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">{a.dueDate.split('T')[0]}</span>
                          {a.points > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cf-border text-slate-400">
                              {a.points} pts
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setOpenId(a.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cf-accent hover:opacity-90 text-black text-[11px] font-semibold rounded transition shrink-0"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Open &amp; Execute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openId && <SmartIntakeDrawer assessmentId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
};
