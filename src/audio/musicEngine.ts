
export type MusicStatus = "idle" | "playing" | "paused";

export interface MusicState {
  status: MusicStatus;
  volume: number;
  muted: boolean;
}

class MusicEngine {
  private audio: HTMLAudioElement | null = null;

  private listeners = new Set<() => void>();

  private state: MusicState = {
    status: "idle",
    volume: 0.6,
    muted: false,
  };

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.state;

  private set(patch: Partial<MusicState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  init(volume: number) {
    this.state = {
      ...this.state,
      volume: Math.min(1, Math.max(0, volume)),
    };
    this.applyVolume();
    this.listeners.forEach((listener) => listener());
  }

  private createAudio() {
    if (this.audio) return;

    const audio = new Audio("/audio/birthday-song.mp3");

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = this.state.muted ? 0 : this.state.volume;

    audio.addEventListener("ended", () => {
      this.set({ status: "idle" });
    });

    audio.addEventListener("error", () => {
      this.set({ status: "paused" });
    });

    this.audio = audio;
  }

  private applyVolume() {
    if (!this.audio) return;

    this.audio.volume = this.state.muted
      ? 0
      : this.state.volume;
  }

  async play() {
    if (this.state.status === "playing") return;

    this.createAudio();

    try {
      await this.audio!.play();
      this.applyVolume();
      this.set({ status: "playing" });
    } catch (error) {
      console.error("Music playback failed:", error);
      this.set({ status: "paused" });
    }
  }

  pause() {
    if (!this.audio) return;

    this.audio.pause();
    this.set({ status: "paused" });
  }

  toggle() {
    if (this.state.status === "playing") {
      this.pause();
    } else {
      void this.play();
    }
  }

  setVolume(value: number) {
    const volume = Math.min(1, Math.max(0, value));

    this.set({ volume, muted: false });
    this.applyVolume();
  }

  toggleMute() {
    this.set({ muted: !this.state.muted });
    this.applyVolume();
  }
}

export const music = new MusicEngine();
