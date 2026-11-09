import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Save, X } from "lucide-react";
import GlowButton from "../GlowButton";

interface LetterEditorProps {
  text: string;
  canReset: boolean;
  onSave: (text: string) => void;
  onReset: () => void;
  onClose: () => void;
}

/** Modal for editing the letter. Saving restarts the typewriter with the new text. */
export default function LetterEditor({ text, canReset, onSave, onReset, onClose }: LetterEditorProps) {
  const [draft, setDraft] = useState(text);
  const area = useRef<HTMLTextAreaElement>(null);
  const empty = draft.trim().length === 0;

  useEffect(() => {
    area.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="letter-editor-title"
        className="w-full max-w-xl rounded-3xl bg-cream p-5 text-plum shadow-2xl sm:p-7"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="letter-editor-title" className="text-2xl">Edit the letter</h2>
          <button type="button" onClick={onClose} aria-label="Close editor" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-plum/10">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <label htmlFor="letter-text" className="sr-only">Letter text</label>
        <textarea
          id="letter-text"
          ref={area}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="font-hand w-full resize-y rounded-2xl border border-plum/15 bg-white/80 p-4 text-[1.4rem] leading-snug outline-none focus:border-violet"
        />
        <p className="mt-1 text-xs text-plum/60">A blank line starts a new paragraph. Your changes are saved in this browser.</p>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          {canReset && (
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="mr-auto inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold text-plum/80 hover:bg-plum/10"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> Restore original
            </button>
          )}
          <button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-full px-5 text-sm font-semibold hover:bg-plum/10">
            Cancel
          </button>
          <GlowButton
            tone="deep"
            disabled={empty}
            icon={<Save className="size-4" aria-hidden="true" />}
            className="!min-h-11 !py-2 text-base disabled:opacity-50"
            onClick={() => {
              onSave(draft.replace(/\s+$/, ""));
              onClose();
            }}
          >
            Save &amp; replay
          </GlowButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
