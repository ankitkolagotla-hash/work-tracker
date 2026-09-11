export type AudioPresetId = 'gamma-40hz' | 'brown-noise' | 'atmospheric-drone' | 'silence';

export interface AudioPresetMeta {
  id: AudioPresetId;
  name: string;
  description: string;
}

export const AUDIO_PRESETS: AudioPresetMeta[] = [
  { id: 'gamma-40hz', name: '40 Hz Gamma Waves', description: 'Pure analytical / math focus' },
  { id: 'brown-noise', name: 'Deep Brown Noise', description: 'Reading comprehension & writing' },
  { id: 'atmospheric-drone', name: 'Atmospheric Synth / Drone', description: 'Minimalist lo-fi / ambient soundscape' },
  { id: 'silence', name: 'Silence / Optic Flow', description: 'Break timer cue' },
];

function createBrownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  return buffer;
}

/**
 * Fully synthesized, in-browser focus audio via the Web Audio API — no external
 * files or streams. A singleton so the Sprint Launcher and the persistent audio
 * bar can drive the same engine and stay in sync through the focus store.
 */
export class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private managedNodes: AudioNode[] = [];
  private sources: Array<AudioBufferSourceNode | OscillatorNode> = [];
  private currentPreset: AudioPresetId | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(v: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  stop(): void {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    });
    this.sources = [];
    this.managedNodes = [];
    this.currentPreset = null;
  }

  isPlaying(): boolean {
    return this.currentPreset !== null;
  }

  async start(presetId: AudioPresetId, volume: number): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') await ctx.resume();
    this.stop();
    this.setVolume(volume);
    this.currentPreset = presetId;

    if (presetId === 'silence' || !this.masterGain) return;

    if (presetId === 'gamma-40hz') {
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.value = 200;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 40;

      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 0.5;

      const modGain = ctx.createGain();
      modGain.gain.value = 0.5;

      lfo.connect(lfoDepth);
      lfoDepth.connect(modGain.gain);
      carrier.connect(modGain);
      modGain.connect(this.masterGain);

      carrier.start();
      lfo.start();
      this.sources.push(carrier, lfo);
      this.managedNodes.push(lfoDepth, modGain);
      return;
    }

    if (presetId === 'brown-noise') {
      const buffer = createBrownNoiseBuffer(ctx, 4);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      src.connect(filter);
      filter.connect(this.masterGain);
      src.start();

      this.sources.push(src);
      this.managedNodes.push(filter);
      return;
    }

    if (presetId === 'atmospheric-drone') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.connect(this.masterGain);
      this.managedNodes.push(filter);

      const root = 110;
      const layers = [
        { freq: root, gain: 0.5 },
        { freq: root * 1.5 + 0.6, gain: 0.22 },
        { freq: root * 2, gain: 0.18 },
      ];

      layers.forEach(({ freq, gain }) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = gain;
        osc.connect(g);
        g.connect(filter);
        osc.start();
        this.sources.push(osc);
        this.managedNodes.push(g);
      });

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.sources.push(lfo);
      this.managedNodes.push(lfoGain);
      return;
    }
  }
}

export const focusAudioEngine = new FocusAudioEngine();
