import { motion } from "framer-motion";
import { easeOutSoft } from "../../animations/variants";
import { memoriesCopy } from "../../config/memories";
import type { TimelineEvent } from "../../types/memories";

interface TimelineProps {
  events: readonly TimelineEvent[];
}

/** Vertical timeline: one rail on mobile, alternating sides from tablet up. */
export default function Timeline({ events }: TimelineProps) {
  const { title, subtitle } = memoriesCopy.timeline;
  return (
    <div>
      <header className="mb-10 text-center">
        <h2 id="timeline-title" className="text-balance text-[clamp(1.6rem,5vw,2.6rem)] font-normal leading-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-[40ch] text-balance font-display text-lg italic text-plum/80">{subtitle}</p>
      </header>

      <ol aria-labelledby="timeline-title" className="relative mx-auto max-w-3xl">
        <span aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-rose/0 via-violet/60 to-rose/0 md:left-1/2" />
        {events.map((e, i) => {
          const right = i % 2 === 1;
          return (
            <motion.li
              key={`${e.date}-${i}`}
              className={`relative pb-10 pl-14 last:pb-0 md:w-1/2 md:pl-0 ${right ? "md:ml-[50%] md:pl-12" : "md:pr-12 md:text-right"}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: easeOutSoft }}
            >
              <span
                aria-hidden="true"
                className={`absolute left-5 top-5 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-blush text-base shadow-md ${
                  right ? "md:left-0" : "md:left-auto md:right-0 md:translate-x-1/2"
                }`}
              >
                {e.emoji ?? "💗"}
              </span>
              <div className="glass rounded-2xl px-5 py-4">
                <p className="font-display text-sm italic text-violet">{e.date}</p>
                <h3 className="mt-0.5 font-display text-xl leading-snug">{e.title}</h3>
                {e.description && <p className="mt-1.5 text-[0.95rem] leading-relaxed text-plum/80">{e.description}</p>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
