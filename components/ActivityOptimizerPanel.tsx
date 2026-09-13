'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { optimizeActivity, STRONG_ACTION_VERBS } from '../lib/activityOptimizer';
import { ListChecks, Trash2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * 150-character Common App activity description formatter. Rule-based
 * feedback (action verb, quantifiable metric, filler phrases, live char
 * count) — it never invents accomplishments on the student's behalf.
 */
export const ActivityOptimizerPanel: React.FC = () => {
  const { commonAppActivities, addCommonAppActivity, updateCommonAppActivity, deleteCommonAppActivity } = useLifeOSStore();
  const [draft, setDraft] = useState('');

  const result = useMemo(() => optimizeActivity(draft), [draft]);

  const handleSave = () => {
    if (!draft.trim()) return;
    addCommonAppActivity({ rawText: draft.trim(), optimizedText: result.truncatedSuggestion });
    setDraft('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-cf-accent" /> Common App Activity Optimizer
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        150-character formatter — enforces the limit and flags missing verbs/metrics; it doesn't invent accomplishments for you.
      </p>

      <textarea
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Describe the activity (e.g., Founded and led a 12-person robotics club, raised $3,000 in sponsorships)..."
        className="w-full bg-cf-bg border border-cf-border rounded p-3 text-sm text-white resize-none focus:outline-cf-accent mb-2"
      />

      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-mono ${result.withinLimit ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.charCount} / 150 characters
        </span>
        {!result.withinLimit && <span className="text-[11px] text-slate-500">Suggested cut: "{result.truncatedSuggestion}"</span>}
      </div>

      <div className="space-y-1 mb-4">
        {result.startsWithActionVerb ? (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Starts with a strong action verb.</p>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
            <AlertTriangle className="w-3 h-3" /> Start with a strong verb — try {STRONG_ACTION_VERBS.slice(0, 5).join(', ')}...
          </p>
        )}
        {result.hasQuantifiableMetric ? (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Includes a quantifiable metric.</p>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-amber-400"><AlertTriangle className="w-3 h-3" /> Add a number, %, or count — quantify the impact.</p>
        )}
        {result.fillerPhrasesFound.length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
            <AlertTriangle className="w-3 h-3" /> Cut filler phrasing: {result.fillerPhrasesFound.join(', ')}
          </p>
        )}
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 px-4 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition mb-4"
      >
        <Save className="w-3.5 h-3.5" /> Save Optimized Activity
      </button>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {commonAppActivities.length === 0 ? (
          <p className="text-xs text-slate-500">No saved activities yet.</p>
        ) : (
          commonAppActivities.map((a) => (
            <div key={a.id} className="bg-cf-bg border border-cf-border rounded-md p-2.5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs text-white flex-1">{a.optimizedText}</p>
                <button onClick={() => deleteCommonAppActivity(a.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">{a.optimizedText.length} chars</p>
              <textarea
                rows={1}
                value={a.optimizedText}
                onChange={(e) => updateCommonAppActivity(a.id, e.target.value.slice(0, 150))}
                className="w-full bg-cf-card border border-cf-border rounded p-1.5 text-[11px] text-slate-300 resize-none focus:outline-cf-accent mt-1"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
