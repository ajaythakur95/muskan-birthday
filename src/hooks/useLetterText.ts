import { useCallback, useState } from "react";
import { birthdayConfig } from "../config/birthday";

const { storageKey, text: defaultText } = birthdayConfig.letter;

/** The letter text, editable by the visitor and remembered in this browser. */
export function useLetterText() {
  const [text, setTextState] = useState<string>(() => {
    try {
      return window.localStorage.getItem(storageKey) || defaultText;
    } catch {
      return defaultText;
    }
  });

  const setText = useCallback((next: string) => {
    setTextState(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      /* private mode: the edit still works for this visit */
    }
  }, []);

  const reset = useCallback(() => {
    setTextState(defaultText);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, []);

  return { text, setText, reset, isDefault: text === defaultText, defaultText };
}
