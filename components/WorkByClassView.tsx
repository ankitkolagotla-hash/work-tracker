'use client';
import React, { useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { SmartIntakeDrawer } from './SmartIntakeDrawer';
import { ChecklistDrawer } from './ChecklistDrawer';
import { CourseReassignSelect } from './CourseReassignSelect';
import { CheckCircle2, Circle, PlayCircle, ChevronDown, ListChecks } from 'lucide-react';

/** Course-organized "Work by Class" dashboard — the primary execution surface. */
export const WorkByClassView: React.FC = () => {
  const assessments = useAssessmentStore((s) => s.assessments);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);
  const [openId, setOpenId] = useState<string | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [expandedArchives, setExpandedArchives] = useState<Set<string>>(new Set());

  const toggleArchive = (courseId: string) => {
    setExpandedArchives((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Work by Class</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {REGISTERED_COURSES.map((course) => {
          const active = assessments
            .filter((a) => a.courseId === course.id && a.status !== 'Completed')
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          const archived = assessments
            .filter((a) => a.courseId === course.id && a.status === 'Completed')
            .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
          const archiveOpen = expandedArchives.has(course.id);

          return (
            <div key={course.id} className="bg-cf-card border border-cf-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                <h3 className="text-sm font-bold text-white">{course.name}</h3>
                <span className="text-[10px] text-slate-500 ml-auto font-mono">{active.length} active</span>
              </div>

              {active.length === 0 ? (
                <p className="text-xs text-slate-500">Nothing active — all caught up.</p>
              ) : (
                <div className="space-y-2">
                  {active.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 bg-cf-bg border border-cf-border rounded-lg px-3 py-2.5">
                      <button
                        onClick={() => toggleTaskComplete(a.id)}
                        title="Mark done"
                        className="text-slate-600 hover:text-emerald-400 transition shrink-0"
                      >
                        <Circle className="w-4 h-4" />
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
                          {a.checklist && a.checklist.length > 0 && (
                            <button
                              onClick={() => setChecklistId(a.id)}
                              className="flex items-center gap-1 text-[10px] text-cf-accent hover:opacity-80 transition"
                            >
                              <ListChecks className="w-3 h-3" />
                              {a.checklist.filter((c) => c.done).length}/{a.checklistPickLimit ?? a.checklist.length} picked
                            </button>
                          )}
                        </div>
                      </div>
                      <CourseReassignSelect assessmentId={a.id} courseId={a.courseId} />
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

              {archived.length > 0 && (
                <div className="mt-3 pt-3 border-t border-cf-border">
                  <button
                    onClick={() => toggleArchive(course.id)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-white transition"
                  >
                    Completed / Archived ({archived.length})
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${archiveOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {archiveOpen && (
                    <div className="space-y-1.5 mt-2">
                      {archived.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 bg-cf-bg border border-cf-border rounded-lg px-3 py-2">
                          <button
                            onClick={() => toggleTaskComplete(a.id)}
                            title="Restore to active schedule"
                            className="text-emerald-400 hover:text-slate-500 transition shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-slate-500 line-through truncate flex-1">{a.title}</p>
                          <span className="text-[10px] text-slate-600 font-mono shrink-0">{a.dueDate.split('T')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openId && <SmartIntakeDrawer assessmentId={openId} onClose={() => setOpenId(null)} />}
      {checklistId && <ChecklistDrawer assessmentId={checklistId} onClose={() => setChecklistId(null)} />}
    </div>
  );
};
