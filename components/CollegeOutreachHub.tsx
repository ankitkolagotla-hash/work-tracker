'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import {
  DEADLINE_CATEGORIES,
  DeadlineCategory,
  UniversityStatus,
  ColdEmailStatus,
  AdvocacyDraftType,
  ColdEmailCategory,
  ColdEmailBuilderInput,
  EmailFormalityTone,
  EmailRegisterTone,
  UniversityFitPreferences,
  CampusSize,
  LocationVibe,
  SelectivityTier,
} from '../types/lifeOs';
import { buildColdEmail } from '../lib/coldEmailBuilder';
import { matchUniversities, ALL_MAJORS } from '../lib/universityMatcher';
import { AdmissionsEngineView } from './AdmissionsEngineView';
import { EssayTrackerPanel } from './EssayTrackerPanel';
import { ActivityOptimizerPanel } from './ActivityOptimizerPanel';
import { BragSheetGenerator } from './BragSheetGenerator';
import { Mail, GraduationCap, FileText, Copy, Trash2, ShieldCheck, Compass, Info, Wand2 } from 'lucide-react';

const UNIVERSITY_STATUSES: UniversityStatus[] = ['Researching', 'Essays In Progress', 'Submitted', 'Decision Received'];
const COLD_EMAIL_STATUSES: ColdEmailStatus[] = ['Draft', 'Sent', 'Replied', 'No Response'];
const ADVOCACY_TYPES: AdvocacyDraftType[] = ['Recommendation Request', 'Contextual Framing', 'Medical Justification'];
const COLD_EMAIL_CATEGORIES: ColdEmailCategory[] = [
  'Socioeconomic Inequality Research',
  'Urban Heat Islands',
  'Public Policy Research',
  'Custom',
];

function generateAdvocacyStarter(type: AdvocacyDraftType): string {
  switch (type) {
    case 'Recommendation Request':
      return `Dear [Teacher Name],

I'm writing to ask whether you'd be willing to write a letter of recommendation for my college applications. I've valued your class this year, particularly [specific project/discussion], and I think you've seen my growth in [specific skill/quality].

I'm happy to share my resume, a draft personal statement, and a list of the schools/deadlines involved — whatever would make this easiest for you. My earliest deadline is [date], so I wanted to give you as much lead time as possible.

Thank you for considering this — I know it's a real time commitment.

Best,
[Your Name]`;
    case 'Contextual Framing':
      return `Context for [Teacher/Counselor Name]:

I wanted to share some background that might be useful context for my application, specifically around [situation — e.g., a schedule change, a family circumstance, a schedule conflict between commitments].

Here's what happened: [describe the circumstance factually and briefly].

Here's how I responded: [describe the adjustment/adaptation you made — new study system, time management change, etc.].

I'm not asking you to make excuses on my behalf — just wanted you to have the full picture in case it's relevant to anything you write or discuss with admissions officers.

Thank you,
[Your Name]`;
    case 'Medical Justification':
      return `Special Circumstances Statement — Medical Context

During [timeframe], I experienced [medical circumstance, described factually and only to the extent you're comfortable disclosing]. This affected [specific impact — e.g., attendance, a grade dip in a specific term, a delayed test date].

Supporting documentation: [name of doctor/clinic, or "available upon request"].

Since then: [describe recovery, accommodations used, or ongoing management], and my academic record from [date] onward reflects that.

I'm including this for context, not as an excuse — I want the full picture to be available to anyone evaluating my application.

[Your Name]`;
  }
}

export const CollegeOutreachHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdmissionsEngineView />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdmissionsTracker />
        <EssayTrackerPanel />
      </div>
      <ActivityOptimizerPanel />
      <ColdEmailStudio />
      <UniversityFitPanel />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdvocacySuite />
        <BragSheetGenerator />
      </div>
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

const CAMPUS_SIZES: (CampusSize | 'No Preference')[] = ['No Preference', 'Small', 'Medium', 'Large'];
const LOCATION_VIBES: (LocationVibe | 'No Preference')[] = ['No Preference', 'Urban', 'Suburban', 'Rural'];
const SELECTIVITY_TIERS: (SelectivityTier | 'No Preference')[] = ['No Preference', 'Extreme Reach', 'Reach', 'Target', 'Safety'];

function UniversityFitPanel() {
  const [prefs, setPrefs] = useState<UniversityFitPreferences>({
    targetMajors: [],
    campusSize: 'No Preference',
    locationVibe: 'No Preference',
    selectivityTier: 'No Preference',
  });

  const matches = useMemo(() => matchUniversities(prefs), [prefs]);

  const toggleMajor = (major: string) => {
    setPrefs((p) => ({
      ...p,
      targetMajors: p.targetMajors.includes(major) ? p.targetMajors.filter((m) => m !== major) : [...p.targetMajors, major],
    }));
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Compass className="w-4 h-4 text-cf-accent" /> University Fit &amp; Recommendation Engine
      </h3>
      <p className="text-xs text-slate-400 mb-3 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-cf-accent shrink-0 mt-0.5" />
        Illustrative starting list — acceptance rates and essay requirements shift yearly. Verify current figures on each school's own
        admissions page before making decisions.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Campus size</p>
          <select
            value={prefs.campusSize}
            onChange={(e) => setPrefs((p) => ({ ...p, campusSize: e.target.value as CampusSize | 'No Preference' }))}
            className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          >
            {CAMPUS_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Location vibe</p>
          <select
            value={prefs.locationVibe}
            onChange={(e) => setPrefs((p) => ({ ...p, locationVibe: e.target.value as LocationVibe | 'No Preference' }))}
            className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          >
            {LOCATION_VIBES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Selectivity tier</p>
          <select
            value={prefs.selectivityTier}
            onChange={(e) => setPrefs((p) => ({ ...p, selectivityTier: e.target.value as SelectivityTier | 'No Preference' }))}
            className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          >
            {SELECTIVITY_TIERS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-slate-500 mb-1.5">Target majors</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_MAJORS.map((major) => (
            <button
              key={major}
              onClick={() => toggleMajor(major)}
              className={`text-[10px] font-semibold px-2 py-1 rounded border transition ${
                prefs.targetMajors.includes(major) ? 'bg-cf-accent text-black border-cf-accent' : 'bg-cf-bg border-cf-border text-slate-400'
              }`}
            >
              {major}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {matches.map((m) => (
          <div key={m.university.id} className="bg-cf-bg border border-cf-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">{m.university.name}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  m.tier === 'Extreme Reach'
                    ? 'text-red-300 border-red-800 bg-red-950/40'
                    : m.tier === 'Reach'
                    ? 'text-orange-300 border-orange-800 bg-orange-950/40'
                    : m.tier === 'Target'
                    ? 'text-amber-300 border-amber-800 bg-amber-950/40'
                    : 'text-emerald-300 border-emerald-800 bg-emerald-950/40'
                }`}
              >
                {m.tier}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              ~{m.university.acceptanceRatePct}% acceptance · {m.university.campusSize} · {m.university.locationVibe} · fit score {m.matchScore}
            </p>
            <p className="text-[10px] text-slate-500 mb-1">Essay requirements</p>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5">
              {m.university.essayRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
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

function AdvocacySuite() {
  const { advocacyDrafts, upsertAdvocacyDraft, deleteAdvocacyDraft } = useLifeOSStore();
  const [type, setType] = useState<AdvocacyDraftType>('Recommendation Request');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    upsertAdvocacyDraft({ type, title: title.trim(), content });
    setTitle('');
    setContent('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-cf-accent" /> Advocacy &amp; Justification Suite
      </h3>
      <p className="text-xs text-slate-400 mb-4">Recommendation requests, contextual framing, and medical justification drafts.</p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <select value={type} onChange={(e) => setType(e.target.value as AdvocacyDraftType)}
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent">
          {ADVOCACY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g., Request to Ms. Patel — AP Bio)"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Starter draft for special circumstances / medical justification framing</span>
          <button
            type="button"
            onClick={() => setContent(generateAdvocacyStarter(type))}
            className="flex items-center gap-1 text-[10px] font-semibold text-cf-accent hover:opacity-80"
          >
            <Wand2 className="w-3 h-3" /> Generate Starter
          </button>
        </div>
        <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Draft content..."
          className="w-full bg-cf-bg border border-cf-border rounded p-2 text-xs text-white resize-none focus:outline-cf-accent" />
        <button type="submit" className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Save Draft
        </button>
      </form>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {advocacyDrafts.length === 0 ? (
          <p className="text-xs text-slate-500">No drafts saved yet.</p>
        ) : (
          advocacyDrafts.map((d) => (
            <div key={d.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs gap-2">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{d.title}</div>
                <div className="text-slate-500">{d.type}</div>
              </div>
              <button onClick={() => deleteAdvocacyDraft(d.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
