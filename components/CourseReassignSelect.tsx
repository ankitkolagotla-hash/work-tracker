'use client';
import React from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';

/** Compact inline dropdown for manually reassigning a task to a different one of the 7 official courses. */
export const CourseReassignSelect: React.FC<{ assessmentId: string; courseId: string; className?: string }> = ({
  assessmentId,
  courseId,
  className,
}) => {
  const reassignCourse = useAssessmentStore((s) => s.reassignCourse);

  return (
    <select
      value={courseId}
      onChange={(e) => reassignCourse(assessmentId, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      title="Reassign course"
      className={
        className ??
        'bg-cf-bg border border-cf-border rounded px-1.5 py-1 text-[10px] text-slate-400 focus:outline-cf-accent shrink-0'
      }
    >
      {REGISTERED_COURSES.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
};
