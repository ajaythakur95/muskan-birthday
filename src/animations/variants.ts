import type { Variants } from "framer-motion";

export const easeOutSoft = [0.22, 1, 0.36, 1] as const;

/** Full-screen page transition. */
export const screenVariants: Variants = {
  initial: { opacity: 0, scale: 1.03, filter: "blur(10px)" },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: easeOutSoft },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(8px)",
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

/** One unit (letter or word) of a text reveal. */
export const revealUnit: Variants = {
  hidden: { opacity: 0, y: "0.5em", filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: easeOutSoft },
  },
};

export const riseIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easeOutSoft, delay },
  },
});
