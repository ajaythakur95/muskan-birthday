import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Gift, Images, Mail } from "lucide-react";
import GiftBox from "../components/GiftBox";
import GlowButton from "../components/GlowButton";
import IconButton from "../components/IconButton";
import RevealText from "../components/RevealText";
import { birthdayConfig } from "../config/birthday";

/** Shown when WebGL isn't available or the 3D scene crashed. Same story, no 3D. */
export default function FallbackCelebration({ onBack, onMemories, onLetter }: { onBack: () => void; onMemories: () => void; onLetter: () => void }) {
  const { gift, cinematic } = birthdayConfig;
  const [opened, setOpened] = useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-7 px-6 py-20 text-center text-plum">
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <IconButton label="Back to the welcome screen" onClick={onBack}>
          <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
        </IconButton>
      </div>

      <p role="status" className="glass max-w-md rounded-2xl px-4 py-2.5 text-sm">{cinematic.fallbackNote}</p>

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div key="gift" className="flex flex-col items-center gap-7" exit={{ opacity: 0, scale: 0.8 }}>
            <GiftBox nudge={0} />
            <h1 className="max-w-[16ch] text-balance text-[clamp(2.25rem,8vw,4.5rem)] font-normal leading-[1.08] text-plum">{gift.title}</h1>
            <GlowButton tone="deep" onClick={() => setOpened(true)} icon={<Gift className="size-5" aria-hidden="true" />}>
              {gift.button}
            </GlowButton>
          </motion.div>
        ) : (
          <motion.div key="hb" className="flex flex-col items-center gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="max-w-[14ch] text-balance text-[clamp(2.4rem,10vw,6rem)] font-medium leading-[1.04] text-plum">
              <RevealText text={cinematic.finale} by="word" delay={0.2} stagger={0.25} />
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <GlowButton tone="deep" onClick={onLetter} icon={<Mail className="size-5" aria-hidden="true" />}>
                {cinematic.letter}
              </GlowButton>
              <GlowButton tone="deep" onClick={onMemories} icon={<Images className="size-5" aria-hidden="true" />}>
                {cinematic.memories}
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
