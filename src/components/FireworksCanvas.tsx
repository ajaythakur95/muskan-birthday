import { useEffect, useRef } from "react";
import { sfx } from "../audio/sfx";

const COLORS = ["#ff9ccf", "#ffd1e3", "#d9c8ff", "#b9a2ff", "#ffe08a", "#ffffff", "#9fd8ff"];

interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string }
interface Rocket { x: number; y: number; vy: number; ty: number; color: string }

/** Lightweight 2D canvas fireworks (rockets + sparkle bursts) for the final screen. No dependencies. */
export default function FireworksCanvas({ sound = true }: { sound?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const perBurst = mobile ? 38 : 70;
    let w = 0, h = 0, raf = 0, last = performance.now(), timer = 0.3;
    const sparks: Spark[] = [];
    const rockets: Rocket[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const burst = (x: number, y: number, color: string) => {
      const alt = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < perBurst; i++) {
        const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 150;
        const max = 1.1 + Math.random() * 1.1;
        sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: max, max, color: i % 3 === 0 ? alt : color });
      }
      if (sound) sfx.play("firework");
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Fade the previous frame toward transparent (leaves glowing trails).
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      timer -= dt;
      if (timer <= 0) {
        rockets.push({ x: w * (0.12 + Math.random() * 0.76), y: h, vy: -(h * (0.9 + Math.random() * 0.3)), ty: h * (0.12 + Math.random() * 0.36), color: COLORS[Math.floor(Math.random() * COLORS.length)] });
        timer = 0.5 + Math.random() * 0.8;
      }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy * dt;
        ctx.fillStyle = "#fff3cf";
        ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, 7); ctx.fill();
        if (r.y <= r.ty) { burst(r.x, r.y, r.color); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        p.vy += 70 * dt;
        p.vx *= Math.pow(0.4, dt); p.vy *= Math.pow(0.6, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = Math.max(p.life / p.max, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      // One gentle static burst instead of continuous motion.
      burst(w * 0.3, h * 0.28, COLORS[0]);
      burst(w * 0.7, h * 0.22, COLORS[2]);
      sparks.forEach((p) => { p.life = p.max = 1; });
    } else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [sound]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full" />;
}
