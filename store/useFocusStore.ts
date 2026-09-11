import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioPresetId } from '../lib/audio';

export type SprintPresetId = 'ultradian' | 'cognitive' | 'exam-sim';
export type SprintPhase = 'idle' | 'work' | 'break' | 'complete';

export interface SprintPresetMeta {
  id: SprintPresetId;
  name: string;
  description: string;
  workMinutes: number;
  breakMinutes: number;
}

export const SPRINT_PRESETS: SprintPresetMeta[] = [
  { id: 'ultradian', name: 'Ultradian Sprint', description: '50 min deep work / 10 min optic-flow rest', workMinutes: 50, breakMinutes: 10 },
  { id: 'cognitive', name: 'Cognitive Sprint', description: '25 min high-intensity / 5 min reset', workMinutes: 25, breakMinutes: 5 },
  { id: 'exam-sim', name: 'Exam Simulation', description: '90 min uninterrupted deep test block', workMinutes: 90, breakMinutes: 0 },
];

interface FocusState {
  sprintPresetId: SprintPresetId | null;
  phase: SprintPhase;
  secondsRemaining: number;
  audioPresetId: AudioPresetId;
  volume: number;
  isAudioPlaying: boolean;

  startSprint: (presetId: SprintPresetId) => void;
  tickSprint: () => void;
  endSprint: () => void;
  setAudioPreset: (id: AudioPresetId) => void;
  setVolume: (v: number) => void;
  setAudioPlaying: (playing: boolean) => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sprintPresetId: null,
      phase: 'idle',
      secondsRemaining: 0,
      audioPresetId: 'atmospheric-drone',
      volume: 0.4,
      isAudioPlaying: false,

      startSprint: (presetId) => {
        const preset = SPRINT_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        set({ sprintPresetId: presetId, phase: 'work', secondsRemaining: preset.workMinutes * 60 });
      },

      tickSprint: () => {
        const { phase, secondsRemaining, sprintPresetId } = get();
        if (phase !== 'work' && phase !== 'break') return;

        if (secondsRemaining <= 1) {
          const preset = SPRINT_PRESETS.find((p) => p.id === sprintPresetId);
          if (phase === 'work' && preset && preset.breakMinutes > 0) {
            set({ phase: 'break', secondsRemaining: preset.breakMinutes * 60 });
          } else {
            set({ phase: 'complete', secondsRemaining: 0 });
          }
          return;
        }

        set({ secondsRemaining: secondsRemaining - 1 });
      },

      endSprint: () => set({ sprintPresetId: null, phase: 'idle', secondsRemaining: 0 }),

      setAudioPreset: (id) => set({ audioPresetId: id }),
      setVolume: (v) => set({ volume: v }),
      setAudioPlaying: (playing) => set({ isAudioPlaying: playing }),
    }),
    {
      name: 'chronoflow-focus',
      partialize: (state) => ({ audioPresetId: state.audioPresetId, volume: state.volume }),
    }
  )
);
