'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES, AssessmentType } from '../types/assessment';
import { validateMaterials } from '../lib/notes';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AssessmentSetupModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addAssessment } = useAssessmentStore();
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(REGISTERED_COURSES[5].id);
  const [type, setType] = useState<AssessmentType>('Quiz');
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState(35);
  const [rawNotes, setRawNotes] = useState('');

  const validation = useMemo(() => validateMaterials(rawNotes), [rawNotes]);

  if (!isOpen) return null;

  const canSubmit = title.trim().length > 0 && dueDate.length > 0 && validation.valid;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    addAssessment({
      title,
      type,
      courseId,
      unitsCovered: ['Direct Notes Ingest'],
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      status: 'Upcoming',
      points: Number(points),
      pastedMaterials: rawNotes,
    });
    setTitle('');
    setDueDate('');
    setRawNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-cf-card border border-cf-border w-full max-w-xl rounded-xl p-6 text-slate-200 shadow-2xl">
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
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-cf-bg border border-cf-border rounded px-3 py-2 text-sm text-white focus:outline-cf-accent"
                required
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
              validation.valid ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {validation.conceptCount} structured concepts identified. Ready to encode prep modules.
                </div>
              ) : (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-900/60 rounded p-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{validation.message}</span>
                </div>
              )
            )}
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
