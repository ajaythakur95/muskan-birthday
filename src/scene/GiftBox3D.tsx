import { useLayoutEffect, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, MathUtils, type Group, type Mesh, type MeshBasicMaterial, type PointLight } from "three";
import { GIFT_H, type Sim } from "./layout";
import { softDotTexture } from "./textures";

export interface GiftParts {
  root: Group;
  lid: Group; // hinge pivot at the back edge of the lid
  bow: Group;
  loopL: Mesh;
  loopR: Mesh;
  tailL: Group;
  tailR: Group;
  beamMat: MeshBasicMaterial;
  light: PointLight;
}

interface GiftBox3DProps {
  parts: MutableRefObject<GiftParts | null>;
  sim: Sim;
  interactive: boolean;
  onActivate: () => void;
  reduced: boolean;
}

const W = 1.5; // outer width / depth
const T = 0.07; // wall thickness
const LID_W = W + 0.12;
const LID_H = 0.28;
const BODY = "#f9a8cb";
const LID = "#fcbfd8";
const INNER = "#e684ad";
const RIBBON = "#fff4e6";
const R = 0.215; // ribbon band width

/** Pastel pink gift box: open-top body (so she can climb out), hinged lid, satin ribbon and bow. */
export default function GiftBox3D({ parts, sim, interactive, onActivate, reduced }: GiftBox3DProps) {
  const root = useRef<Group>(null);
  const floater = useRef<Group>(null);
  const hover = useRef<Group>(null);
  const lid = useRef<Group>(null);
  const bow = useRef<Group>(null);
  const loopL = useRef<Mesh>(null);
  const loopR = useRef<Mesh>(null);
  const tailL = useRef<Group>(null);
  const tailR = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);

  useLayoutEffect(() => {
    parts.current = {
      root: root.current!, lid: lid.current!, bow: bow.current!,
      loopL: loopL.current!, loopR: loopR.current!,
      tailL: tailL.current!, tailR: tailR.current!,
      beamMat: beam.current!.material as MeshBasicMaterial,
      light: light.current!,
    };
    return () => {
      parts.current = null;
      document.body.style.cursor = "";
    };
  }, [parts]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const f = floater.current!, h = hover.current!;
    const amt = reduced ? 0 : sim.floatAmt;
    f.position.y = Math.sin(t * 1.4) * 0.09 * amt;
    f.rotation.y = Math.sin(t * 0.5) * 0.42 * amt;
    f.rotation.z = Math.sin(t * 0.9) * 0.03 * amt;
    // Hover grows the box, a press squeezes it.
    const target = sim.floatAmt < 0.5 ? 1 : sim.pressed ? 0.94 : sim.hovered ? 1.07 : 1;
    h.scale.setScalar(MathUtils.damp(h.scale.x, target, 9, dt));
  });

  const events = interactive
    ? {
        onPointerOver: () => { sim.hovered = true; document.body.style.cursor = "pointer"; },
        onPointerOut: () => { sim.hovered = false; sim.pressed = false; document.body.style.cursor = ""; },
        onPointerDown: () => { sim.pressed = true; },
        onPointerUp: () => { sim.pressed = false; },
        onClick: () => onActivate(),
      }
    : {};

  const bandMat = (
    <meshStandardMaterial color={RIBBON} roughness={0.32} metalness={0.1} />
  );

  return (
    <group ref={root}>
      <group ref={floater}>
        <group ref={hover} {...events}>
          {/* ── Body: open-top box ─────────────────────────── */}
          <mesh position={[0, T / 2, 0]}>
            <boxGeometry args={[W, T, W]} />
            <meshStandardMaterial color={INNER} roughness={0.6} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={`fb${s}`} position={[0, GIFT_H / 2, s * (W / 2 - T / 2)]}>
              <boxGeometry args={[W, GIFT_H, T]} />
              <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.02} />
            </mesh>
          ))}
          {[1, -1].map((s) => (
            <mesh key={`lr${s}`} position={[s * (W / 2 - T / 2), GIFT_H / 2, 0]}>
              <boxGeometry args={[T, GIFT_H, W - 2 * T]} />
              <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.02} />
            </mesh>
          ))}
          {/* Satin bands on the outside of the body */}
          {[1, -1].map((s) => (
            <mesh key={`bf${s}`} position={[0, GIFT_H / 2, s * (W / 2 + 0.006)]}>
              <boxGeometry args={[R, GIFT_H, 0.014]} />
              {bandMat}
            </mesh>
          ))}
          {[1, -1].map((s) => (
            <mesh key={`bs${s}`} position={[s * (W / 2 + 0.006), GIFT_H / 2, 0]}>
              <boxGeometry args={[0.014, GIFT_H, R]} />
              {bandMat}
            </mesh>
          ))}

          {/* ── Lid (hinged at the back edge) ──────────────── */}
          <group ref={lid} position={[0, GIFT_H, -LID_W / 2]}>
            <group position={[0, LID_H / 2, LID_W / 2]}>
              <mesh>
                <boxGeometry args={[LID_W, LID_H, LID_W]} />
                <meshStandardMaterial color={LID} roughness={0.45} metalness={0.02} />
              </mesh>
              <mesh>
                <boxGeometry args={[R, LID_H + 0.014, LID_W + 0.014]} />
                {bandMat}
              </mesh>
              <mesh>
                <boxGeometry args={[LID_W + 0.014, LID_H + 0.014, R]} />
                {bandMat}
              </mesh>

              {/* Bow */}
              <group ref={bow} position={[0, LID_H / 2 + 0.01, 0]}>
                <mesh ref={loopL} position={[-0.2, 0.17, 0]} rotation={[0, 0.5, 0.35]} scale={[1, 1.15, 0.55]}>
                  <torusGeometry args={[0.17, 0.06, 14, 32]} />
                  {bandMat}
                </mesh>
                <mesh ref={loopR} position={[0.2, 0.17, 0]} rotation={[0, -0.5, -0.35]} scale={[1, 1.15, 0.55]}>
                  <torusGeometry args={[0.17, 0.06, 14, 32]} />
                  {bandMat}
                </mesh>
                <group ref={tailL} position={[-0.06, 0.05, 0.03]} rotation={[0.25, 0, 0.45]}>
                  <mesh position={[0, -0.2, 0]}>
                    <boxGeometry args={[0.11, 0.4, 0.014]} />
                    {bandMat}
                  </mesh>
                </group>
                <group ref={tailR} position={[0.06, 0.05, 0.03]} rotation={[0.25, 0, -0.45]}>
                  <mesh position={[0, -0.2, 0]}>
                    <boxGeometry args={[0.11, 0.4, 0.014]} />
                    {bandMat}
                  </mesh>
                </group>
                <mesh position={[0, 0.1, 0.01]}>
                  <sphereGeometry args={[0.095, 20, 16]} />
                  <meshStandardMaterial color="#ffe3ee" roughness={0.3} metalness={0.1} />
                </mesh>
              </group>
            </group>
          </group>

          {/* ── Magical light that pours out when opened ───── */}
          <mesh ref={beam} position={[0, GIFT_H + 2, 0]} renderOrder={5}>
            <cylinderGeometry args={[0.2, 0.75, 4, 32, 1, true]} />
            <meshBasicMaterial
              color="#fff1c9"
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, GIFT_H + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.65, 32]} />
            <meshBasicMaterial map={softDotTexture()} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} color="#fff0c2" />
          </mesh>
          <pointLight ref={light} position={[0, GIFT_H - 0.1, 0]} color="#ffe2a8" intensity={0} distance={7} decay={1.6} />
        </group>
      </group>
    </group>
  );
}
