'use client';
import React, { useEffect } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { focusAudioEngine, AUDIO_PRESETS, AudioPresetId } from '../lib/audio';
import { Play, Pause, Volume2, Waves } from 'lucide-react';

export const AudioFocusHub: React.FC = () => {
  const { audioPresetId, volume, isAudioPlaying, phase, setAudioPreset, setVolume, setAudioPlaying } = useFocusStore();

  // Automatically cue "Silence / Optic Flow" the moment a break phase starts.
  useEffect(() => {
    if (phase === 'break') {
      setAudioPreset('silence');
      focusAudioEngine.start('silence', volume);
      setAudioPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const togglePlay = () => {
    if (isAudioPlaying) {
      focusAudioEngine.stop();
      setAudioPlaying(false);
    } else {
      focusAudioEngine.start(audioPresetId, volume);
      setAudioPlaying(true);
    }
  };

  const selectPreset = (id: AudioPresetId) => {
    setAudioPreset(id);
    if (isAudioPlaying) {
      focusAudioEngine.start(id, volume);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    focusAudioEngine.setVolume(v);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-cf-card border-t border-cf-border px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-cf-accent text-black shrink-0 transition"
        >
          {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {AUDIO_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p.id)}
              title={p.description}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition border ${
                audioPresetId === p.id
                  ? 'bg-cf-accent/15 text-cf-accent border-cf-accent/40'
                  : 'text-cf-text-muted hover:text-cf-text border-transparent'
              }`}
            >
              {p.name}
            </button>
          ))}
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

        <span className="hidden sm:flex items-center gap-1 text-[10px] text-cf-text-muted shrink-0">
          <Waves className="w-3 h-3" /> Focus Audio Engine
        </span>
      </div>
    </div>
  );
};
