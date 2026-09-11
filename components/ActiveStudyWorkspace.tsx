'use client';
import React, { useEffect, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import {
  Assessment,
  DrillCard,
  SynthesisNote,
  MCQQuestion,
  FreeResponsePrompt,
  StudyMethod,
  PACING_MINUTES,
} from '../types/assessment';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  ListChecks,
  Zap,
  PenLine,
  Eye,
  Check,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

type StudyTab = 'notes' | 'flashcards' | 'mcq' | 'speed' | 'free';

const TABS: { id: StudyTab; label: string; icon: React.ElementType }[] = [
  { id: 'notes', label: 'Notes Review', icon: BookOpen },
  { id: 'flashcards', label: 'Flash Cards', icon: Layers },
  { id: 'mcq', label: 'MCQ Quiz', icon: ListChecks },
  { id: 'speed', label: 'Speed Drill', icon: Zap },
  { id: 'free', label: 'Free Response', icon: PenLine },
];

function formatTimer(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
}

export const ActiveStudyWorkspace: React.FC<{ assessmentId: string; onExit: () => void }> = ({ assessmentId, onExit }) => {
  const { assessments, activeSession, startStudySession, tickTimer, cancelSession, logStudySession } =
    useAssessmentStore();
  const assessment = assessments.find((a) => a.id === assessmentId);
  const [activeTab, setActiveTab] = useState<StudyTab>('notes');

  useEffect(() => {
    startStudySession(assessmentId);
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  if (!assessment) return null;

  const handleExit = () => {
    cancelSession();
    onExit();
  };

  const handleComplete = (method: StudyMethod, performanceScore: number) => {
    logStudySession(assessmentId, method, performanceScore);
  };

  const budgetMinutes = assessment.totalPrepTimeMinutes;
  const elapsedMinutes = Math.floor(activeSession.elapsedSeconds / 60);
  const budgetPct = budgetMinutes > 0 ? Math.min(100, Math.round((elapsedMinutes / budgetMinutes) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto bg-cf-card border border-cf-border rounded-xl p-8 text-slate-200 mt-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-cf-border">
        <button onClick={handleExit} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Exit Session
        </button>
        <div className="text-right">
          <div className="text-sm font-bold text-white">{assessment.title}</div>
          <div className="text-xs text-cf-accent font-mono">{assessment.readinessIndex}% Readiness</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
        <span className="font-mono">{formatTimer(activeSession.elapsedSeconds)} elapsed</span>
        <div className="flex-1 mx-3 bg-cf-bg rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${budgetPct >= 100 ? 'bg-amber-400' : 'bg-cf-accent'}`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <span className="font-mono shrink-0">{elapsedMinutes} / {budgetMinutes} min budget</span>
        <span className="ml-3 shrink-0 text-slate-500">
          Pacing: {assessment.studySessionPacing} ({PACING_MINUTES[assessment.studySessionPacing]}m blocks)
        </span>
      </div>

      <div className="flex items-center gap-1 bg-cf-bg border border-cf-border rounded-lg p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'notes' && (
        <NotesReviewPanel notes={assessment.studyPack.notes} onComplete={(score) => handleComplete('Notes Review', score)} />
      )}
      {activeTab === 'flashcards' && (
        <FlashcardPanel
          key={`flashcards-${assessmentId}`}
          cards={assessment.studyPack.flashcards}
          onComplete={(score) => handleComplete('Flashcard Drill', score)}
        />
      )}
      {activeTab === 'mcq' && (
        <MCQPanel
          key={`mcq-${assessmentId}`}
          questions={assessment.studyPack.mcqs}
          onComplete={(score) => handleComplete('MCQ Quiz', score)}
        />
      )}
      {activeTab === 'speed' && (
        <SpeedDrillPanel
          key={`speed-${assessmentId}`}
          cards={assessment.studyPack.flashcards}
          onComplete={(score) => handleComplete('Speed Drill', score)}
        />
      )}
      {activeTab === 'free' && (
        <FreeResponsePanel
          key={`free-${assessmentId}`}
          prompts={assessment.studyPack.freeResponse}
          onComplete={(score) => handleComplete('Free Response', score)}
        />
      )}
    </div>
  );
};

function EmptyState({ message }: { message: string }) {
  return <p className="text-xs text-slate-500 bg-cf-bg border border-cf-border rounded-lg p-6 text-center">{message}</p>;
}

function CompletionSummary({ correct, total, onRestart }: { correct: number; total: number; onRestart: () => void }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="text-center py-10">
      <div className="text-4xl font-mono font-bold text-cf-accent mb-2">{pct}%</div>
      <p className="text-sm text-slate-400 mb-6">{correct} of {total} correct this pass.</p>
      <button
        onClick={onRestart}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Run Again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes Review — collapsible Cornell-style synthesis notes
// ---------------------------------------------------------------------------

function NotesReviewPanel({ notes, onComplete }: { notes: SynthesisNote[]; onComplete: (score: number) => void }) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(notes.map((n) => n.id)));
  const [acknowledged, setAcknowledged] = useState(false);

  if (notes.length === 0) {
    return <EmptyState message="No structured notes yet. Add materials with Term: Definition lines or short section headings to generate a synthesis outline." />;
  }

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="space-y-3 mb-6">
        {notes.map((section) => (
          <div key={section.id} className="bg-cf-bg border border-cf-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="w-full flex justify-between items-center px-4 py-3 text-left"
            >
              <span className="text-sm font-bold text-white">{section.heading}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openIds.has(section.id) ? 'rotate-180' : ''}`} />
            </button>
            {openIds.has(section.id) && (
              <ul className="px-4 pb-4 space-y-1.5">
                {section.points.map((point, i) => (
                  <li key={i} className="text-xs text-slate-300 leading-relaxed">
                    {point.term ? (
                      <>
                        <strong className="text-white">{point.term}</strong>
                        {point.text ? <> — {point.text}</> : null}
                      </>
                    ) : (
                      point.text
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          setAcknowledged(true);
          onComplete(100);
        }}
        disabled={acknowledged}
        className="px-5 py-2.5 bg-cf-accent hover:opacity-90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black font-semibold rounded transition text-sm"
      >
        {acknowledged ? 'Notes Reviewed ✓' : 'Mark Notes Reviewed'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flash Cards — keyboard-driven two-column active recall
// ---------------------------------------------------------------------------

function FlashcardPanel({ cards, onComplete }: { cards: DrillCard[]; onComplete: (score: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const handleScore = (isCorrect: boolean) => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    setCorrect(nextCorrect);
    if (idx + 1 < cards.length) {
      setIdx(idx + 1);
      setRevealed(false);
    } else {
      setDone(true);
      onComplete(Math.round((nextCorrect / cards.length) * 100));
    }
  };

  useEffect(() => {
    if (done || cards.length === 0) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') e.preventDefault();

      if (!revealed) {
        if (e.code === 'Space') setRevealed(true);
        return;
      }

      if (e.code === 'Digit1' || e.code === 'ArrowLeft' || e.code === 'Space') {
        e.preventDefault();
        handleScore(false);
      } else if (e.code === 'Digit2' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleScore(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleScore is redefined each render and captured fresh since this effect re-subscribes on every dependency change
  }, [revealed, idx, correct, cards, done]);

  if (cards.length === 0) {
    return <EmptyState message='No flashcards yet. Add materials formatted as "Term: Definition" or "Prompt - Answer".' />;
  }
  if (done) {
    return (
      <CompletionSummary
        correct={correct}
        total={cards.length}
        onRestart={() => {
          setIdx(0);
          setCorrect(0);
          setDone(false);
          setRevealed(false);
        }}
      />
    );
  }

  const card = cards[idx];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-slate-500">Card {idx + 1} of {cards.length}</span>
        <span className="text-[11px] text-slate-500">Space reveal · 1/← Missed · 2/→/Enter Retained</span>
      </div>

      <div className="min-h-[200px] flex flex-col justify-center items-center bg-cf-bg border border-cf-border rounded-lg p-6 mb-6 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">Retrieval Trigger</p>
        <div className="text-xl font-medium text-white mb-4">{card.prompt}</div>

        {revealed ? (
          <div className="pt-4 border-t border-cf-border w-full">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-mono">Target Answer</p>
            <p className="text-md text-slate-300 font-mono">{card.answer}</p>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm transition"
          >
            <Eye className="w-4 h-4" /> Reveal Answer
          </button>
        )}
      </div>

      {revealed && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleScore(false)}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-950/60 border border-red-800 hover:bg-red-900/80 text-red-300 rounded font-medium transition"
          >
            <X className="w-4 h-4" /> Missed
          </button>
          <button
            onClick={() => handleScore(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/80 text-emerald-300 rounded font-medium transition"
          >
            <Check className="w-4 h-4" /> Retained
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MCQ Quiz — 4-option diagnostic with instant feedback
// ---------------------------------------------------------------------------

function MCQPanel({ questions, onComplete }: { questions: MCQQuestion[]; onComplete: (score: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return <EmptyState message="Not enough concepts for a multiple-choice quiz yet — add at least 2 terms to your notes." />;
  }
  if (done) {
    return (
      <CompletionSummary
        correct={correctCount}
        total={questions.length}
        onRestart={() => {
          setIdx(0);
          setSelected(null);
          setCorrectCount(0);
          setDone(false);
        }}
      />
    );
  }

  const q = questions[idx];

  const handleSelect = (optionIdx: number) => {
    if (selected !== null) return;
    setSelected(optionIdx);
    if (optionIdx === q.correctIndex) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
    } else {
      // correctCount is already up to date here: this button only renders after
      // handleSelect's setCorrectCount has been applied and the component re-rendered.
      setDone(true);
      onComplete(Math.round((correctCount / questions.length) * 100));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-slate-500">Question {idx + 1} of {questions.length}</span>
        <span className="text-xs text-slate-500 font-mono">{correctCount} correct</span>
      </div>

      <div className="bg-cf-bg border border-cf-border rounded-lg p-6 mb-4">
        <p className="text-md font-medium text-white">{q.prompt}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-6">
        {q.options.map((option, i) => {
          const isCorrectOption = i === q.correctIndex;
          const isSelected = selected === i;
          let stateClasses = 'border-cf-border hover:border-slate-600 bg-cf-bg text-slate-200';
          if (selected !== null) {
            if (isCorrectOption) stateClasses = 'border-emerald-700 bg-emerald-950/50 text-emerald-300';
            else if (isSelected) stateClasses = 'border-red-700 bg-red-950/50 text-red-300';
            else stateClasses = 'border-cf-border bg-cf-bg text-slate-500';
          }
          return (
            <button
              key={i}
              type="button"
              disabled={selected !== null}
              onClick={() => handleSelect(i)}
              className={`text-left px-4 py-3 rounded-lg border text-sm transition ${stateClasses}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-cf-accent hover:opacity-90 text-black font-semibold rounded transition text-sm"
          >
            {idx + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speed Drill — rapid-fire 10-second recall
// ---------------------------------------------------------------------------

const SPEED_DRILL_SECONDS = 10;

function SpeedDrillPanel({ cards, onComplete }: { cards: DrillCard[]; onComplete: (score: number) => void }) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPEED_DRILL_SECONDS);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setTimeLeft(SPEED_DRILL_SECONDS);
    setRevealed(false);
  }, [idx]);

  useEffect(() => {
    if (!started || done || revealed) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, revealed, started, done]);

  if (cards.length === 0) {
    return <EmptyState message="No cards available for a speed drill yet. Add structured notes first." />;
  }

  const handleScore = (isCorrect: boolean) => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    setCorrect(nextCorrect);
    if (idx + 1 < cards.length) {
      setIdx(idx + 1);
    } else {
      setDone(true);
      onComplete(Math.round((nextCorrect / cards.length) * 100));
    }
  };

  if (!started) {
    return (
      <div className="text-center py-10">
        <Zap className="w-10 h-10 text-cf-accent mx-auto mb-3" />
        <h4 className="text-sm font-bold text-white mb-2">Rapid-Fire Recall</h4>
        <p className="text-xs text-slate-400 mb-6">{SPEED_DRILL_SECONDS} seconds per prompt across {cards.length} cards. Reveal fast, self-grade faster.</p>
        <button
          onClick={() => setStarted(true)}
          className="px-5 py-2.5 bg-cf-accent hover:opacity-90 text-black font-semibold rounded transition text-sm"
        >
          Start Speed Drill
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <CompletionSummary
        correct={correct}
        total={cards.length}
        onRestart={() => {
          setIdx(0);
          setCorrect(0);
          setDone(false);
          setStarted(false);
        }}
      />
    );
  }

  const card = cards[idx];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-slate-500">Card {idx + 1} of {cards.length}</span>
        <span className={`text-xl font-mono font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-cf-accent'}`}>0:{timeLeft.toString().padStart(2, '0')}</span>
      </div>

      <div className="min-h-[180px] flex flex-col justify-center items-center bg-cf-bg border border-cf-border rounded-lg p-6 mb-6 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">Rapid Recall</p>
        <div className="text-xl font-medium text-white mb-4">{card.prompt}</div>
        {revealed ? (
          <div className="pt-4 border-t border-cf-border w-full">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-mono">Answer</p>
            <p className="text-md text-slate-300 font-mono">{card.answer}</p>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm transition"
          >
            <Eye className="w-4 h-4" /> Reveal
          </button>
        )}
      </div>

      {revealed && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleScore(false)}
            className="flex items-center gap-2 px-6 py-2 bg-red-950/60 border border-red-800 hover:bg-red-900/80 text-red-300 rounded font-medium transition text-sm"
          >
            <X className="w-4 h-4" /> Missed
          </button>
          <button
            onClick={() => handleScore(true)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/80 text-emerald-300 rounded font-medium transition text-sm"
          >
            <Check className="w-4 h-4" /> Retained
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Free Response — scenario / short-answer with expandable markscheme
// ---------------------------------------------------------------------------

function FreeResponsePanel({ prompts, onComplete }: { prompts: FreeResponsePrompt[]; onComplete: (score: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showMarkscheme, setShowMarkscheme] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [done, setDone] = useState(false);

  if (prompts.length === 0) {
    return (
      <EmptyState message='No scenario or essay prompts detected. Add a line with "(N marks)" or a command verb like "Explain..." to generate practice prompts here.' />
    );
  }
  if (done) {
    return (
      <CompletionSummary
        correct={answeredCount}
        total={prompts.length}
        onRestart={() => {
          setIdx(0);
          setAnswer('');
          setShowMarkscheme(false);
          setAnsweredCount(0);
          setDone(false);
        }}
      />
    );
  }

  const p = prompts[idx];

  const handleNext = () => {
    const nextAnswered = answeredCount + (answer.trim().length > 0 ? 1 : 0);
    setAnsweredCount(nextAnswered);
    if (idx + 1 < prompts.length) {
      setIdx(idx + 1);
      setAnswer('');
      setShowMarkscheme(false);
    } else {
      setDone(true);
      onComplete(Math.round((nextAnswered / prompts.length) * 100));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-slate-500">Prompt {idx + 1} of {prompts.length}</span>
        {p.marks !== null && <span className="text-xs font-mono text-cf-accent">{p.marks} marks</span>}
      </div>

      <div className="bg-cf-bg border border-cf-border rounded-lg p-5 mb-4">
        <p className="text-sm text-white leading-relaxed">{p.prompt}</p>
      </div>

      <textarea
        rows={8}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your response here..."
        className="w-full bg-cf-bg border border-cf-border rounded p-3 text-sm text-slate-200 resize-none focus:outline-cf-accent mb-3"
      />

      <button
        type="button"
        onClick={() => setShowMarkscheme((s) => !s)}
        className="text-xs font-semibold text-cf-accent hover:opacity-80 transition mb-3"
      >
        {showMarkscheme ? 'Hide' : 'Show'} Model Markscheme / Rubric Breakdown
      </button>

      {showMarkscheme && (
        <div className="bg-cf-accent/10 border border-cf-accent/30 rounded-lg p-4 mb-4 text-xs text-slate-200 leading-relaxed">
          {p.markscheme}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-5 py-2.5 bg-cf-accent hover:opacity-90 text-black font-semibold rounded transition text-sm"
        >
          {idx + 1 < prompts.length ? 'Next Prompt' : 'Finish'}
        </button>
      </div>
    </div>
  );
}
