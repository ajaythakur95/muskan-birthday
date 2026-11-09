import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";
import { revealUnit } from "../animations/variants";

interface RevealTextProps {
  text: string;
  /** Reveal letter by letter, or word by word. */
  by?: "char" | "word";
  /** Seconds before the first unit appears. */
  delay?: number;
  /** Seconds between units. */
  stagger?: number;
  className?: string;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** Grapheme-safe split so emoji like ❤️ stay in one piece. */
function toGraphemes(value: string): string[] {
  return segmenter ? Array.from(segmenter.segment(value), (s) => s.segment) : Array.from(value);
}

export default function RevealText({
  text,
  by = "char",
  delay = 0,
  stagger = 0.05,
  className,
}: RevealTextProps) {
  const container: Variants = useMemo(
    () => ({
      hidden: {},
      visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
    }),
    [stagger, delay],
  );

  const words = useMemo(() => text.split(" "), [text]);

  return (
    <>
      {/* Screen readers get the whole sentence at once instead of one letter at a time. */}
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        className={className}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="inline-block whitespace-nowrap">
              {by === "word" ? (
                <motion.span className="inline-block" variants={revealUnit}>
                  {word}
                </motion.span>
              ) : (
                toGraphemes(word).map((g, gi) => (
                  <motion.span key={gi} className="inline-block" variants={revealUnit}>
                    {g}
                  </motion.span>
                ))
              )}
            </span>
            {wi < words.length - 1 ? " " : null}
          </span>
        ))}
      </motion.span>
    </>
  );
}
