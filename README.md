# Muskan's Magical Birthday Website

React + Vite + TypeScript + Tailwind v4 · Framer Motion · React Three Fiber / Three.js / Drei · GSAP · small Express server (optional, for the upload screen).

**No AI and no API keys.** Every picture on the site is a file you upload yourself.

## Run it locally

```bash
npm install
cp .env.example .env     # optional: set ADMIN_KEY to protect the upload screen
npm run dev              # API (http://localhost:8787) + site (http://localhost:5173)
```

Needs Node 22.9+. Tests: `npm test`. Type check + build: `npm run build`.

## Your 10 photo pairs

Photos live in `public/photos/`:

```
public/photos/original/01.jpg … 10.jpg   normal photos
public/photos/anime/01.jpg    … 10.jpg   matching Ghibli-style illustrations
public/photos/manifest.json              list of the pairs + captions (kept up to date automatically)
```

**The number is the pairing**: `original/03` is always shown with `anime/03`, so they can't be mismatched.
JPG, PNG or WebP are fine; images are stored exactly as uploaded (never generated or edited).

Two ways to add or replace photos:

1. **Upload screen** (needs `npm run dev`): open **Memories → Manage photos**. Each of the 10 rows has a separate *Normal photo* and *Anime photo* upload with Replace / Remove. Pair numbers cannot get crossed.
2. **By hand**: copy files into the two folders using the numbering above, then start the site (or run `npm run dev`); `manifest.json` is rebuilt from the folders on server start.

Only pairs with **both** images appear in the slideshow and gallery.

### Captions
Open **Memories**, tap the pencil on a card to write that photo's message. Blank or repeated captions automatically get a unique one from `captionBank` in `src/config/memories.ts`, so every slide has its own caption.

### Putting it online
Uploads write files into `public/photos/`. A static host (Vercel) cannot save uploads at runtime, so upload locally, then **commit/deploy the `public/photos` folder**. The deployed site only reads those static files and needs no backend. If you do run `npm start` on a server, set `ADMIN_KEY` (12+ chars) to allow uploads; without it, a production server is read-only.

## The slideshow
Ajay (3D) stays on screen next to the photo (on the left of it on desktop, below it on mobile). Per pair: he waves and points, the normal photo flips in, after a short pause it flips and dissolves into its anime twin, Ajay cheers, the caption appears, then the next pair starts automatically. Controls: Previous / Pause-Play / Next, counter `01/10`. After the 10th pair: *"Every picture has a memory, and every memory is special." / "Happy Birthday Muskan ❤️" / "With love and friendship – Ajay"*.

## What's where

| Path | Purpose |
| --- | --- |
| `src/config/birthday.ts` | Texts (name, letter, slideshow and final lines) |
| `src/config/memories.ts` | Caption bank, timeline events, quiz questions |
| `src/pages/SlideshowPage.tsx` + `src/scene/SlideshowHost.tsx` | Slideshow and Ajay's stage |
| `src/hooks/usePhotos.ts`, `src/services/api.ts` | Reads `public/photos/manifest.json` (+ optional upload calls) |
| `src/components/gallery/SlotManager.tsx` | The 10-row upload screen |
| `server/lib/slots.mjs`, `server/index.mjs` | Saves images into `public/photos` and keeps the manifest |
| `src/scene/`, `src/audio/` | Gift box, cake scene, music (unchanged) |

## Environment variables
See `.env.example`: `ADMIN_KEY`, `CORS_ORIGINS`, `PORT`, `VITE_API_URL`. All optional locally.
