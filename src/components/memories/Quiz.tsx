import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, PartyPopper, RotateCcw } from "lucide-react";
import { easeOutSoft } from "../../animations/variants";
import GlowButton from "../GlowButton";
import { memoriesCopy, quizQuestions } from "../../config/memories";
import type { AnswerTag } from "../../types/memories";
import EmojiBurst from "./EmojiBurst";

type Phase = "intro" | "asking" | "done";

const TAGS: AnswerTag[] = ["her", "me", "both", "neither"];

/** Multiple-choice friendship quiz with a funny animated reaction after every answer. */
export default function Quiz() {
  const copy = memoriesCopy.quiz;
  const questions = quizQuestions;
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerTag[]>([]);
  const lockRef = useRef(false); // blocks a second tap before React re-renders
  const nextRef = useRef<HTMLButtonElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);

  // After an answer: bring the reaction into view (it can sit below the fold on phones),
  // then move focus to "Next" so keyboard users keep flowing.
  useEffect(() => {
    if (picked === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reactionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    nextRef.current?.focus({ preventScroll: true });
  }, [picked]);

  const tally = useMemo(() => {
    const counts: Record<AnswerTag, number> = { her: 0, me: 0, both: 0, neither: 0 };
    answers.forEach((a) => (counts[a] += 1));
    return counts;
  }, [answers]);

  if (questions.length === 0) return null;
  const q = questions[index];
  const last = index === questions.length - 1;
  const chosen = picked !== null ? q.options[picked] : null;

  const choose = (i: number) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setPicked(i);
    setAnswers((a) => [...a, q.options[i].tag]);
  };

  const next = () => {
    lockRef.current = false;
    setPicked(null);
    if (last) setPhase("done");
    else setIndex((n) => n + 1);
  };

  const restart = () => {
    lockRef.current = false;
    setAnswers([]);
    setPicked(null);
    setIndex(0);
    setPhase("asking");
  };

  const top = Math.max(...TAGS.map((t) => tally[t]));
  const leaders = TAGS.filter((t) => tally[t] === top);
  const verdict = leaders.length === 1 ? copy.verdicts[leaders[0]] : copy.verdicts.tie;

  return (
    <div>
      <header className="mb-8 text-center">
        <h2 className="text-balance text-[clamp(1.6rem,5vw,2.6rem)] font-normal leading-tight">{copy.title}</h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-balance font-display text-lg italic text-plum/80">{copy.subtitle}</p>
      </header>

      <div className="glass mx-auto w-full max-w-2xl rounded-3xl p-5 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "intro" && (
            <motion.div key="intro" className="flex flex-col items-center gap-5 py-6 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: easeOutSoft }}>
              <span aria-hidden="true" className="text-6xl">🎉</span>
              <p className="max-w-[34ch] font-display text-xl">{questions.length} questions. Zero pressure. Maximum drama.</p>
              <GlowButton tone="deep" onClick={() => setPhase("asking")} icon={<PartyPopper className="size-5" aria-hidden="true" />}>
                {copy.start}
              </GlowButton>
            </motion.div>
          )}

          {phase === "asking" && (
            <motion.div key={`q-${index}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: easeOutSoft }}>
              <div className="mb-5">
                <p className="mb-2 text-sm font-semibold text-plum/70">Question {index + 1} of {questions.length}</p>
                <div role="progressbar" aria-label="Quiz progress" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1} className="h-2 overflow-hidden rounded-full bg-white/70">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-rose to-violet" initial={false} animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ duration: 0.5, ease: easeOutSoft }} />
                </div>
              </div>

              <h3 id={`quiz-q-${q.id}`} className="text-balance font-display text-2xl leading-snug sm:text-3xl">{q.question}</h3>

              <div role="group" aria-labelledby={`quiz-q-${q.id}`} className="mt-5 grid gap-3">
                {q.options.map((o, i) => {
                  const isPicked = picked === i;
                  return (
                    <motion.button
                      key={o.label}
                      type="button"
                      onClick={() => choose(i)}
                      disabled={picked !== null}
                      aria-pressed={isPicked}
                      whileHover={picked === null ? { scale: 1.015 } : undefined}
                      whileTap={picked === null ? { scale: 0.98 } : undefined}
                      className={`min-h-14 w-full cursor-pointer rounded-2xl px-5 py-3 text-left text-base font-medium transition-colors disabled:cursor-default ${
                        isPicked
                          ? "bg-white shadow-lg ring-2 ring-violet"
                          : picked !== null
                            ? "bg-white/40 text-plum/50"
                            : "bg-white/70 hover:bg-white"
                      }`}
                    >
                      {o.label}
                    </motion.button>
                  );
                })}
              </div>

              <div aria-live="polite" className="min-h-0">
                <AnimatePresence>
                  {chosen && (
                    <motion.div key="reaction" ref={reactionRef} className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blush/70 to-lavender/70 px-5 py-6 text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: easeOutSoft }}>
                      <EmojiBurst emoji={chosen.reaction.emoji} />
                      <motion.span
                        aria-hidden="true"
                        className="relative inline-block text-6xl"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: [0, 1.35, 1], rotate: [-30, 14, -10, 6, 0] }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        {chosen.reaction.emoji}
                      </motion.span>
                      <p className="relative mt-2 text-balance font-display text-lg italic leading-snug">{chosen.reaction.text}</p>
                      <div className="relative mt-5 flex justify-center">
                        <button
                          ref={nextRef}
                          type="button"
                          onClick={next}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-plum px-6 py-2.5 text-sm font-semibold text-cream shadow-lg"
                        >
                          {last ? copy.finish : copy.next}
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" className="py-2 text-center" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: easeOutSoft }}>
              <span aria-hidden="true" className="text-5xl">🏆</span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl">{copy.resultsTitle}</h3>
              <ul className="mx-auto mt-5 max-w-md space-y-3 text-left">
                {TAGS.map((t) => (
                  <li key={t}>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{copy.tally[t]}</span>
                      <span>{tally[t]}</span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/70">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-rose to-violet" initial={{ width: 0 }} animate={{ width: `${(tally[t] / questions.length) * 100}%` }} transition={{ duration: 0.9, ease: easeOutSoft, delay: 0.2 }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mx-auto mt-6 max-w-[40ch] text-balance font-display text-xl italic leading-snug">{verdict}</p>
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={restart} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold shadow">
                  <RotateCcw className="size-4" aria-hidden="true" /> {copy.again}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
