'use client';
import React, { useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import {
  COLD_EMAIL_TEMPLATES,
  DEADLINE_CATEGORIES,
  DeadlineCategory,
  UniversityStatus,
  ColdEmailStatus,
  AdvocacyDraftType,
} from '../types/lifeOs';
import { Mail, GraduationCap, FileText, Copy, Trash2, ShieldCheck } from 'lucide-react';

const UNIVERSITY_STATUSES: UniversityStatus[] = ['Researching', 'Essays In Progress', 'Submitted', 'Decision Received'];
const COLD_EMAIL_STATUSES: ColdEmailStatus[] = ['Draft', 'Sent', 'Replied', 'No Response'];
const ADVOCACY_TYPES: AdvocacyDraftType[] = ['Recommendation Request', 'Contextual Framing', 'Medical Justification'];

export const CollegeOutreachHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <ColdEmailStudio />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdmissionsTracker />
        <AdvocacySuite />
      </div>
    </div>
  );
};

function ColdEmailStudio() {
  const { coldEmailLogs, addColdEmailLog, updateColdEmailStatus, deleteColdEmailLog } = useLifeOSStore();
  const [templateId, setTemplateId] = useState(COLD_EMAIL_TEMPLATES[0].id);
  const [recipientName, setRecipientName] = useState('');
  const [institution, setInstitution] = useState('');
  const [copied, setCopied] = useState(false);

  const template = COLD_EMAIL_TEMPLATES.find((t) => t.id === templateId) ?? COLD_EMAIL_TEMPLATES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const handleLog = () => {
    if (!recipientName.trim()) return;
    addColdEmailLog({
      templateId: template.id,
      recipientName: recipientName.trim(),
      institution: institution.trim(),
      sentDate: new Date().toISOString(),
      status: 'Sent',
    });
    setRecipientName('');
    setInstitution('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4 text-cf-accent" /> Cold Email Studio
      </h3>
      <p className="text-xs text-slate-400 mb-4">Pre-configured outreach for research on socioeconomic inequality, urban heat islands, and public policy.</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {COLD_EMAIL_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplateId(t.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              templateId === t.id ? 'bg-cf-accent text-black border-cf-accent' : 'bg-cf-bg border-cf-border text-slate-300'
            }`}
          >
            {t.category}
          </button>
        ))}
      </div>

      <div className="bg-cf-bg border border-cf-border rounded-lg p-4 mb-3">
        <p className="text-xs text-slate-500 mb-1">Subject</p>
        <p className="text-sm text-white mb-3">{template.subject}</p>
        <p className="text-xs text-slate-500 mb-1">Body</p>
        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
      </div>

      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition mb-4"
      >
        <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Professor name"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
      </div>
      <button onClick={handleLog} className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition mb-4">
        Log as Sent
      </button>

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
        <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Draft content..."
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
