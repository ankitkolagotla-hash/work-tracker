'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { HIGHLIGHT_SKILLS, HighlightSkill, CoachContactStatus, TrainingSessionType } from '../types/lifeOs';
import { sequenceReel } from '../lib/reelSequencer';
import { Shirt, Film, Send, Dumbbell, Trash2, Plus, Clapperboard, CheckCircle2 } from 'lucide-react';

const COACH_STATUSES: CoachContactStatus[] = ['Not Contacted', 'Emailed', 'Responded', 'Following Up', 'No Response'];
const TRAINING_TYPES: TrainingSessionType[] = ['Strength', 'Conditioning', 'Technical', 'Recovery'];

export const AthleticsHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatchLogPanel />
        <HighlightReelPanel />
      </div>
      <ReelSequencerPanel />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CoachPipelinePanel />
        <TrainingLogPanel />
      </div>
    </div>
  );
};

function MatchLogPanel() {
  const { matchLogs, addMatchLog, deleteMatchLog } = useLifeOSStore();
  const [opponent, setOpponent] = useState('');
  const [competition, setCompetition] = useState('ECNL');
  const [minutesPlayed, setMinutesPlayed] = useState(90);
  const [position, setPosition] = useState('');
  const [tacticalNotes, setTacticalNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) return;
    addMatchLog({
      date: new Date().toISOString().slice(0, 10),
      opponent: opponent.trim(),
      competition,
      minutesPlayed,
      position: position.trim(),
      tacticalNotes,
      filmReviewed: false,
    });
    setOpponent('');
    setPosition('');
    setTacticalNotes('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Shirt className="w-4 h-4 text-cf-accent" /> Match Log
      </h3>
      <p className="text-xs text-slate-400 mb-4">Showcase &amp; match schedule, minutes played, captaincy notes.</p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Opponent"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
          <select value={competition} onChange={(e) => setCompetition(e.target.value)}
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent">
            <option>ECNL</option>
            <option>Showcase</option>
            <option>League</option>
            <option>Tournament</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={minutesPlayed} onChange={(e) => setMinutesPlayed(Number(e.target.value))} placeholder="Minutes played"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
          <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Position"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        </div>
        <input value={tacticalNotes} onChange={(e) => setTacticalNotes(e.target.value)} placeholder="Tactical / captaincy notes"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <button type="submit" className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          Log Match
        </button>
      </form>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {matchLogs.length === 0 ? (
          <p className="text-xs text-slate-500">No matches logged yet.</p>
        ) : (
          matchLogs.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">vs {m.opponent} · {m.competition}</div>
                <div className="text-slate-500">{m.minutesPlayed} min{m.position ? ` · ${m.position}` : ''}</div>
              </div>
              <button onClick={() => deleteMatchLog(m.id)} className="text-slate-500 hover:text-red-400 shrink-0 ml-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HighlightReelPanel() {
  const { highlightClips, addHighlightClip, deleteHighlightClip } = useLifeOSStore();
  const [matchName, setMatchName] = useState('');
  const [opponent, setOpponent] = useState('');
  const [timestampStart, setTimestampStart] = useState('');
  const [timestampEnd, setTimestampEnd] = useState('');
  const [clipUrl, setClipUrl] = useState('');
  const [skillsShown, setSkillsShown] = useState<HighlightSkill[]>([]);
  const [notes, setNotes] = useState('');

  const toggleSkill = (skill: HighlightSkill) => {
    setSkillsShown((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipUrl.trim() || !matchName.trim()) return;
    addHighlightClip({
      matchName: matchName.trim(),
      opponent: opponent.trim(),
      timestampStart: timestampStart.trim(),
      timestampEnd: timestampEnd.trim(),
      clipUrl: clipUrl.trim(),
      skillsShown,
      notes,
    });
    setMatchName('');
    setOpponent('');
    setTimestampStart('');
    setTimestampEnd('');
    setClipUrl('');
    setSkillsShown([]);
    setNotes('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Film className="w-4 h-4 text-cf-accent" /> Highlight Reel Production
      </h3>
      <p className="text-xs text-slate-400 mb-4">Clip intake: match, timestamps, link, and the skills each clip showcases.</p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <input value={matchName} onChange={(e) => setMatchName(e.target.value)} placeholder="Match name"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
          <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Opponent"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={timestampStart} onChange={(e) => setTimestampStart(e.target.value)} placeholder="Start (12:34)"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
          <input value={timestampEnd} onChange={(e) => setTimestampEnd(e.target.value)} placeholder="End (12:48)"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        </div>
        <input value={clipUrl} onChange={(e) => setClipUrl(e.target.value)} placeholder="Clip link or file reference"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <div className="flex flex-wrap gap-1.5">
          {HIGHLIGHT_SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`text-[10px] font-semibold px-2 py-1 rounded border transition ${
                skillsShown.includes(skill) ? 'bg-cf-accent text-black border-cf-accent' : 'bg-cf-bg border-cf-border text-slate-400'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <button type="submit" className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          Add Clip
        </button>
      </form>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {highlightClips.length === 0 ? (
          <p className="text-xs text-slate-500">No clips marked yet.</p>
        ) : (
          highlightClips.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">
                  {c.matchName} vs {c.opponent} · {c.timestampStart}–{c.timestampEnd}
                </div>
                <div className="text-slate-500 truncate">{c.skillsShown.join(', ') || 'Untagged'} · {c.clipUrl}</div>
              </div>
              <button onClick={() => deleteHighlightClip(c.id)} className="text-slate-500 hover:text-red-400 shrink-0 ml-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReelSequencerPanel() {
  const highlightClips = useLifeOSStore((s) => s.highlightClips);
  const sequenced = useMemo(() => sequenceReel(highlightClips), [highlightClips]);

  const minutes = Math.floor(sequenced.estimatedSeconds / 60);
  const seconds = sequenced.estimatedSeconds % 60;
  const overUnderLabel =
    sequenced.overUnderSeconds === 0
      ? 'right on target'
      : sequenced.overUnderSeconds > 0
      ? `${sequenced.overUnderSeconds}s over the 3:00 target`
      : `${Math.abs(sequenced.overUnderSeconds)}s under the 3:00 target`;

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Clapperboard className="w-4 h-4 text-cf-accent" /> Adaptive Reel Sequencer
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Deterministic rule-based ordering — not AI-generated — arranging clips into the recruiting-tape structure scouts expect: Hook, then
        Core Skill Isolation, then High-Pressure Sequences.
      </p>

      {highlightClips.length === 0 ? (
        <p className="text-xs text-slate-500">Add clips above to generate a sequenced tape.</p>
      ) : (
        <>
          <div className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-lg p-3 mb-4">
            <span className="text-xs text-slate-400">Estimated runtime (~12s/clip)</span>
            <span className="font-mono font-bold text-cf-accent text-sm">
              {minutes}:{seconds.toString().padStart(2, '0')} <span className="text-slate-500 text-[11px] font-normal">({overUnderLabel})</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ReelSegmentColumn title="Hook" clips={sequenced.hook} />
            <ReelSegmentColumn title="Core Skill Isolation" clips={sequenced.coreSkills} />
            <ReelSegmentColumn title="High-Pressure Sequences" clips={sequenced.highPressure} />
          </div>
        </>
      )}
    </div>
  );
}

function ReelSegmentColumn({ title, clips }: { title: string; clips: ReturnType<typeof sequenceReel>['hook'] }) {
  return (
    <div className="bg-cf-bg border border-cf-border rounded-lg p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-cf-accent mb-2">{title} ({clips.length})</p>
      <div className="space-y-1.5">
        {clips.length === 0 ? (
          <p className="text-[11px] text-slate-500">No clips in this segment.</p>
        ) : (
          clips.map((c) => (
            <div key={c.id} className="text-[11px] text-slate-300 truncate">
              {c.matchName} · {c.timestampStart}–{c.timestampEnd}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CoachPipelinePanel() {
  const { coachContacts, addCoachContact, updateCoachStatus, markTapeSent, deleteCoachContact } = useLifeOSStore();
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
      status: 'Not Contacted',
      lastContactDate: null,
      tapeSentDate: null,
      notes: '',
    });
    setSchoolName('');
    setCoachName('');
    setEmail('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Send className="w-4 h-4 text-cf-accent" /> College Coach Pipeline
      </h3>
      <p className="text-xs text-slate-400 mb-4">Track outreach status per program.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-2 mb-4">
        <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Coach name"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        <button type="submit" className="col-span-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </form>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {coachContacts.length === 0 ? (
          <p className="text-xs text-slate-500">No coach contacts yet.</p>
        ) : (
          coachContacts.map((c) => (
            <div key={c.id} className="bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold truncate">{c.schoolName}</div>
                  <div className="text-slate-500 truncate">{c.coachName}</div>
                </div>
                <select
                  value={c.status}
                  onChange={(e) => updateCoachStatus(c.id, e.target.value as CoachContactStatus)}
                  className="bg-cf-card border border-cf-border rounded px-1.5 py-1 text-[10px] text-slate-300 shrink-0"
                >
                  {COACH_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => deleteCoachContact(c.id)} className="text-slate-500 hover:text-red-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-cf-border">
                {c.tapeSentDate ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Tape sent {new Date(c.tapeSentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <button
                    onClick={() => markTapeSent(c.id)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-cf-accent hover:opacity-80"
                  >
                    <Film className="w-3 h-3" /> Mark Tape Sent
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TrainingLogPanel() {
  const { trainingLogs, addTrainingLog, deleteTrainingLog } = useLifeOSStore();
  const [sessionType, setSessionType] = useState<TrainingSessionType>('Strength');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [sorenessLevel, setSorenessLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [sleepHours, setSleepHours] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrainingLog({
      date: new Date().toISOString().slice(0, 10),
      sessionType,
      durationMinutes,
      sorenessLevel,
      sleepHours,
      notes: '',
    });
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-cf-accent" /> Training &amp; Health Log
      </h3>
      <p className="text-xs text-slate-400 mb-4">Strength/conditioning sessions, recovery, and sleep.</p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <select value={sessionType} onChange={(e) => setSessionType(e.target.value as TrainingSessionType)}
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent">
            {TRAINING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} placeholder="Duration (min)"
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Soreness (1-5)</label>
            <input type="range" min={1} max={5} value={sorenessLevel} onChange={(e) => setSorenessLevel(Number(e.target.value) as 1|2|3|4|5)}
              className="w-full" style={{ accentColor: 'rgb(var(--cf-accent))' }} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Sleep (hrs)</label>
            <input type="number" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} step={0.5}
              className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent" />
          </div>
        </div>
        <button type="submit" className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          Log Session
        </button>
      </form>

      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {trainingLogs.length === 0 ? (
          <p className="text-xs text-slate-500">No training sessions logged yet.</p>
        ) : (
          trainingLogs.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{t.sessionType} · {t.durationMinutes}m</div>
                <div className="text-slate-500">Soreness {t.sorenessLevel}/5 · {t.sleepHours}h sleep</div>
              </div>
              <button onClick={() => deleteTrainingLog(t.id)} className="text-slate-500 hover:text-red-400 shrink-0 ml-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
