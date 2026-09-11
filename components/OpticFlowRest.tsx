'use client';
import React from 'react';
import { useFocusStore } from '../store/useFocusStore';

function formatMMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const OpticFlowRest: React.FC = () => {
  const phase = useFocusStore((s) => s.phase);
  const secondsRemaining = useFocusStore((s) => s.secondsRemaining);
  const endSprint = useFocusStore((s) => s.endSprint);

  if (phase !== 'break') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-cf-bg flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 optic-horizon" />
      <div className="relative z-10 text-center px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cf-text-muted mb-3">Optic Flow Rest</p>
        <div className="text-6xl font-mono font-bold text-cf-text mb-2">{formatMMSS(secondsRemaining)}</div>
        <p className="text-sm text-cf-text-muted mb-8">Let your eyes drift across the horizon. Breathe slowly.</p>
        <button
          onClick={endSprint}
          className="px-5 py-2.5 bg-cf-card border border-cf-border hover:border-slate-600 text-cf-text text-xs font-semibold rounded-lg transition"
        >
          End Session
        </button>
      </div>
    </div>
  );
};
