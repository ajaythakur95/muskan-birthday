/**
 * Tiny synthesized sound effects (Web Audio, no audio files). They follow the music
 * ON/OFF + volume setting: when the music is off or muted, effects are silent too.
 */
import { music } from "./musicEngine";

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
const last: Record<string, number> = {};

function audio(): { c: AudioContext; out: GainNode } | null {
  const { status, muted, volume } = music.getSnapshot();
  if (status !== "playing" || muted || volume <= 0) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    const out = ctx.createGain();
    out.gain.value = Math.min(1, 0.35 + volume * 0.65) * 0.9;
    out.connect(ctx.destination);
    return { c: ctx, out };
  } catch {
    return null;
  }
}

function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}

/** A pitched note with a quick attack and exponential decay. */
function tone(c: AudioContext, out: AudioNode, f: number, t: number, dur: number, gain: number, type: OscillatorType = "sine", f2?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Filtered noise burst. */
function hiss(c: AudioContext, out: AudioNode, t: number, dur: number, gain: number, type: BiquadFilterType, f1: number, f2 = f1) {
  const s = noise(c);
  const flt = c.createBiquadFilter();
  const g = c.createGain();
  flt.type = type;
  flt.frequency.setValueAtTime(f1, t);
  flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + Math.min(0.05, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(flt).connect(g).connect(out);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const effects = {
  /** Ribbon rustle. */
  ribbon(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.5, 0.18, "bandpass", 2500, 5200);
    hiss(c, o, t + 0.25, 0.4, 0.12, "bandpass", 3600, 1800);
  },
  /** Lid pops open with a magical rising chime. */
  giftOpen(c: AudioContext, o: AudioNode, t: number) {
    tone(c, o, 140, t, 0.25, 0.3, "sine", 70); // soft thump
    hiss(c, o, t, 0.9, 0.2, "highpass", 600, 5000); // whoosh
    [84, 88, 91, 96, 100, 103].forEach((m, i) => tone(c, o, midi(m - 12), t + 0.08 + i * 0.09, 1.3, 0.16, "sine"));
    [96, 103, 108].forEach((m, i) => tone(c, o, midi(m - 12), t + 0.5 + i * 0.12, 1.6, 0.07, "triangle"));
  },
  /** Cheerful party popper. */
  pop(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.18, 0.35, "highpass", 1500, 4000);
    tone(c, o, 520, t, 0.12, 0.22, "sine", 140);
    for (let i = 0; i < 6; i++) tone(c, o, 2000 + Math.random() * 3000, t + 0.1 + i * 0.05, 0.25, 0.04, "sine");
  },
  /** Landing / small whoosh. */
  whoosh(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.7, 0.14, "bandpass", 500, 2600);
  },
  /** A candle catching light. */
  candle(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.16, 0.18, "highpass", 3000, 6000);
    tone(c, o, midi(96 + Math.floor(Math.random() * 4)), t + 0.04, 0.5, 0.06, "sine");
  },
  /** Making a wish. */
  wish(c: AudioContext, o: AudioNode, t: number) {
    [72, 76, 79, 84].forEach((m, i) => tone(c, o, midi(m + 12), t + i * 0.16, 1.8, 0.09, "sine"));
  },
  /** Blowing out the candles. */
  blow(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.9, 0.38, "lowpass", 900, 260);
    hiss(c, o, t + 0.05, 0.9, 0.2, "bandpass", 1600, 700);
  },
  /** Knife through cake. */
  cut(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.22, 0.34, "highpass", 2200, 6500);
    tone(c, o, 190, t + 0.05, 0.22, 0.28, "triangle", 80);
  },
  /** Slice lands on the table. */
  clink(c: AudioContext, o: AudioNode, t: number) {
    tone(c, o, 2400, t, 0.5, 0.1, "sine");
    tone(c, o, 3600, t, 0.35, 0.06, "sine");
  },
  /** Hello chime when Ajay walks in. */
  hello(c: AudioContext, o: AudioNode, t: number) {
    [79, 83, 86].forEach((m, i) => tone(c, o, midi(m), t + i * 0.11, 0.9, 0.14, "triangle"));
  },
  /** Firework: crackling boom. */
  firework(c: AudioContext, o: AudioNode, t: number) {
    hiss(c, o, t, 0.8, 0.4, "lowpass", 700, 90);
    tone(c, o, 90, t, 0.5, 0.35, "sine", 38);
    for (let i = 0; i < 9; i++) hiss(c, o, t + 0.12 + Math.random() * 0.7, 0.07, 0.1, "highpass", 4000 + Math.random() * 3000);
  },
  /** Rocket whistle before a firework (used rarely, quiet). */
  rocket(c: AudioContext, o: AudioNode, t: number) {
    tone(c, o, 500, t, 0.65, 0.05, "sine", 1700);
  },
} as const;

export type SfxName = keyof typeof effects;

export const sfx = {
  play(name: SfxName, delaySec = 0) {
    const now = performance.now();
    if (now - (last[name] ?? 0) < 90) return; // never stack identical sounds
    last[name] = now;
    const a = audio();
    if (!a) return;
    effects[name](a.c, a.out, a.c.currentTime + 0.01 + delaySec);
  },
};
