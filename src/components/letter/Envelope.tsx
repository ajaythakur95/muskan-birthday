import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { birthdayConfig } from "../../config/birthday";

function HeartSeal() {
  return (
    <svg viewBox="0 0 64 64" className="size-full drop-shadow-[0_6px_10px_rgba(160,30,80,0.45)]" aria-hidden="true">
      <defs>
        <radialGradient id="seal-g" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ff8fb4" />
          <stop offset="55%" stopColor="#e5366f" />
          <stop offset="100%" stopColor="#b01c52" />
        </radialGradient>
      </defs>
      <path d="M32 56C10 40 4 28 4 19 4 11 10 6 17 6c6 0 11 3 15 9 4-6 9-9 15-9 7 0 13 5 13 13 0 9-6 21-28 37Z" fill="url(#seal-g)" />
      <path d="M17 14c-4 0-8 3-8 8" stroke="#fff" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface EnvelopeProps {
  opened: boolean;
  onOpen: () => void;
}

/** Pastel pink envelope with a heart seal. Opens the flap and slides the letter out. */
export default function Envelope({ opened, onOpen }: EnvelopeProps) {
  // The flap swings over the top, then sits behind the letter.
  const [flapBehind, setFlapBehind] = useState(false);
  useEffect(() => {
    if (!opened) return setFlapBehind(false);
    const t = window.setTimeout(() => setFlapBehind(true), 350);
    return () => window.clearTimeout(t);
  }, [opened]);

  const { openHint, openLabel } = birthdayConfig.letter;

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.button
        type="button"
        onClick={onOpen}
        disabled={opened}
        aria-label={openLabel}
        className="relative aspect-[3/2] w-[min(88vw,26rem)] cursor-pointer disabled:cursor-default"
        style={{ perspective: 1200 }}
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={opened ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: [0, -8, 0], scale: 1 }}
        transition={opened ? { duration: 0.5 } : { y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.9 }, scale: { duration: 0.9 } }}
        whileHover={opened ? undefined : { scale: 1.03 }}
        whileTap={opened ? undefined : { scale: 0.98 }}
      >
        {/* Back of the envelope */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(160deg, #ffc9de 0%, #ffaccb 100%)", boxShadow: "0 28px 60px -18px rgba(190,60,120,0.55)" }}
        />

        {/* Flap (behind everything once open) */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[58%] origin-top"
          style={{
            zIndex: flapBehind ? 0 : 4,
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: "linear-gradient(180deg, #ffb6d3 0%, #ff9fc4 100%)",
          }}
          animate={{ rotateX: opened ? 180 : 0 }}
          transition={{ duration: 0.75, ease: [0.6, 0.05, 0.3, 1] }}
        />

        {/* The letter peeking out */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-[7%] bottom-[8%] top-[10%] rounded-md"
          style={{
            zIndex: 1,
            background: "linear-gradient(180deg, #fffdf8, #fff3e6)",
            boxShadow: "0 4px 14px rgba(120,40,90,0.18)",
          }}
          animate={{ y: opened ? "-62%" : "0%" }}
          transition={{ duration: 0.9, delay: opened ? 0.55 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto mt-[14%] h-1.5 w-1/2 rounded-full bg-rose/50" />
          <div className="mx-auto mt-3 h-1.5 w-2/3 rounded-full bg-rose/30" />
          <div className="mx-auto mt-3 h-1.5 w-1/3 rounded-full bg-rose/30" />
        </motion.div>

        {/* Front pocket */}
        <svg viewBox="0 0 300 200" className="absolute inset-0 z-[2] size-full overflow-hidden rounded-2xl" aria-hidden="true">
          <defs>
            <linearGradient id="pocket-side" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffc2da" />
              <stop offset="100%" stopColor="#ffa9ca" />
            </linearGradient>
            <linearGradient id="pocket-bottom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd4e5" />
              <stop offset="100%" stopColor="#ffb9d3" />
            </linearGradient>
          </defs>
          <path d="M0 0 L158 108 L0 200 Z" fill="url(#pocket-side)" />
          <path d="M300 0 L142 108 L300 200 Z" fill="url(#pocket-side)" opacity=".92" />
          <path d="M0 200 L150 96 L300 200 Z" fill="url(#pocket-bottom)" />
          <path d="M0 200 L150 96 L300 200" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />
        </svg>

        {/* Heart seal */}
        <motion.span
          className="absolute left-1/2 top-[58%] z-[5] size-[17%] -translate-x-1/2 -translate-y-1/2"
          animate={opened ? { scale: 0, opacity: 0, rotate: 25 } : { scale: [1, 1.1, 1] }}
          transition={opened ? { duration: 0.3 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <HeartSeal />
        </motion.span>
      </motion.button>

      <motion.p
        className="font-display text-lg italic text-plum/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: opened ? 0 : 1 }}
        transition={{ delay: opened ? 0 : 1.2, duration: 0.6 }}
      >
        {openHint}
      </motion.p>
    </div>
  );
}
