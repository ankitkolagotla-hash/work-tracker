'use client';
import React, { useState } from 'react';
import { useSystemDateStore, useSystemDate } from '../store/useSystemDateStore';
import { formatFullDate } from '../lib/date';
import { CalendarClock, ChevronRight, RotateCcw } from 'lucide-react';

/**
 * Live system-date control: auto-advances to the real calendar date by
 * default, but can be pinned to a manual date or stepped forward a day at a
 * time — without ever rewriting any assessment's actual due date.
 */
export const SystemDateControl: React.FC = () => {
  const systemDate = useSystemDate();
  const { overrideDate, autoAdvance, setOverrideDate, setAutoAdvance, advanceOneDay, resetToBaseline } = useSystemDateStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-slate-300 transition"
      >
        <CalendarClock className="w-3.5 h-3.5 text-cf-accent" />
        {formatFullDate(systemDate)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-cf-card border border-cf-border rounded-xl p-4 shadow-2xl z-50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">System Date</h4>

            <label className="flex items-center justify-between mb-3 cursor-pointer">
              <span className="text-xs text-slate-300">Auto-advance to today</span>
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: 'rgb(var(--cf-accent))' }}
              />
            </label>

            <label className="block mb-3">
              <span className="text-[10px] text-slate-500 block mb-1">Manual override</span>
              <input
                type="date"
                value={overrideDate ?? ''}
                onChange={(e) => setOverrideDate(e.target.value || null)}
                className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={advanceOneDay}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition"
              >
                <ChevronRight className="w-3.5 h-3.5" /> +1 Day
              </button>
              <button
                onClick={resetToBaseline}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Baseline
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
