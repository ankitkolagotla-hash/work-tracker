'use client';
import React, { useMemo, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { parseDashboardText } from '../lib/dashboardParse';
import { REGISTERED_COURSES, Assessment } from '../types/assessment';
import { EMPTY_STUDY_PACK } from '../lib/studyGenerator';
import { isUpcoming, toDateOnly } from '../lib/date';
import { ClipboardPaste, X, CalendarPlus } from 'lucide-react';

export const DashboardPasteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { importCanvasEvents } = useAssessmentStore();
  const [rawText, setRawText] = useState('');

  const parsedItems = useMemo(() => {
    if (!rawText.trim()) return [];
    return parseDashboardText(rawText).filter((item) => isUpcoming(item.dueDateISO));
  }, [rawText]);

  if (!isOpen) return null;

  const handleImport = () => {
    const events: Assessment[] = parsedItems.map((item, idx) => ({
      id: `paste-${Date.now()}-${idx}`,
      title: item.title,
      type: item.type,
      courseId: item.courseId,
      unitsCovered: ['Dashboard Paste Ingest'],
      dueDate: item.dueDateISO,
      status: 'Upcoming',
      points: item.points,
      readinessIndex: 0,
      pastedMaterials: '',
      studyPack: EMPTY_STUDY_PACK,
      totalPrepTimeMinutes: 60,
      studySessionPacing: '25m Pomodoro',
      targetStudyDays: [],
    }));
    importCanvasEvents(events);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-cf-card border border-cf-border w-full max-w-2xl rounded-xl p-6 text-cf-text shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-cf-text flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-cf-accent" /> Direct Dashboard Paste
          </h3>
          <button onClick={onClose} className="text-cf-text-muted hover:text-cf-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-cf-text-muted mb-4">
          Paste your entire Canvas dashboard, weekly syllabus, or a custom schedule. Any line with a recognizable due
          date becomes an assessment automatically — no waiting on a feed sync.
        </p>

        <textarea
          rows={10}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={'IB Biology — Cell Membrane Lab Report — Due Sep 16\nECON-S1: Market Structures Quiz (09/18/2026)\nCreative Writing Portfolio Draft - Sept 20'}
          className="w-full bg-cf-bg border border-cf-border rounded p-3 text-xs font-mono text-cf-text resize-none focus:outline-cf-accent mb-4"
        />

        <div className="flex-1 overflow-y-auto min-h-[60px] mb-4">
          {parsedItems.length === 0 ? (
            <p className="text-xs text-cf-text-muted">No dated assignments recognized yet.</p>
          ) : (
            <div className="space-y-1.5">
              {parsedItems.map((item, idx) => {
                const course = REGISTERED_COURSES.find((c) => c.id === item.courseId);
                return (
                  <div key={idx} className="flex items-center justify-between bg-cf-bg border border-cf-border rounded-md px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                        style={{ color: course?.color, backgroundColor: `${course?.color}18` }}
                      >
                        {course?.code}
                      </span>
                      <span className="text-cf-text truncate">{item.title}</span>
                    </div>
                    <span className="text-cf-text-muted shrink-0 ml-2">{toDateOnly(item.dueDateISO)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cf-text-muted hover:text-cf-text">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedItems.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-cf-accent hover:opacity-90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black rounded transition"
          >
            <CalendarPlus className="w-4 h-4" />
            Import {parsedItems.length || ''} Assignment{parsedItems.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
};
