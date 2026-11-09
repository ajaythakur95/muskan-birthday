import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import { createSlots, SlotError } from "./lib/slots.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const photosDir = path.join(root, "public", "photos");
const PORT = Number(process.env.PORT) || 8787;
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per image
const IS_PROD = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

const slots = createSlots(photosDir);
await slots.init();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));
app.use((_req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" });
  next();
});

/* CORS: only origins listed in CORS_ORIGINS (needed when the site and API are on different domains) */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set({
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
      "Access-Control-Allow-Methods": "GET, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Max-Age": "600",
    });
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

/* Auth: viewing is public. Changing photos needs ADMIN_KEY when one is set.
   In production with no ADMIN_KEY, changing is switched off (read-only). */
const ADMIN_KEY = process.env.ADMIN_KEY?.trim() ?? "";
const readOnly = IS_PROD && !ADMIN_KEY;
if (readOnly) console.warn("[security] No ADMIN_KEY set in production: uploads are disabled (read-only).");
const safeEqual = (a, b) => {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};
const MAX_FAILS = 10;
const LOCK_MS = 15 * 60 * 1000;
const failures = new Map();
const isAdmin = (req) => {
  if (readOnly) return false;
  if (!ADMIN_KEY) return true; // local use
  const sent = req.get("x-admin-key");
  if (!sent) return false;
  const now = Date.now();
  const r = failures.get(req.ip);
  if (r && r.resetAt > now && r.count >= MAX_FAILS) return false;
  const ok = safeEqual(String(sent), ADMIN_KEY);
  if (!ok) {
    if (!r || r.resetAt <= now) failures.set(req.ip, { count: 1, resetAt: now + LOCK_MS });
    else r.count++;
  }
  return ok;
};
const requireAdmin = (req, res, next) => {
  if (isAdmin(req)) return next();
  res.status(readOnly ? 403 : 401).json({ error: readOnly ? "Uploads are disabled on this server." : "Admin key required." });
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } });
const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, adminProtected: Boolean(ADMIN_KEY), isAdmin: isAdmin(req), canUpload: !readOnly, maxUploadMb: MAX_BYTES / 1024 / 1024 });
});

app.get("/api/slots", handle(async (_req, res) => res.json(await slots.list())));

app.put("/api/slots/:n/:kind", requireAdmin, upload.single("photo"), handle(async (req, res) => {
  if (!req.file) throw new SlotError("Choose an image file first.");
  res.json(await slots.save(req.params.n, req.params.kind, req.file.buffer));
}));

app.delete("/api/slots/:n/:kind", requireAdmin, handle(async (req, res) => {
  res.json(await slots.clear(req.params.n, req.params.kind));
}));

app.patch("/api/slots/:n", requireAdmin, handle(async (req, res) => {
  res.json(await slots.setCaption(req.params.n, req.body?.caption));
}));

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

/* Static: the photos folder (always fresh), then the built site when it exists */
app.use("/photos", (req, res, next) => {
  res.set("Cache-Control", req.path.endsWith("manifest.json") ? "no-store" : "public, max-age=3600");
  next();
}, express.static(photosDir, { index: false, fallthrough: false }));
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.status === 404 && !(err instanceof SlotError)) return res.status(404).end();
  if (err instanceof SlotError) return res.status(err.status).json({ error: err.message });
  if (err?.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: `That image is over ${MAX_BYTES / 1024 / 1024} MB.` });
  if (err?.name === "MulterError") return res.status(400).json({ error: "The upload could not be read." });
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") return res.status(400).json({ error: "The request body could not be read." });
  console.error("[server] error:", err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const server = app.listen(PORT, () => {
  console.log(`\n  Muskan API  →  http://localhost:${PORT}`);
  console.log(`  Photos      →  ${photosDir}`);
  console.log("  No AI or API keys are used. Photos are only the files you upload.\n");
});
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
