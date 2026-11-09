
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "../animations/random";

/**
 * Premium semi-realistic anime textures for Ajay and Muskan.
 * Procedurally generated locally. No AI API or external images required.
 */
const cache = new Map<string, CanvasTexture>();

function make(
  key: string,
  w: number,
  h: number,
  repeat: [number, number],
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
): CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;

  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Unable to create texture canvas");

  draw(ctx, w, h);

  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;

  cache.set(key, texture);
  return texture;
}

interface HairOpts {
  wavy?: boolean;
  part?: boolean;
  band?: number;
}

/** Detailed anime hair with layered strands and cinematic highlights. */
export const hairTexture = (
  id: string,
  base: string,
  mid: string,
  light: string,
  o: HairOpts = {},
) =>
  make(`hair-${id}`, 512, 512, [1, 1], (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);

    const random = mulberry32(7 + id.length);

    // Soft natural hair shading
    const shade = g.createLinearGradient(0, 0, w, h);
    shade.addColorStop(0, "rgba(255,255,255,0.12)");
    shade.addColorStop(0.45, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.3)");
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);

    // Fine flowing hair strands
    for (let i = 0; i < 700; i++) {
      const x = random() * w;
      const phase = random() * Math.PI * 2;
      const amplitude = o.wavy ? 7 + random() * 15 : 2 + random() * 3;

      g.beginPath();
      g.moveTo(x, 0);

      for (let y = 0; y <= h; y += 8) {
        const curve =
          x + Math.sin(y * 0.018 + phase) * amplitude;

        g.lineTo(curve, y);
      }

      const tone = random();
      g.strokeStyle = tone < 0.55 ? mid : light;
      g.globalAlpha = 0.12 + random() * 0.3;
      g.lineWidth = 0.5 + random() * 1.5;
      g.stroke();
    }

    g.globalAlpha = 1;

    // Long anime-style highlights
    for (let i = 0; i < 18; i++) {
      const x = random() * w;
      const gradient = g.createLinearGradient(x, 0, x + 12, h);

      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.45, "rgba(255,255,255,0.16)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      g.strokeStyle = gradient;
      g.lineWidth = 2 + random() * 4;
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(
        x + 20, h * 0.3,
        x - 15, h * 0.7,
        x + 5, h,
      );
      g.stroke();
    }

    // Soft cinematic shine
    const band = o.band ?? 0.4;
    const highlight = g.createLinearGradient(
      0,
      h * (band - 0.15),
      0,
      h * (band + 0.15),
    );

    highlight.addColorStop(0, "rgba(255,255,255,0)");
    highlight.addColorStop(0.5, "rgba(255,255,255,0.2)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");

    g.fillStyle = highlight;
    g.fillRect(0, h * (band - 0.15), w, h * 0.3);

    if (o.part) {
      g.strokeStyle = "rgba(205,175,160,0.85)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(w * 0.25, 0);
      g.lineTo(w * 0.25, h * 0.75);
      g.stroke();
    }
  });

/** Smoky charcoal-grey skirt with fine silver floral embroidery. */
export const floralSkirt = () =>
  make("skirt", 512, 512, [3, 1], (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#302d36");
    gradient.addColorStop(0.45, "#77717e");
    gradient.addColorStop(1, "#24212b");

    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);

    const random = mulberry32(21);

    // Fine fabric folds
    for (let i = 0; i < 45; i++) {
      const x = random() * w;
      const fold = g.createLinearGradient(x, 0, x + 18, 0);
      fold.addColorStop(0, "rgba(255,255,255,0)");
      fold.addColorStop(0.5, "rgba(255,255,255,0.07)");
      fold.addColorStop(1, "rgba(0,0,0,0.12)");

      g.fillStyle = fold;
      g.fillRect(x, 0, 18, h);
    }

    // Delicate floral embroidery
    for (let i = 0; i < 65; i++) {
      const x = random() * w;
      const y = random() * h;
      const size = 3 + random() * 5;

      g.strokeStyle = "#c9c2d0";
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(
        x + 12,
        y - 15,
        x + 18,
        y - 25,
      );
      g.stroke();

      for (let k = 0; k < 5; k++) {
        const angle = (k * Math.PI * 2) / 5;

        g.fillStyle = "#d4c9dc";
        g.beginPath();
        g.ellipse(
          x + Math.cos(angle) * size,
          y + Math.sin(angle) * size,
          size * 0.45,
          size * 0.8,
          angle,
          0,
          Math.PI * 2,
        );
        g.fill();
      }

      g.fillStyle = "#e5c98e";
      g.beginPath();
      g.arc(x, y, size * 0.3, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Black blouse with subtle pearl and gold floral details. */
export const blouseTexture = () =>
  make("blouse", 512, 256, [2, 1], (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#100e15");
    gradient.addColorStop(0.5, "#28232e");
    gradient.addColorStop(1, "#15121a");

    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);

    const random = mulberry32(5);

    // Subtle textile texture
    for (let i = 0; i < 1600; i++) {
      g.fillStyle =
        random() > 0.5
          ? "rgba(255,255,255,0.035)"
          : "rgba(0,0,0,0.07)";

      g.fillRect(random() * w, random() * h, 1, 1);
    }

    // Pearl and gold embroidery
    for (let i = 0; i < 60; i++) {
      const x = random() * w;
      const y = random() * h;

      for (let k = 0; k < 5; k++) {
        const angle = (k * Math.PI * 2) / 5;

        g.fillStyle = "#e8d8bf";
        g.beginPath();
        g.arc(
          x + Math.cos(angle) * 4,
          y + Math.sin(angle) * 4,
          1.8,
          0,
          Math.PI * 2,
        );
        g.fill();
      }

      g.fillStyle = "#c9a45a";
      g.beginPath();
      g.arc(x, y, 1.6, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Premium washed denim with realistic diagonal twill. */
export const denimTexture = () =>
  make("denim", 512, 512, [2, 2], (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#7897c0");
    gradient.addColorStop(0.5, "#a1b7d6");
    gradient.addColorStop(1, "#607fa8");

    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);

    const random = mulberry32(13);

    // Diagonal denim weave
    for (let i = 0; i < 3500; i++) {
      const x = random() * w;
      const y = random() * h;

      g.strokeStyle =
        random() < 0.5
          ? "rgba(255,255,255,0.12)"
          : "rgba(30,50,85,0.12)";

      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 5, y + 5);
      g.stroke();
    }

    // Soft washed highlights
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(255,255,255,${0.015 + random() * 0.035})`;
      g.beginPath();
      g.ellipse(
        random() * w,
        random() * h,
        15 + random() * 30,
        5 + random() * 15,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });

/** Cream shirt with clean red and navy stripes. */
export const stripedTee = () =>
  make("tee", 256, 512, [1, 1], (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "#d9ceb8");
    gradient.addColorStop(0.5, "#f4ead8");
    gradient.addColorStop(1, "#d7cbb5");

    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);

    for (let y = 12; y < h; y += 36) {
      g.fillStyle = "#a8333d";
      g.fillRect(0, y, w, 4);

      g.fillStyle = "#2f3860";
      g.fillRect(0, y + 11, w, 3);
    }

    // Fine fabric grain
    const random = mulberry32(31);

    for (let i = 0; i < 1200; i++) {
      g.fillStyle =
        random() > 0.5
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.035)";

      g.fillRect(random() * w, random() * h, 1, 1);
    }
  });
