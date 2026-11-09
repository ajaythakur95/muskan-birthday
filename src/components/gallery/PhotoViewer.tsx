import { useEffect, useRef, useState } from "react";
import { viewerImage } from "../../utils/imageUrl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, X } from "lucide-react";
import type { Photo } from "../../types/photo";
import RevealText from "../RevealText";

interface PhotoViewerProps {
  photos: Photo[]; // only finished photos
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

const REVEAL_AFTER_MS = 1600;

/** Cinematic full-screen viewer: original photo first, then it paints into the illustration. */
export default function PhotoViewer({ photos, index, onIndexChange, onClose }: PhotoViewerProps) {
  const photo = photos[index];
  const [showAnime, setShowAnime] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchedRef = useRef(false);

  // Restart the cinematic whenever a different photo opens.
  useEffect(() => {
    touchedRef.current = false;
    setShowAnime(false);
    const t = window.setTimeout(() => {
      if (!touchedRef.current) setShowAnime(true);
    }, REVEAL_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [photo?.id]);

  // Keyboard, focus and scroll-lock.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const go = (delta: number) => onIndexChange((index + delta + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && photos.length > 1) go(1);
      else if (e.key === "ArrowLeft" && photos.length > 1) go(-1);
      else if (e.key === "Tab") {
        // Keep focus inside the dialog.
        const f = Array.from(document.querySelectorAll<HTMLElement>("[data-viewer] button:not([disabled])"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!photo || !photo.anime) return null;
  const choose = (anime: boolean) => {
    touchedRef.current = true;
    setShowAnime(anime);
  };
  const title = photo.title || "A memory";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — photo viewer`}
      data-viewer
      className="fixed inset-0 z-50 flex flex-col bg-[#150a2c]/95 text-cream backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-5">
        <p className="font-display text-lg italic text-blush">{photos.length > 1 ? `${index + 1} / ${photos.length}` : ""}</p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="glass inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-plum"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="glass absolute left-2 z-10 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-plum sm:left-6">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="glass absolute right-2 z-10 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-plum sm:right-6">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={photo.id}
            className="relative max-h-full max-w-full overflow-hidden rounded-xl shadow-[0_30px_90px_-20px_rgba(247,143,187,0.55)]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={viewerImage(photo.original.url)}
              alt={`Original photo: ${title}`}
              className="block max-h-[56dvh] max-w-[88vw] object-contain sm:max-h-[62dvh] sm:max-w-[min(70vw,56rem)]"
            />
            <motion.img
              src={viewerImage(photo.anime.url)}
              alt={`Anime illustration: ${title}`}
              className="absolute inset-0 size-full object-contain"
              initial={false}
              animate={{ clipPath: showAnime ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)" }}
              transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
            />
            <AnimatePresence>
              {showAnime && (
                <motion.span
                  key={`flash-${photo.id}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,209,227,0) 65%)" }}
                  initial={{ opacity: 0.9, scale: 0.2 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-4 text-center sm:pb-9">
        <div role="group" aria-label="Choose picture" className="glass flex gap-1 rounded-full p-1 text-sm font-semibold text-plum">
          <button type="button" aria-pressed={!showAnime} onClick={() => choose(false)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 ${!showAnime ? "bg-white shadow" : ""}`}>
            <ImageIcon className="size-4" aria-hidden="true" /> Original
          </button>
          <button type="button" aria-pressed={showAnime} onClick={() => choose(true)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 ${showAnime ? "bg-white shadow" : ""}`}>
            <Sparkles className="size-4" aria-hidden="true" /> Illustration
          </button>
        </div>

        {photo.title && <h2 className="font-display text-2xl text-cream sm:text-3xl">{photo.title}</h2>}
        {photo.caption && (
          <p className="max-w-[46ch] text-balance font-display text-lg font-light italic leading-snug text-blush sm:text-xl" aria-live="polite">
            <RevealText key={photo.id} text={photo.caption} by="word" delay={0.6} stagger={0.07} />
          </p>
        )}
      </div>
    </motion.div>
  );
}
