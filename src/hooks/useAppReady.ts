import { useEffect, useState } from "react";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * True once web fonts have loaded (or 3s have passed, so offline never hangs)
 * and the minimum loader time has elapsed, so the loader never just flashes.
 */
export function useAppReady(minDurationMs: number): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fonts: Promise<unknown> =
      "fonts" in document ? Promise.race([document.fonts.ready, wait(3000)]) : Promise.resolve();

    Promise.all([fonts, wait(minDurationMs)]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [minDurationMs]);

  return ready;
}
