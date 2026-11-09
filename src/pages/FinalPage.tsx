import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Images, RotateCcw } from "lucide-react";
import { riseIn, screenVariants } from "../animations/variants";
import FireworksCanvas from "../components/FireworksCanvas";
import GlowButton from "../components/GlowButton";
import IconButton from "../components/IconButton";
import MagicBackground from "../components/MagicBackground";
import RevealText from "../components/RevealText";
import FloatingHearts from "../components/gallery/FloatingHearts";
import BloomBurst from "../components/letter/BloomBurst";
import { birthdayConfig } from "../config/birthday";

interface FinalPageProps {
  onBack: () => void;
  onReplay: () => void;
  onMemories: () => void;
}

export default function FinalPage({ onBack, onReplay, onMemories }: FinalPageProps) {
  const { title, subtitle, replay, memories } = birthdayConfig.final;
  const { name, dateOfBirth, celebration, wishesFrom } = birthdayConfig.person;
  const [burst, setBurst] = useState(0);

  // Celebrate on arrival, and again every time she taps the title.
  useEffect(() => {
    const t = window.setTimeout(() => setBurst(1), 500);
    return () => window.clearTimeout(t);
  }, []);

  const details: [string, string][] = [
    ["Name", name],
    ["Date of Birth", dateOfBirth],
    ["Birthday Celebration", celebration],
    ["Wishes from", wishesFrom],
  ];

  return (
    <motion.div variants={screenVariants} initial="initial" animate="animate" exit="exit" aria-label="Final birthday message">
      <MagicBackground variant="twilight">
        <FireworksCanvas />
        <FloatingHearts />
        <BloomBurst burstKey={burst} count={36} />

        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <IconButton label="Back to the slideshow" onClick={onBack}>
            <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>

        <main className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 pb-32 pt-20 text-center text-cream">
          <h1
            className="max-w-[14ch] cursor-pointer text-balance text-[clamp(2.4rem,9vw,5.5rem)] font-medium leading-[1.05] tracking-tight drop-shadow-[0_4px_36px_rgba(255,160,210,0.7)]"
            onClick={() => setBurst((n) => n + 1)}
          >
            <RevealText text={title} by="word" delay={0.3} stagger={0.22} />
          </h1>
          <motion.p
            className="text-balance font-display text-[clamp(1.5rem,5vw,2.4rem)] italic text-blush"
            variants={riseIn(1.6)}
            initial="hidden"
            animate="visible"
          >
            {subtitle}
          </motion.p>

          <motion.dl
            className="glass grid w-full max-w-md grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 rounded-3xl px-5 py-5 text-left text-plum sm:px-7"
            variants={riseIn(2.2)}
            initial="hidden"
            animate="visible"
          >
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-sm font-semibold uppercase tracking-wide text-violet">{label}</dt>
                <dd className="text-right font-display text-lg">{value}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.div className="mt-1 flex flex-wrap items-center justify-center gap-3" variants={riseIn(2.8)} initial="hidden" animate="visible">
            <GlowButton onClick={onMemories} icon={<Images className="size-5" strokeWidth={2} aria-hidden="true" />}>
              {memories}
            </GlowButton>
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex min-h-13 cursor-pointer items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 text-base font-semibold text-cream backdrop-blur"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> {replay}
            </button>
          </motion.div>
        </main>
      </MagicBackground>
    </motion.div>
  );
}
