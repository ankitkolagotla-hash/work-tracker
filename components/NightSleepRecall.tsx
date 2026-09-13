'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { REGISTERED_COURSES, DrillCard } from '../types/assessment';
import { useSystemDate } from '../store/useSystemDateStore';
import { addDays, toDateOnly } from '../lib/date';
import { Moon, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

const RECALL_DECK_SIZE = 12;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface DeckCard {
  assessmentId: string;
  card: DrillCard;
}

/**
 * End-of-day nightly consolidation: a one-click cross-domain summary of what
 * got done today, plus a rapid ~10-minute flashcard recall pass over the
 * active test-prep modules due today or tomorrow — the highest-value moment
 * to reinforce material right before sleep.
 */
export const NightSleepRecall: React.FC = () => {
  const today = useSystemDate();
  const assessments = useAssessmentStore((s) => s.assessments);
  const studyLogs = useAssessmentStore((s) => s.studyLogs);
  const logStudySession = useAssessmentStore((s) => s.logStudySession);
  const actSectionSessions = useLifeOSStore((s) => s.actSectionSessions);
  const trainingLogs = useLifeOSStore((s) => s.trainingLogs);
  const coldEmailLogs = useLifeOSStore((s) => s.coldEmailLogs);

  const [recallActive, setRecallActive] = useState(false);
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, { correct: number; attempted: number }>>({});
  const [logged, setLogged] = useState(false);

  const tomorrow = addDays(today, 1);

  const completedToday = useMemo(
    () => assessments.filter((a) => toDateOnly(a.dueDate) === today && a.status === 'Completed').length,
    [assessments, today]
  );
  const academicMinutesToday = useMemo(
    () => studyLogs.filter((l) => toDateOnly(l.timestamp) === today).reduce((acc, l) => acc + l.durationMinutes, 0),
    [studyLogs, today]
  );
  const actMinutesToday = useMemo(
    () => actSectionSessions.filter((s) => s.date === today).reduce((acc, s) => acc + s.minutesSpent, 0),
    [actSectionSessions, today]
  );
  const trainingMinutesToday = useMemo(
    () => trainingLogs.filter((t) => t.date === today).reduce((acc, t) => acc + t.durationMinutes, 0),
    [trainingLogs, today]
  );
  const outreachToday = useMemo(
    () => coldEmailLogs.filter((l) => l.sentDate && toDateOnly(l.sentDate) === today).length,
    [coldEmailLogs, today]
  );

  const activeModules = useMemo(
    () =>
      assessments.filter(
        (a) =>
          (toDateOnly(a.dueDate) === today || toDateOnly(a.dueDate) === tomorrow) &&
          a.status !== 'Completed' &&
          a.studyPack.flashcards.length > 0
      ),
    [assessments, today, tomorrow]
  );

  const beginRecall = () => {
    const pool: DeckCard[] = activeModules.flatMap((a) => a.studyPack.flashcards.map((card) => ({ assessmentId: a.id, card })));
    setDeck(shuffle(pool).slice(0, RECALL_DECK_SIZE));
    setIdx(0);
    setFlipped(false);
    setResults({});
    setLogged(false);
    setRecallActive(true);
  };

  const handleMark = (correct: boolean) => {
    const current = deck[idx];
    setResults((prev) => {
      const existing = prev[current.assessmentId] ?? { correct: 0, attempted: 0 };
      return { ...prev, [current.assessmentId]: { correct: existing.correct + (correct ? 1 : 0), attempted: existing.attempted + 1 } };
    });
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  const handleLogResults = () => {
    Object.entries(results).forEach(([assessmentId, r]) => {
      const pct = Math.round((r.correct / r.attempted) * 100);
      logStudySession(assessmentId, 'Flashcard Drill', pct);
    });
    setLogged(true);
  };

  if (recallActive) {
    if (deck.length === 0) {
      return (
        <div className="bg-cf-card border border-cf-border rounded-xl p-6">
          <p className="text-xs text-slate-400 mb-3">No flashcards found in modules due today or tomorrow.</p>
          <button onClick={() => setRecallActive(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition">
            Close
          </button>
        </div>
      );
    }

    if (idx >= deck.length) {
      const totalAttempted = Object.values(results).reduce((acc, r) => acc + r.attempted, 0);
      const totalCorrect = Object.values(results).reduce((acc, r) => acc + r.correct, 0);
      return (
        <div className="bg-cf-card border border-cf-border rounded-xl p-6 text-center">
          <Sparkles className="w-6 h-6 text-cf-accent mx-auto mb-2" />
          <p className="text-2xl font-mono font-bold text-cf-accent mb-1">{totalCorrect} / {totalAttempted}</p>
          <p className="text-xs text-slate-400 mb-4">recalled correctly across {Object.keys(results).length} module(s)</p>
          <div className="flex gap-2 justify-center">
            {!logged ? (
              <button onClick={handleLogResults} className="px-4 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
                Log to Readiness
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 px-4 py-2">
                <CheckCircle2 className="w-4 h-4" /> Logged
              </span>
            )}
            <button onClick={() => setRecallActive(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition">
              Close
            </button>
          </div>
        </div>
      );
    }

    const current = deck[idx];
    const assessment = assessments.find((a) => a.id === current.assessmentId);
    const course = REGISTERED_COURSES.find((c) => c.id === assessment?.courseId);

    return (
      <div className="bg-cf-card border border-cf-border rounded-xl p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500">
            Card {idx + 1}/{deck.length} · <span style={{ color: course?.color }}>{course?.name}</span>
          </span>
          <button onClick={() => setRecallActive(false)} className="text-xs text-slate-500 hover:text-white">Exit</button>
        </div>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="w-full min-h-[120px] flex items-center justify-center text-center bg-cf-bg border border-cf-border rounded-lg p-6 mb-4 transition hover:border-slate-600"
        >
          <p className="text-sm text-white">{flipped ? current.card.answer : current.card.prompt}</p>
        </button>
        {!flipped ? (
          <button onClick={() => setFlipped(true)} className="w-full px-4 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition">
            Reveal Answer
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleMark(false)} className="px-4 py-2 bg-red-950/50 border border-red-800 hover:bg-red-900/50 text-red-300 text-xs font-semibold rounded transition">
              Missed It
            </button>
            <button onClick={() => handleMark(true)} className="px-4 py-2 bg-emerald-950/50 border border-emerald-800 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold rounded transition">
              Got It
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6">
      <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Moon className="w-4 h-4 text-cf-accent" /> End-of-Day Nightly Consolidation
      </h2>
      <p className="text-xs text-slate-400 mb-4">Cross-domain summary, plus a rapid recall pass before sleep locks in tomorrow's material.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <SummaryStat label="Tasks Completed" value={completedToday} />
        <SummaryStat label="Academic Minutes" value={academicMinutesToday} />
        <SummaryStat label="ACT + Training Min" value={actMinutesToday + trainingMinutesToday} />
        <SummaryStat label="Outreach Sent" value={outreachToday} />
      </div>

      <button
        onClick={beginRecall}
        disabled={activeModules.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cf-accent hover:opacity-90 disabled:opacity-40 text-black font-semibold rounded transition text-sm"
      >
        <RotateCcw className="w-4 h-4" /> Begin 10-Minute Sleep Recall {activeModules.length > 0 ? `(${activeModules.length} module${activeModules.length === 1 ? '' : 's'})` : ''}
      </button>
      {activeModules.length === 0 && <p className="text-[11px] text-slate-500 mt-2">No flashcard modules due today or tomorrow yet.</p>}
    </div>
  );
};

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-cf-bg border border-cf-border rounded-lg p-3 text-center">
      <p className="text-xl font-mono font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
