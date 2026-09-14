'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import {
  REGISTERED_COURSES,
  AssessmentType,
  AssessmentDifficulty,
  StudyPacing,
  DayOfWeek,
  DAYS_OF_WEEK,
  PACING_MINUTES,
  STUDY_PACING_OPTIONS,
} from '../types/assessment';
import { parseDrillLines, MIN_STRUCTURED_CONCEPTS } from '../lib/notes';
import { AlertTriangle, CheckCircle2, Info, CalendarClock } from 'lucide-react';

const FALLBACK_DUE_DATE_ISO = '2026-09-11T12:00:00.000Z';

const PREP_TIME_PRESETS: { label: string; minutes: number }[] = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '2 hrs', minutes: 120 },
  { label: '3+ hrs', minutes: 180 },
];

const DIFFICULTY_OPTIONS: AssessmentDifficulty[] = ['Easy', 'Medium', 'Hard'];

const DAY_ABBR: Record<DayOfWeek, string> = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'Th',
  Friday: 'F',
  Saturday: 'Sa',
  Sunday: 'Su',
};

export const AssessmentSetupModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addAssessment } = useAssessmentStore();
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(REGISTERED_COURSES[0].id);
  const [type, setType] = useState<AssessmentType>('Quiz');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState(35);
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty>('Medium');
  const [rawNotes, setRawNotes] = useState('');
  const [totalPrepTimeMinutes, setTotalPrepTimeMinutes] = useState(60);
  const [studySessionPacing, setStudySessionPacing] = useState<StudyPacing>('25m Pomodoro');
  const [targetStudyDays, setTargetStudyDays] = useState<DayOfWeek[]>([]);

  const conceptCount = useMemo(() => parseDrillLines(rawNotes).length, [rawNotes]);

  if (!isOpen) return null;

  const canSubmit = title.trim().length > 0 && conceptCount >= 1;

  const toggleDay = (day: DayOfWeek) => {
    setTargetStudyDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const pacingMinutes = PACING_MINUTES[studySessionPacing];
  const sessionCount = Math.max(1, Math.round(totalPrepTimeMinutes / pacingMinutes));
  const planPreview = `${sessionCount} session${sessionCount === 1 ? '' : 's'} of ~${pacingMinutes} min${
    targetStudyDays.length > 0 ? ` across ${targetStudyDays.join(' & ')}` : ' — pick study days below'
  }`;

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setRawNotes('');
    setTotalPrepTimeMinutes(60);
    setStudySessionPacing('25m Pomodoro');
    setTargetStudyDays([]);
    setDifficulty('Medium');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let dueISO = FALLBACK_DUE_DATE_ISO;
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!Number.isNaN(parsed.getTime())) dueISO = parsed.toISOString();
    }

    addAssessment({
      title,
      type,
      courseId,
      unitsCovered: ['Direct Notes Ingest'],
      dueDate: dueISO,
      status: 'Upcoming',
      difficulty,
      points: Number(points),
      pastedMaterials: rawNotes,
      totalPrepTimeMinutes,
      studySessionPacing,
      targetStudyDays,
    });
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-cf-card border border-cf-border w-full max-w-xl rounded-xl p-6 text-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">Add Assessment &amp; Ingest Study Packet</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full bg-cf-bg border border-cf-border rounded px-3 py-2 text-sm text-white focus:outline-cf-accent"
              >
                {REGISTERED_COURSES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Assessment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssessmentType)}
                className="w-full bg-cf-bg border border-cf-border rounded px-3 py-2 text-sm text-white focus:outline-cf-accent"
              >
                <option value="Quiz">Quiz</option>
                <option value="Test">Test</option>
                <option value="Exam">Exam</option>
                <option value="Assignment">Assignment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g., Unit 1 Science of Biology Quiz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-cf-bg border border-cf-border rounded px-3 py-2 text-sm text-white focus:outline-cf-accent"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Target Due Date <span className="text-slate-500 normal-case">(optional — defaults to today)</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-cf-bg border border-cf-border rounded px-3 py-2 text-sm text-white focus:outline-cf-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full bg-cf-bg border border-cf-border rounded px-3 py-2 text-sm text-white focus:outline-cf-accent"
                min={0}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Difficulty</label>
              <div className="flex gap-1.5">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 px-2 py-2 rounded text-xs font-semibold border transition ${
                      difficulty === d
                        ? 'bg-cf-accent text-black border-cf-accent'
                        : 'bg-cf-bg border-cf-border text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Dump Notes / Flashcards (Format: <code className="text-cf-accent">Term: Definition</code> or <code className="text-cf-accent">Prompt - Answer</code>)
            </label>
            <textarea
              rows={7}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder={'Attention: Selective allocation of cognitive processing\nEmergent Property: Novel characteristic from system interactions'}
              className="w-full bg-cf-bg border border-cf-border rounded p-3 text-xs font-mono text-slate-200 resize-none focus:outline-cf-accent"
            />

            {rawNotes.trim().length > 0 && (
              conceptCount === 0 ? (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-900/60 rounded p-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>No structured concepts detected yet. Use &quot;Term: Definition&quot; or &quot;Prompt - Answer&quot; lines.</span>
                </div>
              ) : conceptCount < MIN_STRUCTURED_CONCEPTS ? (
                <div className="mt-2 flex items-start gap-2 text-xs text-sky-400 bg-sky-950/30 border border-sky-900/60 rounded p-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{conceptCount} concept{conceptCount === 1 ? '' : 's'} identified — add a few more for richer flashcards, MCQs, and notes.</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {conceptCount} structured concepts identified. Ready to generate the full study pack.
                </div>
              )
            )}
          </div>

          <div className="border border-cf-border rounded-lg p-4 bg-cf-bg/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cf-accent mb-3 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" /> Study Time &amp; Schedule Planner
            </h4>

            <label className="text-xs text-slate-400 block mb-1.5">Target Study Time Available</label>
            <div className="flex gap-2 mb-3">
              {PREP_TIME_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setTotalPrepTimeMinutes(preset.minutes)}
                  className={`flex-1 px-2 py-2 rounded text-xs font-semibold border transition ${
                    totalPrepTimeMinutes === preset.minutes
                      ? 'bg-cf-accent text-black border-cf-accent'
                      : 'bg-cf-bg border-cf-border text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <label className="text-xs text-slate-400 block mb-1.5">Preferred Session Pacing</label>
            <div className="flex gap-2 mb-3">
              {STUDY_PACING_OPTIONS.map((pacing) => (
                <button
                  key={pacing}
                  type="button"
                  onClick={() => setStudySessionPacing(pacing)}
                  className={`flex-1 px-2 py-2 rounded text-xs font-semibold border transition ${
                    studySessionPacing === pacing
                      ? 'bg-cf-accent text-black border-cf-accent'
                      : 'bg-cf-bg border-cf-border text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {pacing}
                </button>
              ))}
            </div>

            <label className="text-xs text-slate-400 block mb-1.5">Study Days</label>
            <div className="flex gap-1.5 mb-3">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  title={day}
                  className={`w-9 h-9 rounded-full text-xs font-bold border transition ${
                    targetStudyDays.includes(day)
                      ? 'bg-cf-accent text-black border-cf-accent'
                      : 'bg-cf-bg border-cf-border text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {DAY_ABBR[day]}
                </button>
              ))}
            </div>

            <p className="text-xs text-cf-accent bg-cf-accent/10 border border-cf-accent/30 rounded px-3 py-2">
              {planPreview}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2 text-sm font-semibold bg-cf-accent hover:opacity-90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black rounded transition"
            >
              Ingest &amp; Generate Recall Cards
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
