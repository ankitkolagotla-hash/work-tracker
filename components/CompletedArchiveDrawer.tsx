'use client';
import React, { useMemo } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { CourseReassignSelect } from './CourseReassignSelect';
import { X, Archive, RotateCcw } from 'lucide-react';

/** Global "Completed Work Archive" — every finished assignment across all courses, with instant restore. */
export const CompletedArchiveDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const assessments = useAssessmentStore((s) => s.assessments);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);

  const completed = useMemo(
    () =>
      assessments
        .filter((a) => a.status === 'Completed')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [assessments]
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-cf-card border border-cf-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-cf-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-cf-accent" /> Completed Work Archive
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {completed.length === 0 ? (
          <p className="text-xs text-slate-500">Nothing completed yet — finished work will collect here.</p>
        ) : (
          <div className="space-y-2">
            {completed.map((a) => {
              const course = REGISTERED_COURSES.find((c) => c.id === a.courseId);
              return (
                <div key={a.id} className="flex items-center gap-2 bg-cf-bg border border-cf-border rounded-lg px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 line-through truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: course?.color }}>{course?.name}</span>
                      {a.completedAt && <span className="text-[10px] text-slate-500 font-mono">· done {a.completedAt}</span>}
                    </div>
                  </div>
                  <CourseReassignSelect assessmentId={a.id} courseId={a.courseId} />
                  <button
                    onClick={() => toggleTaskComplete(a.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-cf-accent hover:text-black text-slate-200 text-[10px] font-semibold rounded transition shrink-0"
                    title="Restore to active schedule"
                  >
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
