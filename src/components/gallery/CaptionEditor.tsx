import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import type { Photo } from "../../types/photo";
import { suggestCaption } from "../../utils/captions";

interface CaptionEditorProps {
  photo: Photo;
  /** Captions already used by the other photos, so suggestions stay unique. */
  otherCaptions: string[];
  onSave: (caption: string) => Promise<void>;
  onClose: () => void;
}

/** Small dialog to edit a photo's message, with a "Suggest" helper. */
export default function CaptionEditor({ photo, otherCaptions, onSave, onClose }: CaptionEditorProps) {
  const [caption, setCaption] = useState(photo.caption);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const firstRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    firstRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !savingRef.current) onClose();
      else if (e.key === "Tab") {
        const f = Array.from(document.querySelectorAll<HTMLElement>("[data-editor] button:not([disabled]), [data-editor] input, [data-editor] textarea"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSave(caption.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-plum/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <motion.form
        role="dialog"
        aria-modal="true"
        aria-label="Edit photo message"
        data-editor
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-md rounded-t-3xl bg-cream p-5 text-plum shadow-2xl sm:rounded-3xl sm:p-7"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-display text-2xl">Edit message</h2>

        <label className="mt-4 block text-sm font-semibold">
          Message
          <textarea
            ref={firstRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={400}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-violet/30 bg-white px-3 py-2 text-base font-normal"
          />
        </label>
        <div className="mt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCaption((c) => suggestCaption(otherCaptions, c))}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-lavender/60 px-4 text-sm font-semibold"
          >
            <Sparkles className="size-4" aria-hidden="true" /> Suggest one
          </button>
          <span className="text-xs text-plum/60">{caption.length}/400</span>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-[#a22a5b]">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 cursor-pointer rounded-full px-5 text-sm font-semibold disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-plum px-6 text-sm font-semibold text-cream disabled:cursor-wait disabled:opacity-70">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Save
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
