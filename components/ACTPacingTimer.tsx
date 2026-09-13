'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ACT_SECTION_PACING, ACTSection } from '../types/lifeOs';
import { Timer, Play, Pause, RotateCcw, ChevronRight, AlertTriangle } from 'lucide-react';

const PACE_TOLERANCE_SECONDS = 30;

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Official standard ACT section pacing metronome. The student manually
 * advances the question counter as they work through a real or practice
 * section; the timer compares actual elapsed time against where they SHOULD
 * be by question N and flashes yellow once they fall more than 30 seconds
 * behind pace.
 */
export const ACTPacingTimer: React.FC = () => {
  const [section, setSection] = useState<ACTSection>('English');
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pacing = ACT_SECTION_PACING.find((p) => p.section === section)!;
  const totalSeconds = pacing.minutes * 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsedSeconds((s) => Math.min(totalSeconds, s + 1)), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, totalSeconds]);

  const reset = (nextSection?: ACTSection) => {
    setRunning(false);
    setElapsedSeconds(0);
    setQuestionIndex(1);
    if (nextSection) setSection(nextSection);
  };

  const expectedElapsedAtCurrentQuestion = (questionIndex - 1) * pacing.secondsPerQuestion;
  const behindBySeconds = elapsedSeconds - expectedElapsedAtCurrentQuestion;
  const isBehindPace = behindBySeconds > PACE_TOLERANCE_SECONDS;
  const expectedQuestionNow = Math.min(pacing.questions, Math.floor(elapsedSeconds / pacing.secondsPerQuestion) + 1);

  return (
    <div
      className={`bg-cf-card border rounded-xl p-6 transition-colors ${
        isBehindPace ? 'border-amber-500 animate-pulse' : 'border-cf-border'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Timer className="w-4 h-4 text-cf-accent" /> Official Pacing Metronome
        </h3>
        <select
          value={section}
          onChange={(e) => reset(e.target.value as ACTSection)}
          className="bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-white focus:outline-cf-accent"
        >
          {ACT_SECTION_PACING.map((p) => (
            <option key={p.section} value={p.section}>{p.section}</option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-slate-500 mb-4">
        {pacing.questions} questions / {pacing.minutes} minutes — ~{pacing.secondsPerQuestion}s per question
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-cf-bg border border-cf-border rounded-lg p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Elapsed</p>
          <p className="text-2xl font-mono font-bold text-white">{formatMMSS(elapsedSeconds)}</p>
          <p className="text-[10px] text-slate-500">of {formatMMSS(totalSeconds)}</p>
        </div>
        <div className="bg-cf-bg border border-cf-border rounded-lg p-3 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Question</p>
          <p className="text-2xl font-mono font-bold text-white">{questionIndex} <span className="text-sm text-slate-500">/ {pacing.questions}</span></p>
          <p className="text-[10px] text-slate-500">pace expects Q{expectedQuestionNow}</p>
        </div>
      </div>

      {isBehindPace && (
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-3">
          <AlertTriangle className="w-3.5 h-3.5" /> {behindBySeconds}s behind pace — pick up speed or flag &amp; move on
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cf-accent hover:opacity-90 text-black text-xs font-semibold rounded transition"
        >
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => setQuestionIndex((q) => Math.min(pacing.questions, q + 1))}
          disabled={!running}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-semibold rounded transition"
        >
          <ChevronRight className="w-3.5 h-3.5" /> Next Question
        </button>
        <button
          onClick={() => reset()}
          className="flex items-center justify-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
