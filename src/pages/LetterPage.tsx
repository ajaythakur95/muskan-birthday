import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pencil, SkipForward } from "lucide-react";
import { screenVariants } from "../animations/variants";
import GlowButton from "../components/GlowButton";
import IconButton from "../components/IconButton";
import MagicBackground from "../components/MagicBackground";
import FloatingHearts from "../components/gallery/FloatingHearts";
import BloomBurst from "../components/letter/BloomBurst";
import Envelope from "../components/letter/Envelope";
import LetterEditor from "../components/letter/LetterEditor";
import TypedLetter from "../components/letter/TypedLetter";
import { useLetterText } from "../hooks/useLetterText";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useMusic } from "../hooks/useMusic";

interface LetterPageProps {
  onBack: () => void;
  onContinue: () => void;
}

type Stage = "closed" | "opening" | "reading";

export default function LetterPage({ onBack, onContinue }: LetterPageProps) {
  const [stage, setStage] = useState<Stage>("closed");
  const [burst, setBurst] = useState(0);
  const [editing, setEditing] = useState(false);
  const { text, setText, reset, isDefault } = useLetterText();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const music = useMusic();
  const [typing, setTyping] = useState<{ done: boolean; skip: () => void }>({ done: false, skip: () => undefined });
  const onTyping = useCallback((t: { done: boolean; skip: () => void }) => setTyping(t), []);
  const { done, skip } = typing;

  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    setBurst((n) => n + 1);
    // Opening the envelope is a click, so starting the music here is allowed.
    if (music.status !== "playing") music.play();
  };

  useEffect(() => {
    if (stage !== "opening") return;
    const t = window.setTimeout(() => setStage("reading"), 1900);
    return () => window.clearTimeout(t);
  }, [stage]);

  return (
    <motion.div variants={screenVariants} initial="initial" animate="animate" exit="exit" aria-label="Birthday letter">
      <MagicBackground variant="dream">
        <FloatingHearts />
        <BloomBurst burstKey={burst} />

        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <IconButton label="Back to the celebration" onClick={onBack}>
            <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>

        <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pb-32 pt-20 text-plum">
          <AnimatePresence mode="wait">
            {stage !== "reading" ? (
              <motion.div key="envelope" exit={{ opacity: 0, y: 60, scale: 0.9 }} transition={{ duration: 0.5 }}>
                <Envelope opened={stage === "opening"} onOpen={open} />
              </motion.div>
            ) : (
              <motion.div
                key="letter"
                className="flex w-full flex-col items-center gap-6"
                initial={{ opacity: 0, y: 50, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <article
                  className="letter-paper relative w-[min(94vw,40rem)] -rotate-[0.6deg] rounded-xl px-6 pb-8 pt-10 shadow-[0_30px_70px_-24px_rgba(120,40,110,0.55)] sm:px-10 sm:pt-12"
                  aria-label="Your birthday letter"
                >
                  <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-1 rounded-sm bg-rose/40" />
                  <TypedLetter text={text} active={stage === "reading"} instant={reduced} onState={onTyping} />
                </article>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="glass inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold"
                  >
                    <Pencil className="size-4" aria-hidden="true" /> Edit letter
                  </button>
                  {!done && (
                    <button
                      type="button"
                      onClick={skip}
                      className="glass inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold"
                    >
                      <SkipForward className="size-4" aria-hidden="true" /> Show all
                    </button>
                  )}
                  <GlowButton tone="deep" onClick={onContinue} icon={<ArrowRight className="size-5" aria-hidden="true" />}>
                    Continue
                  </GlowButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {editing && (
            <LetterEditor
              key="editor"
              text={text}
              canReset={!isDefault}
              onSave={setText}
              onReset={reset}
              onClose={() => setEditing(false)}
            />
          )}
        </AnimatePresence>
      </MagicBackground>
    </motion.div>
  );
}
