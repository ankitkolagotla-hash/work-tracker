'use client';
import React, { useEffect, useState } from 'react';
import { useLifeOSStore } from '../store/useLifeOSStore';
import { CalendarClock, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Live Canvas calendar feed connector. Replaces the old file drop/export
 * flow entirely — the student pastes their Canvas .ics subscription link
 * once, then every sync (manual "Sync Now" or the once-per-mount automatic
 * check below) fetches it fresh server-side and reconciles it against
 * existing assessments without ever touching a local file.
 */
export const CalendarSyncDropZone: React.FC = () => {
  const { canvasFeedUrl, lastSyncedAt, syncStatus, syncError, setCanvasFeedUrl, syncCalendarFeed } = useLifeOSStore();
  const [urlDraft, setUrlDraft] = useState(canvasFeedUrl);

  // Keep the input in sync if the URL was hydrated from storage (or carried
  // over from the pre-refactor location) after this component's first render.
  useEffect(() => {
    setUrlDraft(canvasFeedUrl);
  }, [canvasFeedUrl]);

  // Automatic daily background fetch. This is a client-only SPA with no
  // service worker, so "background" here means "once per app load, if it's
  // been 24h+ since the last sync" rather than a true always-on background
  // job — that's the honest ceiling for a browser tab that isn't always open.
  useEffect(() => {
    if (!canvasFeedUrl.trim()) return;
    const last = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;
    if (Date.now() - last > ONE_DAY_MS) {
      syncCalendarFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setCanvasFeedUrl(urlDraft.trim());
  };

  const handleSyncNow = () => {
    if (urlDraft.trim() !== canvasFeedUrl) setCanvasFeedUrl(urlDraft.trim());
    syncCalendarFeed();
  };

  const isSyncing = syncStatus === 'syncing';

  return (
    <div className="mb-5 px-5 py-4 rounded-xl border border-cf-border bg-cf-bg">
      <div className="flex items-center gap-3 mb-3">
        <CalendarClock className="w-6 h-6 text-cf-accent shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-cf-text">Live Canvas Calendar Feed</p>
          <p className="text-[11px] text-cf-text-muted">
            Paste your Canvas calendar subscription link — new assignments are ingested and submitted ones marked
            Completed automatically, no file exports needed.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={handleSave}
          placeholder="https://[school].instructure.com/feeds/calendars/user_....ics"
          className="flex-1 bg-cf-card border border-cf-border rounded-lg px-3 py-2 text-xs text-cf-text focus:outline-cf-accent"
        />
        <button
          onClick={handleSyncNow}
          disabled={isSyncing || !urlDraft.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-cf-accent hover:opacity-90 disabled:opacity-40 text-black text-xs font-semibold rounded-lg transition shrink-0"
        >
          {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[11px]">
        {syncStatus === 'error' ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-red-400">{syncError}</span>
          </>
        ) : lastSyncedAt ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-cf-text-muted">Last Synced: {formatTimestamp(lastSyncedAt)}</span>
          </>
        ) : (
          <span className="text-cf-text-muted">
            {canvasFeedUrl ? 'Not synced yet — click Sync Now.' : 'No feed connected yet.'}
          </span>
        )}
      </div>
    </div>
  );
};
