'use client';
import React, { useState } from 'react';
import { AssessmentSetupModal } from '../components/AssessmentSetupModal';
import { DashboardPasteModal } from '../components/DashboardPasteModal';
import { DailyBriefing } from '../components/DailyBriefing';
import { NeedsReviewQueue } from '../components/NeedsReviewQueue';
import { WorkByClassView } from '../components/WorkByClassView';
import { SprintLauncher } from '../components/SprintLauncher';
import { StudyStreakTracker } from '../components/StudyStreakTracker';
import { NightSleepRecall } from '../components/NightSleepRecall';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { ACTMasteryHub } from '../components/ACTMasteryHub';
import { CollegeOutreachHub } from '../components/CollegeOutreachHub';
import { AthleticsHub } from '../components/AthleticsHub';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { FocusModeOverlay } from '../components/FocusModeOverlay';
import { SystemDateControl } from '../components/SystemDateControl';
import { CalendarSyncDropZone } from '../components/CalendarSyncDropZone';
import {
  Plus,
  ClipboardPaste,
  LayoutGrid,
  Target,
  GraduationCap,
  Shirt,
  DatabaseBackup,
} from 'lucide-react';

type NavTab = 'assignments' | 'act' | 'athletics' | 'college';

const NAV_TABS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'assignments', label: 'Assignments & Study', icon: LayoutGrid },
  { id: 'act', label: 'ACT Mastery', icon: Target },
  { id: 'athletics', label: 'Athletics & Soccer', icon: Shirt },
  { id: 'college', label: 'College Outreach', icon: GraduationCap },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('assignments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-cf-bg text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cf-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-mono">CHRONOFLOW OS</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Life Operating System &amp; Focus Hub</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SystemDateControl />
            <ThemeSwitcher />
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-slate-300 transition"
            >
              <DatabaseBackup className="w-3.5 h-3.5 text-cf-accent" /> Backup
            </button>
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 rounded-lg text-xs font-semibold tracking-wider text-slate-300 transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-cf-accent" /> Paste Dashboard
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

        {activeTab === 'assignments' && (
          <div className="space-y-8">
            <CalendarSyncDropZone />
            <DailyBriefing />
            <NeedsReviewQueue />
            <WorkByClassView />
            <div className="space-y-6 opacity-90">
              <SprintLauncher />
              <StudyStreakTracker />
              <NightSleepRecall />
            </div>
          </div>
        )}

        {activeTab === 'act' && <ACTMasteryHub />}
        {activeTab === 'athletics' && <AthleticsHub />}
        {activeTab === 'college' && <CollegeOutreachHub />}

        <AssessmentSetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <DashboardPasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} />
        <BackupRestoreModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
      </div>
      <FocusModeOverlay />
    </main>
  );
}
