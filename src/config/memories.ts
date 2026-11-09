import type { QuizQuestion, TimelineEvent } from "../types/memories";

/**
 * Phase 4 content. Edit here only — no component needs to change.
 */

/* ── Friendly captions (used by the "Suggest" buttons, never repeated while unused ones remain) ── */
export const captionBank: readonly string[] = [
  "Your smile makes everything brighter!",
  "Stay the same crazy and beautiful person forever.",
  "Keep smiling, Muskan!",
  "Some friendships make life more beautiful.",
  "Main character energy, always.",
  "Certified sunshine, delivered daily.",
  "Be a little extra today. You've earned it.",
  "The world is better with your laugh in it.",
  "Never lose that sparkle, Muskan.",
  "Chaos, charm and a whole lot of heart.",
  "Here's to many more silly laughs.",
  "You make ordinary days feel like a celebration.",
  "Dream big, laugh louder, stay you.",
  "A friend like you is a rare kind of lucky.",
  "Look at that smile. Pure magic.",
  "Always be the reason someone smiles.",
  "Grow older, never grow boring.",
  "Life looks better with you in the frame.",
  "Keep being unapologetically you.",
  "Today the whole day is yours.",
  "Thank you for being such a good friend.",
  "May your year be as bright as your smile.",
  "Little moments, big smiles.",
  "One of a kind. Don't ever change.",
  "Go shine, birthday girl!",
  "Be happy, be loud, be Muskan.",
  "Laughter looks great on you.",
  "Another year of being awesome.",
  "You light up every room you walk into.",
  "Good people make good days. Thanks for being one.",
  "Pagalpan hi toh hamari best quality hai ❤️",
  "Tu hasti rehna, baaki sab main sambhal lunga.",
  "Kuch log photo mein hi nahi, dil mein bhi fit hote hain.",
  "Camera bhi bol raha hai: kya smile hai!",
  "Sabse alag, sabse pyaari, sabse crazy.",
  "Ye photo dekh ke mera din ban gaya.",
  "Door hoon, par is photo jitna paas hoon ❤️",
  "Tere bina yaadein adhoori lagti hain.",
  "Birthday girl on duty! Entry ka music bajao 🎶",
  "Aaj sirf cake, smiles aur masti. No tension.",
  "Teri hansi mein hi toh meri khushi hai.",
  "Is smile ko kabhi bhi mat bhoolna.",
  "Friend nahi, family hai tu.",
  "Sabse best, bina kisi filter ke.",
  "Aise hi jeeti reh, aise hi hasti reh.",
  "Ek photo, hazaar yaadein.",
  "Tera attitude + teri smile = deadly combination 😎",
  "Jahan tu hoti hai, wahan boring ka koi kaam nahi.",
  "Aaj ke din toh maafi bhi mil jayegi, bas cake lana mat bhoolna.",
  "Tu ek hi hai, aur wahi kaafi hai.",
  "Har saal aur zyada pyaari, aur zyada crazy.",
  "Ye pal hamesha yaad rahega.",
  "Khush reh, masti kar, aur sabko pareshaan kar 😄",
  "Thoda drama, thoda pyaar, bahut saari hansi.",
  "Teri khushi meri wish list mein sabse upar hai.",
  "Is photo ki tarah teri life bhi rang-birangi ho.",
  "Dua hai ki har din tere liye birthday jaisa ho.",
  "Tu hai toh sab kuch thoda zyada achha lagta hai.",
  "Best friend ka matlab: bina bole sab samajh jana.",
  "Muskan naam hi kaafi hai muskurane ke liye 😊",
  "Duniya ka sabse bada cake tere naam!",
  "Chahe kitni bhi door ho, dil toh yahin hai.",
  "Yaaron ki yaari, ye photo gawah hai.",
  "Bas aise hi chamakti reh, star ⭐",
  "Teri hansi sabse pyaara sound hai.",
  "Tension chhod, party shuru kar!",
  "Teri har photo mein ek alag hi magic hota hai.",
  "Hamesha aise hi khush rehna, ye meri sabse badi wish hai.",
  "Tu jaisi hai, bilkul waisi hi perfect hai.",
  "Zindagi ke har chapter mein tu best part hai.",
];

/* ── Section copy ── */
export const memoriesCopy = {
  galleryTitle: "Our Little World of Memories ❤️",
  gallerySubtitle: "Every photo, reimagined as a little animated-film moment.",
  nav: { memories: "Memories", timeline: "Timeline", quiz: "Quiz" },
  timeline: {
    title: "Our Friendship Timeline",
    subtitle: "A few moments worth remembering.",
  },
  quiz: {
    title: "The Friendship Quiz",
    subtitle: "A few quick questions. Answer honestly, there's no judging (a little judging).",
    start: "Let's play",
    next: "Next question",
    finish: "See my results",
    again: "Play again",
    resultsTitle: "Your results",
    tally: { her: "Muskan", me: "Me", both: "Both of us", neither: "Neither" },
    /** Verdict shown for whichever answer she picked most. */
    verdicts: {
      her: "You picked yourself most often. Confidence level: legendary. 👑",
      me: "You picked me most often. I accept this crown with great humility. 😎",
      both: "Team \"Both of us\" wins. Two of a kind, honestly. 🤝",
      neither: "You think we're both innocent. The jury is not convinced. 😇",
      tie: "A perfect split. Impossible to read, just like you. 🌀",
    },
  },
  /** Floating flowers and hearts behind the gallery. */
  floaters: { desktop: 14, mobile: 8 },
} as const;

/* ── Friendship timeline ──────────────────────────────────────────────
 * ONLY add real events and dates that you know happened. Nothing is invented.
 * List them oldest first. The section stays hidden while this list is empty.
 *
 *   { date: "14 March 2019", title: "The day we met", description: "Optional text.", emoji: "🌸" },
 */
export const timelineEvents: readonly TimelineEvent[] = [];

/* ── Quiz ─────────────────────────────────────────────────────────────
 * Add, remove or reword questions freely (5 to 10 works best).
 * `tag` decides which bucket an answer counts toward in the final tally.
 */
export const quizQuestions: readonly QuizQuestion[] = [
  {
    id: "crazy",
    question: "Who is more crazy?",
    options: [
      { label: "Muskan, obviously", tag: "her", reaction: { emoji: "🤪", text: "Bold of you to admit it. Certified chaos." } },
      { label: "Me", tag: "me", reaction: { emoji: "😏", text: "Throwing your best friend under the bus? Respect." } },
      { label: "Both of us, equally", tag: "both", reaction: { emoji: "🤝", text: "Two peas in a very silly pod." } },
      { label: "Neither, we're very normal", tag: "neither", reaction: { emoji: "😇", text: "Sure. And I'm a unicorn." } },
    ],
  },
  {
    id: "talks",
    question: "Who talks more?",
    options: [
      { label: "Muskan", tag: "her", reaction: { emoji: "🗣️", text: "Plot twist: nobody else got a word in." } },
      { label: "Me", tag: "me", reaction: { emoji: "🙊", text: "Fine. I'll stop talking. (I won't.)" } },
      { label: "We never stop", tag: "both", reaction: { emoji: "📞", text: "Two phones, zero pauses." } },
      { label: "We just sit in silence", tag: "neither", reaction: { emoji: "🦗", text: "Cricket sounds intensify." } },
    ],
  },
  {
    id: "late",
    question: "Who is always late?",
    options: [
      { label: "Muskan", tag: "her", reaction: { emoji: "⏰", text: "Fashionably late is still late!" } },
      { label: "Me", tag: "me", reaction: { emoji: "🐢", text: "Traffic. It's always traffic." } },
      { label: "Both of us", tag: "both", reaction: { emoji: "🕰️", text: "Meeting at 5 means 6:30. Everyone knows." } },
      { label: "Neither, we're early", tag: "neither", reaction: { emoji: "🤥", text: "The clocks are laughing at you." } },
    ],
  },
  {
    id: "cake",
    question: "Who deserves the biggest birthday cake?",
    options: [
      { label: "Muskan, no contest", tag: "her", reaction: { emoji: "🎂", text: "Correct! Three tiers, minimum." } },
      { label: "Me, I'm hungrier", tag: "me", reaction: { emoji: "🍰", text: "It's HER birthday. Put the fork down." } },
      { label: "We split it", tag: "both", reaction: { emoji: "🍴", text: "Generous. But she gets the bigger half." } },
      { label: "A cake for everyone", tag: "neither", reaction: { emoji: "🎉", text: "The best kind of party." } },
    ],
  },
  {
    id: "hungry",
    question: "Who gets hungry first?",
    options: [
      { label: "Muskan", tag: "her", reaction: { emoji: "🍕", text: "Snack radar: always on." } },
      { label: "Me", tag: "me", reaction: { emoji: "🍟", text: "Honesty is the best seasoning." } },
      { label: "Both, at the exact same time", tag: "both", reaction: { emoji: "😋", text: "Synchronized hunger. Beautiful." } },
      { label: "Neither, we're full of cake", tag: "neither", reaction: { emoji: "🤰", text: "That's a lot of cake." } },
    ],
  },
  {
    id: "dance",
    question: "Who is the better dancer?",
    options: [
      { label: "Muskan", tag: "her", reaction: { emoji: "💃", text: "Dance floor: reserved." } },
      { label: "Me", tag: "me", reaction: { emoji: "🕺", text: "Confidence counts for a lot, so sure." } },
      { label: "We're both unstoppable", tag: "both", reaction: { emoji: "🪩", text: "Please, no videos." } },
      { label: "Neither, we just vibe", tag: "neither", reaction: { emoji: "🎶", text: "Vibing is a valid art form." } },
    ],
  },
  {
    id: "movie",
    question: "Who cries first at a sad movie?",
    options: [
      { label: "Muskan", tag: "her", reaction: { emoji: "😭", text: "Pass the tissues, she's gone." } },
      { label: "Me", tag: "me", reaction: { emoji: "🥲", text: "It was just something in my eye. Obviously." } },
      { label: "Both, before the trailer ends", tag: "both", reaction: { emoji: "🧻", text: "Buy tissues in bulk." } },
      { label: "Neither, hearts of stone", tag: "neither", reaction: { emoji: "🪨", text: "Stone cold. Impressive." } },
    ],
  },
  {
    id: "selfie",
    question: "Who takes the most selfies?",
    options: [
      { label: "Muskan", tag: "her", reaction: { emoji: "🤳", text: "Best angle: all of them." } },
      { label: "Me", tag: "me", reaction: { emoji: "📸", text: "A true artist, misunderstood." } },
      { label: "Both, the gallery is full", tag: "both", reaction: { emoji: "📱", text: "Storage full. Again." } },
      { label: "Neither, we hate selfies", tag: "neither", reaction: { emoji: "🙄", text: "And yet here we are, smiling." } },
    ],
  },
];
