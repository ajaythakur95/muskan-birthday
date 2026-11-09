// Run with: npm test   (Node's built-in test runner, no extra dependencies)
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { inspectImage } from "../server/lib/imageInfo.mjs";
import { createSlots, SlotError } from "../server/lib/slots.mjs";

const tmp = () => mkdtemp(path.join(os.tmpdir(), "muskan-"));

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]), Buffer.from([0, 0, 2, 0, 0, 0, 1, 0x90]), Buffer.alloc(8)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 1, 0x90, 2, 0x00, 3]), Buffer.alloc(40)]);

const slot = (m, n) => m.slots.find((s) => s.n === n);

test("inspectImage trusts bytes, not file names", () => {
  assert.deepEqual(inspectImage(PNG), { mime: "image/png", ext: "png", width: 512, height: 400 });
  assert.equal(inspectImage(JPG).ext, "jpg");
  assert.equal(inspectImage(Buffer.from("<?php echo 1; ?> not an image at all.....")), null);
  assert.equal(inspectImage(Buffer.from("GIF89a" + "0".repeat(30))), null);
});

test("slots: starts with 10 empty pairs", async () => {
  const s = createSlots(await tmp());
  const m = await s.init();
  assert.equal(m.slots.length, 10);
  assert.ok(m.slots.every((x) => x.original === null && x.anime === null));
});

test("slots: original and anime are stored separately under the same number (pairing)", async () => {
  const dir = await tmp();
  const s = createSlots(dir);
  await s.init();
  await s.save(3, "original", PNG);
  const m = await s.save(3, "anime", JPG);
  assert.equal(slot(m, 3).original.file, "03.png");
  assert.equal(slot(m, 3).anime.file, "03.jpg");
  assert.equal(slot(m, 4).original, null);
  assert.deepEqual(await readdir(path.join(dir, "original")), ["03.png"]);
  assert.deepEqual(await readdir(path.join(dir, "anime")), ["03.jpg"]);
  assert.deepEqual(JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8")), m);
});

test("slots: replacing removes the old file and bumps the cache version", async () => {
  const dir = await tmp();
  const s = createSlots(dir);
  const first = slot(await s.save(1, "original", PNG), 1).original;
  await new Promise((r) => setTimeout(r, 5));
  const second = slot(await s.save(1, "original", JPG), 1).original;
  assert.equal(second.file, "01.jpg");
  assert.notEqual(second.v, first.v);
  assert.deepEqual(await readdir(path.join(dir, "original")), ["01.jpg"]);
});

test("slots: rejects non-images, bad slots and bad kinds; keeps files exact", async () => {
  const s = createSlots(await tmp());
  await assert.rejects(s.save(1, "original", Buffer.from("not an image at all, just text")), (e) => e instanceof SlotError && e.status === 415);
  await assert.rejects(s.save(11, "original", PNG), SlotError);
  await assert.rejects(s.save(0, "anime", PNG), SlotError);
  await assert.rejects(s.save(1, "cartoon", PNG), SlotError);
});

test("slots: clear removes only that side", async () => {
  const dir = await tmp();
  const s = createSlots(dir);
  await s.save(2, "original", PNG);
  await s.save(2, "anime", PNG);
  const m = await s.clear(2, "anime");
  assert.ok(slot(m, 2).original);
  assert.equal(slot(m, 2).anime, null);
});

test("slots: files dropped in by hand are picked up; stray names ignored", async () => {
  const dir = await tmp();
  await mkdir(path.join(dir, "original"), { recursive: true });
  await mkdir(path.join(dir, "anime"), { recursive: true });
  await writeFile(path.join(dir, "original", "07.jpg"), JPG);
  await writeFile(path.join(dir, "anime", "07.webp"), PNG);
  await writeFile(path.join(dir, "anime", "99.jpg"), PNG);
  await writeFile(path.join(dir, "original", "notes.txt"), "hi");
  const m = await createSlots(dir).init();
  assert.equal(slot(m, 7).original.file, "07.jpg");
  assert.equal(slot(m, 7).anime.file, "07.webp");
  assert.equal(m.slots.filter((x) => x.original || x.anime).length, 1);
});

test("slots: captions are saved, trimmed, and survive uploads and restarts", async () => {
  const dir = await tmp();
  const s = createSlots(dir);
  await s.setCaption(5, "  Chai   and   chaos  ");
  await s.save(5, "original", PNG);
  const m = await createSlots(dir).list();
  assert.equal(slot(m, 5).caption, "Chai and chaos");
  assert.ok(slot(m, 5).original);
  await assert.rejects(s.setCaption(5, 42), SlotError);
});
