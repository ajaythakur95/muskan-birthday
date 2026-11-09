import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, MathUtils, Object3D,
  type Group, type InstancedMesh, type Points, type Sprite, type Vector3,
} from "three";
import type { Sim } from "./layout";
import { softDotTexture } from "./textures";

const PASTELS = ["#ffb6d3", "#f78fbb", "#d9c8ff", "#b9a2ff", "#fff2e0", "#ffe08a", "#bfe6ff", "#ffffff"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* ───────────────────────── Confetti ───────────────────────── */

export interface ConfettiHandle {
  fire: (origin: Vector3, count?: number, power?: number) => void;
}

/** One InstancedMesh = one draw call for every paper piece. */
export const Confetti = forwardRef<ConfettiHandle, { max: number }>(function Confetti({ max }, ref) {
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const d = useMemo(
    () => ({
      pos: new Float32Array(max * 3), vel: new Float32Array(max * 3),
      rot: new Float32Array(max * 3), spin: new Float32Array(max * 3),
      life: new Float32Array(max), cursor: 0, active: false,
    }),
    [max],
  );

  useLayoutEffect(() => {
    const m = mesh.current!;
    const c = new Color();
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < max; i++) {
      c.set(PASTELS[i % PASTELS.length]);
      m.setColorAt(i, c);
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [max, dummy]);

  useImperativeHandle(ref, () => ({
    fire(origin, count = Math.floor(max * 0.6), power = 1) {
      for (let k = 0; k < count; k++) {
        const i = d.cursor;
        d.cursor = (i + 1) % max;
        const a = Math.random() * Math.PI * 2;
        const sp = rand(1.2, 4.2) * power;
        d.pos.set([origin.x + rand(-0.15, 0.15), origin.y, origin.z + rand(-0.15, 0.15)], i * 3);
        d.vel.set([Math.cos(a) * sp, rand(3.5, 8.5) * power, Math.sin(a) * sp], i * 3);
        d.rot.set([rand(0, 6), rand(0, 6), rand(0, 6)], i * 3);
        d.spin.set([rand(-9, 9), rand(-9, 9), rand(-9, 9)], i * 3);
        d.life[i] = rand(3, 5.2);
      }
      d.active = true;
    },
  }));

  useFrame((_, delta) => {
    if (!d.active) return;
    const dt = Math.min(delta, 0.05);
    const m = mesh.current!;
    let any = false;
    for (let i = 0; i < max; i++) {
      if (d.life[i] <= 0) continue;
      any = true;
      d.life[i] -= dt;
      const i3 = i * 3;
      // Paper flutters: gravity with strong air drag so it drifts down slowly.
      d.vel[i3 + 1] -= 9 * dt;
      const drag = Math.pow(0.12, dt);
      d.vel[i3] *= drag;
      d.vel[i3 + 2] *= drag;
      d.vel[i3 + 1] = Math.max(d.vel[i3 + 1] * Math.pow(0.5, dt), -1.6);
      d.pos[i3] += d.vel[i3] * dt;
      d.pos[i3 + 1] += d.vel[i3 + 1] * dt;
      d.pos[i3 + 2] += d.vel[i3 + 2] * dt;
      const onFloor = d.pos[i3 + 1] <= 0.02;
      if (onFloor) { d.pos[i3 + 1] = 0.02; d.vel[i3] = d.vel[i3 + 1] = d.vel[i3 + 2] = 0; }
      for (let a = 0; a < 3; a++) d.rot[i3 + a] += d.spin[i3 + a] * dt * (onFloor ? 0 : 1);
      dummy.position.set(d.pos[i3], d.pos[i3 + 1], d.pos[i3 + 2]);
      dummy.rotation.set(d.rot[i3], d.rot[i3 + 1], d.rot[i3 + 2]);
      dummy.scale.setScalar(Math.min(1, d.life[i] / 0.6));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (d.life[i] <= 0) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    d.active = any;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, max]} frustumCulled={false}>
      <planeGeometry args={[0.1, 0.055]} />
      <meshBasicMaterial side={DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
});

/* ───────────────────────── Fireworks ───────────────────────── */

interface FireworksProps {
  sim: Sim;
  center: Vector3;
  bursts: number;
  perBurst: number;
  /** Called when a rocket explodes (used for the boom sound). */
  onBurst?: () => void;
}

/** A pool of additive spark particles; bursts launch while `sim.fireworks` is true. */
export function Fireworks({ sim, center, bursts, perBurst, onBurst }: FireworksProps) {
  const total = bursts * perBurst;
  const points = useRef<Points>(null);
  const dot = useMemo(() => softDotTexture(), []);
  const s = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(total * 3).fill(-999);
    const col = new Float32Array(total * 3);
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    geo.setAttribute("color", new BufferAttribute(col, 3));
    return {
      geo, pos, col, base: new Float32Array(total * 3), vel: new Float32Array(total * 3),
      life: new Float32Array(total), next: 0, timer: 0.2,
      rockets: [] as { slot: number; t: number; cx: number; cy: number; cz: number }[],
    };
  }, [total]);

  useLayoutEffect(() => () => s.geo.dispose(), [s]);

  /** Sends a glowing rocket up first; it explodes into the burst when it reaches the top. */
  const launch = () => {
    const slot = s.next;
    s.next = (slot + 1) % bursts;
    s.rockets = s.rockets.filter((r) => r.slot !== slot);
    s.rockets.push({ slot, t: 0, cx: center.x + rand(-4.5, 4.5), cy: rand(3.2, 5.6), cz: center.z - rand(3, 6) });
  };

  const explode = (slot: number, cx: number, cy: number, cz: number) => {
    const c1 = new Color(PASTELS[Math.floor(rand(0, 6))]);
    const c2 = new Color(PASTELS[Math.floor(rand(0, 8))]);
    for (let j = 0; j < perBurst; j++) {
      const i = slot * perBurst + j, i3 = i * 3;
      // Uniform direction on a sphere.
      const u = rand(-1, 1), a = rand(0, Math.PI * 2), r = Math.sqrt(1 - u * u);
      const speed = rand(1.6, 3.6);
      s.vel[i3] = r * Math.cos(a) * speed;
      s.vel[i3 + 1] = u * speed;
      s.vel[i3 + 2] = r * Math.sin(a) * speed;
      s.pos[i3] = cx; s.pos[i3 + 1] = cy; s.pos[i3 + 2] = cz;
      const c = j % 3 === 0 ? c2 : c1;
      s.base[i3] = c.r; s.base[i3 + 1] = c.g; s.base[i3 + 2] = c.b;
      s.life[i] = rand(1.5, 2.4);
    }
    onBurst?.();
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (sim.fireworks) {
      s.timer -= dt;
      if (s.timer <= 0) { launch(); s.timer = rand(0.45, 0.95); }
    }
    let any = false;
    // Rockets: one bright spark climbing (particle 0 of the slot) until it bursts.
    for (let k = s.rockets.length - 1; k >= 0; k--) {
      const r = s.rockets[k];
      r.t += dt;
      const i = r.slot * perBurst, i3 = i * 3;
      const p = Math.min(r.t / 0.75, 1);
      const e = 1 - Math.pow(1 - p, 2);
      s.pos[i3] = r.cx; s.pos[i3 + 1] = 0.3 + (r.cy - 0.3) * e; s.pos[i3 + 2] = r.cz;
      s.base[i3] = 1; s.base[i3 + 1] = 0.9; s.base[i3 + 2] = 0.65;
      s.vel[i3] = s.vel[i3 + 1] = s.vel[i3 + 2] = 0;
      s.life[i] = 1;
      any = true;
      if (p >= 1) {
        s.rockets.splice(k, 1);
        explode(r.slot, r.cx, r.cy, r.cz);
      }
    }
    const drag = Math.pow(0.35, dt);
    for (let i = 0; i < total; i++) {
      const i3 = i * 3;
      if (s.rockets.length && i % perBurst === 0 && s.rockets.some((r) => r.slot * perBurst === i)) {
        s.col[i3] = s.base[i3]; s.col[i3 + 1] = s.base[i3 + 1]; s.col[i3 + 2] = s.base[i3 + 2];
        continue;
      }
      if (s.life[i] <= 0) {
        if (s.col[i3] !== 0 || s.col[i3 + 1] !== 0 || s.col[i3 + 2] !== 0) { s.col[i3] = s.col[i3 + 1] = s.col[i3 + 2] = 0; any = true; }
        continue;
      }
      any = true;
      s.life[i] -= dt;
      s.vel[i3 + 1] -= 1.8 * dt;
      s.vel[i3] *= drag; s.vel[i3 + 1] *= drag; s.vel[i3 + 2] *= drag;
      s.pos[i3] += s.vel[i3] * dt; s.pos[i3 + 1] += s.vel[i3 + 1] * dt; s.pos[i3 + 2] += s.vel[i3 + 2] * dt;
      const fade = MathUtils.clamp(s.life[i] / 0.9, 0, 1);
      s.col[i3] = s.base[i3] * fade; s.col[i3 + 1] = s.base[i3 + 1] * fade; s.col[i3 + 2] = s.base[i3 + 2] * fade;
    }
    if (any) {
      s.geo.attributes.position.needsUpdate = true;
      s.geo.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={points} geometry={s.geo} frustumCulled={false}>
      <pointsMaterial
        map={dot} size={0.26} sizeAttenuation vertexColors transparent depthWrite={false}
        blending={AdditiveBlending} toneMapped={false}
      />
    </points>
  );
}

/* ───────────────────────── Smoke ───────────────────────── */

export interface SmokeHandle {
  puff: (at: Vector3) => void;
}

/** A small pool of soft sprites that rise, grow and fade — candle smoke. */
export const Smoke = forwardRef<SmokeHandle, { count: number }>(function Smoke({ count }, ref) {
  const sprites = useRef<Sprite[]>([]);
  const dot = useMemo(() => softDotTexture(), []);
  const st = useMemo(
    () => ({ life: new Float32Array(count), max: new Float32Array(count), vx: new Float32Array(count), cursor: 0 }),
    [count],
  );

  useImperativeHandle(ref, () => ({
    puff(at) {
      for (let k = 0; k < 3; k++) {
        const i = st.cursor;
        st.cursor = (i + 1) % count;
        const sp = sprites.current[i];
        if (!sp) continue;
        sp.position.set(at.x + rand(-0.02, 0.02), at.y + k * 0.03, at.z + rand(-0.02, 0.02));
        st.life[i] = st.max[i] = rand(1.6, 2.6);
        st.vx[i] = rand(0.05, 0.22);
        sp.visible = true;
      }
    },
  }));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const sp = sprites.current[i];
      if (!sp || st.life[i] <= 0) continue;
      st.life[i] -= dt;
      const k = 1 - st.life[i] / st.max[i];
      sp.position.y += (0.35 - k * 0.15) * dt;
      sp.position.x += st.vx[i] * dt;
      sp.scale.setScalar(0.08 + k * 0.4);
      (sp.material as { opacity: number }).opacity = (1 - k) * 0.5;
      if (st.life[i] <= 0) sp.visible = false;
    }
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <sprite key={i} ref={(o) => { if (o) sprites.current[i] = o; }} visible={false} renderOrder={4}>
          <spriteMaterial map={dot} color="#d8d2e6" transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
});

/* ───────────────────────── Balloons ───────────────────────── */

const BALLOON_COLORS = ["#ffb6d3", "#d9c8ff", "#fff2e0", "#f78fbb", "#b9a2ff", "#ffd9a8", "#bfe6ff", "#ffc4dc"];

interface BalloonsProps {
  sim: Sim;
  center: Vector3;
  count: number;
}

/** Balloons launch from the floor behind the cake when `sim.balloonsStart` is set. */
export function Balloons({ sim, center, count }: BalloonsProps) {
  const groups = useRef<Group[]>([]);
  const cfg = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        x: center.x + (i / Math.max(count - 1, 1) - 0.5) * 9 + rand(-0.5, 0.5),
        z: center.z - rand(1.2, 3.2),
        top: rand(2.3, 4.4),
        delay: i * 0.18 + rand(0, 0.2),
        phase: rand(0, 6.28),
        size: rand(0.85, 1.15),
      })),
    [count, center],
  );

  useFrame(() => {
    const now = performance.now() / 1000;
    cfg.forEach((c, i) => {
      const g = groups.current[i];
      if (!g) return;
      const t = sim.balloonsStart < 0 ? -1 : now - sim.balloonsStart - c.delay;
      if (t < 0) { g.visible = false; return; }
      g.visible = true;
      const k = MathUtils.clamp(t / 3.4, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const bob = k >= 1 ? Math.sin(now * 1.1 + c.phase) * 0.12 : 0;
      g.position.set(c.x + Math.sin(now * 0.8 + c.phase) * 0.14, 0.3 + (c.top - 0.3) * e + bob, c.z);
      g.rotation.z = Math.sin(now * 0.9 + c.phase) * 0.07;
      g.scale.setScalar(Math.min(1, t * 2.5) * c.size);
    });
  });

  return (
    <group>
      {cfg.map((c, i) => (
        <group key={i} ref={(o) => { if (o) groups.current[i] = o; }} visible={false}>
          <mesh scale={[1, 1.2, 1]}>
            <sphereGeometry args={[0.32, 24, 18]} />
            <meshStandardMaterial color={c.color} roughness={0.22} metalness={0.05} />
          </mesh>
          <mesh position={[-0.1, 0.17, 0.24]} scale={[0.6, 1, 0.4]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshBasicMaterial color="#fff" transparent opacity={0.65} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <coneGeometry args={[0.045, 0.07, 10]} />
            <meshStandardMaterial color={c.color} roughness={0.3} />
          </mesh>
          <mesh position={[0, -1.15, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 1.5, 4]} />
            <meshBasicMaterial color="#fff6ea" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── Floor ───────────────────────── */

/** A big, very soft pastel disc that fades to nothing at the edge, so the world has a ground. */
export function Floor() {
  const dot = useMemo(() => softDotTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0, 1]} renderOrder={0}>
      <planeGeometry args={[34, 34]} />
      <meshBasicMaterial map={dot} color="#fff3f8" transparent opacity={0.95} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
