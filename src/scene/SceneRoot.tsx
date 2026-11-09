import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Gift, Images, Mail, RotateCcw, SkipForward } from "lucide-react";
import GlowButton from "../components/GlowButton";
import IconButton from "../components/IconButton";
import RevealText from "../components/RevealText";
import { birthdayConfig } from "../config/birthday";
import { useMediaQuery } from "../hooks/useMediaQuery";
import Experience from "./Experience";
import FallbackCelebration from "./FallbackCelebration";
import type { Phase } from "./layout";
import { hasWebGL, useTier } from "./support";

interface SceneRootProps {
  onBack: () => void;
  onMemories: () => void;
  onLetter: () => void;
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("3D scene failed:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const NIGHT: Phase[] = ["celebrating", "finale"];

/** Full-screen 3D stage + the HTML captions/controls that sit on top of it. */
export default function SceneRoot({ onBack, onMemories, onLetter }: SceneRootProps) {
  const { gift, cinematic } = birthdayConfig;
  const tier = useTier();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [webgl] = useState(hasWebGL);
  const [broken, setBroken] = useState(false);
  const [runId, setRunId] = useState(0);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dpr, setDpr] = useState<number>(tier === "low" ? 1.5 : 2);
  const skipRef = useRef<(() => void) | null>(null);

  useEffect(() => setDpr(tier === "low" ? 1.5 : 2), [tier]);

  const start = useCallback(() => setStarted(true), []);
  const replay = useCallback(() => {
    setPhase("idle");
    setStarted(false);
    setRunId((n) => n + 1); // remount the scene: everything resets cleanly
  }, []);

  if (!webgl || broken) {
    return <FallbackCelebration onBack={onBack} onMemories={onMemories} onLetter={onLetter} />;
  }

  const night = NIGHT.includes(phase);
  const caption = cinematic.captions[phase as keyof typeof cinematic.captions];
  const playing = started && phase !== "finale";

  return (
    <div className="relative h-dvh w-full overflow-hidden" aria-label={birthdayConfig.environment.ariaLabel}>
      {/* Night sky fades in for the fireworks */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #120926 0%, #2b1659 55%, #5a3a92 100%)" }}
        initial={false}
        animate={{ opacity: night ? 1 : 0 }}
        transition={{ duration: 2.2 }}
      />

      <SceneBoundary onError={() => setBroken(true)}>
        <Canvas
          key={runId}
          aria-hidden="true"
          className="touch-none"
          style={{ position: "absolute", inset: 0 }}
          dpr={[1, dpr]}
          camera={{ fov: 42, near: 0.1, far: 120, position: [0, 2.1, 7.4] }}
          gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              setBroken(true);
            });
          }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} />
          <Suspense fallback={null}>
            <Experience
              tier={tier}
              reduced={reduced}
              started={started}
              onStart={start}
              onPhase={setPhase}
              skipRef={skipRef}
            />
          </Suspense>
        </Canvas>
      </SceneBoundary>

      {/* Cinematic letterbox bars + soft vignette while the story plays */}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[5] bg-[#120926]" initial={false} animate={{ height: playing ? "5.5%" : "0%" }} transition={{ duration: 1.2, ease: "easeInOut" }} />
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-[#120926]" initial={false} animate={{ height: playing ? "5.5%" : "0%" }} transition={{ duration: 1.2, ease: "easeInOut" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4]" style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(30,10,60,0.35) 100%)" }} />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
        <IconButton label="Back to the welcome screen" onClick={onBack}>
          <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
        </IconButton>
        {playing && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => skipRef.current?.()}
            className="glass mt-14 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold text-plum sm:mr-44 sm:mt-0"
          >
            <SkipForward className="size-4" aria-hidden="true" /> Skip
          </motion.button>
        )}
      </div>

      {/* Idle: title + button (the 3D box itself is also tappable) */}
      <AnimatePresence>
        {!started && (
          <motion.div
            key="idle-ui"
            className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-5 px-6 pb-10 text-center sm:pb-14"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h1 className="max-w-[18ch] text-balance text-[clamp(2rem,7vw,4.25rem)] font-normal leading-[1.08] tracking-tight text-plum drop-shadow-[0_2px_18px_rgba(255,255,255,0.8)]">
              {gift.title}
            </h1>
            <GlowButton
              tone="deep"
              onClick={start}
              icon={<Gift className="size-5" strokeWidth={2} aria-hidden="true" />}
            >
              {gift.button}
            </GlowButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story captions (also announced to screen readers) */}
      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-[8%] z-10 flex justify-center px-6">
        <AnimatePresence mode="wait">
          {started && phase !== "wish" && phase !== "finale" && caption && (
            <motion.p
              key={phase}
              className={`glass rounded-full px-5 py-2.5 font-display text-lg italic `}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              {caption}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* "Make a Wish" */}
      <AnimatePresence>
        {phase === "wish" && (
          <motion.div
            key="wish"
            className="pointer-events-none absolute inset-x-0 top-[16%] z-10 flex justify-center px-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-shimmer-dark max-w-[14ch] text-balance text-[clamp(2.25rem,8vw,5rem)] font-light italic leading-[1.05] drop-shadow-[0_4px_24px_rgba(155,122,216,0.55)]">
              {cinematic.wish}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finale */}
      <AnimatePresence>
        {phase === "finale" && (
          <motion.div
            key="finale"
            className="absolute inset-x-0 top-[10%] z-10 flex flex-col items-center gap-8 px-6 text-center sm:top-[12%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="max-w-[14ch] text-balance text-[clamp(2.4rem,9vw,6.25rem)] font-medium leading-[1.04] tracking-tight text-cream drop-shadow-[0_4px_36px_rgba(255,160,210,0.7)]">
              <RevealText text={cinematic.finale} by="word" delay={0.2} stagger={0.28} />
            </h2>
            <motion.div
              className="flex flex-wrap items-center justify-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.8 }}
            >
              <GlowButton onClick={onLetter} icon={<Mail className="size-5" strokeWidth={2} aria-hidden="true" />}>
                {cinematic.letter}
              </GlowButton>
              <button
                type="button"
                onClick={onMemories}
                className="inline-flex min-h-13 cursor-pointer items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 text-base font-semibold text-cream backdrop-blur"
              >
                <Images className="size-4" aria-hidden="true" /> {cinematic.memories}
              </button>
              <button
                type="button"
                onClick={replay}
                className="inline-flex min-h-13 cursor-pointer items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 text-base font-semibold text-cream backdrop-blur"
              >
                <RotateCcw className="size-4" aria-hidden="true" /> {cinematic.replay}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
