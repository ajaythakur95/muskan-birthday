import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Vector3, type Group, type Mesh, type PointLight } from "three";
import { CAKE_TO_GIRL } from "./layout";
import { softDotTexture } from "./textures";

export interface CakeParts {
  root: Group;
  flames: Group[];
  light: PointLight;
  knifeTable: Group;
  wedge: Group;
  /** Swap the whole cake for "cake with a slice missing" — called at the instant the knife cuts. */
  reveal: () => void;
  candleTops: Vector3[];
}

interface BirthdayCakeProps {
  parts: MutableRefObject<CakeParts | null>;
}

const TABLE_H = 0.55;
const PLATE_H = 0.03;
const T0 = { r: 0.6, h: 0.3, color: "#ffc4dc" };
const T1 = { r: 0.42, h: 0.26, color: "#fff2e0" };
const T2 = { r: 0.27, h: 0.22, color: "#d9c8ff" };
const Y0 = TABLE_H + PLATE_H; // bottom of tier 0
const Y1 = Y0 + T0.h;
const Y2 = Y1 + T1.h;
const TOP = Y2 + T2.h;
const CANDLE_H = 0.2;
const CANDLE_COLORS = ["#ffd1e3", "#d9c8ff", "#fff2e0", "#ffc4dc", "#cfe8ff"];

/** Direction of the slice (angle around Y, in three's cylinder convention: x = sinθ, z = cosθ). */
const SLICE_CENTER = Math.atan2(CAKE_TO_GIRL.x, CAKE_TO_GIRL.z);
const SLICE_LEN = 0.6;
const SLICE_START = SLICE_CENTER - SLICE_LEN / 2;

/** The knife lies tangent to the table edge on the girl's side. */
const KNIFE_YAW = Math.atan2(-CAKE_TO_GIRL.x, -CAKE_TO_GIRL.z);

export const CANDLE_LOCAL: Vector3[] = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 + 0.4;
  return new Vector3(Math.sin(a) * 0.14, TOP + CANDLE_H, Math.cos(a) * 0.14);
});

/** A radial cut face, standing vertically at angle θ from the cake's centre. */
function CutFace({ theta, r, y, h }: { theta: number; r: number; y: number; h: number }) {
  return (
    <mesh position={[(r / 2) * Math.sin(theta), y, (r / 2) * Math.cos(theta)]} rotation={[0, theta - Math.PI / 2, 0]}>
      <planeGeometry args={[r, h]} />
      <meshStandardMaterial color="#fff0d2" roughness={0.9} side={DoubleSide} />
    </mesh>
  );
}

export default function BirthdayCake({ parts }: BirthdayCakeProps) {
  const root = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const knifeTable = useRef<Group>(null);
  const wedge = useRef<Group>(null);
  const fullTier = useRef<Mesh>(null);
  const cutGroup = useRef<Group>(null);
  const flames = useRef<Group[]>([]);
  const flameMeshes = useRef<Mesh[]>([]);
  const dot = useMemo(() => softDotTexture(), []);

  useLayoutEffect(() => {
    parts.current = {
      root: root.current!,
      flames: flames.current,
      light: light.current!,
      knifeTable: knifeTable.current!,
      wedge: wedge.current!,
      candleTops: CANDLE_LOCAL,
      reveal: () => {
        fullTier.current!.visible = false;
        cutGroup.current!.visible = true;
        wedge.current!.visible = true;
      },
    };
    // Flames start unlit; the slice pieces start hidden until the cut.
    flames.current.forEach((f) => f.scale.setScalar(0.001));
    cutGroup.current!.visible = false;
    wedge.current!.visible = false;
    return () => {
      parts.current = null;
    };
  }, [parts]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flameMeshes.current.forEach((m, i) => {
      if (!m) return;
      m.scale.set(0.55 + Math.sin(t * 13 + i) * 0.06, 1.1 + Math.sin(t * 9 + i * 2) * 0.14, 0.55);
    });
  });

  return (
    <group ref={root}>
      {/* Table */}
      <mesh position={[0, TABLE_H / 2, 0]}>
        <cylinderGeometry args={[0.9, 0.9, TABLE_H, 48]} />
        <meshStandardMaterial color="#fff6ea" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.06, 48]} />
        <meshStandardMaterial color="#d9c8ff" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial map={dot} color="#3b2466" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh position={[0, TABLE_H + PLATE_H / 2, 0]}>
        <cylinderGeometry args={[0.74, 0.74, PLATE_H, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.15} />
      </mesh>

      {/* Tier 0 — whole, until the cut */}
      <mesh ref={fullTier} position={[0, Y0 + T0.h / 2, 0]}>
        <cylinderGeometry args={[T0.r, T0.r, T0.h, 56]} />
        <meshStandardMaterial color={T0.color} roughness={0.55} />
      </mesh>
      {/* Tier 0 — after the cut: the cake minus a wedge, with visible cut faces */}
      <group ref={cutGroup}>
        <mesh position={[0, Y0 + T0.h / 2, 0]}>
          <cylinderGeometry args={[T0.r, T0.r, T0.h, 56, 1, false, SLICE_START + SLICE_LEN, Math.PI * 2 - SLICE_LEN]} />
          <meshStandardMaterial color={T0.color} roughness={0.55} side={DoubleSide} />
        </mesh>
        <CutFace theta={SLICE_START} r={T0.r} y={Y0 + T0.h / 2} h={T0.h} />
        <CutFace theta={SLICE_START + SLICE_LEN} r={T0.r} y={Y0 + T0.h / 2} h={T0.h} />
      </group>
      {/* The slice: hidden until the cut, then slides out toward the girl */}
      <group ref={wedge}>
        <mesh position={[0, Y0 + T0.h / 2, 0]}>
          <cylinderGeometry args={[T0.r, T0.r, T0.h, 24, 1, false, SLICE_START, SLICE_LEN]} />
          <meshStandardMaterial color={T0.color} roughness={0.55} side={DoubleSide} />
        </mesh>
        <mesh position={[0, Y0 + T0.h / 2, 0]} scale={[0.999, 1, 0.999]}>
          <cylinderGeometry args={[T0.r, T0.r, 0.012, 24, 1, false, SLICE_START, SLICE_LEN]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} side={DoubleSide} />
        </mesh>
      </group>

      {/* Tier 1 + 2 */}
      <mesh position={[0, Y1 + T1.h / 2, 0]}>
        <cylinderGeometry args={[T1.r, T1.r, T1.h, 48]} />
        <meshStandardMaterial color={T1.color} roughness={0.5} />
      </mesh>
      <mesh position={[0, Y1 + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[T1.r, 0.025, 10, 56]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, Y2 + T2.h / 2, 0]}>
        <cylinderGeometry args={[T2.r, T2.r, T2.h, 40]} />
        <meshStandardMaterial color={T2.color} roughness={0.5} />
      </mesh>
      <mesh position={[0, Y2 + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[T2.r, 0.022, 10, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* Strawberries around tier 1 */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <group key={i} position={[Math.sin(a) * 0.35, Y2 + 0.035, Math.cos(a) * 0.35]}>
            <mesh scale={[1, 1.15, 1]}>
              <sphereGeometry args={[0.04, 14, 12]} />
              <meshStandardMaterial color="#ff5f86" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.045, 0]}>
              <coneGeometry args={[0.022, 0.025, 6]} />
              <meshStandardMaterial color="#6ac28a" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      {/* Top cherry-heart topper */}
      <mesh position={[0, TOP + 0.03, 0]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshStandardMaterial color="#ff4f7f" roughness={0.3} />
      </mesh>

      {/* Candles */}
      {CANDLE_LOCAL.map((p, i) => (
        <group key={i} position={[p.x, TOP, p.z]}>
          <mesh position={[0, CANDLE_H / 2, 0]}>
            <cylinderGeometry args={[0.016, 0.016, CANDLE_H, 12]} />
            <meshStandardMaterial color={CANDLE_COLORS[i]} roughness={0.5} />
          </mesh>
          <group ref={(g) => { if (g) flames.current[i] = g; }} position={[0, CANDLE_H + 0.035, 0]}>
            <mesh ref={(m) => { if (m) flameMeshes.current[i] = m; }} position={[0, 0.02, 0]}>
              <sphereGeometry args={[0.03, 12, 10]} />
              <meshBasicMaterial color="#ffd27a" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <planeGeometry args={[0.22, 0.22]} />
              <meshBasicMaterial map={dot} color="#ffb35c" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ))}
      <pointLight ref={light} position={[0, TOP + 0.5, 0]} color="#ffb86b" intensity={0} distance={4} decay={1.5} />

      {/* Knife lying on the table beside the cake (she picks it up) */}
      <group ref={knifeTable} position={[CAKE_TO_GIRL.x * 0.8, TABLE_H + 0.012, CAKE_TO_GIRL.z * 0.8]} rotation={[0, KNIFE_YAW, 0]}>
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.03]} />
          <meshStandardMaterial color="#7a4a3a" roughness={0.6} />
        </mesh>
        <mesh position={[-0.08, 0, 0]}>
          <boxGeometry args={[0.26, 0.008, 0.03]} />
          <meshStandardMaterial color="#eef3f8" metalness={0.85} roughness={0.18} />
        </mesh>
      </group>
    </group>
  );
}
