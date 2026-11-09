import { motion } from "framer-motion";

interface EmojiBurstProps {
  emoji: string;
}

const SPARKS = 10;
const EXTRAS = ["✨", "💖", "🌸"];

/** A short radial pop of emoji behind a quiz reaction. Purely decorative. */
export default function EmojiBurst({ emoji }: EmojiBurstProps) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2 + 0.3;
        const dist = 70 + (i % 3) * 22;
        return (
          <motion.span
            key={i}
            className="absolute text-xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 1.15 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.05 }}
          >
            {i % 2 === 0 ? emoji : EXTRAS[i % EXTRAS.length]}
          </motion.span>
        );
      })}
    </span>
  );
}
