import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Heart, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { birthdayConfig } from "../../config/birthday";
import { useMusic } from "../../hooks/useMusic";

/**
 * full: the card with play/pause, volume and animated disc.
 * compact: a single round button for screens where the music just continues.
 */
export default function MusicPlayer({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { status, volume, muted, toggle, setVolume, toggleMute } = useMusic();
  const playing = status === "playing";
  const { title, subtitle } = birthdayConfig.music;
  const shown = muted ? 0 : volume;
  const VolIcon = shown === 0 ? VolumeX : shown < 0.5 ? Volume1 : Volume2;

  if (variant === "compact") {
    return (
      <motion.button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Turn music off" : "Turn music on"}
        aria-pressed={playing}
        title={playing ? "Music ON — tap to turn off" : "Music OFF — tap to turn on"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="glass fixed right-3 top-3 z-40 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-plum sm:right-5 sm:top-5"
      >
        {playing ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
        <span>Music {playing ? "ON" : "OFF"}</span>
      </motion.button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-5">
      <motion.section
        aria-label="Music player"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl p-2.5 pr-3 text-plum"
      >
        <div
          aria-hidden="true"
          className="music-disc relative grid size-12 shrink-0 place-items-center rounded-full"
          style={{ animationPlayState: playing ? "running" : "paused" }}
        >
          <span className="grid size-5 place-items-center rounded-full bg-cream">
            <Heart className="size-3 fill-rose text-rose" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[0.95rem] font-medium leading-tight">{title}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-plum/70">
            <span aria-hidden="true" className={`eq ${playing ? "eq-on" : ""}`}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="truncate" role="status">
              {status === "idle" ? "Tap play for music" : playing ? "Now playing" : "Paused"}
            </span>
          </p>
          <span className="sr-only">{subtitle}</span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={shown === 0 ? "Unmute" : "Mute"}
          className="hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-full sm:inline-flex"
        >
          <VolIcon className="size-5" aria-hidden="true" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={shown}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume"
          className="vol-range w-16 shrink-0 sm:w-24"
          style={{ "--fill": `${Math.round(shown * 100)}%` } as CSSProperties}
        />

        <motion.button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause music" : "Play music"}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-plum text-cream shadow-lg"
        >
          {playing ? <Pause className="size-5 fill-current" aria-hidden="true" /> : <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />}
        </motion.button>
      </motion.section>
    </div>
  );
}
