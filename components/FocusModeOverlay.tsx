'use client';
import React, { useState } from 'react';
import { useFocusStore, SPRINT_PRESETS } from '../store/useFocusStore';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useSystemDate } from '../store/useSystemDateStore';
import { isUpcoming } from '../lib/date';
import { Minimize2 } from 'lucide-react';

function formatMMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Distraction-free fullscreen view for an active 50/10 ultradian block (or
 * any sprint): hides every nav bar and sidebar, leaving only the timer, a
 * chosen current task, and a scratchpad — the persistent Apple Music player
 * bar stays visible beneath this overlay by z-index rather than being
 * duplicated here.
 */
export const FocusModeOverlay: React.FC = () => {
  const { focusModeActive, setFocusModeActive, phase, secondsRemaining, sprintPresetId } = useFocusStore();
  const assessments = useAssessmentStore((s) => s.assessments);
  const today = useSystemDate();
  const [taskId, setTaskId] = useState('');
  const [scratchpad, setScratchpad] = useState('');

  if (!focusModeActive) return null;

  const preset = SPRINT_PRESETS.find((p) => p.id === sprintPresetId);
  const upcoming = assessments.filter((a) => isUpcoming(a.dueDate, today) && a.status !== 'Completed');

  return (
    <div className="fixed inset-0 z-40 bg-cf-bg flex flex-col items-center justify-center px-6 pb-24">
      <button
        onClick={() => setFocusModeActive(false)}
        className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-cf-card border border-cf-border hover:border-slate-600 text-xs font-semibold text-slate-300 rounded transition"
      >
        <Minimize2 className="w-3.5 h-3.5" /> Exit Focus Mode
      </button>

      <div className="w-full max-w-lg text-center">
        <p className="text-xs uppercase tracking-widest text-cf-text-muted mb-2">
          {phase === 'work' ? preset?.name ?? 'Focus Block' : 'Optic Flow Rest'}
        </p>
        <div className="text-7xl font-mono font-bold text-cf-accent mb-8">{formatMMSS(secondsRemaining)}</div>

        <div className="mb-6 text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted block mb-1.5">Current Task</label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full bg-cf-card border border-cf-border rounded-lg px-3 py-2.5 text-sm text-cf-text focus:outline-cf-accent"
          >
            <option value="">Not tied to a specific task</option>
            {upcoming.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        <div className="text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted block mb-1.5">Scratchpad</label>
          <textarea
            rows={6}
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Jot down anything without breaking focus..."
            className="w-full bg-cf-card border border-cf-border rounded-lg p-3 text-sm text-cf-text resize-none focus:outline-cf-accent"
          />
        </div>
      </div>
    </div>
  );
};
