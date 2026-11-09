import { memo, useMemo, type CSSProperties } from "react";
import { between, mulberry32 } from "../animations/random";

interface PetalsProps {
  count: number;
  seed?: number;
}

const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#ffe3ee", "#f9a8c9"],
  ["#ffd1e3", "#f78fbb"],
  ["#f1e6ff", "#c9b0f5"],
  ["#fff0f6", "#f7b6d2"],
];

function Petals({ count, seed = 5 }: PetalsProps) {
  const petals = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, id) => {
      const size = between(rand, 10, 22);
      const [c1, c2] = PALETTE[Math.floor(rand() * PALETTE.length)];
      return {
        id,
        c1,
        c2,
        size,
        left: rand() * 100,
        dur: between(rand, 13, 24),
        delay: -rand() * 24,
        sway: between(rand, 30, 90),
      };
    });
  }, [count, seed]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="fx-petal"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.3,
              "--c1": p.c1,
              "--c2": p.c2,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--sway": `${p.sway}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default memo(Petals);
