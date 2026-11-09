/**
 * Detects the real image type (by magic bytes, not by the client-supplied
 * MIME type) and reads pixel dimensions from the file header.
 * Supports JPEG, PNG and WebP.
 */
export function inspectImage(buf) {
  if (buf.length < 16) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A, IHDR width/height at 16/20
  if (buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a) {
    return { mime: "image/png", ext: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: FF D8, then scan markers for a SOF segment
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xff) { i++; continue; }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSOF) {
        return { mime: "image/jpeg", ext: "jpg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return { mime: "image/jpeg", ext: "jpg", width: 0, height: 0 };
  }

  // WebP: "RIFF"....."WEBP"
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const kind = buf.toString("ascii", 12, 16);
    let width = 0, height = 0;
    if (kind === "VP8X") {
      width = 1 + buf.readUIntLE(24, 3);
      height = 1 + buf.readUIntLE(27, 3);
    } else if (kind === "VP8L") {
      const b = buf.readUInt32LE(21);
      width = 1 + (b & 0x3fff);
      height = 1 + ((b >> 14) & 0x3fff);
    } else if (kind === "VP8 ") {
      width = buf.readUInt16LE(26) & 0x3fff;
      height = buf.readUInt16LE(28) & 0x3fff;
    }
    return { mime: "image/webp", ext: "webp", width, height };
  }

  return null;
}
