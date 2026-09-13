'use client';
import React, { useRef, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { Assessment } from '../types/assessment';
import { EMPTY_STUDY_PACK } from '../lib/studyGenerator';
import { parseICSFile } from '../lib/icsImport';
import { downloadICS } from '../lib/icsExport';
import { CalendarArrowDown, CalendarArrowUp, CheckCircle2 } from 'lucide-react';

/**
 * High-visibility .ics sync zone: drag-and-drop or upload a calendar file to
 * pull in new events (deduped against what's already tracked), and export the
 * current study schedule + ACT mocks back out to Apple Calendar in one click.
 */
export const CalendarSyncDropZone: React.FC = () => {
  const { assessments, importCanvasEvents } = useAssessmentStore();
  const actMockExams = useLifeOSStore((s) => s.actMockExams);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseICSFile(text);
    const existingTitles = new Set(assessments.map((a) => a.title));

    const events: Assessment[] = parsed
      .filter((item) => !existingTitles.has(item.title))
      .map((item, idx) => ({
        id: `ics-${Date.now()}-${idx}`,
        title: item.title,
        type: item.type,
        courseId: item.courseId,
        unitsCovered: ['ICS Calendar Sync'],
        dueDate: item.dueDateISO,
        status: 'Upcoming',
        difficulty: 'Medium',
        points: item.points,
        readinessIndex: 0,
        pastedMaterials: '',
        studyPack: EMPTY_STUDY_PACK,
        totalPrepTimeMinutes: 60,
        studySessionPacing: '25m Pomodoro',
        targetStudyDays: [],
      }));

    importCanvasEvents(events);
    setLastResult({ imported: events.length, skipped: parsed.length - events.length });
    setTimeout(() => setLastResult(null), 4000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.name.endsWith('.ics'));
    if (file) handleFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 px-5 py-4 rounded-xl border-2 border-dashed cursor-pointer transition ${
        dragOver ? 'border-cf-accent bg-cf-accent/5' : 'border-cf-border bg-cf-bg hover:border-slate-600'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-3">
        <CalendarArrowDown className="w-6 h-6 text-cf-accent shrink-0" />
        <div>
          <p className="text-sm font-bold text-cf-text">Drop a .ics calendar file to sync</p>
          <p className="text-[11px] text-cf-text-muted">
            {lastResult
              ? `Imported ${lastResult.imported} new event${lastResult.imported === 1 ? '' : 's'}${lastResult.skipped > 0 ? ` · ${lastResult.skipped} already tracked` : ''}`
              : 'Drag & drop, or click to browse — duplicates are skipped automatically.'}
          </p>
        </div>
        {lastResult && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          downloadICS(assessments, actMockExams);
        }}
        className="flex items-center gap-1.5 px-3 py-2 bg-cf-card border border-cf-border hover:border-slate-600 text-xs font-semibold text-cf-text rounded-lg transition shrink-0"
      >
        <CalendarArrowUp className="w-3.5 h-3.5 text-cf-accent" /> 1-Click Export to Apple Calendar
      </button>
    </div>
  );
};
