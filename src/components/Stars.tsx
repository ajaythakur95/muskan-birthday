import { memo, useMemo, type CSSProperties } from "react";
import { between, mulberry32 } from "../animations/random";

interface StarsProps {
  count: number;
  seed?: number;
  /** Tailwind text color class; stars use currentColor. */
  className?: string;
}

function Stars({ count, seed = 11, className = "text-cream" }: StarsProps) {
  const stars = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, id) => {
      const big = rand() > 0.88;
      return {
        id,
        big,
        left: rand() * 100,
        top: rand() * 78,
        size: big ? between(rand, 3, 5) : between(rand, 1, 2.6),
        delay: rand() * 6,
        dur: between(rand, 2.6, 6.6),
      };
    });
  }, [count, seed]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="fx-star"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              boxShadow: s.big ? `0 0 ${s.size * 3}px currentColor` : undefined,
              "--dur": `${s.dur}s`,
              "--delay": `${s.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default memo(Stars);
