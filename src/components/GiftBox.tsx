import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface GiftBoxProps {
  /** Changing this number plays a short wiggle (used when the button is pressed). */
  nudge?: number;
}

const CREAM = "linear-gradient(180deg, #fffaf2 0%, #ffe9d6 100%)";

/**
 * Temporary CSS illustration of a pastel pink gift box.
 * Phase 2 replaces this with the real 3D gift.
 */
export default function GiftBox({ nudge = 0 }: GiftBoxProps) {
  return (
    <div
      role="img"
      aria-label="A pastel pink gift box with a cream ribbon and bow"
      className="relative aspect-square w-[clamp(11.5rem,54vw,18rem)]"
    >
      {/* Glow behind the box */}
      <div
        aria-hidden="true"
        className="absolute inset-[-18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,209,227,0.55) 40%, rgba(255,209,227,0) 70%)",
        }}
      />

      {/* Floor shadow */}
      <div
        aria-hidden="true"
        className="absolute bottom-[1%] left-[12%] h-[8%] w-[76%] rounded-full bg-plum/30 blur-md"
      />

      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          key={nudge}
          className="absolute inset-0"
          initial={{ rotate: 0 }}
          animate={nudge > 0 ? { rotate: [0, -5, 5, -4, 3, 0] } : { rotate: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Body */}
          <div
            className="absolute bottom-[9%] left-[14%] h-[46%] w-[72%] overflow-hidden rounded-b-[14%] rounded-t-[3%]"
            style={{
              background: "linear-gradient(160deg, #ffc9e0 0%, #f78fbb 100%)",
              boxShadow:
                "inset 10px 0 18px rgba(255,255,255,0.38), inset -10px -12px 18px rgba(184,85,154,0.28)",
            }}
          >
            <div
              className="absolute left-1/2 top-0 h-full w-[17%] -translate-x-1/2"
              style={{ background: CREAM, boxShadow: "0 0 12px rgba(255,255,255,0.6)" }}
            />
          </div>

          {/* Lid */}
          <div
            className="absolute bottom-[53%] left-[9%] h-[17%] w-[82%] overflow-hidden rounded-[14%/30%]"
            style={{
              background: "linear-gradient(160deg, #ffd9ea 0%, #fa9cc5 100%)",
              boxShadow:
                "inset 10px 0 16px rgba(255,255,255,0.45), 0 8px 14px -6px rgba(184,85,154,0.5)",
            }}
          >
            <div
              className="absolute left-1/2 top-0 h-full w-[17%] -translate-x-1/2"
              style={{ background: CREAM }}
            />
          </div>

          {/* Bow */}
          <div className="absolute bottom-[66%] left-1/2 h-[21%] w-[46%] -translate-x-1/2">
            <span
              className="absolute bottom-[8%] left-0 h-[88%] w-[54%] rounded-full"
              style={{
                transform: "rotate(-28deg)",
                background:
                  "radial-gradient(ellipse at 55% 58%, #f78fbb 0 36%, #fff6ea 38% 100%)",
                boxShadow: "0 4px 10px -3px rgba(184,85,154,0.45)",
              }}
            />
            <span
              className="absolute bottom-[8%] right-0 h-[88%] w-[54%] rounded-full"
              style={{
                transform: "rotate(28deg)",
                background:
                  "radial-gradient(ellipse at 45% 58%, #f78fbb 0 36%, #fff6ea 38% 100%)",
                boxShadow: "0 4px 10px -3px rgba(184,85,154,0.45)",
              }}
            />
            <span
              className="absolute bottom-0 left-1/2 aspect-square w-[24%] -translate-x-1/2 rounded-full"
              style={{
                background: "linear-gradient(160deg, #fffaf2 0%, #ffd9ea 100%)",
                boxShadow: "0 3px 8px -2px rgba(184,85,154,0.55)",
              }}
            />
          </div>
        </motion.div>

        {/* Sparkles around the box */}
        <Sparkles
          className="absolute left-[2%] top-[18%] size-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          strokeWidth={1.5}
        />
        <Sparkles
          className="absolute right-[4%] top-[8%] size-5 text-violet drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          strokeWidth={1.5}
        />
        <Sparkles
          className="absolute right-[-2%] top-[52%] size-4 text-rose"
          strokeWidth={1.75}
        />
      </motion.div>
    </div>
  );
}
