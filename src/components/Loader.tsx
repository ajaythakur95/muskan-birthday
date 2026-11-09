import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { birthdayConfig } from "../config/birthday";

export default function Loader() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="bg-twilight flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center text-cream"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.18, 1], rotate: [0, 12, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-full p-5"
        style={{ background: "radial-gradient(circle, rgba(255,209,227,0.45), rgba(255,209,227,0) 70%)" }}
      >
        <Sparkles className="size-10 text-blush" strokeWidth={1.5} />
      </motion.div>
      <p className="font-display text-xl italic text-blush/95">{birthdayConfig.loader.label}</p>
    </motion.div>
  );
}
