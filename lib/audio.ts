export type AudioCategory = 'tone' | 'instrumental';

export type AudioPresetId =
  | 'gamma-40hz'
  | 'brown-noise'
  | 'white-noise'
  | 'pink-noise'
  | 'rainy-cafe'
  | 'winter-chill'
  | 'midnight-deep-focus'
  | 'chill-beats'
  | 'neo-classical-piano'
  | 'post-rock'
  | 'atmospheric-drone'
  | 'silence';

export interface AudioPresetMeta {
  id: AudioPresetId;
  name: string;
  description: string;
  category: AudioCategory;
}

export const AUDIO_PRESETS: AudioPresetMeta[] = [
  { id: 'gamma-40hz', name: '40 Hz Gamma Waves', description: 'Pure analytical / math focus', category: 'tone' },
  { id: 'brown-noise', name: 'Deep Brown Noise', description: 'Reading comprehension & writing', category: 'tone' },
  { id: 'white-noise', name: 'Pure White Noise', description: 'Full-spectrum masking noise', category: 'tone' },
  { id: 'pink-noise', name: 'Pink Noise', description: 'Softer, balanced masking noise', category: 'tone' },
  { id: 'rainy-cafe', name: 'Rainy Cafe Lo-Fi', description: 'Soft rain hiss with a warm undertone', category: 'instrumental' },
  { id: 'winter-chill', name: 'Winter Chill Lo-Fi', description: 'Slow minor-key pad, melancholic focus', category: 'instrumental' },
  { id: 'midnight-deep-focus', name: 'Midnight Deep Study Lo-Fi', description: 'Low sub-bass drone, sparse and dark', category: 'instrumental' },
  { id: 'chill-beats', name: 'Chill Beats Lo-Fi', description: 'Warm rhythmic pad with a soft vinyl-hiss texture', category: 'instrumental' },
  { id: 'neo-classical-piano', name: 'Neo-Classical Piano', description: 'Generative slow arpeggio loop', category: 'instrumental' },
  { id: 'post-rock', name: 'Minimalist Post-Rock', description: 'Slow-building shimmer, wide filter sweep', category: 'instrumental' },
  { id: 'atmospheric-drone', name: 'Minimalist Atmospheric Drone', description: 'Evolving ambient soundscape', category: 'instrumental' },
  { id: 'silence', name: 'Silence / Optic Flow', description: 'Break timer cue', category: 'tone' },
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

function createWhiteNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  return buffer;
}

/** Paul Kellet's economy pink noise filter. */
function createPinkNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.11;
  }
  return buffer;
}

const PIANO_PATTERN = [261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 349.23];

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
  private schedulerTimeout: ReturnType<typeof setTimeout> | null = null;

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
    if (this.schedulerTimeout) {
      clearTimeout(this.schedulerTimeout);
      this.schedulerTimeout = null;
    }
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

  private startLoopedBuffer(ctx: AudioContext, buffer: AudioBuffer, filterFreq: number | null): void {
    if (!this.masterGain) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    if (filterFreq !== null) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      src.connect(filter);
      filter.connect(this.masterGain);
      this.managedNodes.push(filter);
    } else {
      src.connect(this.masterGain);
    }
    src.start();
    this.sources.push(src);
  }

  private startDrone(ctx: AudioContext, root: number, layerGains: number[], filterFreq: number, lfoRate: number, lfoDepth: number): void {
    if (!this.masterGain) return;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.connect(this.masterGain);
    this.managedNodes.push(filter);

    const intervals = [1, 1.5, 2];
    intervals.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = root * mult + (i === 1 ? 0.6 : 0);
      const g = ctx.createGain();
      g.gain.value = layerGains[i] ?? 0.2;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.sources.push(osc);
      this.managedNodes.push(g);
    });

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = lfoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.sources.push(lfo);
    this.managedNodes.push(lfoGain);
  }

  private playPianoNote(ctx: AudioContext, freq: number, when: number): void {
    if (!this.masterGain) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.3, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(when);
    osc.stop(when + 1.5);
    this.sources.push(osc);
    this.managedNodes.push(g);
  }

  private scheduleArpeggio(ctx: AudioContext): void {
    const noteGap = 0.65;
    const loopLength = PIANO_PATTERN.length * noteGap;

    const scheduleLoop = () => {
      const startTime = ctx.currentTime + 0.05;
      PIANO_PATTERN.forEach((freq, i) => this.playPianoNote(ctx, freq, startTime + i * noteGap));
      this.schedulerTimeout = setTimeout(scheduleLoop, loopLength * 1000);
    };
    scheduleLoop();
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
      this.startLoopedBuffer(ctx, createBrownNoiseBuffer(ctx, 4), 500);
      return;
    }

    if (presetId === 'white-noise') {
      this.startLoopedBuffer(ctx, createWhiteNoiseBuffer(ctx, 4), null);
      return;
    }

    if (presetId === 'pink-noise') {
      this.startLoopedBuffer(ctx, createPinkNoiseBuffer(ctx, 4), null);
      return;
    }

    if (presetId === 'rainy-cafe') {
      // Rain hiss: filtered white noise, narrowed to a mid-high band.
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = createWhiteNoiseBuffer(ctx, 4);
      rainSrc.loop = true;
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 1200;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 5500;
      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.5;
      rainSrc.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(rainGain);
      rainGain.connect(this.masterGain);
      rainSrc.start();
      this.sources.push(rainSrc);
      this.managedNodes.push(highpass, lowpass, rainGain);

      // Warm undertone pad.
      this.startDrone(ctx, 130.81, [0.18, 0.1, 0.06], 700, 0.06, 100);
      return;
    }

    if (presetId === 'winter-chill') {
      this.startDrone(ctx, 220, [0.4, 0.22, 0.16], 650, 0.05, 150);
      return;
    }

    if (presetId === 'midnight-deep-focus') {
      this.startDrone(ctx, 55, [0.55, 0.15, 0.08], 350, 0.03, 60);
      return;
    }

    if (presetId === 'chill-beats') {
      // Warm rhythmic pad plus a soft filtered-noise "vinyl hiss" texture.
      this.startDrone(ctx, 174.61, [0.35, 0.2, 0.12], 900, 0.15, 250);

      const hissSrc = ctx.createBufferSource();
      hissSrc.buffer = createWhiteNoiseBuffer(ctx, 4);
      hissSrc.loop = true;
      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = 'highpass';
      hissFilter.frequency.value = 4000;
      const hissGain = ctx.createGain();
      hissGain.gain.value = 0.05;
      hissSrc.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(this.masterGain);
      hissSrc.start();
      this.sources.push(hissSrc);
      this.managedNodes.push(hissFilter, hissGain);
      return;
    }

    if (presetId === 'neo-classical-piano') {
      this.scheduleArpeggio(ctx);
      return;
    }

    if (presetId === 'post-rock') {
      // A lower root with a slow, wide filter sweep gives a "building" shimmer feel.
      this.startDrone(ctx, 98, [0.45, 0.3, 0.24], 600, 0.025, 500);
      return;
    }

    if (presetId === 'atmospheric-drone') {
      this.startDrone(ctx, 110, [0.5, 0.22, 0.18], 800, 0.08, 200);
      return;
    }
  }
}

export const focusAudioEngine = new FocusAudioEngine();
