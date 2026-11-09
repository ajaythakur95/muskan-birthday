import { useEffect, useState } from "react";

export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export type Tier = "high" | "low";

/** Phones, touch-first devices and low-core/low-memory machines get the lighter scene. */
export function detectTier(): Tier {
  if (typeof window === "undefined") return "high";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return small || (coarse && weak) || weak ? "low" : "high";
}

export function useTier(): Tier {
  const [tier, setTier] = useState<Tier>(detectTier);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const on = () => setTier(detectTier());
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return tier;
}
