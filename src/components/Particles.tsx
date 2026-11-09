import { memo, useMemo, type CSSProperties } from "react";
import { between, mulberry32 } from "../animations/random";

interface ParticlesProps {
  count: number;
  seed?: number;
}

/** Soft glowing orbs that drift upward. */
function Particles({ count, seed = 23 }: ParticlesProps) {
  const orbs = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: rand() * 100,
      size: between(rand, 6, 22),
      dur: between(rand, 14, 26),
      delay: -rand() * 26,
      drift: between(rand, -60, 60),
    }));
  }, [count, seed]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o) => (
        <span
          key={o.id}
          className="fx-orb"
          style={
            {
              left: `${o.left}%`,
              width: o.size,
              height: o.size,
              "--dur": `${o.dur}s`,
              "--delay": `${o.delay}s`,
              "--drift": `${o.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default memo(Particles);
