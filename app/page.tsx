'use client';
import React, { useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { REGISTERED_COURSES } from '../types/assessment';
import { StudyStreakTracker } from '../components/StudyStreakTracker';
import { AssessmentSetupModal } from '../components/AssessmentSetupModal';
import { ActiveStudyWorkspace } from '../components/ActiveStudyWorkspace';
import { Plus, RefreshCw, Play, Trash2, Calendar } from 'lucide-react';

export default function Home() {
  const { assessments, canvasFeedUrl, importCanvasEvents, deleteAssessment } = useAssessmentStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <main className="min-h-screen bg-[#0D0F12] p-8">
        <ActiveStudyWorkspace assessmentId={activeStudyId} onExit={() => setActiveStudyId(null)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0F12] text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#232936] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono">CHRONOFLOW OS</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Target Cognitive Architecture &amp; Focus Hub</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncCanvas}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#161A22] border border-[#232936] hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-slate-300 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Canvas Feed'}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs tracking-wider transition"
            >
              <Plus className="w-3.5 h-3.5" /> New Assessment
            </button>
          </div>
        </div>

        <StudyStreakTracker />

        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> Active Preparation &amp; Sprints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((a) => {
              const course = REGISTERED_COURSES.find((c) => c.id === a.courseId);
              return (
                <div key={a.id} className="bg-[#161A22] border border-[#232936] hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition shadow-lg">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                        style={{ color: course?.color, borderColor: `${course?.color}40`, backgroundColor: `${course?.color}10` }}
                      >
                        {course?.name || 'Class'}
                      </span>
                      <button onClick={() => deleteAssessment(a.id)} className="text-slate-500 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-md font-bold text-white line-clamp-1">{a.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">Due: {a.dueDate.split('T')[0]}</p>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Readiness Index</span>
                        <span className="font-mono text-cyan-400">{a.readinessIndex}%</span>
                      </div>
                      <div className="w-full bg-[#0D0F12] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-400 h-1.5 rounded-full transition-all" style={{ width: `${a.readinessIndex}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#232936] flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-mono">{a.generatedDrills.length} cards</span>
                    <button
                      onClick={() => setActiveStudyId(a.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-200 text-xs font-semibold rounded transition"
                    >
                      <Play className="w-3 h-3" /> Study Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AssessmentSetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </main>
  );
}
