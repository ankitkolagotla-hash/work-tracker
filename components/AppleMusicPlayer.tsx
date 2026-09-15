'use client';
import React, { useState } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { focusAudioEngine } from '../lib/audio';
import { APPLE_MUSIC_PRESETS, NOISE_PRESET_ID, NOISE_PRESET_NAME, resolveAppleMusicEmbedUrl } from '../lib/appleMusicPresets';
import { Music2, ChevronUp, Link2, ChevronDown, LogIn, Play, Pause, Volume2 } from 'lucide-react';

/**
 * Official embedded Apple Music Web Player, with one small exception: the
 * 6th "Brown / White Noise Generators" preset has no Apple playlist behind
 * it, so it toggles the in-browser Web Audio noise engine instead — the same
 * engine (and the same persisted volume/preset fields) the old focus-audio
 * bar used, just driven from this picker now instead of its own UI.
 */
export const AppleMusicPlayer: React.FC = () => {
  const embedUrl = useFocusStore((s) => s.appleMusicEmbedUrl);
  const setEmbedUrl = useFocusStore((s) => s.setAppleMusicEmbedUrl);
  const audioPresetId = useFocusStore((s) => s.audioPresetId);
  const volume = useFocusStore((s) => s.volume);
  const isAudioPlaying = useFocusStore((s) => s.isAudioPlaying);
  const setAudioPreset = useFocusStore((s) => s.setAudioPreset);
  const setVolume = useFocusStore((s) => s.setVolume);
  const setAudioPlaying = useFocusStore((s) => s.setAudioPlaying);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'apple' | 'noise'>('apple');

  const activePreset = APPLE_MUSIC_PRESETS.find((p) => p.embedUrl === embedUrl);
  const activeLabel =
    mode === 'noise' ? NOISE_PRESET_NAME : activePreset ? activePreset.name : embedUrl ? 'Custom Link' : 'Choose Music';

  const stopNoise = () => {
    focusAudioEngine.stop();
    setAudioPlaying(false);
  };

  const selectPreset = (embed: string) => {
    if (mode === 'noise') stopNoise();
    setMode('apple');
    setEmbedUrl(embed);
    setExpanded(true);
    setPickerOpen(false);
    setError('');
  };

  const selectNoiseMode = () => {
    setMode('noise');
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
    if (mode === 'noise') stopNoise();
    setMode('apple');
    setEmbedUrl(resolved);
    setExpanded(true);
    setError('');
    setPickerOpen(false);
  };

  const toggleNoisePlayback = () => {
    if (isAudioPlaying) {
      stopNoise();
    } else {
      const presetId = audioPresetId === 'brown-noise' || audioPresetId === 'white-noise' ? audioPresetId : 'brown-noise';
      setAudioPreset(presetId);
      focusAudioEngine.start(presetId, volume);
      setAudioPlaying(true);
    }
  };

  const selectNoiseType = (id: 'brown-noise' | 'white-noise') => {
    setAudioPreset(id);
    if (isAudioPlaying) focusAudioEngine.start(id, volume);
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    focusAudioEngine.setVolume(v);
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
              {activeLabel}
              <ChevronUp className={`w-3 h-3 transition-transform ${pickerOpen ? '' : 'rotate-180'}`} />
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-cf-card border border-cf-border rounded-xl p-3 shadow-2xl z-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted mb-1.5">One-Click Presets</p>
                  <div className="space-y-1 mb-3">
                    {APPLE_MUSIC_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPreset(p.embedUrl)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                          mode === 'apple' && activePreset?.id === p.id ? 'bg-cf-accent/15 text-cf-accent' : 'text-cf-text hover:bg-cf-bg'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    <button
                      key={NOISE_PRESET_ID}
                      onClick={selectNoiseMode}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                        mode === 'noise' ? 'bg-cf-accent/15 text-cf-accent' : 'text-cf-text hover:bg-cf-bg'
                      }`}
                    >
                      {NOISE_PRESET_NAME}
                    </button>
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
                  <p className="text-[10px] text-cf-text-muted mt-1">
                    Paste any music.apple.com link — it's rewritten to the embed URL automatically.
                  </p>
                  {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
                </div>
              </>
            )}
          </div>

          {mode === 'apple' && embedUrl && (
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-cf-accent/40 bg-cf-accent/10 text-[10px] font-semibold text-cf-accent">
              <LogIn className="w-3 h-3" /> Click "Sign In" in the top-right corner of the player for full-length playback
            </span>
          )}

          {((mode === 'apple' && embedUrl) || mode === 'noise') && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-[11px] text-cf-text-muted hover:text-cf-text transition ml-auto sm:ml-0"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {expanded ? 'Hide Player' : 'Show Player'}
            </button>
          )}
        </div>

        {mode === 'apple' && embedUrl && expanded && (
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

        {mode === 'noise' && expanded && (
          <div className="mt-2 flex flex-wrap items-center gap-3 bg-cf-bg border border-cf-border rounded-lg p-3">
            <button
              type="button"
              onClick={toggleNoisePlayback}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-cf-accent text-black shrink-0 transition"
            >
              {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex bg-cf-card border border-cf-border rounded overflow-hidden">
              <button
                onClick={() => selectNoiseType('brown-noise')}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  audioPresetId === 'brown-noise' ? 'bg-cf-accent text-black' : 'text-cf-text hover:bg-cf-bg'
                }`}
              >
                Brown Noise
              </button>
              <button
                onClick={() => selectNoiseType('white-noise')}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  audioPresetId === 'white-noise' ? 'bg-cf-accent text-black' : 'text-cf-text hover:bg-cf-bg'
                }`}
              >
                White Noise
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto min-w-[120px]">
              <Volume2 className="w-4 h-4 text-cf-text-muted shrink-0" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolume(Number(e.target.value))}
                className="w-24"
                style={{ accentColor: 'rgb(var(--cf-accent))' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
