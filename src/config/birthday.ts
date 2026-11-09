/**
 * Central content for Muskan's birthday experience.
 * Edit text here — no need to touch any component.
 */
export const birthdayConfig = {
  name: "Muskan",

  // Her birthday celebration date. Shown as text only: no age is calculated anywhere.
  birthday: { dateLabel: "10 November 2026" },

  // Personal details card (final screen).
  person: {
    name: "Muskan",
    dateOfBirth: "10 November 2002",
    celebration: "10 November 2026",
    wishesFrom: "Ajay",
  },

  loader: {
    label: "Sprinkling a little magic…",
    minDurationMs: 1600,
  },

  welcome: {
    greeting: "Hey Muskan! ❤️",
    subtitle: "Someone has created a little magical world just for you... on 24th birthday",
    button: "Let's Begin",
  },

  environment: {
    ariaLabel: "Magical birthday world",
  },

  gift: {
    title: "Your Birthday Surprise Is Waiting!",
    button: "Open Your Surprise",
    opening: "Unwrapping your surprise…",
  },

  cinematic: {
    wish: "Make a Wish, Muskan!",
    finale: "HAPPY BIRTHDAY MUSKAN! ❤️",
    replay: "Watch again",
    memories: "See your memories",
    letter: "Open your letter 💌",
    loading3d: "Gathering the magic…",
    fallbackNote:
      "Your device can't show the 3D scene, so here is a lighter surprise instead.",
    // Narration shown while the scene plays (also read by screen readers).
    captions: {
      opening: "Untying the ribbon…",
      emerging: "Someone is coming out…",
      waving: "Hi, Muskan!",
      walking: "Let's go to the cake…",
      candles: "The candles are lit…",
      blowing: "Blow them out!",
      cutting: "Time to cut the cake…",
      ajay: "Look who just walked in. It's Ajay! 🎉",
      cuttingTogether: "Cutting the cake together…",
      celebrating: "Hooray!",
    },
  },

  letter: {
    storageKey: "muskan-letter-v1",
    openHint: "Tap the heart to open your letter",
    openLabel: "Open your birthday letter",
    // Blank line = new paragraph. Muskan's letter can also be edited on screen.
    text: [
      "Dear Muskan,",
      "Happy Birthday! ❤️",
      "I may not be physically present with you on your special day, but I wanted to create something different and memorable for you.",
      "You deserve happiness, endless smiles, and beautiful moments.",
      "Never stop smiling, never stop being yourself, and keep shining.",
      "I hope this little surprise brings a big smile to your face.",
      "Wishing you the happiest birthday!",
      "Your Best Friend ❤️",
    ].join("\n\n"),
  },

  music: {
    title: "Muskan's Lullaby",
    subtitle: "Original music-box tune · royalty-free",
    storageKey: "muskan-volume-v1",
    defaultVolume: 0.6,
  },

  slideshow: {
    title: "Memories, then and painted",
    original: "The photo",
    anime: "The illustration",
    hold: 3800, // ms each picture stays on screen
    next: "Continue",
    finalQuote: "Every picture has a memory, and every memory is special.",
    finalTitle: "Happy Birthday Muskan ❤️",
    finalFrom: "With love and friendship – Ajay",
    watchAgain: "Watch again",
  },

  final: {
    title: "Happy Birthday Muskan ❤️",
    subtitle: "— From Ajay",
    replay: "Replay",
    memories: "View memories",
  },

  gallery: {
    title: "Our Little World of Memories ❤️",
    subtitle: "Every photo, reimagined as a little animated-film moment.",
    empty: "No memories have been added yet. Check back soon! 💌",
    viewerHint: "Tap a card to open it",
  },

  // Counts are tuned to look rich on desktop and stay smooth on phones.
  effects: {
    stars: { desktop: 90, mobile: 45 },
    butterflies: { desktop: 7, mobile: 4 },
    particles: { desktop: 36, mobile: 18 },
    petals: { desktop: 22, mobile: 12 },
  },
} as const;

export type BirthdayConfig = typeof birthdayConfig;

export { memoriesCopy, timelineEvents, quizQuestions, captionBank } from "./memories";
