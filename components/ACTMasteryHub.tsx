'use client';
import React, { useMemo, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { ACT_SECTIONS, ACT_ROOT_CAUSES, ACT_TARGET_DATE, ACTSection, ACTRootCause, ACTDrillQuestion } from '../types/lifeOs';
import { generateAdaptiveDrillSet } from '../lib/actDrills';
import { dateStrToTimestamp, formatFullDate } from '../lib/date';
import { Target, AlertOctagon, Zap, CalendarClock, Trash2, Check } from 'lucide-react';

function daysUntil(dateStr: string): number {
  const now = dateStrToTimestamp('2026-09-11');
  const target = dateStrToTimestamp(dateStr);
  return Math.round((target - now) / 86400000);
}

export const ACTMasteryHub: React.FC = () => {
  const {
    actSectionScores,
    actErrorLog,
    actMockExams,
    updateSectionScore,
    logACTError,
    deleteACTError,
    toggleMockExamComplete,
  } = useLifeOSStore();

  const [drillActive, setDrillActive] = useState(false);
  const [drillSet, setDrillSet] = useState<ACTDrillQuestion[]>([]);

  const composite = useMemo(() => {
    const sum = actSectionScores.reduce((acc, s) => acc + s.current, 0);
    return Math.round(sum / actSectionScores.length);
  }, [actSectionScores]);

  const targetComposite = useMemo(() => {
    const sum = actSectionScores.reduce((acc, s) => acc + s.target, 0);
    return Math.round(sum / actSectionScores.length);
  }, [actSectionScores]);

  const daysLeft = daysUntil(ACT_TARGET_DATE);

  const launchDrills = () => {
    setDrillSet(generateAdaptiveDrillSet(actErrorLog, 5));
    setDrillActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-cf-card border border-cf-border rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cf-accent" /> ACT Intensive Mastery Station
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <CalendarClock className="w-3.5 h-3.5 text-cf-accent" />
            <span className="text-slate-400">Target: {formatFullDate(ACT_TARGET_DATE)}</span>
            <span className="font-mono font-bold text-cf-accent">{daysLeft} days left</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {actSectionScores.map((s) => (
            <div key={s.section} className="bg-cf-bg border border-cf-border rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">{s.section}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <input
                  type="number"
                  value={s.current}
                  onChange={(e) => updateSectionScore(s.section, Number(e.target.value))}
                  className="w-12 bg-transparent text-xl font-mono font-bold text-white focus:outline-none border-b border-cf-border focus:border-cf-accent"
                  min={1}
                  max={36}
                />
                <span className="text-xs text-slate-500">/ {s.target} target</span>
              </div>
              <div className="w-full bg-cf-card rounded-full h-1.5 overflow-hidden">
                <div className="bg-cf-accent h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (s.current / s.target) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-lg p-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Composite Score</p>
            <p className="text-3xl font-mono font-bold text-cf-accent">{composite}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Target composite: <span className="text-white font-mono">{targetComposite}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorLogPanel actErrorLog={actErrorLog} logACTError={logACTError} deleteACTError={deleteACTError} />

        <div className="bg-cf-card border border-cf-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cf-accent" /> Adaptive Drill Engine
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Generates a rapid-fire set weighted toward your most-logged error tags.
          </p>

          {!drillActive ? (
            <button
              onClick={launchDrills}
              className="px-5 py-2.5 bg-cf-accent hover:opacity-90 text-black font-semibold rounded transition text-sm"
            >
              Launch Targeted Drill Set
            </button>
          ) : (
            <DrillRunnerMini questions={drillSet} onExit={() => setDrillActive(false)} />
          )}
        </div>
      </div>

      <div className="bg-cf-card border border-cf-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Saturday Full-Length Simulation Tracker</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actMockExams.map((exam) => {
            const remaining = daysUntil(exam.date);
            return (
              <button
                key={exam.id}
                onClick={() => toggleMockExamComplete(exam.id)}
                className={`text-left bg-cf-bg border rounded-lg p-4 transition ${
                  exam.completed ? 'border-emerald-700' : 'border-cf-border hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{formatFullDate(exam.date).split(',').slice(0, 2).join(',')}</span>
                  {exam.completed && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400 mb-2">{exam.scheduledTime} full-length mock</p>
                <div className="flex flex-wrap gap-1">
                  {exam.sectionSplits.map((sp) => (
                    <span key={sp.section} className="text-[10px] text-slate-500 bg-cf-card border border-cf-border rounded px-1.5 py-0.5">
                      {sp.section} {sp.minutes}m
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">{remaining >= 0 ? `${remaining} days out` : 'Past'}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function ErrorLogPanel({
  actErrorLog,
  logACTError,
  deleteACTError,
}: {
  actErrorLog: import('../types/lifeOs').ACTErrorLogEntry[];
  logACTError: (entry: Omit<import('../types/lifeOs').ACTErrorLogEntry, 'id'>) => void;
  deleteACTError: (id: string) => void;
}) {
  const [section, setSection] = useState<ACTSection>('English');
  const [questionType, setQuestionType] = useState('');
  const [rootCause, setRootCause] = useState<ACTRootCause>('Content Gap');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionType.trim()) return;
    logACTError({
      testDate: new Date().toISOString().slice(0, 10),
      section,
      questionType: questionType.trim(),
      rootCause,
      notes,
    });
    setQuestionType('');
    setNotes('');
  };

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <AlertOctagon className="w-4 h-4 text-cf-accent" /> Error Diagnostics Log
      </h3>
      <p className="text-xs text-slate-400 mb-4">Log each missed question so the drill engine can target it.</p>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as ACTSection)}
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          >
            {ACT_SECTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value as ACTRootCause)}
            className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
          >
            {ACT_ROOT_CAUSES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          placeholder="Question type (e.g., Comma Splices, Paired Passages)"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
        />
        <button
          type="submit"
          className="w-full px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition"
        >
          Log Error
        </button>
      </form>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {actErrorLog.length === 0 ? (
          <p className="text-xs text-slate-500">No errors logged yet.</p>
        ) : (
          actErrorLog.map((e) => (
            <div key={e.id} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{e.questionType}</div>
                <div className="text-slate-500">{e.section} · {e.rootCause}</div>
              </div>
              <button onClick={() => deleteACTError(e.id)} className="text-slate-500 hover:text-red-400 shrink-0 ml-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DrillRunnerMini({ questions, onExit }: { questions: ACTDrillQuestion[]; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) return <p className="text-xs text-slate-500">No drills available.</p>;

  if (done) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl font-mono font-bold text-cf-accent mb-1">{correct} / {questions.length}</p>
        <p className="text-xs text-slate-400 mb-3">correct this set</p>
        <button onClick={onExit} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition">
          Close
        </button>
      </div>
    );
  }

  const q = questions[idx];

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctIndex) setCorrect((c) => c + 1);
  };

  const handleNext = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-500">{q.questionType} — Q{idx + 1}/{questions.length}</span>
        <button onClick={onExit} className="text-xs text-slate-500 hover:text-white">Exit</button>
      </div>
      <p className="text-sm text-white mb-3">{q.prompt}</p>
      <div className="space-y-1.5 mb-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isSelected = selected === i;
          let cls = 'border-cf-border bg-cf-bg text-slate-200 hover:border-slate-600';
          if (selected !== null) {
            if (isCorrect) cls = 'border-emerald-700 bg-emerald-950/50 text-emerald-300';
            else if (isSelected) cls = 'border-red-700 bg-red-950/50 text-red-300';
            else cls = 'border-cf-border bg-cf-bg text-slate-500';
          }
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => handleSelect(i)}
              className={`w-full text-left px-3 py-2 rounded border text-xs transition ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button onClick={handleNext} className="px-4 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
          {idx + 1 < questions.length ? 'Next' : 'Finish'}
        </button>
      )}
    </div>
  );
}
