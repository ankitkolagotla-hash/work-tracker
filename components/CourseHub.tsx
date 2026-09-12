'use client';
import React from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { getCourseWorkflow } from '../types/lifeOs';
import { Brain, Zap, Play, CheckCircle2 } from 'lucide-react';

export const CourseHub: React.FC<{ onStudy: (id: string) => void }> = ({ onStudy }) => {
  const { assessments, toggleTaskComplete } = useAssessmentStore();

  const deepStudyCourses = REGISTERED_COURSES.filter((c) => getCourseWorkflow(c.id) === 'DeepStudy');
  const executiveCourses = REGISTERED_COURSES.filter((c) => getCourseWorkflow(c.id) === 'ExecutiveReview');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cf-accent" /> Deep Study Workspaces
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          High-depth STEM: derivations, diagrams, masked recall, and free-response practice.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deepStudyCourses.map((course) => (
            <CourseColumn
              key={course.id}
              course={course}
              assessments={assessments.filter((a) => a.courseId === course.id)}
              onStudy={onStudy}
              onToggleComplete={toggleTaskComplete}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cf-accent" /> Executive Review Queues
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Fast humanities review: summaries, vocab, and quick recall passes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {executiveCourses.map((course) => (
            <CourseColumn
              key={course.id}
              course={course}
              assessments={assessments.filter((a) => a.courseId === course.id)}
              onStudy={onStudy}
              onToggleComplete={toggleTaskComplete}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function CourseColumn({
  course,
  assessments,
  onStudy,
  onToggleComplete,
  compact,
}: {
  course: { id: string; name: string; color: string };
  assessments: import('../types/assessment').Assessment[];
  onStudy: (id: string) => void;
  onToggleComplete: (id: string) => void;
  compact?: boolean;
}) {
  const sorted = [...assessments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course.color }} />
        <h3 className="text-sm font-bold text-white">{course.name}</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-500">Nothing queued.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => (
            <div key={a.id} className="bg-cf-bg border border-cf-border rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <button
                  onClick={() => onToggleComplete(a.id)}
                  className={`shrink-0 mt-0.5 ${a.status === 'Completed' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                  title="Toggle complete"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <p className={`text-xs flex-1 ${a.status === 'Completed' ? 'text-slate-500 line-through' : 'text-white'}`}>{a.title}</p>
              </div>
              {!compact && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-500 font-mono">{a.readinessIndex}% ready</span>
                  <button
                    onClick={() => onStudy(a.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-cf-accent hover:text-black text-slate-200 text-[10px] font-semibold rounded transition"
                  >
                    <Play className="w-2.5 h-2.5" /> Study
                  </button>
                </div>
              )}
              {compact && (
                <button
                  onClick={() => onStudy(a.id)}
                  className="mt-1 text-[10px] font-semibold text-cf-accent hover:opacity-80"
                >
                  Quick Review →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
