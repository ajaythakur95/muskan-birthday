/**
 * Original, royalty-free background music generated live with the Web Audio API
 * (a soft music-box lullaby over a warm pad). No audio files, so nothing to license.
 * The AudioContext is only created inside play(), which is called from a click,
 * so nothing ever plays (or even initialises) before the visitor interacts.
 */
export type MusicStatus = "idle" | "playing" | "paused";
export interface MusicState {
  status: MusicStatus;
  volume: number;
  muted: boolean;
}

const BPM = 74;
const STEP = 60 / BPM / 2; // one eighth note, in seconds
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// I – vi – IV – V in C major, one bar each.
const CHORDS = [
  { bass: 48, tones: [60, 64, 67, 72] },
  { bass: 45, tones: [57, 60, 64, 69] },
  { bass: 53, tones: [60, 65, 69, 72] },
  { bass: 55, tones: [59, 62, 67, 71] },
];
const ARP = [0, 1, 2, 3, 2, 1, 3, 2];
const SCALE = [72, 74, 76, 79, 81, 84]; // C major pentatonic

const FADE_IN = 0.45; // time constants for smooth gain changes
const FADE_OUT = 0.28;

class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private timer: number | null = null;
  private suspendTimer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private melodyIdx = 2;
  private listeners = new Set<() => void>();
  private state: MusicState = { status: "idle", volume: 0.6, muted: false };

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;

  private set(patch: Partial<MusicState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Sets the starting volume (e.g. restored from storage) before anything plays. */
  init(volume: number) {
    this.state = { ...this.state, volume: Math.min(1, Math.max(0, volume)) };
    this.listeners.forEach((l) => l());
  }

  private target() {
    const { volume, muted } = this.state;
    return muted ? 0 : volume * volume * 0.85; // squared = more natural slider feel
  }

  private build() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    const bus = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    // Simple synthetic reverb: decaying stereo noise.
    const len = Math.floor(ctx.sampleRate * 2.6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    bus.connect(master);
    bus.connect(verb);
    verb.connect(wet);
    wet.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    this.bus = bus;
  }

  async play() {
    if (this.state.status === "playing") return;
    if (this.suspendTimer) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    try {
      await ctx.resume();
    } catch {
      return; // the browser refused; stay paused
    }
    this.nextTime = ctx.currentTime + 0.08;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(this.target(), ctx.currentTime, FADE_IN);
    if (this.timer === null) this.timer = window.setInterval(() => this.tick(), 110);
    this.set({ status: "playing" });
  }

  pause() {
    const ctx = this.ctx;
    if (!ctx || this.state.status !== "playing") return;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(0, ctx.currentTime, FADE_OUT);
    this.set({ status: "paused" });
    // Let the fade finish, then really stop the clock and the scheduler.
    this.suspendTimer = window.setTimeout(() => {
      if (this.state.status !== "paused") return;
      if (this.timer !== null) window.clearInterval(this.timer);
      this.timer = null;
      void ctx.suspend();
    }, 1100);
  }

  toggle() {
    if (this.state.status === "playing") this.pause();
    else void this.play();
  }

  setVolume(v: number) {
    const volume = Math.min(1, Math.max(0, v));
    this.set({ volume, muted: false });
    this.applyGain();
  }

  toggleMute() {
    this.set({ muted: !this.state.muted });
    this.applyGain();
  }

  private applyGain() {
    if (!this.ctx || !this.master || this.state.status !== "playing") return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(this.target(), this.ctx.currentTime, 0.1);
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextTime < ctx.currentTime + 0.5) {
      this.scheduleStep(this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
  }

  private scheduleStep(t: number) {
    const inBar = this.step % 8;
    const chord = CHORDS[Math.floor(this.step / 8) % CHORDS.length];

    if (inBar === 0) {
      this.pad(chord.tones.slice(0, 3), t, STEP * 8 + 0.9);
      this.pluck(midi(chord.bass), t, 0.2, 2.4, true);
    }
    if (inBar === 4) this.pluck(midi(chord.bass + 7), t, 0.1, 1.8, true);

    this.pluck(midi(chord.tones[ARP[inBar]]), t, 0.11, 1.7);

    // A gentle wandering melody on the strong beats.
    if (inBar === 0 || inBar === 4 || (inBar === 6 && Math.random() < 0.5)) {
      const move = Math.floor(Math.random() * 3) - 1;
      this.melodyIdx = Math.min(SCALE.length - 1, Math.max(0, this.melodyIdx + move));
      this.pluck(midi(SCALE[this.melodyIdx]), t + 0.01, 0.17, 2.2);
    }
  }

  /** A music-box note: a soft sine plus a quiet bell-like overtone. */
  private pluck(freq: number, t: number, level: number, dur: number, soft = false) {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(level, t + (soft ? 0.03 : 0.004));
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(this.bus!);
    const partials: Array<[number, number]> = soft ? [[1, 1]] : [[1, 1], [3, 0.14], [5.4, 0.05]];
    for (const [mult, amp] of partials) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq * mult;
      g.gain.value = amp;
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  /** Warm, slowly swelling pad. */
  private pad(notes: number[], t: number, dur: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(0.05, t + 1.3);
    out.gain.linearRampToValueAtTime(0.0001, t + dur);
    filter.connect(out);
    out.connect(this.bus!);
    for (const n of notes) {
      for (const detune of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = midi(n);
        o.detune.value = detune;
        o.connect(filter);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }
  }
}

export const music = new MusicEngine();


