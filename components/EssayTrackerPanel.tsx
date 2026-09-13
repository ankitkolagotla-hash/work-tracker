'use client';
import React, { useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { EssayStatus } from '../types/lifeOs';
import { FileEdit, Trash2, Plus } from 'lucide-react';

const ESSAY_STATUSES: EssayStatus[] = ['Not Started', 'Brainstorming', 'Drafting', 'Final'];

const STATUS_COLORS: Record<EssayStatus, string> = {
  'Not Started': '#94A3B8',
  Brainstorming: '#818CF8',
  Drafting: '#FBBF24',
  Final: '#34D399',
};

export const EssayTrackerPanel: React.FC = () => {
  const { targetUniversities, supplementalEssays, addEssay, updateEssayDraft, updateEssayStatus, deleteEssay } = useLifeOSStore();
  const [universityId, setUniversityId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [wordLimit, setWordLimit] = useState(250);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId || !prompt.trim()) return;
    addEssay({ universityId, prompt: prompt.trim(), wordLimit, draft: '', status: 'Not Started' });
    setPrompt('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <FileEdit className="w-4 h-4 text-cf-accent" /> Essay Tracker
      </h3>
      <p className="text-xs text-slate-400 mb-4">Supplemental prompts, word limits, and draft status per school.</p>

      {targetUniversities.length === 0 ? (
        <p className="text-xs text-slate-500 mb-3">Add a target university below first, then track its essays here.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 mb-4">
          <select
            value={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
            className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          >
            <option value="">Select university...</option>
            {targetUniversities.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Essay prompt"
            className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={wordLimit}
              onChange={(e) => setWordLimit(Number(e.target.value))}
              placeholder="Word limit"
              className="w-28 bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
            />
            <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
              <Plus className="w-3.5 h-3.5" /> Add Essay
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {supplementalEssays.length === 0 ? (
          <p className="text-xs text-slate-500">No essays tracked yet.</p>
        ) : (
          supplementalEssays.map((essay) => {
            const university = targetUniversities.find((u) => u.id === essay.universityId);
            const wordCount = essay.draft.trim().length === 0 ? 0 : essay.draft.trim().split(/\s+/).length;
            return (
              <div key={essay.id} className="bg-cf-bg border border-cf-border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{university?.name ?? 'Unknown school'}</p>
                    <p className="text-[11px] text-slate-400">{essay.prompt}</p>
                  </div>
                  <button onClick={() => deleteEssay(essay.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={essay.draft}
                  onChange={(e) => updateEssayDraft(essay.id, e.target.value)}
                  placeholder="Draft..."
                  className="w-full bg-cf-card border border-cf-border rounded p-2 text-xs text-slate-200 resize-none focus:outline-cf-accent mb-1.5"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono ${wordCount > essay.wordLimit ? 'text-red-400' : 'text-slate-500'}`}>
                    {wordCount} / {essay.wordLimit} words
                  </span>
                  <select
                    value={essay.status}
                    onChange={(e) => updateEssayStatus(essay.id, e.target.value as EssayStatus)}
                    className="bg-cf-card border border-cf-border rounded px-1.5 py-1 text-[10px]"
                    style={{ color: STATUS_COLORS[essay.status] }}
                  >
                    {ESSAY_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
