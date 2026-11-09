import { captionBank } from "../config/memories";

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Picks a friendly caption that no other photo is using yet.
 * Falls back to any caption other than `avoid` only if every one is taken.
 */
export function suggestCaption(used: Iterable<string>, avoid = ""): string {
  const taken = new Set(Array.from(used, norm));
  taken.add(norm(avoid));
  const fresh = captionBank.filter((c) => !taken.has(norm(c)));
  const pool = fresh.length ? fresh : captionBank.filter((c) => norm(c) !== norm(avoid));
  return pool[Math.floor(Math.random() * pool.length)] ?? captionBank[0];
}

/** A unique caption for every photo: its own message, or a fresh one if blank or duplicated. */
export function uniqueCaptions(texts: string[]): string[] {
  const used = new Set<string>();
  return texts.map((raw, i) => {
    let c = raw.trim();
    if (!c || used.has(norm(c))) {
      c = captionBank.find((x) => !used.has(norm(x))) ?? captionBank[i % captionBank.length];
    }
    used.add(norm(c));
    return c;
  });
}
