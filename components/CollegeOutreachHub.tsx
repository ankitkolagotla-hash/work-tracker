'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import {
  DEADLINE_CATEGORIES,
  DeadlineCategory,
  UniversityStatus,
  ColdEmailStatus,
  ColdEmailCategory,
  ColdEmailBuilderInput,
  EmailFormalityTone,
  EmailRegisterTone,
} from '../types/lifeOs';
import { buildColdEmail } from '../lib/coldEmailBuilder';
import { Mail, GraduationCap, Copy, Trash2 } from 'lucide-react';

const UNIVERSITY_STATUSES: UniversityStatus[] = ['Researching', 'Essays In Progress', 'Submitted', 'Decision Received'];
const COLD_EMAIL_STATUSES: ColdEmailStatus[] = ['Draft', 'Sent', 'Replied', 'No Response'];
const COLD_EMAIL_CATEGORIES: ColdEmailCategory[] = [
  'Socioeconomic Inequality Research',
  'Urban Heat Islands',
  'Public Policy Research',
  'Custom',
];

export const CollegeOutreachHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <ColdEmailStudio />
      <AdmissionsTracker />
    </div>
  );
};

function ColdEmailStudio() {
  const { addColdEmailLog, coldEmailLogs, updateColdEmailStatus, deleteColdEmailLog } = useLifeOSStore();
  const [input, setInput] = useState<ColdEmailBuilderInput>({
    category: 'Socioeconomic Inequality Research',
    customTopic: '',
    professorName: '',
    university: '',
    paperFocus: '',
    studentAngle: '',
    formalityTone: 'Inquiring',
    registerTone: 'Academic',
  });
  const [copied, setCopied] = useState(false);

  const email = useMemo(() => buildColdEmail(input), [input]);

  const update = <K extends keyof ColdEmailBuilderInput>(key: K, value: ColdEmailBuilderInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const handleLog = () => {
    if (!input.professorName.trim()) return;
    addColdEmailLog({
      templateId: `dynamic-${input.category}`,
      recipientName: input.professorName.trim(),
      institution: input.university.trim(),
      sentDate: new Date().toISOString(),
      status: 'Sent',
    });
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4 text-cf-accent" /> Interactive Cold Email Builder
      </h3>
      <p className="text-xs text-slate-400 mb-4">Dynamic outreach generation with tone control — no unfilled placeholders.</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {COLD_EMAIL_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => update('category', c)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              input.category === c ? 'bg-cf-accent text-black border-cf-accent' : 'bg-cf-bg border-cf-border text-slate-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {input.category === 'Custom' && (
        <input
          value={input.customTopic}
          onChange={(e) => update('customTopic', e.target.value)}
          placeholder="Custom research topic"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent mb-2"
        />
      )}

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input value={input.professorName} onChange={(e) => update('professorName', e.target.value)} placeholder="Professor name"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={input.university} onChange={(e) => update('university', e.target.value)} placeholder="University"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input value={input.paperFocus} onChange={(e) => update('paperFocus', e.target.value)} placeholder="Recent paper / focus area"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={input.studentAngle} onChange={(e) => update('studentAngle', e.target.value)} placeholder="Your angle / independent project"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <ToneToggle
          label="Formality"
          value={input.formalityTone}
          options={['Inquiring', 'Assertive'] as EmailFormalityTone[]}
          onChange={(v) => update('formalityTone', v)}
        />
        <ToneToggle
          label="Register"
          value={input.registerTone}
          options={['Scholarly', 'Academic'] as EmailRegisterTone[]}
          onChange={(v) => update('registerTone', v)}
        />
      </div>

      <div className="bg-cf-bg border border-cf-border rounded-lg p-4 mb-3">
        <p className="text-xs text-slate-500 mb-1">Subject</p>
        <p className="text-sm text-white mb-3">{email.subject}</p>
        <p className="text-xs text-slate-500 mb-1">Body</p>
        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
        >
          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button onClick={handleLog} className="flex-1 px-3 py-1.5 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          Log as Sent
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {coldEmailLogs.map((l) => (
          <div key={l.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold truncate">{l.recipientName}</div>
              <div className="text-slate-500 truncate">{l.institution}</div>
            </div>
            <select
              value={l.status}
              onChange={(e) => updateColdEmailStatus(l.id, e.target.value as ColdEmailStatus)}
              className="bg-cf-card border border-cf-border rounded px-1.5 py-1 text-[10px] text-slate-300 shrink-0"
            >
              {COLD_EMAIL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={() => deleteColdEmailLog(l.id)} className="text-slate-500 hover:text-red-400 shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToneToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <div className="flex bg-cf-bg border border-cf-border rounded overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 text-[11px] font-semibold py-1.5 transition ${
              value === opt ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function AdmissionsTracker() {
  const { targetUniversities, addUniversity, updateUniversityStatus, deleteUniversity } = useLifeOSStore();
  const [name, setName] = useState('');
  const [deadlineCategory, setDeadlineCategory] = useState<DeadlineCategory>('RD');
  const [deadlineDate, setDeadlineDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addUniversity({
      name: name.trim(),
      deadlineCategory,
      deadlineDate: deadlineDate || '2026-11-01',
      status: 'Researching',
      notes: '',
    });
    setName('');
    setDeadlineDate('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-cf-accent" /> Admissions Tracker
      </h3>
      <p className="text-xs text-slate-400 mb-4">Target universities, deadline category, and status.</p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="University name"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <div className="grid grid-cols-2 gap-2">
          <select value={deadlineCategory} onChange={(e) => setDeadlineCategory(e.target.value as DeadlineCategory)}
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent">
            {DEADLINE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)}
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        </div>
        <button type="submit" className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          Add University
        </button>
      </form>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {targetUniversities.length === 0 ? (
          <p className="text-xs text-slate-500">No target universities added yet.</p>
        ) : (
          targetUniversities.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-white font-semibold truncate">{u.name}</div>
                <div className="text-slate-500">{u.deadlineCategory} · {u.deadlineDate}</div>
              </div>
              <select
                value={u.status}
                onChange={(e) => updateUniversityStatus(u.id, e.target.value as UniversityStatus)}
                className="bg-cf-card border border-cf-border rounded px-1.5 py-1 text-[10px] text-slate-300 shrink-0"
              >
                {UNIVERSITY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button onClick={() => deleteUniversity(u.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
