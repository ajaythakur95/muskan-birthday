import { useMemo } from "react";
import { motion } from "framer-motion";
import { between, mulberry32 } from "../../animations/random";

const SYMBOLS = ["🌸", "🌷", "🌺", "💗", "🌼", "✨", "💖", "🌹"];

/** One-shot burst of flowers, hearts and sparkles. Change `burstKey` to fire it again. */
export default function BloomBurst({ burstKey, count = 30 }: { burstKey: number; count?: number }) {
  const items = useMemo(() => {
    const rand = mulberry32(900 + burstKey);
    return Array.from({ length: count }, (_, i) => {
      const angle = between(rand, -Math.PI * 0.95, -Math.PI * 0.05); // upward fan
      const dist = between(rand, 140, 460);
      return {
        i,
        symbol: SYMBOLS[Math.floor(rand() * SYMBOLS.length)],
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        fall: between(rand, 60, 220),
        size: between(rand, 18, 38),
        rot: between(rand, -160, 160),
        dur: between(rand, 2.4, 4),
        delay: between(rand, 0, 0.5),
      };
    });
  }, [burstKey, count]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {items.map((p) => (
        <motion.span
          key={`${burstKey}-${p.i}`}
          className="absolute left-1/2 top-[55%] select-none"
          style={{ fontSize: p.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
          animate={{
            x: [0, p.x, p.x * 1.12],
            y: [0, p.y, p.y + p.fall],
            opacity: [0, 1, 0],
            scale: [0.2, 1.15, 1],
            rotate: p.rot,
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeOut", times: [0, 0.55, 1] }}
        >
          {p.symbol}
        </motion.span>
      ))}
    </div>
  );
}
