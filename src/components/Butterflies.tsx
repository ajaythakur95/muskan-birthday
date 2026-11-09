import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { between, mulberry32 } from "../animations/random";
import ButterflyIcon from "./ButterflyIcon";

interface ButterfliesProps {
  count: number;
  seed?: number;
}

const COLORS: ReadonlyArray<readonly [string, string]> = [
  ["#ffd1e3", "#f78fbb"],
  ["#e9dcff", "#b79bf0"],
  ["#fff0d9", "#f9b8d3"],
  ["#d9c8ff", "#f7a8d0"],
];

/** Butterflies wander between random points with GSAP while their wings flap in CSS. */
function Butterflies({ count, seed = 31 }: ButterfliesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const butterflies = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, id) => {
      const [from, to] = COLORS[id % COLORS.length];
      return {
        id,
        from,
        to,
        size: between(rand, 28, 52),
        flap: between(rand, 0.45, 0.85),
      };
    });
  }, [count, seed]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".fx-butterfly");

      items.forEach((el) => {
        const pick = () => {
          const w = root.clientWidth;
          const h = root.clientHeight;
          return {
            x: gsap.utils.random(0, Math.max(0, w - 56)),
            y: gsap.utils.random(h * 0.06, Math.max(h * 0.1, h * 0.85)),
          };
        };

        const start = pick();
        gsap.set(el, { x: start.x, y: start.y });
        gsap.to(el, { opacity: 1, duration: 1.4, delay: gsap.utils.random(0.2, 1.6) });

        if (reduceMotion) return;

        const bob = el.querySelector(".fx-bob");
        if (bob) {
          gsap.to(bob, {
            y: -10,
            duration: gsap.utils.random(0.9, 1.6),
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        }

        const tilt = el.querySelector(".fx-tilt");
        const fly = () => {
          const next = pick();
          const currentX = Number(gsap.getProperty(el, "x"));
          gsap.to(el, {
            x: next.x,
            y: next.y,
            duration: gsap.utils.random(6, 11),
            ease: "sine.inOut",
            onComplete: fly,
          });
          if (tilt) {
            gsap.to(tilt, {
              rotation: gsap.utils.clamp(-28, 28, (next.x - currentX) * 0.07),
              duration: 1.4,
              ease: "sine.inOut",
            });
          }
        };
        fly();
      });
    }, root);

    return () => ctx.revert();
  }, [count, reduceMotion]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {butterflies.map((b) => (
        <div
          key={b.id}
          className="fx-butterfly absolute left-0 top-0"
          style={{ opacity: 0, willChange: "transform" }}
        >
          <div className="fx-bob">
            <div className="fx-tilt">
              <ButterflyIcon from={b.from} to={b.to} size={b.size} flap={b.flap} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(Butterflies);
