import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { inspectImage } from "./imageInfo.mjs";

/**
 * Ten fixed photo slots. Slot N holds the ORIGINAL photo and its matching ANIME illustration:
 *   public/photos/original/NN.<ext>
 *   public/photos/anime/NN.<ext>
 * The slot number is the pairing, so an original can never end up beside the wrong illustration.
 * Nothing here generates or edits images: files are stored exactly as uploaded.
 */
export const SLOT_COUNT = 10;
export const KINDS = ["original", "anime"];
export const EXTS = ["jpg", "png", "webp"];
export const MAX_CAPTION = 400;
const MIN_SIDE = 64;
const MAX_SIDE = 12_000;

export class SlotError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const pad = (n) => String(n).padStart(2, "0");
const fileRe = /^(\d{2})\.(jpg|png|webp)$/;

export function createSlots(photosDir) {
  const manifestPath = path.join(photosDir, "manifest.json");
  const dirOf = (kind) => path.join(photosDir, kind);
  let queue = Promise.resolve(); // serialises writes so the manifest never gets interleaved

  const exclusive = (fn) => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  };

  const checkSlot = (n) => {
    const num = Number(n);
    if (!Number.isInteger(num) || num < 1 || num > SLOT_COUNT) throw new SlotError(`Slot must be 1 to ${SLOT_COUNT}.`, 404);
    return num;
  };
  const checkKind = (kind) => {
    if (!KINDS.includes(kind)) throw new SlotError('Kind must be "original" or "anime".', 404);
    return kind;
  };

  async function readCaptions() {
    try {
      const raw = JSON.parse(await readFile(manifestPath, "utf8"));
      const out = {};
      for (const s of raw.slots ?? []) if (s && Number.isInteger(s.n) && typeof s.caption === "string") out[s.n] = s.caption;
      return out;
    } catch {
      return {};
    }
  }

  async function readVersions() {
    try {
      const raw = JSON.parse(await readFile(manifestPath, "utf8"));
      const out = {};
      for (const s of raw.slots ?? []) if (s) out[s.n] = { original: s.original?.v ?? 0, anime: s.anime?.v ?? 0 };
      return out;
    } catch {
      return {};
    }
  }

  /** Scan the folders (so files dropped in by hand are found) and rewrite manifest.json. */
  async function rebuild({ bump = [] } = {}) {
    await Promise.all(KINDS.map((k) => mkdir(dirOf(k), { recursive: true })));
    const [captions, versions] = await Promise.all([readCaptions(), readVersions()]);
    const found = { original: {}, anime: {} };
    for (const kind of KINDS) {
      for (const name of await readdir(dirOf(kind))) {
        const m = fileRe.exec(name.toLowerCase());
        if (!m) continue;
        const n = Number(m[1]);
        if (n >= 1 && n <= SLOT_COUNT) found[kind][n] = name;
      }
    }
    const now = Date.now();
    const slots = [];
    for (let n = 1; n <= SLOT_COUNT; n++) {
      const entry = { n, caption: captions[n] ?? "" };
      for (const kind of KINDS) {
        const file = found[kind][n];
        const prev = versions[n]?.[kind] ?? 0;
        const v = bump.some((b) => b.n === n && b.kind === kind) ? now : prev || 1;
        entry[kind] = file ? { file, v } : null;
      }
      slots.push(entry);
    }
    const manifest = { slots };
    const tmp = `${manifestPath}.tmp`;
    await writeFile(tmp, JSON.stringify(manifest, null, 2) + "\n");
    await rename(tmp, manifestPath);
    return manifest;
  }

  const removeFiles = async (kind, n, except) => {
    for (const ext of EXTS) {
      const name = `${pad(n)}.${ext}`;
      if (name === except) continue;
      await unlink(path.join(dirOf(kind), name)).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
    }
  };

  return {
    photosDir,
    init: () => exclusive(() => rebuild()),
    list: () => exclusive(() => rebuild()),

    /** Store (or replace) the original or anime image for a slot, exactly as uploaded. */
    save: (nRaw, kindRaw, buffer) =>
      exclusive(async () => {
        const n = checkSlot(nRaw);
        const kind = checkKind(kindRaw);
        const info = inspectImage(buffer);
        if (!info) throw new SlotError("That file is not a JPG, PNG or WebP image.", 415);
        if (info.width && (info.width < MIN_SIDE || info.height < MIN_SIDE)) throw new SlotError("That image is too small.");
        if (info.width > MAX_SIDE || info.height > MAX_SIDE) throw new SlotError("That image is too large (max 12000 px per side).");
        await mkdir(dirOf(kind), { recursive: true });
        const name = `${pad(n)}.${info.ext}`;
        const dest = path.join(dirOf(kind), name);
        const tmp = `${dest}.tmp`;
        await writeFile(tmp, buffer);
        await rename(tmp, dest);
        await removeFiles(kind, n, name); // replacing a .jpg with a .png must not leave the old one behind
        return rebuild({ bump: [{ n, kind }] });
      }),

    clear: (nRaw, kindRaw) =>
      exclusive(async () => {
        const n = checkSlot(nRaw);
        const kind = checkKind(kindRaw);
        await mkdir(dirOf(kind), { recursive: true });
        await removeFiles(kind, n, null);
        return rebuild();
      }),

    setCaption: (nRaw, caption) =>
      exclusive(async () => {
        const n = checkSlot(nRaw);
        if (typeof caption !== "string") throw new SlotError("Caption must be text.");
        const clean = caption.replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION);
        await rebuild();
        const raw = JSON.parse(await readFile(manifestPath, "utf8"));
        raw.slots.find((s) => s.n === n).caption = clean;
        await writeFile(manifestPath, JSON.stringify(raw, null, 2) + "\n");
        return raw;
      }),
  };
}
