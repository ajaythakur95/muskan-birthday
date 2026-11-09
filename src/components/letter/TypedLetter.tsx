import { useEffect } from "react";
import { useTypewriter } from "../../hooks/useTypewriter";

interface TypedLetterProps {
  text: string;
  active: boolean;
  instant: boolean;
  /** Receives the "show everything now" function and whether typing has finished. */
  onState: (state: { done: boolean; skip: () => void }) => void;
}

/**
 * Isolated on purpose: the typewriter updates state every few milliseconds, and keeping
 * it in its own component means only this paragraph re-renders, not the whole page.
 */
export default function TypedLetter({ text, active, instant, onState }: TypedLetterProps) {
  const { shown, done, skip } = useTypewriter(text, active, instant);
  useEffect(() => onState({ done, skip }), [done, skip, onState]);

  return (
    <>
      {/* Screen readers get the full letter at once, not letter by letter. */}
      <p className="font-hand sr-only whitespace-pre-wrap">{text}</p>
      <div aria-hidden="true" className="font-hand relative">
        <p className="invisible whitespace-pre-wrap">{text}</p>
        <p className="absolute inset-0 whitespace-pre-wrap">
          {shown}
          {!done && <span className="typewriter-caret" />}
        </p>
      </div>
    </>
  );
}
