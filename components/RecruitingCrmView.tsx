'use client';
import React, { useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { COACH_PIPELINE_STAGES, CoachPipelineStage } from '../types/lifeOs';
import { Send, Plus, Trash2, Film, CheckCircle2, CalendarClock } from 'lucide-react';

const STAGE_COLORS: Record<CoachPipelineStage, string> = {
  Prospecting: '#94A3B8',
  'Initial Email Sent': '#38BDF8',
  'Film Sent': '#818CF8',
  'Campus Visit': '#FBBF24',
  'Offer / Closing': '#34D399',
};

/**
 * College Coach Communication CRM: a Kanban board across the five recruiting
 * pipeline stages (Prospecting -> Initial Email Sent -> Film Sent -> Campus
 * Visit -> Offer / Closing), with tape-sent tracking and scheduled follow-ups.
 */
export const RecruitingCrmView: React.FC = () => {
  const { coachContacts, addCoachContact, updateCoachStatus, markTapeSent, scheduleFollowUp, deleteCoachContact } = useLifeOSStore();
  const [schoolName, setSchoolName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;
    addCoachContact({
      schoolName: schoolName.trim(),
      coachName: coachName.trim(),
      email: email.trim(),
      status: 'Prospecting',
      lastContactDate: null,
      tapeSentDate: null,
      nextFollowUpDate: null,
      notes: '',
    });
    setSchoolName('');
    setCoachName('');
    setEmail('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Send className="w-4 h-4 text-cf-accent" /> College Coach Communication CRM
      </h3>
      <p className="text-xs text-slate-400 mb-4">Pipeline stages, contact info, and scheduled follow-ups per program.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-5">
        <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Coach name"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <button type="submit" className="flex items-center justify-center gap-1.5 px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </form>

      {coachContacts.length === 0 ? (
        <p className="text-xs text-slate-500">No coach contacts yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
          {COACH_PIPELINE_STAGES.map((stage) => {
            const contactsInStage = coachContacts.filter((c) => c.status === stage);
            return (
              <div key={stage} className="bg-cf-bg border border-cf-border rounded-lg p-3 min-h-[140px]">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b"
                  style={{ color: STAGE_COLORS[stage], borderColor: `${STAGE_COLORS[stage]}40` }}
                >
                  {stage} ({contactsInStage.length})
                </p>
                <div className="space-y-2">
                  {contactsInStage.map((c) => (
                    <div key={c.id} className="bg-cf-card border border-cf-border rounded-md p-2 space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-white truncate">{c.schoolName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{c.coachName}</p>
                        </div>
                        <button onClick={() => deleteCoachContact(c.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <select
                        value={c.status}
                        onChange={(e) => updateCoachStatus(c.id, e.target.value as CoachPipelineStage)}
                        className="w-full bg-cf-bg border border-cf-border rounded px-1 py-1 text-[10px] text-slate-300"
                      >
                        {COACH_PIPELINE_STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      {c.tapeSentDate ? (
                        <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Tape sent {new Date(c.tapeSentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ) : (
                        <button onClick={() => markTapeSent(c.id)} className="flex items-center gap-1 text-[9px] font-semibold text-cf-accent hover:opacity-80">
                          <Film className="w-2.5 h-2.5" /> Mark Tape Sent
                        </button>
                      )}

                      <div className="flex items-center gap-1">
                        <CalendarClock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        <input
                          type="date"
                          value={c.nextFollowUpDate ?? ''}
                          onChange={(e) => scheduleFollowUp(c.id, e.target.value)}
                          className="w-full bg-cf-bg border border-cf-border rounded px-1 py-0.5 text-[9px] text-slate-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
