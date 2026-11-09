export interface TimelineEvent {
  /** Shown exactly as written, e.g. "12 March 2019" or "Summer 2021". */
  date: string;
  title: string;
  description?: string;
  emoji?: string;
}

/** Who an answer points to. Used for the little tally at the end. */
export type AnswerTag = "her" | "me" | "both" | "neither";

export interface QuizOption {
  label: string;
  tag: AnswerTag;
  reaction: { emoji: string; text: string };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}
