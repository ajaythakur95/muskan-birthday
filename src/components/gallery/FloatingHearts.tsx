import { memo, useMemo, type CSSProperties } from "react";
import { Flower2, Heart } from "lucide-react";
import { between, mulberry32 } from "../../animations/random";
import { memoriesCopy } from "../../config/memories";
import { useIsMobile } from "../../hooks/useMediaQuery";

const COLORS = ["#f78fbb", "#ffb8dc", "#b79bf0", "#e58fd0", "#ffffff"];

/** Decorative flowers and hearts drifting upward behind the gallery. */
function FloatingHearts() {
  const isMobile = useIsMobile();
  const count = memoriesCopy.floaters[isMobile ? "mobile" : "desktop"];

  const items = useMemo(() => {
    const rand = mulberry32(77);
    return Array.from({ length: count }, (_, i) => ({
      flower: i % 3 === 0,
      left: between(rand, 2, 96),
      size: between(rand, 16, 34),
      dur: between(rand, 18, 32),
      delay: -between(rand, 0, 30),
      drift: between(rand, -50, 60),
      rot: between(rand, -25, 25),
      color: COLORS[Math.floor(rand() * COLORS.length)],
    }));
  }, [count]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {items.map((it, i) => {
        const Icon = it.flower ? Flower2 : Heart;
        return (
          <span
            key={i}
            className="fx-float"
            style={
              {
                left: `${it.left}%`,
                color: it.color,
                "--dur": `${it.dur}s`,
                "--delay": `${it.delay}s`,
                "--drift": `${it.drift}px`,
                "--r0": `${it.rot}deg`,
              } as CSSProperties
            }
          >
            <Icon width={it.size} height={it.size} strokeWidth={1.6} fill={it.flower ? "none" : "currentColor"} />
          </span>
        );
      })}
    </div>
  );
}

export default memo(FloatingHearts);
