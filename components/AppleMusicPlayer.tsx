'use client';
import React, { useState } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { APPLE_MUSIC_PRESETS, buildPlaylistEmbedUrl, resolveAppleMusicEmbedUrl } from '../lib/appleMusicPresets';
import { Music2, ChevronUp, Link2, ChevronDown } from 'lucide-react';

/**
 * Official embedded Apple Music Web Player. Replaces the old synthesized
 * Web Audio focus soundscapes bar — playback (and Apple's own native sign-in
 * for full-length tracks) happens entirely inside Apple's iframe, which this
 * app has no access into; it only ever picks which embed URL to load.
 */
export const AppleMusicPlayer: React.FC = () => {
  const embedUrl = useFocusStore((s) => s.appleMusicEmbedUrl);
  const setEmbedUrl = useFocusStore((s) => s.setAppleMusicEmbedUrl);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState('');

  const activePreset = APPLE_MUSIC_PRESETS.find((p) => buildPlaylistEmbedUrl(p.playlistId) === embedUrl);

  const selectPreset = (playlistId: string) => {
    setEmbedUrl(buildPlaylistEmbedUrl(playlistId));
    setExpanded(true);
    setPickerOpen(false);
    setError('');
  };

  const handleLoadCustom = () => {
    const resolved = resolveAppleMusicEmbedUrl(customUrl);
    if (!resolved) {
      setError('Paste a valid Apple Music song, album, or playlist link.');
      return;
    }
    setEmbedUrl(resolved);
    setExpanded(true);
    setError('');
    setPickerOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-cf-card border-t border-cf-border">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 relative">
          <Music2 className="w-4 h-4 text-cf-accent shrink-0" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cf-bg border border-cf-border text-cf-text hover:border-slate-600 transition"
            >
              {activePreset ? activePreset.name : embedUrl ? 'Custom Link' : 'Choose Music'}
              <ChevronUp className={`w-3 h-3 transition-transform ${pickerOpen ? '' : 'rotate-180'}`} />
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-cf-card border border-cf-border rounded-xl p-3 shadow-2xl z-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted mb-1.5">Presets</p>
                  <div className="space-y-1 mb-3">
                    {APPLE_MUSIC_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPreset(p.playlistId)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                          activePreset?.id === p.id ? 'bg-cf-accent/15 text-cf-accent' : 'text-cf-text hover:bg-cf-bg'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted mb-1.5">Custom Apple Music Link</p>
                  <div className="flex gap-1.5">
                    <input
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://music.apple.com/us/..."
                      className="flex-1 bg-cf-bg border border-cf-border rounded px-2 py-1.5 text-xs text-cf-text focus:outline-cf-accent"
                    />
                    <button
                      onClick={handleLoadCustom}
                      className="flex items-center justify-center px-2.5 py-1.5 bg-cf-accent hover:opacity-90 text-black rounded transition"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
                </div>
              </>
            )}
          </div>

          {embedUrl && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-[11px] text-cf-text-muted hover:text-cf-text transition"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {expanded ? 'Hide Player' : 'Show Player'}
            </button>
          )}

          <span className="hidden sm:block text-[10px] text-cf-text-muted ml-auto">
            Sign in inside the player for full-length Apple Music playback
          </span>
        </div>

        {embedUrl && expanded && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <iframe
              key={embedUrl}
              title="Apple Music Player"
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              height={150}
              style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', borderRadius: 12, border: 0 }}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
              src={embedUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
};
