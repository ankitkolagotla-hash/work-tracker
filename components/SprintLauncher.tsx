'use client';
import React from 'react';
import { useFocusStore, SPRINT_PRESETS, SprintPresetId } from '../store/useFocusStore';
import { focusAudioEngine, AudioPresetId } from '../lib/audio';
import { Zap, Brain, GraduationCap, Square } from 'lucide-react';

const SPRINT_AUDIO_MAP: Record<SprintPresetId, AudioPresetId> = {
  ultradian: 'atmospheric-drone',
  cognitive: 'gamma-40hz',
  'exam-sim': 'brown-noise',
};

const SPRINT_ICONS: Record<SprintPresetId, React.ElementType> = {
  ultradian: Zap,
  cognitive: Brain,
  'exam-sim': GraduationCap,
};

function formatMMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const SprintLauncher: React.FC = () => {
  const { sprintPresetId, phase, secondsRemaining, volume, startSprint, endSprint, setAudioPreset, setAudioPlaying } =
    useFocusStore();

  const handleStart = (id: SprintPresetId) => {
    startSprint(id);
    const audioId = SPRINT_AUDIO_MAP[id];
    setAudioPreset(audioId);
    focusAudioEngine.start(audioId, volume);
    setAudioPlaying(true);
  };

  const handleEnd = () => {
    endSprint();
    focusAudioEngine.stop();
    setAudioPlaying(false);
  };

  const activePreset = SPRINT_PRESETS.find((p) => p.id === sprintPresetId);
  const isActive = phase === 'work' || phase === 'break';

  return (
    <div className="bg-cf-card border border-cf-border rounded-xl p-6 text-cf-text">
      <h2 className="text-lg font-bold text-cf-text mb-1 flex items-center gap-2">
        <Zap className="w-5 h-5 text-cf-accent" /> Sprint Launcher
      </h2>
      <p className="text-xs text-cf-text-muted mb-4">Optimal study-timing blocks, backed by ultradian rhythm research.</p>

      {isActive && activePreset ? (
        <div className="bg-cf-bg border border-cf-border rounded-lg p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-cf-text-muted mb-1">
            {phase === 'work' ? activePreset.name : 'Optic Flow Rest'}
          </p>
          <div className="text-4xl font-mono font-bold text-cf-accent mb-3">{formatMMSS(secondsRemaining)}</div>
          <button
            onClick={handleEnd}
            className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-cf-card border border-cf-border hover:border-slate-600 text-xs font-semibold text-cf-text rounded transition"
          >
            <Square className="w-3 h-3" /> End Sprint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SPRINT_PRESETS.map((p) => {
            const Icon = SPRINT_ICONS[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleStart(p.id)}
                className="flex flex-col items-start gap-2 bg-cf-bg border border-cf-border hover:border-cf-accent rounded-lg p-4 text-left transition"
              >
                <Icon className="w-5 h-5 text-cf-accent" />
                <span className="text-sm font-bold text-cf-text">{p.name}</span>
                <span className="text-[11px] text-cf-text-muted">{p.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
