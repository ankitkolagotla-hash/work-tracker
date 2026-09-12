'use client';
import React, { useEffect, useState } from 'react';
import { useFocusStore } from '../store/useFocusStore';
import { focusAudioEngine, AUDIO_PRESETS, AudioPresetId } from '../lib/audio';
import { Play, Pause, Volume2, Waves, ChevronUp, Check } from 'lucide-react';

export const AudioFocusHub: React.FC = () => {
  const { audioPresetId, volume, isAudioPlaying, phase, setAudioPreset, setVolume, setAudioPlaying } = useFocusStore();
  const [pickerOpen, setPickerOpen] = useState(false);

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
    setPickerOpen(false);
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    focusAudioEngine.setVolume(v);
  };

  const currentPreset = AUDIO_PRESETS.find((p) => p.id === audioPresetId) ?? AUDIO_PRESETS[0];
  const toneOptions = AUDIO_PRESETS.filter((p) => p.category === 'tone');
  const instrumentalOptions = AUDIO_PRESETS.filter((p) => p.category === 'instrumental');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-cf-card border-t border-cf-border px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3 relative">
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-cf-accent text-black shrink-0 transition"
        >
          {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cf-bg border border-cf-border text-cf-text hover:border-slate-600 transition"
          >
            {currentPreset.name} <ChevronUp className={`w-3 h-3 transition-transform ${pickerOpen ? '' : 'rotate-180'}`} />
          </button>

          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
              <div className="absolute bottom-full left-0 mb-2 w-72 bg-cf-card border border-cf-border rounded-xl p-3 shadow-2xl z-50 max-h-80 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted mb-1.5">Focus Tones</p>
                <div className="space-y-1 mb-3">
                  {toneOptions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPreset(p.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                        audioPresetId === p.id ? 'bg-cf-accent/15 text-cf-accent' : 'text-cf-text hover:bg-cf-bg'
                      }`}
                    >
                      <span className="text-left">
                        <span className="block font-semibold">{p.name}</span>
                        <span className="block text-[10px] text-cf-text-muted">{p.description}</span>
                      </span>
                      {audioPresetId === p.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-cf-text-muted mb-1.5">Instrumental Channels</p>
                <div className="space-y-1">
                  {instrumentalOptions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPreset(p.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                        audioPresetId === p.id ? 'bg-cf-accent/15 text-cf-accent' : 'text-cf-text hover:bg-cf-bg'
                      }`}
                    >
                      <span className="text-left">
                        <span className="block font-semibold">{p.name}</span>
                        <span className="block text-[10px] text-cf-text-muted">{p.description}</span>
                      </span>
                      {audioPresetId === p.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
