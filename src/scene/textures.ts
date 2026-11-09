import { CanvasTexture, SRGBColorSpace } from "three";

let soft: CanvasTexture | null = null;

/** A soft white dot (radial gradient) used for sparks, smoke and blob shadows. Created once. */
export function softDotTexture(): CanvasTexture {
  if (soft) return soft;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  soft = new CanvasTexture(c);
  soft.colorSpace = SRGBColorSpace;
  return soft;
}
