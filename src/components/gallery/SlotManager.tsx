import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { ServerHealth, Slot, SlotKind } from "../../types/photo";

interface SlotManagerProps {
  slots: Slot[];
  health: ServerHealth;
  onUpload: (n: number, kind: SlotKind, file: File) => Promise<void>;
  onClear: (n: number, kind: SlotKind) => Promise<void>;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const LABEL: Record<SlotKind, string> = { original: "Normal photo", anime: "Anime photo" };

/** 10 rows, each with a separate Normal and Anime upload. The row number is the pairing. */
export default function SlotManager({ slots, health, onUpload, onClear }: SlotManagerProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = key;
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work. Please try again.");
    } finally {
      busyRef.current = null;
      setBusy(null);
    }
  };

  const complete = slots.filter((s) => s.original && s.anime).length;

  return (
    <div className="glass mx-auto mb-10 w-full max-w-3xl rounded-3xl p-4 text-plum sm:p-6">
      <h2 className="font-display text-2xl">Manage photos</h2>
      <p className="mt-1 text-sm text-plum/75">
        Upload each normal photo and its matching anime photo in the <b>same row</b>. Row numbers pair them, so they can never get mixed up.
        Files are saved exactly as you upload them (JPG, PNG or WebP, up to {health.maxUploadMb} MB). {complete}/10 pairs complete.
      </p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose/30 px-3 py-2 text-sm">{error}</p>}

      <ol className="mt-4 grid gap-3">
        {slots.map((s) => (
          <li key={s.n} className="rounded-2xl bg-white/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg">Pair {String(s.n).padStart(2, "0")}</span>
              {s.original && s.anime ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet"><CheckCircle2 className="size-4" aria-hidden="true" /> Pair complete</span>
              ) : (
                <span className="text-xs text-plum/60">Needs both photos</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["original", "anime"] as const).map((kind) => {
                const img = s[kind];
                const key = `${s.n}-${kind}`;
                const working = busy === key;
                return (
                  <div key={kind} className="flex flex-col gap-2">
                    <span className="text-xs font-semibold">{LABEL[kind]}</span>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-lavender/50">
                      {img ? (
                        <img src={img.url} alt={`${LABEL[kind]} ${s.n}`} loading="lazy" className="size-full object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs text-plum/50">Empty</span>
                      )}
                      {working && (
                        <span className="absolute inset-0 flex items-center justify-center bg-plum/40"><Loader2 className="size-6 animate-spin text-cream" aria-hidden="true" /></span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-plum px-3 text-xs font-semibold text-cream has-[:disabled]:opacity-50">
                        <ImagePlus className="size-4" aria-hidden="true" /> {img ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept={ACCEPT}
                          disabled={busy !== null}
                          className="sr-only"
                          aria-label={`${img ? "Replace" : "Upload"} ${LABEL[kind].toLowerCase()} for pair ${s.n}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) void run(key, () => onUpload(s.n, kind, file));
                          }}
                        />
                      </label>
                      {img && (
                        <button
                          type="button"
                          disabled={busy !== null}
                          aria-label={`Remove ${LABEL[kind].toLowerCase()} for pair ${s.n}`}
                          onClick={() => {
                            if (window.confirm(`Remove the ${LABEL[kind].toLowerCase()} from pair ${s.n}?`)) void run(key, () => onClear(s.n, kind));
                          }}
                          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white disabled:opacity-50"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
