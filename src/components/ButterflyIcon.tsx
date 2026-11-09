import { useId, type CSSProperties } from "react";

interface ButterflyIconProps {
  /** Wing gradient start / end colors. */
  from: string;
  to: string;
  size: number;
  /** Seconds per wing beat. */
  flap?: number;
}

function Wing({ fill }: { fill: string }) {
  return (
    <>
      <path d="M32 30 C20 4 1 7 5 26 C7 35 22 37 32 32 Z" fill={fill} />
      <path d="M32 33 C22 36 9 38 13 50 C17 61 30 52 32 38 Z" fill={fill} opacity="0.88" />
    </>
  );
}

export default function ButterflyIcon({ from, to, size, flap = 0.7 }: ButterflyIconProps) {
  const id = useId().replace(/:/g, "");
  const fill = `url(#bf-${id})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ "--flap": `${flap}s`, overflow: "visible" } as CSSProperties}
    >
      <defs>
        <linearGradient id={`bf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <g className="fx-wing fx-wing-l">
        <Wing fill={fill} />
      </g>
      <g className="fx-wing fx-wing-r">
        <g transform="translate(64 0) scale(-1 1)">
          <Wing fill={fill} />
        </g>
      </g>
      <ellipse cx="32" cy="34" rx="1.8" ry="12" fill="#5b3a8c" />
      <path
        d="M31 22 C29 15 26 12 24 11 M33 22 C35 15 38 12 40 11"
        stroke="#5b3a8c"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
