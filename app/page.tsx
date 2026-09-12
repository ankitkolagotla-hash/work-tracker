'use client';
import React, { useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { StudyStreakTracker } from '../components/StudyStreakTracker';
import { AssessmentSetupModal } from '../components/AssessmentSetupModal';
import { DashboardPasteModal } from '../components/DashboardPasteModal';
import { ActiveStudyWorkspace } from '../components/ActiveStudyWorkspace';
import { CalendarView } from '../components/CalendarView';
import { SprintLauncher } from '../components/SprintLauncher';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { CourseHub } from '../components/CourseHub';
import { ACTMasteryHub } from '../components/ACTMasteryHub';
import { AssignmentStudioModal } from '../components/AssignmentStudioModal';
import { CollegeOutreachHub } from '../components/CollegeOutreachHub';
import { AthleticsHub } from '../components/AthleticsHub';
import { BASELINE_LABEL, isUpcoming, isPast } from '../lib/date';
import {
  Plus,
  RefreshCw,
  Play,
  Trash2,
  Calendar,
  Archive,
  ClipboardPaste,
  CheckCircle2,
  LayoutGrid,
  BookOpen,
  Target,
  PenTool,
  GraduationCap,
  Shirt,
} from 'lucide-react';

type NavTab = 'academic' | 'course-hub' | 'act' | 'assignment-studio' | 'college' | 'athletics';

const NAV_TABS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'academic', label: 'Academic Flow', icon: LayoutGrid },
  { id: 'course-hub', label: 'Course Hub', icon: BookOpen },
  { id: 'act', label: 'ACT Mastery', icon: Target },
  { id: 'assignment-studio', label: 'Assignment Studio', icon: PenTool },
  { id: 'college', label: 'College & Outreach', icon: GraduationCap },
  { id: 'athletics', label: 'Athletics & Recruiting', icon: Shirt },
];

export default function Home() {
  const { assessments, canvasFeedUrl, importCanvasEvents, deleteAssessment } = useAssessmentStore();
  const [activeTab, setActiveTab] = useState<NavTab>('academic');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSyncCanvas = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canvasFeedUrl }),
      });
      const data = await res.json();
      if (data.events) {
        importCanvasEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to sync Canvas:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (activeStudyId) {
    return (
      <main className="min-h-screen bg-cf-bg p-8">
        <ActiveStudyWorkspace assessmentId={activeStudyId} onExit={() => setActiveStudyId(null)} />
      </main>
    );
  }

  const upcomingAssessments = assessments
    .filter((a) => isUpcoming(a.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const pastAssessments = assessments
    .filter((a) => isPast(a.dueDate))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  return (
    <main className="min-h-screen bg-cf-bg text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cf-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono">CHRONOFLOW OS</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Life Operating System &amp; Focus Hub</p>
            <p className="text-[11px] text-cf-accent mt-1 font-mono">System Date: {BASELINE_LABEL}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeSwitcher />
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-slate-300 transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-cf-accent" /> Paste Dashboard
            </button>
            <button
              onClick={handleSyncCanvas}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-slate-300 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cf-accent ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Canvas Feed'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cf-accent hover:opacity-90 text-black font-semibold rounded-lg text-xs tracking-wider transition"
            >
              <Plus className="w-3.5 h-3.5" /> New Assessment
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-cf-card border border-cf-border rounded-xl p-1.5 overflow-x-auto">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id ? 'bg-cf-accent text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'academic' && (
          <div className="space-y-8">
            <CalendarView />
            <SprintLauncher />
            <StudyStreakTracker />

            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cf-accent" /> Active Preparation &amp; Sprints
              </h2>
              {upcomingAssessments.length === 0 ? (
                <p className="text-xs text-slate-500">No upcoming assessments. Add one to start building prep modules.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingAssessments.map((a) => (
                    <AssessmentCard key={a.id} assessmentId={a.id} onDelete={deleteAssessment} onStudy={setActiveStudyId} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5 text-slate-500" /> Past Assessments
              </h2>
              {pastAssessments.length === 0 ? (
                <p className="text-xs text-slate-500">Nothing here yet — past assessments will appear once their due date is behind {BASELINE_LABEL}.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastAssessments.map((a) => (
                    <AssessmentCard key={a.id} assessmentId={a.id} onDelete={deleteAssessment} onStudy={setActiveStudyId} muted />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'course-hub' && <CourseHub onStudy={setActiveStudyId} />}
        {activeTab === 'act' && <ACTMasteryHub />}
        {activeTab === 'assignment-studio' && <AssignmentStudioModal />}
        {activeTab === 'college' && <CollegeOutreachHub />}
        {activeTab === 'athletics' && <AthleticsHub />}

        <AssessmentSetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <DashboardPasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} />
      </div>
    </main>
  );
}

function AssessmentCard({
  assessmentId,
  onDelete,
  onStudy,
  muted,
}: {
  assessmentId: string;
  onDelete: (id: string) => void;
  onStudy: (id: string) => void;
  muted?: boolean;
}) {
  const assessment = useAssessmentStore((state) => state.assessments.find((a) => a.id === assessmentId));
  const toggleTaskComplete = useAssessmentStore((state) => state.toggleTaskComplete);
  if (!assessment) return null;
  const course = REGISTERED_COURSES.find((c) => c.id === assessment.courseId);
  const isComplete = assessment.status === 'Completed';

  return (
    <div
      className={`bg-cf-card border border-cf-border hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition shadow-lg ${
        muted ? 'opacity-70' : ''
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
            style={{ color: course?.color, borderColor: `${course?.color}40`, backgroundColor: `${course?.color}10` }}
          >
            {course?.name || 'Class'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTaskComplete(assessment.id)}
              title="Toggle complete"
              className={isComplete ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(assessment.id)} className="text-slate-500 hover:text-red-400 transition">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <h3 className={`text-md font-bold line-clamp-1 ${isComplete ? 'text-slate-500 line-through' : 'text-white'}`}>
          {assessment.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1">Due: {assessment.dueDate.split('T')[0]}</p>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Readiness Index</span>
            <span className="font-mono text-cf-accent">{assessment.readinessIndex}%</span>
          </div>
          <div className="w-full bg-cf-bg rounded-full h-1.5 overflow-hidden">
            <div className="bg-cf-accent h-1.5 rounded-full transition-all" style={{ width: `${assessment.readinessIndex}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-cf-border flex justify-between items-center">
        <span className="text-xs text-slate-500 font-mono">{assessment.studyPack.flashcards.length} cards</span>
        <button
          onClick={() => onStudy(assessment.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-cf-accent hover:text-black text-slate-200 text-xs font-semibold rounded transition"
        >
          <Play className="w-3 h-3" /> Study Now
        </button>
      </div>
    </div>
  );
}
