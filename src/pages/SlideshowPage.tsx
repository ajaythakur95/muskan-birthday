import { Suspense, lazy, type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2, Pause, Play, RefreshCw, RotateCcw } from "lucide-react";
import { screenVariants } from "../animations/variants";
import GlowButton from "../components/GlowButton";
import IconButton from "../components/IconButton";
import MagicBackground from "../components/MagicBackground";
import FloatingHearts from "../components/gallery/FloatingHearts";
import { birthdayConfig } from "../config/birthday";
import { useIsMobile } from "../hooks/useMediaQuery";
import { usePhotos } from "../hooks/usePhotos";
import type { GirlRig } from "../scene/CartoonGirl";
import { createHost } from "../scene/hostState";
import { hasWebGL } from "../scene/support";
import { viewerImage } from "../utils/imageUrl";

// Three.js loads only when this page opens.
const SlideshowHost = lazy(() => import("../scene/SlideshowHost"));

interface SlideshowPageProps {
  onBack: () => void;
  onContinue: () => void;
}

const MAX_SLIDES = 10;
const pad = (n: number) => String(n).padStart(2, "0");

/** Stand-in rig so the show still runs (without Ajay) if 3D is unavailable. */
const fakeRig = (): GirlRig => {
  const o = () => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, setScalar() {} });
  return { root: o(), body: o(), torso: o(), head: o(), armL: o(), armR: o(), foreL: o(), foreR: o(), legL: o(), legR: o(), knife: o() } as unknown as GirlRig;
};

function SparkleBurst() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
        const d = 70 + Math.random() * 110;
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, delay: Math.random() * 0.25 };
      }),
    [],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {sparks.map((s, i) => (
        <span key={i} className="spark-pop" style={{ "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, animationDelay: `${s.delay}s` } as CSSProperties} />
      ))}
    </div>
  );
}

/**
 * Photo slideshow hosted by Ajay (3D). One GSAP timeline per photo pair:
 * Ajay waves and points → the normal photo flips in → short pause → it flips and dissolves into its
 * matching anime illustration → Ajay cheers → a unique caption → the card flips away → next pair.
 * Every slide is ONE numbered slot (original N + anime N), so the pair can never be mismatched.
 */
export default function SlideshowPage({ onBack, onContinue }: SlideshowPageProps) {
  const { photos, loading, loadError, refresh } = usePhotos();
  const { title, original, anime, finalQuote, finalTitle, finalFrom, watchAgain, next } = birthdayConfig.slideshow;
  const mobile = useIsMobile();

  const slides = useMemo(() => photos.slice(0, MAX_SLIDES), [photos]);
  const total = slides.length;

  const [webgl] = useState(hasWebGL);
  const [hostReady, setHostReady] = useState(false);
  const [hostFailed, setHostFailed] = useState(false);
  const useHost = webgl && !hostFailed;
  const canRun = total > 0 && (!useHost || hostReady);

  const [index, setIndex] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [mode, setMode] = useState<"slides" | "final">("slides");
  const [showAnime, setShowAnime] = useState(false);
  const [captionOn, setCaptionOn] = useState(false);
  const [finalOn, setFinalOn] = useState(false);
  const [sparkKey, setSparkKey] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ratio, setRatio] = useState(0.8); // width / height of the current original photo

  const cardRef = useRef<HTMLDivElement>(null);
  const rig = useRef<GirlRig | null>(null);
  const shared = useRef(createHost()).current;
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const playingRef = useRef(true);
  playingRef.current = playing;

  const slide = slides[Math.min(index, Math.max(total - 1, 0))];

  /* ── The director: rebuilt for every slide (and for the final scene) ── */
  useLayoutEffect(() => {
    if (!canRun) return;
    const card = cardRef.current;
    if (!card) return;
    const { host, sim } = shared;
    const g: GirlRig = useHost && rig.current ? rig.current : fakeRig();

    const restPose = () => {
      gsap.set(g.armR.rotation, { x: 0, z: 0.12 });
      gsap.set(g.foreR.rotation, { x: 0, z: 0 });
      gsap.set(g.armL.rotation, { x: 0, z: -0.12 });
      gsap.set(g.foreL.rotation, { x: 0, z: 0 });
      gsap.set([g.legL.rotation, g.legR.rotation], { x: 0 });
      sim.smileScale = 1;
      sim.boyWalking = false;
    };

    const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });
    tlRef.current = tl;
    if (!playingRef.current) tl.pause();

    if (mode === "final") {
      /* ── Finale: Ajay walks to the centre and waves ── */
      host.finale = true;
      gsap.set(card, { opacity: 0 });
      setShowAnime(false);
      setCaptionOn(false);
      setFinalOn(false);
      restPose();
      tl.call(() => { sim.boyWalking = true; }, undefined, 0);
      tl.to(g.root.rotation, { y: 0, duration: 0.6 }, 0);
      tl.to(g.root.position, { x: 0, duration: 2.2 }, 0);
      tl.to(g.root.scale, { x: host.scale, y: host.scale, z: host.scale, duration: 2.2 }, 0);
      tl.call(() => { sim.boyWalking = false; }, undefined, 2.2);
      tl.to([g.legL.rotation, g.legR.rotation, g.armL.rotation], { x: 0, duration: 0.3 }, 2.2);
      tl.to(g.armR.rotation, { x: 0, z: 2.55, duration: 0.6 }, 2.3);
      tl.to(g.foreR.rotation, { z: 0.75, duration: 0.2, repeat: -1, yoyo: true, ease: "sine.inOut" }, 2.9);
      tl.to(sim, { smileScale: 1.45, duration: 0.4 }, 2.4);
      tl.call(() => setFinalOn(true), undefined, 2.5);
    } else {
      /* ── One photo pair ── */
      host.finale = false;
      g.root.scale.setScalar(host.scale);
      g.root.position.x = host.baseX;
      g.root.position.y = host.baseY;
      gsap.set(g.root.rotation, { y: mobile ? 0.15 : 0.45 });
      restPose();
      gsap.set(card, { rotationY: -80, y: 30, scale: 0.9, opacity: 0 });
      setShowAnime(false);
      setCaptionOn(false);
      setFinalOn(false);

      const point = mobile ? 2.3 : 1.3; // pointing at the photo (beside him on desktop, above him on mobile)
      // 1 · Ajay waves hello
      tl.to(g.armR.rotation, { z: 2.55, duration: 0.5, ease: "back.out(1.6)" }, 0);
      tl.to(g.foreR.rotation, { z: 0.7, duration: 0.18, repeat: 5, yoyo: true, ease: "sine.inOut" }, 0.5);
      tl.to(sim, { smileScale: 1.3, duration: 0.3 }, 0.2);
      // 2 · the normal photo flips in with sparkles
      tl.call(() => setSparkKey((k) => k + 1), undefined, 0.5);
      tl.to(card, { rotationY: 0, opacity: 1, scale: 1, y: 0, duration: 1.0, ease: "power3.out" }, 0.5);
      // 3 · he settles and points at it, then a short pause
      tl.to(g.foreR.rotation, { z: 0, duration: 0.3 }, 1.6);
      tl.to(g.armR.rotation, { x: -0.1, z: point, duration: 0.6 }, 1.6);
      tl.to(sim, { smileScale: 1, duration: 0.4 }, 1.8);
      // 4 · the photo flips and dissolves into its matching anime illustration
      tl.call(() => setSparkKey((k) => k + 1), undefined, 3.7);
      tl.to(card, { rotationY: 180, scale: 1.04, duration: 1.3, ease: "power2.inOut" }, 3.2);
      tl.to(card, { scale: 1, duration: 0.4, ease: "power2.out" }, 4.5);
      tl.call(() => setShowAnime(true), undefined, 3.85);
      // 5 · Ajay reacts happily
      tl.to(sim, { smileScale: 1.5, duration: 0.3 }, 4.2);
      tl.to(g.armR.rotation, { x: 0, z: 2.5, duration: 0.4, ease: "back.out(1.7)" }, 4.2);
      tl.to(g.armL.rotation, { x: 0, z: -2.5, duration: 0.4, ease: "back.out(1.7)" }, 4.2);
      tl.to([g.foreR.rotation, g.foreL.rotation], { z: (i: number) => (i === 0 ? 0.5 : -0.5), duration: 0.2, repeat: 5, yoyo: true, ease: "sine.inOut" }, 4.6);
      tl.to(g.root.position, { y: `+=${(host.scale * 0.1).toFixed(3)}`, duration: 0.2, repeat: 3, yoyo: true, ease: "power1.out" }, 4.3);
      // 6 · the unique caption
      tl.call(() => setCaptionOn(true), undefined, 4.8);
      // 7 · the card flips away; Ajay relaxes; next pair
      tl.call(() => setCaptionOn(false), undefined, 8.0);
      tl.to(card, { rotationY: 260, opacity: 0, scale: 0.9, duration: 0.75, ease: "power2.in" }, 8.0);
      tl.to([g.armR.rotation, g.armL.rotation], { x: 0, z: (i: number) => (i === 0 ? 0.12 : -0.12), duration: 0.6 }, 8.1);
      tl.to([g.foreR.rotation, g.foreL.rotation], { z: 0, duration: 0.4 }, 8.1);
      tl.to(sim, { smileScale: 1, duration: 0.4 }, 8.1);
      tl.call(() => {
        if (index < total - 1) setIndex(index + 1);
        else setMode("final");
      }, undefined, 8.8);
    }

    return () => {
      tl.kill();
      gsap.killTweensOf(card);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRun, index, runKey, mode, total, mobile]);

  // Pause / play.
  useEffect(() => {
    tlRef.current?.paused(!playing);
  }, [playing]);

  // Warm the next pair in the cache.
  useEffect(() => {
    const n = slides[index + 1];
    if (!n) return;
    for (const u of [n.original.url, n.anime.url]) new Image().src = viewerImage(u);
  }, [slides, index]);

  const goTo = (i: number) => {
    if (mode !== "slides" || !total) return;
    if (i >= total) setMode("final");
    else if (i >= 0) {
      setIndex(i);
      setRunKey((k) => k + 1);
    }
  };
  const watchAgainNow = () => {
    shared.host.finale = false;
    setMode("slides");
    setIndex(0);
    setRunKey((k) => k + 1);
    setPlaying(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON" && mode === "slides") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div variants={screenVariants} initial="initial" animate="animate" exit="exit" aria-label="Photo slideshow">
      <MagicBackground variant="dream">
        <FloatingHearts />
        <div className="relative min-h-dvh">
          {/* Ajay (3D) stays on screen beside / below the photo */}
          {webgl && !hostFailed && total > 0 && (
            <Suspense fallback={null}>
              <div className="pointer-events-none absolute inset-0 z-20">
                <SlideshowHost rig={rig} sim={shared.sim} host={shared.host} mobile={mobile} onReady={() => setHostReady(true)} onFail={() => setHostFailed(true)} />
              </div>
            </Suspense>
          )}

          <div className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
            <IconButton label="Back to the letter" onClick={onBack}>
              <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </div>

          <main className={`relative z-10 flex min-h-dvh flex-col px-3 pt-14 text-plum sm:px-6 sm:pt-16 ${mobile ? "pb-[42dvh]" : "pb-28"}`}>
            {loading ? (
              <p role="status" className="m-auto flex items-center gap-2 font-display text-lg italic">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Loading photos…
              </p>
            ) : loadError ? (
              <div role="alert" className="glass m-auto max-w-md rounded-2xl p-6 text-center">
                <p className="font-medium">{loadError}</p>
                <button type="button" onClick={() => void refresh()} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow">
                  <RefreshCw className="size-4" aria-hidden="true" /> Try again
                </button>
              </div>
            ) : !slide ? (
              <div className="m-auto text-center">
                <p className="font-display text-xl italic">No photos with illustrations yet.</p>
                <div className="mt-5"><GlowButton tone="deep" onClick={onContinue}>{next}</GlowButton></div>
              </div>
            ) : (
              <>
                <h1 className="mb-2 hidden text-center font-display sm:block text-[clamp(1.2rem,4vw,2rem)] font-normal">{title}</h1>
                <div className="mb-2 flex justify-center">
                  <span aria-live="polite" aria-label={`Photo ${index + 1} of ${total}`} className="glass rounded-full px-4 py-1.5 text-sm font-semibold tabular-nums">
                    {mode === "final" ? `${pad(total)}/${pad(total)}` : `${pad(index + 1)}/${pad(total)}`}
                  </span>
                </div>

                {/* Photo area: beside Ajay on desktop, above him on mobile */}
                <div className={`flex flex-1 items-center justify-center ${mobile ? "px-2" : "pl-[32%] pr-[3%]"} ${mode === "final" ? "invisible" : ""}`}>
                  <div className="w-full" style={{ perspective: "1400px", maxWidth: `min(100%, calc(${mobile ? "31dvh" : "54dvh"} * ${ratio}))` }}>
                    <div ref={cardRef} className="relative w-full opacity-0 will-change-transform" style={{ aspectRatio: String(ratio), transformStyle: "preserve-3d" }}>
                      {sparkKey > 0 && <SparkleBurst key={sparkKey} />}
                      {/* Front: the normal photo */}
                      <div className="absolute inset-0 rounded-[0.5rem] bg-[#fffdf8] p-2 shadow-[0_24px_60px_-18px_rgba(59,36,102,0.6)] sm:p-3" style={{ backfaceVisibility: "hidden" }}>
                        <img
                          src={viewerImage(slide.original.url)}
                          alt={`Original photo ${index + 1}`}
                          onLoad={(e) => {
                            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                            if (w && h) setRatio(Math.min(1.6, Math.max(0.62, w / h)));
                          }}
                          className="size-full rounded-[0.3rem] bg-lavender/40 object-contain"
                        />
                      </div>
                      {/* Back: the matching anime illustration (same slot number) */}
                      <div className="absolute inset-0 rounded-[0.5rem] bg-[#fffdf8] p-2 shadow-[0_24px_60px_-18px_rgba(59,36,102,0.6)] sm:p-3" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        <img src={viewerImage(slide.anime.url)} alt={`Ghibli-style illustration ${index + 1}`} className="size-full rounded-[0.3rem] bg-lavender/40 object-contain" />
                      </div>
                    </div>
                    <p className="mt-2 text-center text-xs font-semibold text-violet">{showAnime ? anime : original}</p>
                  </div>
                </div>

                {/* Unique caption for this photo */}
                <div className={`min-h-[3.4rem] ${mobile ? "px-3" : "pl-[32%] pr-[3%]"} text-center`}>
                  <AnimatePresence mode="wait">
                    {captionOn && mode === "slides" && (
                      <motion.p
                        key={slide.id}
                        aria-live="polite"
                        className="mx-auto max-w-[36ch] text-balance font-display text-lg italic leading-snug text-plum/90 sm:text-xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {slide.caption}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </main>

          {/* Final message (Ajay waves in the centre below it) */}
          <AnimatePresence>
            {mode === "final" && finalOn && (
              <motion.div
                key="final-msg"
                className="absolute inset-x-0 top-[7%] z-30 mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
              >
                <p className="text-balance font-display text-[clamp(1.05rem,3.6vw,1.6rem)] italic leading-snug drop-shadow-[0_2px_16px_rgba(255,255,255,0.9)]">{finalQuote}</p>
                <h2 className="text-balance font-display text-[clamp(1.8rem,7vw,3.4rem)] font-medium leading-tight drop-shadow-[0_2px_16px_rgba(255,255,255,0.9)]">{finalTitle}</h2>
                <p className="font-display text-xl italic text-violet sm:text-2xl">{finalFrom}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          {slide && (
            <div className="absolute inset-x-0 bottom-4 z-30 flex flex-col items-center gap-2 px-4 sm:bottom-6">
              {mode === "slides" ? (
                <>
                  <div className="flex items-center gap-3">
                    <IconButton label="Previous photo" onClick={() => goTo(index - 1)} disabled={index === 0}>
                      <ChevronLeft className="size-5" aria-hidden="true" />
                    </IconButton>
                    <IconButton label={playing ? "Pause slideshow" : "Play slideshow"} onClick={() => setPlaying((p) => !p)} className="size-14!">
                      {playing ? <Pause className="size-6" aria-hidden="true" /> : <Play className="ml-0.5 size-6" aria-hidden="true" />}
                    </IconButton>
                    <IconButton label="Next photo" onClick={() => goTo(index + 1)}>
                      <ChevronRight className="size-5" aria-hidden="true" />
                    </IconButton>
                  </div>
                  <button type="button" onClick={onContinue} className="cursor-pointer text-sm font-semibold underline-offset-4 hover:underline">
                    Skip to the end
                  </button>
                </>
              ) : (
                finalOn && (
                  <motion.div className="flex flex-wrap items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <GlowButton tone="deep" onClick={onContinue} icon={<ArrowRight className="size-5" aria-hidden="true" />}>
                      {next}
                    </GlowButton>
                    <button type="button" onClick={watchAgainNow} className="glass inline-flex min-h-13 cursor-pointer items-center gap-2 rounded-full px-6 text-base font-semibold">
                      <RotateCcw className="size-4" aria-hidden="true" /> {watchAgain}
                    </button>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
      </MagicBackground>
    </motion.div>
  );
}
