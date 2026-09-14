'use client';
import React, { useEffect } from 'react';
import { useToastStore, ToastItem } from '../store/useToastStore';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { CheckCircle2, X } from 'lucide-react';

/** 5-second auto-dismissing confirmation toasts, e.g. "marked done" + Undo. */
export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[60] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          toast={t}
          onRemove={() => removeToast(t.id)}
          onUndo={
            t.assessmentId
              ? () => {
                  toggleTaskComplete(t.assessmentId as string);
                  removeToast(t.id);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
};

function Toast({ toast, onRemove, onUndo }: { toast: ToastItem; onRemove: () => void; onUndo?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-auto flex items-center gap-3 bg-cf-card border border-cf-border rounded-lg px-4 py-3 shadow-2xl min-w-[260px]">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="text-xs text-cf-text flex-1">{toast.message}</span>
      {onUndo && (
        <button onClick={onUndo} className="text-xs font-semibold text-cf-accent hover:opacity-80 transition shrink-0">
          Undo
        </button>
      )}
      <button onClick={onRemove} className="text-cf-text-muted hover:text-cf-text transition shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
