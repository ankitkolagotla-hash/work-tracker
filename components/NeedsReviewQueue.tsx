'use client';
import React from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { AlertTriangle, X } from 'lucide-react';

/** Mandatory follow-up queue of items missed during a Smart Intake drill pass. */
export const NeedsReviewQueue: React.FC = () => {
  const needsReviewItems = useAssessmentStore((s) => s.needsReviewItems);
  const removeNeedsReviewItem = useAssessmentStore((s) => s.removeNeedsReviewItem);

  if (needsReviewItems.length === 0) return null;

  return (
    <div className="bg-cf-card border border-amber-800/50 rounded-xl p-5">
      <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Needs Review ({needsReviewItems.length})
      </h3>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {needsReviewItems.map((item) => {
          const course = REGISTERED_COURSES.find((c) => c.id === item.courseId);
          return (
            <div key={item.id} className="flex items-start gap-2 bg-cf-bg border border-cf-border rounded-lg px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 truncate">{item.prompt}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  <span style={{ color: course?.color }}>{course?.code}</span> — {item.answer}
                </p>
              </div>
              <button onClick={() => removeNeedsReviewItem(item.id)} className="text-slate-500 hover:text-emerald-400 shrink-0" title="Cleared">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
