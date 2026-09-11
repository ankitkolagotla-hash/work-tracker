'use client';
import React, { useEffect, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { Assessment, DrillCard, PrepStage, PREP_STAGES } from '../types/assessment';
import { validateMaterials, MaterialValidation } from '../lib/notes';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Trophy,
} from 'lucide-react';

function formatTimer(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
}

export const MasteryWorkspace: React.FC<{ assessmentId: string; onExit: () => void }> = ({ assessmentId, onExit }) => {
  const { assessments, activeSession, startStudySession, tickTimer, completeStage, cancelSession, appendMaterials } =
    useAssessmentStore();
  const assessment = assessments.find((a) => a.id === assessmentId);

  const [viewStage, setViewStage] = useState<PrepStage>(() => {
    const found = PREP_STAGES.find((s) => !assessment?.completedStages.includes(s.id));
    return found?.id ?? 'mastery';
  });
  const [supplementText, setSupplementText] = useState('');

  useEffect(() => {
    if (viewStage === 'intake') return;
    startStudySession(assessmentId);
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewStage, assessmentId]);

  if (!assessment) return null;

  const validation = validateMaterials(assessment.pastedMaterials);
  const allComplete = assessment.completedStages.length === PREP_STAGES.length;

  const handleExit = () => {
    cancelSession();
    onExit();
  };

  const goNext = (stage: PrepStage) => {
    const order = PREP_STAGES.map((s) => s.id);
    const idx = order.indexOf(stage);
    setViewStage(order[idx + 1] ?? stage);
  };

  return (
    <div className="max-w-3xl mx-auto bg-[#161A22] border border-[#232936] rounded-xl p-8 text-slate-200 mt-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#232936]">
        <button onClick={handleExit} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Exit Session
        </button>
        <div className="text-right">
          <div className="text-sm font-bold text-white">{assessment.title}</div>
          <div className="text-xs text-cyan-400 font-mono">{assessment.readinessIndex}% Readiness</div>
        </div>
      </div>

      <StageProgressHeader assessment={assessment} viewStage={viewStage} onSelect={setViewStage} />

      {allComplete ? (
        <MasteryCompleteScreen assessment={assessment} onExit={handleExit} />
      ) : assessment.generatedDrills.length === 0 && viewStage !== 'intake' ? (
        <NoDrillsFallback onBack={() => setViewStage('intake')} />
      ) : viewStage === 'intake' ? (
        <Stage1Intake
          assessment={assessment}
          validation={validation}
          supplementText={supplementText}
          setSupplementText={setSupplementText}
          onAppend={() => {
            appendMaterials(assessmentId, supplementText);
            setSupplementText('');
          }}
          onConfirm={() => {
            completeStage(assessmentId, 'intake');
            goNext('intake');
          }}
        />
      ) : viewStage === 'review' ? (
        <Stage2Review
          drills={assessment.generatedDrills}
          elapsedSeconds={activeSession.elapsedSeconds}
          onComplete={() => {
            completeStage(assessmentId, 'review', 100);
            goNext('review');
          }}
        />
      ) : viewStage === 'diagnostic' ? (
        <DrillRunner
          key="diagnostic"
          drills={assessment.generatedDrills}
          timedSeconds={20}
          heading="Diagnostic Drill & Quizzing"
          subheading="Timed multi-question active test — reveal before the clock runs out."
          onFinish={(score) => {
            completeStage(assessmentId, 'diagnostic', score);
            goNext('diagnostic');
          }}
        />
      ) : (
        <DrillRunner
          key="mastery"
          drills={assessment.generatedDrills}
          timedSeconds={null}
          heading="Mastery Exam Simulation"
          subheading="Full-length recall pass under exam conditions."
          onFinish={(score) => {
            completeStage(assessmentId, 'mastery', score);
            goNext('mastery');
          }}
        />
      )}
    </div>
  );
};

function StageProgressHeader({
  assessment,
  viewStage,
  onSelect,
}: {
  assessment: Assessment;
  viewStage: PrepStage;
  onSelect: (s: PrepStage) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {PREP_STAGES.map((s, idx) => {
        const done = assessment.completedStages.includes(s.id);
        const active = viewStage === s.id;
        const prevDone = idx === 0 || assessment.completedStages.includes(PREP_STAGES[idx - 1].id);
        const locked = !done && !prevDone;
        return (
          <button
            key={s.id}
            type="button"
            disabled={locked}
            onClick={() => onSelect(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
              active
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : done
                ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400'
                : locked
                ? 'border-[#232936] text-slate-600 cursor-not-allowed'
                : 'border-[#232936] text-slate-400 hover:border-slate-600'
            }`}
          >
            {done ? <Check className="w-3.5 h-3.5" /> : <span>{s.order}</span>}
            {s.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

function Stage1Intake({
  assessment,
  validation,
  supplementText,
  setSupplementText,
  onAppend,
  onConfirm,
}: {
  assessment: Assessment;
  validation: MaterialValidation;
  supplementText: string;
  setSupplementText: (v: string) => void;
  onAppend: () => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-white mb-1">Note Intake &amp; Structural Encoding</h4>
      <p className="text-xs text-slate-400 mb-4">Validating pasted materials and encoding structured prep modules.</p>

      {validation.valid ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900/60 rounded-lg p-3 mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {validation.conceptCount} structured concepts identified and ready for encoding.
        </div>
      ) : (
        <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-950/30 border border-amber-900/60 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validation.message}</span>
        </div>
      )}

      {assessment.generatedDrills.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto pr-1">
          {assessment.generatedDrills.map((d) => (
            <div key={d.id} className="bg-[#0D0F12] border border-[#232936] rounded-md px-3 py-2">
              <div className="text-xs font-semibold text-white truncate">{d.prompt}</div>
              <div className="text-[11px] text-slate-500 truncate">{d.answer}</div>
            </div>
          ))}
        </div>
      )}

      {!validation.valid && (
        <div className="mb-4">
          <label className="text-xs text-slate-400 block mb-1">Add supplementary notes to reach the encoding threshold</label>
          <textarea
            rows={4}
            value={supplementText}
            onChange={(e) => setSupplementText(e.target.value)}
            placeholder="Additional Term: Additional Definition"
            className="w-full bg-[#0D0F12] border border-[#232936] rounded p-3 text-xs font-mono text-slate-200 resize-none focus:outline-cyan-500 mb-2"
          />
          <button
            type="button"
            onClick={onAppend}
            disabled={supplementText.trim().length === 0}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded transition"
          >
            Re-Encode Notes
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onConfirm}
          disabled={!validation.valid}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black font-semibold rounded transition"
        >
          Confirm Structural Encoding <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Stage2Review({
  drills,
  elapsedSeconds,
  onComplete,
}: {
  drills: DrillCard[];
  elapsedSeconds: number;
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allRevealed = drills.length > 0 && revealed.size === drills.length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Deep Note Review &amp; Two-Column Recall</h4>
          <p className="text-xs text-slate-400">Reveal every definition at least once to complete this stage.</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono text-cyan-400">{formatTimer(elapsedSeconds)}</div>
          <span className="text-xs text-slate-500">{revealed.size} / {drills.length} reviewed</span>
        </div>
      </div>

      <div className="space-y-2 mb-6 max-h-96 overflow-y-auto pr-1">
        {drills.map((d) => (
          <button
            type="button"
            key={d.id}
            onClick={() => toggleReveal(d.id)}
            className="w-full text-left grid grid-cols-2 gap-4 bg-[#0D0F12] border border-[#232936] hover:border-slate-600 rounded-lg p-4 transition"
          >
            <div className="text-sm font-medium text-white">{d.prompt}</div>
            <div className={`text-sm font-mono ${revealed.has(d.id) ? 'text-slate-300' : 'text-slate-600'}`}>
              {revealed.has(d.id) ? d.answer : '•'.repeat(Math.min(d.answer.length, 48))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={!allRevealed}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black font-semibold rounded transition"
        >
          Complete Review <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DrillRunner({
  drills,
  timedSeconds,
  heading,
  subheading,
  onFinish,
}: {
  drills: DrillCard[];
  timedSeconds: number | null;
  heading: string;
  subheading: string;
  onFinish: (performanceScore: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timedSeconds ?? 0);

  useEffect(() => {
    setShowAnswer(false);
    setTimeLeft(timedSeconds ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    if (timedSeconds === null || showAnswer) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, showAnswer, timedSeconds]);

  if (drills.length === 0) return null;
  const card = drills[idx];

  const handleScore = (isCorrect: boolean) => {
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    if (isCorrect) setCorrect(nextCorrect);
    if (idx + 1 < drills.length) {
      setIdx((p) => p + 1);
    } else {
      onFinish(Math.round((nextCorrect / drills.length) * 100));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">{heading}</h4>
          <p className="text-xs text-slate-400">{subheading}</p>
        </div>
        <div className="text-right">
          {timedSeconds !== null && (
            <div className={`text-xl font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-cyan-400'}`}>
              0:{timeLeft.toString().padStart(2, '0')}
            </div>
          )}
          <span className="text-xs text-slate-500">Question {idx + 1} of {drills.length}</span>
        </div>
      </div>

      <div className="min-h-[200px] flex flex-col justify-center items-center bg-[#0D0F12] border border-[#232936] rounded-lg p-6 mb-6 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">Retrieval Trigger</p>
        <div className="text-xl font-medium text-white mb-4">{card.prompt}</div>

        {showAnswer ? (
          <div className="pt-4 border-t border-[#232936] w-full">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-mono">Target Answer</p>
            <p className="text-md text-slate-300 font-mono">{card.answer}</p>
          </div>
        ) : (
          <button
            onClick={() => setShowAnswer(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm transition"
          >
            <Eye className="w-4 h-4" /> Reveal Answer
          </button>
        )}
      </div>

      {showAnswer && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleScore(false)}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-950/60 border border-red-800 hover:bg-red-900/80 text-red-300 rounded font-medium transition"
          >
            Missed
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

function NoDrillsFallback({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-8 text-center text-slate-400">
      <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-white mb-2">No Structured Drills Encoded</h3>
      <p className="text-xs text-slate-400 mb-4">
        Return to Intake and add notes formatted as &quot;Term: Definition&quot; to generate prep modules.
      </p>
      <button onClick={onBack} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm transition">
        Back to Intake
      </button>
    </div>
  );
}

function MasteryCompleteScreen({ assessment, onExit }: { assessment: Assessment; onExit: () => void }) {
  return (
    <div className="text-center py-10">
      <Trophy className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Mastery Achieved</h3>
      <p className="text-sm text-slate-400 mb-6">
        {assessment.title} is fully prepped at {assessment.readinessIndex}% readiness across all four stages.
      </p>
      <button onClick={onExit} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded transition">
        Return to Dashboard
      </button>
    </div>
  );
}
