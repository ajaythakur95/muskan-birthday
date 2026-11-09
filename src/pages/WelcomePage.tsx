import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { screenVariants, riseIn } from "../animations/variants";
import GlowButton from "../components/GlowButton";
import MagicBackground from "../components/MagicBackground";
import RevealText from "../components/RevealText";
import { birthdayConfig } from "../config/birthday";

interface WelcomePageProps {
  onBegin: () => void;
}

export default function WelcomePage({ onBegin }: WelcomePageProps) {
  const { greeting, subtitle, button } = birthdayConfig.welcome;

  // Sequence: greeting letters → subtitle words → button.
  const greetingDelay = 0.5;
  const subtitleDelay = 2.0;
  const buttonDelay = 3.6;

  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <MagicBackground variant="twilight">
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="text-balance text-[clamp(2.75rem,11vw,6.5rem)] font-light leading-[1.05] tracking-tight text-cream drop-shadow-[0_4px_30px_rgba(255,190,224,0.45)]">
            <RevealText text={greeting} by="char" delay={greetingDelay} stagger={0.07} />
          </h1>

          <p className="mt-6 max-w-[30ch] text-balance font-display text-[clamp(1.125rem,3.6vw,1.65rem)] font-light italic leading-snug text-blush sm:max-w-[40ch]">
            <RevealText text={subtitle} by="word" delay={subtitleDelay} stagger={0.12} />
          </p>

          <motion.p
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-cream backdrop-blur"
            variants={riseIn(subtitleDelay + 1.4)}
            initial="hidden"
            animate="visible"
          >
            <span aria-hidden="true">🎂</span> {birthdayConfig.birthday.dateLabel}
          </motion.p>

          <motion.div
            className="mt-10"
            variants={riseIn(buttonDelay)}
            initial="hidden"
            animate="visible"
          >
            <GlowButton
              onClick={onBegin}
              icon={<Heart className="size-5" strokeWidth={2} fill="currentColor" aria-hidden="true" />}
            >
              {button}
            </GlowButton>
          </motion.div>
        </main>
      </MagicBackground>
    </motion.div>
  );
}
