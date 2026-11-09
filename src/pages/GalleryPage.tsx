import { useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Images, KeyRound, Loader2, PartyPopper, Plus, RefreshCw } from "lucide-react";
import { riseIn, screenVariants } from "../animations/variants";
import IconButton from "../components/IconButton";
import MagicBackground from "../components/MagicBackground";
import CaptionEditor from "../components/gallery/CaptionEditor";
import FloatingHearts from "../components/gallery/FloatingHearts";
import PhotoViewer from "../components/gallery/PhotoViewer";
import PolaroidCard from "../components/gallery/PolaroidCard";
import SlotManager from "../components/gallery/SlotManager";
import Quiz from "../components/memories/Quiz";
import SectionNav, { type NavItem } from "../components/memories/SectionNav";
import Timeline from "../components/memories/Timeline";
import { birthdayConfig } from "../config/birthday";
import { memoriesCopy, timelineEvents } from "../config/memories";
import { useActiveSection } from "../hooks/useActiveSection";
import { usePhotos } from "../hooks/usePhotos";

interface GalleryPageProps {
  onBack: () => void;
}

export default function GalleryPage({ onBack }: GalleryPageProps) {
  const { slots, photos, health, loading, loadError, canManage, refresh, uploadSlot, clearSlot, saveCaption, unlock } = usePhotos();
  const [showUpload, setShowUpload] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { empty, viewerHint } = birthdayConfig.gallery;
  const { galleryTitle: title, gallerySubtitle: subtitle } = memoriesCopy;
  const hasTimeline = timelineEvents.length > 0;

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: "memories", label: memoriesCopy.nav.memories, icon: <Images className="size-4" aria-hidden="true" /> },
      ...(hasTimeline ? [{ id: "timeline", label: memoriesCopy.nav.timeline, icon: <CalendarDays className="size-4" aria-hidden="true" /> }] : []),
      { id: "quiz", label: memoriesCopy.nav.quiz, icon: <PartyPopper className="size-4" aria-hidden="true" /> },
    ],
    [hasTimeline],
  );
  const active = useActiveSection(navItems.map((n) => n.id));
  const editing = photos.find((p) => p.id === editingId) ?? null;

  const finished = photos;

  const submitKey = async (e: FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    try {
      await unlock(keyInput);
      setKeyInput("");
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Could not verify the key.");
    }
  };

  return (
    <motion.div variants={screenVariants} initial="initial" animate="animate" exit="exit" aria-label="Photo memories">
      <MagicBackground variant="dream">
        <FloatingHearts />
        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <IconButton label="Back to the celebration" onClick={onBack}>
            <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </div>

        <main className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pb-20 pt-24 text-plum sm:px-8">
          <motion.header className="mb-10 text-center" variants={riseIn(0.1)} initial="hidden" animate="visible">
            <h1 className="mx-auto max-w-[18ch] text-balance text-[clamp(2rem,7vw,4rem)] font-normal leading-[1.08]">{title}</h1>
            <p className="mx-auto mt-3 max-w-[44ch] text-balance font-display text-lg italic text-plum/80">{subtitle}</p>
            {finished.length > 0 && <p className="mt-2 text-sm text-plum/60">{viewerHint}</p>}
          </motion.header>

          {health && health.canUpload && (health.isAdmin || !health.adminProtected) ? (
            <div className="mb-8 flex justify-center">
              <button
                type="button"
                onClick={() => setShowUpload((v) => !v)}
                aria-expanded={showUpload}
                className="glass inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                <Plus className="size-4" aria-hidden="true" /> {showUpload ? "Hide photo manager" : "Manage photos"}
              </button>
            </div>
          ) : health ? (
            <form onSubmit={(e) => void submitKey(e)} className="mx-auto mb-8 flex max-w-xs flex-col items-center gap-2">
              <label className="flex w-full items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm">
                <KeyRound className="size-4 shrink-0 text-violet" aria-hidden="true" />
                <span className="sr-only">Admin key</span>
                <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Admin key to manage photos" autoComplete="off" className="w-full bg-transparent outline-none placeholder:text-plum/50" />
              </label>
              {keyError && <p role="alert" className="text-xs text-[#a22a5b]">{keyError}</p>}
            </form>
          ) : null}

          <AnimatePresence initial={false}>
            {showUpload && health && canManage && (
              <motion.div key="uploader" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <SlotManager slots={slots} health={health} onUpload={uploadSlot} onClear={clearSlot} />
              </motion.div>
            )}
          </AnimatePresence>

          <SectionNav items={navItems} active={active} />

          <section id="memories" aria-label="Photo memories" className="scroll-mt-28">
            {loading ? (
              <p role="status" className="flex items-center justify-center gap-2 py-20 font-display text-lg italic">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Opening the album…
              </p>
            ) : loadError ? (
              <div role="alert" className="glass mx-auto max-w-md rounded-2xl p-6 text-center">
                <p className="font-medium">{loadError}</p>
                <p className="mt-1 text-sm text-plum/70">Check that <code>public/photos/manifest.json</code> exists.</p>
                <button type="button" onClick={() => void refresh()} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow">
                  <RefreshCw className="size-4" aria-hidden="true" /> Try again
                </button>
              </div>
            ) : photos.length === 0 ? (
              <p className="py-16 text-center font-display text-xl italic">{empty}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((p, i) => (
                  <li key={p.id}>
                    <PolaroidCard
                      photo={p}
                      index={i}
                      canManage={canManage}
                      onOpen={() => setViewerIndex(finished.findIndex((f) => f.id === p.id))}
                      onEdit={() => setEditingId(p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {hasTimeline && (
            <section id="timeline" aria-labelledby="timeline-title" className="mt-24 scroll-mt-28">
              <Timeline events={timelineEvents} />
            </section>
          )}

          <section id="quiz" aria-label="Friendship quiz" className="mt-24 scroll-mt-28">
            <Quiz />
          </section>
        </main>

        {/* Portalled to <body>: the page transition uses a CSS filter, which would otherwise
            trap "fixed" dialogs inside the (tall) page instead of the viewport. */}
        {createPortal(
          <>
        <AnimatePresence>
          {editing && (
            <CaptionEditor
              key={editing.id}
              photo={editing}
              otherCaptions={photos.filter((p) => p.id !== editing.id).map((p) => p.caption)}
              onSave={(caption) => saveCaption(editing.n, caption)}
              onClose={() => setEditingId(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewerIndex !== null && viewerIndex >= 0 && finished.length > 0 && (
            <PhotoViewer
              key="viewer"
              photos={finished}
              index={Math.min(viewerIndex, finished.length - 1)}
              onIndexChange={setViewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}
        </AnimatePresence>
          </>,
          document.body,
        )}
      </MagicBackground>
    </motion.div>
  );
}
