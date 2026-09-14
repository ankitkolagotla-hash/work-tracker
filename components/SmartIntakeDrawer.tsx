'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useFocusStore } from '../store/useFocusStore';
import { useSystemDate } from '../store/useSystemDateStore';
import { REGISTERED_COURSES, DrillCard, MCQQuestion, StudyMethod } from '../types/assessment';
import { humanizeDraft } from '../lib/humanizer';
import { buildStudyRoadmap } from '../lib/studyRoadmap';
import { FlashcardPanel, MCQPanel, SpeedDrillPanel, FreeResponsePanel } from './ActiveStudyWorkspace';
import { CourseReassignSelect } from './CourseReassignSelect';
import {
  X,
  Sparkles,
  Layers,
  ListChecks,
  Zap,
  PenLine,
  Copy,
  CheckCircle2,
  CalendarClock,
  Maximize2,
  BookOpen,
} from 'lucide-react';

type DrillTab = 'flashcards' | 'mcq' | 'speed' | 'free';

const DRILL_TABS: { id: DrillTab; label: string; icon: React.ElementType }[] = [
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'mcq', label: 'Diagnostic MCQs', icon: ListChecks },
  { id: 'speed', label: 'Speed Drill', icon: Zap },
  { id: 'free', label: 'Free Response', icon: PenLine },
];

const STUDY_ASSESSMENT_TYPES = new Set(['Quiz', 'Test', 'Exam']);

/**
 * Universal "Open & Execute" modal. One text box in, then automatically
 * routed by assessment.type: Quizzes/Tests/Exams get the multi-day study
 * roadmap + 4 drill tabs (Path A); everything else gets the quick overview
 * + dual-draft humanizer (Path B).
 */
export const SmartIntakeDrawer: React.FC<{ assessmentId: string; onClose: () => void }> = ({ assessmentId, onClose }) => {
  const assessment = useAssessmentStore((s) => s.assessments.find((a) => a.id === assessmentId));
  const regenerateStudyPack = useAssessmentStore((s) => s.regenerateStudyPack);
  const logStudySession = useAssessmentStore((s) => s.logStudySession);
  const toggleTaskComplete = useAssessmentStore((s) => s.toggleTaskComplete);
  const addNeedsReviewItem = useAssessmentStore((s) => s.addNeedsReviewItem);
  const startSprint = useFocusStore((s) => s.startSprint);
  const setFocusModeActive = useFocusStore((s) => s.setFocusModeActive);
  const today = useSystemDate();

  const [rawText, setRawText] = useState(assessment?.pastedMaterials ?? '');
  const [view, setView] = useState<'intake' | 'result'>(
    assessment && assessment.pastedMaterials.trim().length > 0 ? 'result' : 'intake'
  );
  const [drillTab, setDrillTab] = useState<DrillTab>('flashcards');
  const [draftMode, setDraftMode] = useState<'stems' | 'humanized'>('humanized');
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState(false);
  const [copied, setCopied] = useState(false);
  const [markedDone, setMarkedDone] = useState(false);

  const dualDraft = useMemo(() => (rawText.trim() ? humanizeDraft(rawText) : null), [rawText]);
  const roadmap = useMemo(
    () => (assessment ? buildStudyRoadmap(assessment, today) : null),
    [assessment, today]
  );

  if (!assessment) return null;
  const course = REGISTERED_COURSES.find((c) => c.id === assessment.courseId);
  const isStudyPath = STUDY_ASSESSMENT_TYPES.has(assessment.type);

  const handleGenerate = () => {
    if (!rawText.trim()) return;
    regenerateStudyPack(assessmentId, rawText);
    setView('result');
  };

  const handleComplete = (method: StudyMethod, score: number) => logStudySession(assessmentId, method, score);

  const handleMissedCard = (card: DrillCard) =>
    addNeedsReviewItem({ assessmentId, courseId: assessment.courseId, prompt: card.prompt, answer: card.answer });
  const handleMissedMCQ = (q: MCQQuestion) =>
    addNeedsReviewItem({ assessmentId, courseId: assessment.courseId, prompt: q.prompt, answer: q.options[q.correctIndex] });

  const handleStartSprint = () => {
    startSprint('ultradian');
    setFocusModeActive(true);
  };

  const handleCopyDraft = async () => {
    if (!dualDraft) return;
    const text =
      draftMode === 'humanized'
        ? dualDraft.humanizedDraft
        : dualDraft.paraphraseStems.map((s, i) => `${i + 1}. ${s.stem}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const handleMarkCompleted = () => {
    toggleTaskComplete(assessmentId);
    setMarkedDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-cf-card border border-cf-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-cf-border">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                style={{ color: course?.color, borderColor: `${course?.color}40`, backgroundColor: `${course?.color}10` }}
              >
                {course?.name ?? 'Class'}
              </span>
              <CourseReassignSelect assessmentId={assessmentId} courseId={assessment.courseId} />
            </div>
            <h2 className="text-lg font-bold text-white mt-2">{assessment.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {assessment.type} · Due {assessment.dueDate.split('T')[0]} · {assessment.points} pts
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {view === 'intake' && (
          <div>
            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste assignment prompt, rubric, notes, or quiz syllabus here..."
              className="w-full bg-cf-bg border border-cf-border rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-cf-accent mb-4"
            />
            <button
              onClick={handleGenerate}
              disabled={!rawText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cf-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded transition text-sm"
            >
              <Sparkles className="w-4 h-4" /> Generate {isStudyPath ? 'Study Roadmap & Drills' : 'Overview & Drafts'}
            </button>
          </div>
        )}

        {view === 'result' && isStudyPath && (
          <div>
            {roadmap && (
              <div className="bg-cf-bg border border-cf-border rounded-lg p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-cf-accent" /> Study Roadmap — {roadmap.daysUntilDue} day
                    {roadmap.daysUntilDue === 1 ? '' : 's'} to go
                  </p>
                  <button
                    onClick={handleStartSprint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cf-accent hover:opacity-90 text-black text-[11px] font-semibold rounded transition"
                  >
                    <Maximize2 className="w-3 h-3" /> Start 50/10 Sprint
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.sessionDates.map((d) => (
                    <span key={d.date} className="text-[10px] font-mono px-2 py-1 rounded border border-cf-border text-slate-300">
                      {d.label} · {d.focusBlocks} block{d.focusBlocks === 1 ? '' : 's'}
                    </span>
                  ))}
                </div>
                {roadmap.eveningRecallReminder && (
                  <p className="text-[11px] text-amber-400 mt-2">
                    Due soon — run an evening sleep-recall flashcard pass tonight for best retention.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 bg-cf-bg border border-cf-border rounded-lg p-1 mb-5 overflow-x-auto">
              {DRILL_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrillTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                      drillTab === tab.id ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {drillTab === 'flashcards' && (
              <FlashcardPanel
                key={`flash-${assessmentId}`}
                cards={assessment.studyPack.flashcards}
                onComplete={(score) => handleComplete('Flashcard Drill', score)}
                onMissedItem={handleMissedCard}
              />
            )}
            {drillTab === 'mcq' && (
              <MCQPanel
                key={`mcq-${assessmentId}`}
                questions={assessment.studyPack.mcqs}
                onComplete={(score) => handleComplete('MCQ Quiz', score)}
                onMissedItem={handleMissedMCQ}
              />
            )}
            {drillTab === 'speed' && (
              <SpeedDrillPanel
                key={`speed-${assessmentId}`}
                cards={assessment.studyPack.flashcards}
                onComplete={(score) => handleComplete('Speed Drill', score)}
                onMissedItem={handleMissedCard}
              />
            )}
            {drillTab === 'free' && (
              <FreeResponsePanel
                key={`free-${assessmentId}`}
                prompts={assessment.studyPack.freeResponse}
                onComplete={(score) => handleComplete('Free Response', score)}
              />
            )}
          </div>
        )}

        {view === 'result' && !isStudyPath && (
          <div className="space-y-5">
            {assessment.studyPack.notes.length > 0 && (
              <div className="bg-cf-bg border border-cf-border rounded-lg p-4">
                <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cf-accent" /> 2-Minute Overview
                </p>
                <div className="space-y-2">
                  {assessment.studyPack.notes.slice(0, 3).map((n) => (
                    <div key={n.id}>
                      <p className="text-[11px] font-semibold text-slate-300">{n.heading}</p>
                      <ul className="text-[11px] text-slate-400 list-disc list-inside">
                        {n.points.slice(0, 3).map((p, i) => (
                          <li key={i}>{p.term ? <><strong className="text-slate-300">{p.term}</strong>{p.text ? ` — ${p.text}` : ''}</> : p.text}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {assessment.studyPack.mcqs.length > 0 && (
                  <button
                    onClick={() => setShowKnowledgeCheck((s) => !s)}
                    className="text-[11px] font-semibold text-cf-accent hover:opacity-80 transition mt-2"
                  >
                    {showKnowledgeCheck ? 'Hide' : 'Show'} Key Knowledge Check
                  </button>
                )}
                {showKnowledgeCheck && (
                  <div className="mt-3">
                    <MCQPanel
                      key={`kc-mcq-${assessmentId}`}
                      questions={assessment.studyPack.mcqs.slice(0, 3)}
                      onComplete={(score) => handleComplete('MCQ Quiz', score)}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1 bg-cf-bg border border-cf-border rounded-lg p-1 mb-3 w-fit">
                <button
                  onClick={() => setDraftMode('stems')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    draftMode === 'stems' ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Draft 1: Paraphrasable Units
                </button>
                <button
                  onClick={() => setDraftMode('humanized')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    draftMode === 'humanized' ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Draft 2: Humanized Synthesis
                </button>
              </div>

              {dualDraft && draftMode === 'stems' && (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {dualDraft.paraphraseStems.map((s, i) => (
                    <div key={i} className="bg-cf-bg border border-cf-border rounded-lg p-3">
                      <p className="text-xs text-slate-200">{i + 1}. {s.stem}</p>
                      <details className="mt-1">
                        <summary className="text-[10px] text-slate-500 cursor-pointer">Reference</summary>
                        <p className="text-[11px] text-slate-400 mt-1">{s.reference}</p>
                      </details>
                    </div>
                  ))}
                </div>
              )}

              {dualDraft && draftMode === 'humanized' && (
                <div className="space-y-3">
                  <div className="bg-cf-bg border border-cf-border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{dualDraft.humanizedDraft}</p>
                  </div>
                  <div className="bg-cf-accent/10 border border-cf-accent/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-cf-accent font-semibold mb-1">
                      H.E.A.R.T. Audit — {dualDraft.audit.score}/100
                    </p>
                    {dualDraft.audit.findings.length === 0 ? (
                      <p className="text-[11px] text-emerald-400">No AI-writing tells detected.</p>
                    ) : (
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {dualDraft.audit.findings.map((f, i) => (
                          <li key={i}><strong className="text-white">{f.pattern}</strong>: {f.recommendation}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCopyDraft}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Draft'}
                </button>
                <button
                  onClick={handleMarkCompleted}
                  className="flex items-center gap-1.5 flex-1 justify-center px-4 py-2 bg-cf-accent hover:opacity-90 disabled:opacity-60 text-black text-xs font-semibold rounded transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {markedDone ? 'Marked Completed' : 'Mark Completed'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
