import { useEffect, useSyncExternalStore } from "react";
import { music } from "../audio/musicEngine";
import { birthdayConfig } from "../config/birthday";

let restored = false;
function restoreVolume() {
  if (restored) return;
  restored = true;
  let v: number = birthdayConfig.music.defaultVolume;
  try {
    const saved = window.localStorage.getItem(birthdayConfig.music.storageKey);
    if (saved !== null && !Number.isNaN(Number(saved))) v = Number(saved);
  } catch {
    /* storage unavailable: keep the default */
  }
  music.init(v);
}

export function useMusic() {
  useEffect(restoreVolume, []);
  const state = useSyncExternalStore(music.subscribe, music.getSnapshot, music.getSnapshot);

  return {
    ...state,
    toggle: () => music.toggle(),
    play: () => void music.play(),
    setVolume: (v: number) => {
      music.setVolume(v);
      try {
        window.localStorage.setItem(birthdayConfig.music.storageKey, String(v));
      } catch {
        /* ignore */
      }
    },
    toggleMute: () => music.toggleMute(),
  };
}
