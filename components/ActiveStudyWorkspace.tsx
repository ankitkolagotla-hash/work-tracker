'use client';
import React, { useState, useEffect } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { Eye, Check, X, ShieldAlert, ArrowLeft } from 'lucide-react';

export const ActiveStudyWorkspace: React.FC<{ assessmentId: string; onExit: () => void }> = ({ assessmentId, onExit }) => {
  const { assessments, activeSession, startStudySession, stopStudySession, tickTimer } = useAssessmentStore();
  const assessment = assessments.find((a) => a.id === assessmentId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    startStudySession(assessmentId);
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  if (!assessment || assessment.generatedDrills.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-[#161A22] rounded-xl border border-[#232936] max-w-lg mx-auto mt-12">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">No Active Drills Generated</h3>
        <p className="text-xs text-slate-400 mb-4">Paste notes with colons or dashes (e.g. "Term: Definition") to generate interactive recall cards.</p>
        <button onClick={onExit} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const drills = assessment.generatedDrills;
  const currentCard = drills[currentIdx];

  const handleScore = (isCorrect: boolean) => {
    if (isCorrect) setCorrectAnswers((prev) => prev + 1);
    setShowAnswer(false);
    if (currentIdx + 1 < drills.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      const performance = Math.round(((correctAnswers + (isCorrect ? 1 : 0)) / drills.length) * 100);
      stopStudySession(performance, 'Active Recall Prompt');
      onExit();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#161A22] border border-[#232936] rounded-xl p-8 text-slate-200 mt-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#232936]">
        <button onClick={onExit} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Exit Session
        </button>
        <div className="text-right">
          <div className="text-2xl font-mono text-cyan-400">{formatTime(activeSession.elapsedSeconds)}</div>
          <span className="text-xs text-slate-500">Card {currentIdx + 1} of {drills.length}</span>
        </div>
      </div>

      <div className="min-h-[220px] flex flex-col justify-center items-center bg-[#0D0F12] border border-[#232936] rounded-lg p-6 mb-6 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">Retrieval Trigger</p>
        <div className="text-xl font-medium text-white mb-4">{currentCard.prompt}</div>

        {showAnswer ? (
          <div className="pt-4 border-t border-[#232936] w-full">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 font-mono">Target Answer</p>
            <p className="text-md text-slate-300 font-mono">{currentCard.answer}</p>
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
};
