import type { CSSProperties, ReactNode } from "react";
import { birthdayConfig } from "../config/birthday";
import { useIsMobile } from "../hooks/useMediaQuery";
import Butterflies from "./Butterflies";
import Particles from "./Particles";
import Petals from "./Petals";
import Stars from "./Stars";

interface MagicBackgroundProps {
  /** twilight: night-sky welcome. dream: soft pastel environment. */
  variant: "twilight" | "dream";
  children: ReactNode;
}

interface Blob {
  className: string;
  color: string;
  dur: number;
  delay: number;
}

const BLOBS: Record<MagicBackgroundProps["variant"], Blob[]> = {
  twilight: [
    { className: "-right-24 top-[8%] h-80 w-80", color: "#8a5cf0", dur: 22, delay: 0 },
    { className: "-left-28 top-[42%] h-96 w-96", color: "#c36bd6", dur: 26, delay: -6 },
    { className: "bottom-[-10%] left-[25%] h-96 w-[34rem]", color: "#ff9fcb", dur: 24, delay: -3 },
  ],
  dream: [
    { className: "-left-24 top-[6%] h-96 w-96", color: "#ffffff", dur: 24, delay: 0 },
    { className: "-right-20 top-[30%] h-96 w-96", color: "#ffb8dc", dur: 21, delay: -5 },
    { className: "bottom-[-8%] left-[20%] h-80 w-[30rem]", color: "#c7b0ff", dur: 26, delay: -9 },
  ],
};

const RAYS = [
  { left: "12%", rot: "-14deg", dur: 9, delay: 0 },
  { left: "42%", rot: "6deg", dur: 11, delay: -4 },
  { left: "72%", rot: "18deg", dur: 10, delay: -7 },
];

export default function MagicBackground({ variant, children }: MagicBackgroundProps) {
  const isMobile = useIsMobile();
  const size = isMobile ? "mobile" : "desktop";
  const fx = birthdayConfig.effects;
  const dream = variant === "dream";

  return (
    <div
      className={`relative min-h-dvh w-full overflow-x-clip ${
        dream ? "bg-dream text-plum" : "bg-twilight text-cream"
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS[variant].map((b, i) => (
          <div
            key={i}
            className={`fx-blob ${b.className}`}
            style={
              {
                background: b.color,
                "--dur": `${b.dur}s`,
                "--delay": `${b.delay}s`,
              } as CSSProperties
            }
          />
        ))}

        {dream &&
          RAYS.map((r, i) => (
            <div
              key={i}
              className="fx-ray"
              style={
                {
                  left: r.left,
                  "--rot": r.rot,
                  "--dur": `${r.dur}s`,
                  "--delay": `${r.delay}s`,
                } as CSSProperties
              }
            />
          ))}
      </div>

      <Stars
        count={fx.stars[size]}
        seed={dream ? 41 : 11}
        className={dream ? "text-violet" : "text-cream"}
      />
      <Particles count={fx.particles[size]} />
      <Butterflies count={fx.butterflies[size]} />
      <Petals count={fx.petals[size]} />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
