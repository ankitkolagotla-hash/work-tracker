'use client';
import React, { useState } from 'react';
import { humanizeDraft } from '../lib/humanizer';
import { DualDraft } from '../lib/humanizer';
import { PenTool, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Named AssignmentStudioModal per spec, but rendered as the full "Assignment
 * Studio" tab body rather than a popup overlay — the tab already is the
 * dedicated screen for this workflow, so a further modal on top would just
 * add a redundant layer.
 */
export const AssignmentStudioModal: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [draft, setDraft] = useState<DualDraft | null>(null);
  const [mode, setMode] = useState<'A' | 'B'>('A');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const handleGenerate = () => {
    if (!rawText.trim()) return;
    setDraft(humanizeDraft(rawText));
    setMode('A');
  };

  const copyText = async (text: string, which: 'A' | 'B') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'A') {
        setCopiedA(true);
        setTimeout(() => setCopiedA(false), 1500);
      } else {
        setCopiedB(true);
        setTimeout(() => setCopiedB(false), 1500);
      }
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-cf-card border border-cf-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-cf-accent" /> Assignment Studio
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Paste an assignment prompt or draft text (copy-pasted from a PDF works too). Generates a modular
          paraphrasable stem draft (Mode A) and a H.E.A.R.T.-cleaned draft (Mode B), audited against Wikipedia&apos;s
          signs of AI writing.
        </p>
        <textarea
          rows={8}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste your assignment prompt or draft text here..."
          className="w-full bg-cf-bg border border-cf-border rounded p-3 text-sm text-slate-200 resize-none focus:outline-cf-accent mb-3"
        />
        <button
          onClick={handleGenerate}
          disabled={!rawText.trim()}
          className="px-5 py-2.5 bg-cf-accent hover:opacity-90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black font-semibold rounded transition text-sm"
        >
          Generate Dual Drafts
        </button>
      </div>

      {draft && (
        <div className="bg-cf-card border border-cf-border rounded-xl p-6">
          <div className="flex items-center gap-1 bg-cf-bg border border-cf-border rounded-lg p-1 mb-4 w-fit">
            <button
              onClick={() => setMode('A')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition ${mode === 'A' ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'}`}
            >
              Mode A · Paraphrase Stems
            </button>
            <button
              onClick={() => setMode('B')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition ${mode === 'B' ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'}`}
            >
              Mode B · Humanized Draft
            </button>
          </div>

          {mode === 'A' ? (
            <div>
              {draft.paraphraseStems.length === 0 ? (
                <p className="text-xs text-slate-500 mb-4">No sentences detected in the pasted text.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {draft.paraphraseStems.map((s, i) => (
                    <div key={i} className="bg-cf-bg border border-cf-border rounded-lg p-3">
                      <p className="text-sm text-white font-mono mb-2">{i + 1}. {s.stem}</p>
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer select-none">Reference (do not copy verbatim)</summary>
                        <p className="mt-1 text-slate-400">{s.reference}</p>
                      </details>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => copyText(draft.paraphraseStems.map((s, i) => `${i + 1}. ${s.stem}`).join('\n'), 'A')}
                disabled={draft.paraphraseStems.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition"
              >
                <Copy className="w-3.5 h-3.5" /> {copiedA ? 'Copied!' : 'Copy Stems'}
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-cf-bg border border-cf-border rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{draft.humanizedDraft || '—'}</p>
              </div>
              <button
                onClick={() => copyText(draft.humanizedDraft, 'B')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition mb-6"
              >
                <Copy className="w-3.5 h-3.5" /> {copiedB ? 'Copied!' : 'Copy Humanized Draft'}
              </button>

              <h4 className="text-xs font-bold uppercase tracking-wider text-cf-accent mb-3">Wikipedia Tells &amp; H.E.A.R.T. Audit</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-mono font-bold text-cf-accent">{draft.audit.score}</span>
                <span className="text-xs text-slate-500">/ 100 clean</span>
              </div>

              {draft.audit.findings.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 mb-3">
                  <CheckCircle2 className="w-4 h-4" /> No formulaic AI-writing tells detected.
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {draft.audit.findings.map((f, i) => (
                    <div key={i} className="bg-amber-950/30 border border-amber-900/60 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-300">{f.pattern}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{f.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {draft.audit.missingEmpiricalSignals.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400">Missing empirical signals:</p>
                  {draft.audit.missingEmpiricalSignals.map((m, i) => (
                    <p key={i} className="text-xs text-slate-500">• {m}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
