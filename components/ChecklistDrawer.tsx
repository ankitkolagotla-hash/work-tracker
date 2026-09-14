'use client';
import React from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { X, CheckSquare, Square } from 'lucide-react';

/** "Pick N of M" checklist popup for a consolidated task like Biology's weekly A&B activity. */
export const ChecklistDrawer: React.FC<{ assessmentId: string; onClose: () => void }> = ({ assessmentId, onClose }) => {
  const assessment = useAssessmentStore((s) => s.assessments.find((a) => a.id === assessmentId));
  const toggleChecklistItem = useAssessmentStore((s) => s.toggleChecklistItem);

  if (!assessment || !assessment.checklist) return null;
  const doneCount = assessment.checklist.filter((c) => c.done).length;
  const limit = assessment.checklistPickLimit;
  const atCap = limit !== undefined && doneCount >= limit;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-cf-card border border-cf-border rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">{assessment.title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {doneCount}/{limit ?? assessment.checklist.length} selected
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {assessment.checklist.map((item) => {
            const disabled = !item.done && atCap;
            return (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(assessmentId, item.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition ${
                  item.done
                    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                    : disabled
                    ? 'border-cf-border bg-cf-bg text-slate-600 cursor-not-allowed'
                    : 'border-cf-border bg-cf-bg text-slate-200 hover:border-slate-600'
                }`}
              >
                {item.done ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>

        {atCap && <p className="text-[11px] text-amber-400 mt-3">Pick limit reached — uncheck one to swap in another option.</p>}
      </div>
    </div>
  );
};
