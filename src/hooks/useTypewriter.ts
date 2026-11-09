import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const toGraphemes = (v: string) => (segmenter ? Array.from(segmenter.segment(v), (s) => s.segment) : Array.from(v));

function delayFor(ch: string, speed: number) {
  if (ch === "\n") return speed * 7;
  if (".!?".includes(ch)) return speed * 9;
  if (",;:".includes(ch)) return speed * 4;
  return speed * (0.7 + Math.random() * 0.7);
}

/** Types `text` out character by character once `active`. Restarts when the text changes. */
export function useTypewriter(text: string, active: boolean, instant: boolean, speed = 42) {
  const chars = useMemo(() => toGraphemes(text), [text]);
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    countRef.current = 0;
    setCount(0);
    if (!active) return;
    if (instant) {
      countRef.current = chars.length;
      setCount(chars.length);
      return;
    }
    let timer: number | undefined;
    const tick = () => {
      const i = countRef.current;
      if (i >= chars.length) return;
      countRef.current = i + 1;
      setCount(i + 1);
      timer = window.setTimeout(tick, delayFor(chars[i], speed));
    };
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, [chars, active, instant, speed]);

  const skip = useCallback(() => {
    countRef.current = chars.length;
    setCount(chars.length);
  }, [chars]);

  return { shown: chars.slice(0, count).join(""), done: count >= chars.length, skip };
}
