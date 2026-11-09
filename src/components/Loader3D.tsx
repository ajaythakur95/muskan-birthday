import { Sparkles } from "lucide-react";
import { birthdayConfig } from "../config/birthday";

/** Light-background loading state while the 3D chunk downloads. */
export default function Loader3D() {
  return (
    <div role="status" aria-live="polite" className="flex h-dvh flex-col items-center justify-center gap-4 text-center text-plum">
      <Sparkles className="size-9 animate-pulse text-violet" strokeWidth={1.5} aria-hidden="true" />
      <p className="font-display text-xl italic">{birthdayConfig.cinematic.loading3d}</p>
    </div>
  );
}
