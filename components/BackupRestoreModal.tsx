'use client';
import React, { useRef, useState } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { useFocusStore } from '../store/useFocusStore';
import { useThemeStore } from '../store/useThemeStore';
import { X, Download, Upload, DatabaseBackup, CheckCircle2, AlertTriangle } from 'lucide-react';

const BACKUP_FORMAT = 'chronoflow-backup-v1';

interface BackupPayload {
  format: typeof BACKUP_FORMAT;
  exportedAt: string;
  assessmentStore: unknown;
  lifeOSStore: unknown;
  focusStore: unknown;
  themeStore: unknown;
}

export const BackupRestoreModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const payload: BackupPayload = {
      format: BACKUP_FORMAT,
      exportedAt: new Date().toISOString(),
      assessmentStore: useAssessmentStore.getState(),
      lifeOSStore: useLifeOSStore.getState(),
      focusStore: { audioPresetId: useFocusStore.getState().audioPresetId, volume: useFocusStore.getState().volume },
      themeStore: useThemeStore.getState(),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronoflow-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus({ kind: 'ok', message: 'Backup downloaded.' });
  };

  const handleRestoreFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupPayload>;
      if (!parsed || typeof parsed !== 'object' || !parsed.assessmentStore || !parsed.lifeOSStore) {
        setStatus({ kind: 'error', message: 'This file doesn\'t look like a ChronoFlow backup — missing expected state sections.' });
        return;
      }
      // setState here live-updates the running stores (and, via the persist
      // middleware already attached to each, their localStorage backing) —
      // no page reload or database re-seed required.
      useAssessmentStore.setState(parsed.assessmentStore as never);
      useLifeOSStore.setState(parsed.lifeOSStore as never);
      if (parsed.focusStore) useFocusStore.setState(parsed.focusStore as never);
      if (parsed.themeStore) useThemeStore.setState(parsed.themeStore as never);
      setStatus({ kind: 'ok', message: 'Backup restored — your data is live, no reload needed.' });
    } catch (err) {
      console.error(err);
      setStatus({ kind: 'error', message: 'Could not parse that file as valid JSON.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-cf-card border border-cf-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-cf-text flex items-center gap-2">
            <DatabaseBackup className="w-4 h-4 text-cf-accent" /> Backup &amp; Data Management
          </h3>
          <button onClick={onClose} className="text-cf-text-muted hover:text-cf-text">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-cf-text-muted mb-5">
          Every task, score, log, and draft lives in your browser's storage. Export a full snapshot for safekeeping, or restore one —
          restoring never wipes anything first, it just overlays the file's data onto what's currently loaded.
        </p>

        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cf-accent hover:opacity-90 text-black font-semibold rounded transition text-sm mb-3"
        >
          <Download className="w-4 h-4" /> Export Full Backup (.json)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleRestoreFile(f);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded transition text-sm"
        >
          <Upload className="w-4 h-4" /> Restore Backup (.json)
        </button>

        {status && (
          <p className={`flex items-center gap-1.5 text-xs mt-4 ${status.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status.kind === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
};
