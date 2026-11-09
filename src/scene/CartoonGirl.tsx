import { useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
import { AnimeEye, Brow } from "./faceParts";
import { blouseTexture, floralSkirt, hairTexture } from "./paint";
import type { Sim } from "./layout";
import { softDotTexture } from "./textures";

/** The skeleton: every joint is a Group the timeline can rotate. */
export interface GirlRig {
  root: Group;
  body: Group;
  torso: Group;
  head: Group;
  armL: Group;
  armR: Group;
  foreL: Group;
  foreR: Group;
  legL: Group;
  legR: Group;
  knife: Group;
}

interface CartoonGirlProps {
  rig: MutableRefObject<GirlRig | null>;
  sim: Sim;
}

// Colours taken from Muskan's reference photo.
const SKIN = "#f1c9aa";
const BLACK = "#1c1921";
const GOLD = "#d9b25f";
const PEARL = "#fff8ee";
const SHOE = "#eadbcf";
const IRIS = "#4a2d22";

/**
 * Muskan: an original, hand-painted-style anime character built as a jointed rig
 * (hips → torso → head, shoulders → elbows, hips → legs). Her look follows her reference photo:
 * long straight black hair with a centre parting, jhumka earrings, red lips, a black embroidered
 * blouse with sheer puffed sleeves, a pearl belt buckle and a long blush floral skirt.
 * Blinking, breathing and the walk cycle run here; the story beats are rotations the GSAP
 * timeline applies to the joints, so the skeleton below must not change.
 */
export default function CartoonGirl({ rig, sim }: CartoonGirlProps) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const foreL = useRef<Group>(null);
  const foreR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const knife = useRef<Group>(null);
  const eyeL = useRef<Group>(null);
  const eyeR = useRef<Group>(null);
  const smile = useRef<Group>(null);
  const mouthO = useRef<Group>(null);
  const hairBack = useRef<Group>(null);
  const blinkTimer = useRef(2);
  const blinkT = useRef(0);
  const walkPhase = useRef(0);
  const dot = useMemo(() => softDotTexture(), []);
  const tex = useMemo(
    () => ({
      cap: hairTexture("muskan-cap", "#100e14", "#28232e", "#625b6b", { part: false, band: 0.5 }),
      long: hairTexture("muskan-long", "#15111a", "#2b2431", "#615770", { band: 0.12 }),
      skirt: floralSkirt(),
      blouse: blouseTexture(),
    }),
    [],
  );

  useLayoutEffect(() => {
    rig.current = {
      root: root.current!, body: body.current!, torso: torso.current!, head: head.current!,
      armL: armL.current!, armR: armR.current!, foreL: foreL.current!, foreR: foreR.current!,
      legL: legL.current!, legR: legR.current!, knife: knife.current!,
    };
    return () => {
      rig.current = null;
    };
  }, [rig]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);

    // Natural blinking every 2–5 s; "closed" (wishing) holds the eyes shut.
    blinkTimer.current -= step;
    if (blinkTimer.current <= 0) {
      blinkT.current = 0.18;
      blinkTimer.current = 2.2 + Math.random() * 3;
    }
    let blink = 0;
    if (blinkT.current > 0) {
      blinkT.current -= step;
      blink = Math.sin(Math.PI * Math.min(Math.max(1 - blinkT.current / 0.18, 0), 1));
    }
    const eyeY = 1 - Math.max(blink, sim.closed) * 0.93;
    eyeL.current!.scale.y = eyeY;
    eyeR.current!.scale.y = eyeY;

    // Breathing + a tiny head sway (the timeline uses head X/Z; idle only touches Y).
    torso.current!.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
    head.current!.rotation.y = Math.sin(t * 0.7) * 0.08;

    // Smile ↔ "o" mouth for blowing out candles.
    const blowing = sim.mouthO >= 0.5;
    smile.current!.visible = !blowing;
    mouthO.current!.visible = blowing;
    smile.current!.scale.setScalar(sim.smileScale);

    // Walk cycle, with hip sway, a counter-turn of the shoulders and long hair that swings.
    let hairSwing = Math.sin(t * 1.3) * 0.02;
    if (sim.walking) {
      walkPhase.current += step * 8.5;
      const s = Math.sin(walkPhase.current);
      legL.current!.rotation.x = s * 0.7;
      legR.current!.rotation.x = -s * 0.7;
      body.current!.position.y = Math.abs(Math.cos(walkPhase.current)) * 0.05;
      body.current!.rotation.y = s * 0.06;
      body.current!.rotation.z = Math.cos(walkPhase.current) * 0.02;
      torso.current!.rotation.y = -s * 0.08;
      hairSwing += Math.abs(s) * 0.07;
      if (sim.swingArms) {
        armL.current!.rotation.x = -s * 0.55;
        armR.current!.rotation.x = s * 0.55;
      }
    } else {
      body.current!.position.y *= 0.8;
      body.current!.rotation.y *= 0.8;
      body.current!.rotation.z *= 0.8;
      torso.current!.rotation.y *= 0.8;
    }
    hairBack.current!.rotation.x += (hairSwing - hairBack.current!.rotation.x) * Math.min(1, step * 6);
  });

  return (
    <group ref={root}>
      {/* Soft blob shadow on the floor */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[1.35, 1.35]} />
        <meshBasicMaterial map={dot} color="#3b2466" transparent opacity={0.4} depthWrite={false} />
      </mesh>

      <group ref={body}>
        {/* Legs (mostly hidden under the long skirt) */}
        <Leg groupRef={legL} x={-0.1} />
        <Leg groupRef={legR} x={0.1} />

        {/* Long floral skirt */}
        <mesh position={[0, 0.485, 0]}>
          <cylinderGeometry args={[0.17, 0.47, 0.73, 48, 1, true]} />
          <meshStandardMaterial map={tex.skirt} roughness={0.6} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.125, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.468, 0.011, 8, 56]} />
          <meshStandardMaterial color="#f3e3d6" roughness={0.5} />
        </mesh>

        {/* Torso (pivot at the waist) */}
        <group ref={torso} position={[0, 0.85, 0]}>
          {/* Black embroidered blouse */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.15, 0.19, 0.31, 32]} />
            <meshStandardMaterial map={tex.blouse} roughness={0.55} />
          </mesh>
          {/* Black belt with a pearl-and-gold buckle */}
          <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.034, 10, 36]} />
            <meshStandardMaterial color="#141217" roughness={0.4} />
          </mesh>
          <group position={[0, 0.012, 0.215]}>
            <mesh>
              <sphereGeometry args={[0.034, 14, 12]} />
              <meshStandardMaterial color={PEARL} roughness={0.25} />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh key={i} position={[Math.cos((i * Math.PI) / 4) * 0.05, Math.sin((i * Math.PI) / 4) * 0.05, -0.004]}>
                <sphereGeometry args={[0.012, 8, 6]} />
                <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} />
              </mesh>
            ))}
          </group>
          {/* Scoop neckline: a ring of skin and a neck */}
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.032, 10, 32]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.052, 0.058, 0.12, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>

          <Arm side={-1} upper={armL} fore={foreL} accessory="watch">
            <group ref={knife} position={[0, -0.22, 0.02]} visible={false}>
              <mesh position={[0, -0.03, 0]}>
                <boxGeometry args={[0.032, 0.1, 0.032]} />
                <meshStandardMaterial color="#7a4a3a" roughness={0.6} />
              </mesh>
              <mesh position={[0, -0.19, 0]}>
                <boxGeometry args={[0.03, 0.26, 0.008]} />
                <meshStandardMaterial color="#eef3f8" metalness={0.85} roughness={0.18} />
              </mesh>
            </group>
          </Arm>
          <Arm side={1} upper={armR} fore={foreR} accessory="bangles" />

          {/* Head (pivot at the neck) */}
          <group ref={head} position={[0, 0.3, 0]}>
            {/* Slightly smaller head for natural proportions */}
            <group position={[0, 0.25, 0]} scale={0.86}>
              <mesh scale={[0.94, 1.035, 0.91]}>
                <sphereGeometry args={[0.26, 56, 40]} />
                <meshStandardMaterial color={SKIN} roughness={0.48} metalness={0.015} />
              </mesh>

              {/* Hair: deep side-swept crown, long dark curtain down the back and face-framing locks */}
              <mesh>
                <sphereGeometry args={[0.285, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.44]} />
                <meshStandardMaterial map={tex.cap} roughness={0.42} metalness={0.08} />
              </mesh>
              <mesh position={[0, 0, -0.02]} scale={[1, 1.02, 1]}>
                <sphereGeometry args={[0.285, 36, 28, Math.PI, Math.PI, Math.PI * 0.2, Math.PI * 0.5]} />
                <meshStandardMaterial map={tex.cap} roughness={0.42} metalness={0.08} side={DoubleSide} />
              </mesh>
              {/* Soft side-swept fringe: a layered lock rather than a rigid centre-part cartoon cap */}
              <mesh position={[-0.075, 0.155, 0.185]} rotation={[0.08, 0.02, -0.48]} scale={[1.35, 0.52, 0.72]}>
                <sphereGeometry args={[0.12, 28, 18]} />
                <meshStandardMaterial map={tex.cap} roughness={0.34} metalness={0.035} />
              </mesh>
              <group ref={hairBack}>
                <mesh position={[0, -0.37, 0]}>
                  <cylinderGeometry args={[0.285, 0.3, 0.85, 40, 12, true, Math.PI * 0.62, Math.PI * 0.76]} />
                  <meshStandardMaterial map={tex.long} roughness={0.42} metalness={0.08} side={DoubleSide} />
                </mesh>
              </group>
              {[-1, 1].map((s) => (
                <group key={s}>
                  {/* hair framing the face, falling over the shoulders */}
                  <mesh position={[s * 0.222, -0.2, 0.07]} rotation={[0, 0, s * 0.05]} scale={[0.8, 1, 0.8]}>
                    <capsuleGeometry args={[0.042, 0.4, 4, 12]} />
                    <meshStandardMaterial map={tex.long} roughness={0.42} metalness={0.08} />
                  </mesh>
                  <mesh position={[s * 0.19, 0.06, 0.1]} rotation={[0, 0, s * 0.35]}>
                    <capsuleGeometry args={[0.04, 0.12, 4, 10]} />
                    <meshStandardMaterial map={tex.long} roughness={0.36} metalness={0.035} />
                  </mesh>
                </group>
              ))}

              {/* Jhumka (chandelier) earrings */}
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.255, -0.085, 0.045]}>
                  <mesh>
                    <sphereGeometry args={[0.017, 10, 8]} />
                    <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
                  </mesh>
                  <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.04, 0.06, 18, 1, true]} />
                    <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} side={DoubleSide} />
                  </mesh>
                  {[-0.022, 0, 0.022].map((x) => (
                    <mesh key={x} position={[x, -0.092, 0]}>
                      <sphereGeometry args={[0.011, 8, 6]} />
                      <meshStandardMaterial color={PEARL} roughness={0.25} />
                    </mesh>
                  ))}
                </group>
              ))}

              {/* Face: almond eyes (modest size), slim arched brows */}
              <AnimeEye groupRef={eyeL} side={-1} iris={IRIS} size={0.95} />
              <AnimeEye groupRef={eyeR} side={1} iris={IRIS} size={0.95} />
              <Brow side={-1} color="#1a1014" radius={0.0055} length={0.07} tilt={-0.1} />
              <Brow side={1} color="#1a1014" radius={0.0055} length={0.07} tilt={-0.1} />
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.165, -0.07, 0.195]} scale={[1, 0.6, 0.25]}>
                  <sphereGeometry args={[0.048, 14, 10]} />
                  <meshStandardMaterial color="#ff9db8" transparent opacity={0.5} roughness={1} />
                </mesh>
              ))}
              <mesh position={[0, -0.018, 0.244]} scale={[0.44, 1.25, 0.4]}>
                <sphereGeometry args={[0.016, 18, 14]} />
                <meshStandardMaterial color="#e7b69b" roughness={0.52} />
              </mesh>
              <mesh position={[0, -0.05, 0.258]}>
                <sphereGeometry args={[0.014, 16, 12]} />
                <meshStandardMaterial color="#e9b89b" roughness={0.55} />
              </mesh>
              {/* Red lips */}
              <group ref={smile} position={[0, -0.095, 0.245]} rotation={[0, 0, Math.PI]}>
                <mesh>
                  <torusGeometry args={[0.045, 0.0105, 8, 24, Math.PI]} />
                  <meshStandardMaterial color="#c42a45" roughness={0.45} />
                </mesh>
              </group>
              <group ref={mouthO} position={[0, -0.1, 0.245]} visible={false}>
                <mesh scale={[1, 1.2, 0.4]}>
                  <sphereGeometry args={[0.026, 14, 10]} />
                  <meshStandardMaterial color="#b01f3a" roughness={0.6} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Leg({ groupRef, x }: { groupRef: MutableRefObject<Group | null>; x: number }) {
  return (
    <group ref={groupRef} position={[x, 0.42, 0]}>
      <mesh position={[0, -0.17, 0]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* Embellished heels */}
      <mesh position={[0, -0.385, 0.035]} scale={[1, 0.7, 1.45]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshStandardMaterial color={SHOE} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.372, 0.075]}>
        <sphereGeometry args={[0.014, 8, 6]} />
        <meshStandardMaterial color={PEARL} roughness={0.25} />
      </mesh>
    </group>
  );
}

interface ArmProps {
  side: 1 | -1;
  upper: MutableRefObject<Group | null>;
  fore: MutableRefObject<Group | null>;
  accessory: "watch" | "bangles";
  children?: ReactNode;
}

/** Shoulder → elbow → hand, in sheer black puffed sleeves. `side` −1 is her left arm (the one holding the knife). */
function Arm({ side, upper, fore, accessory, children }: ArmProps) {
  return (
    <group ref={upper} position={[side * 0.21, 0.27, 0]} rotation={[0, 0, side * 0.12]}>
      <mesh>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshStandardMaterial color={BLACK} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <capsuleGeometry args={[0.042, 0.16, 4, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* sheer sleeve over the upper arm */}
      <mesh position={[0, -0.15, 0]}>
        <capsuleGeometry args={[0.054, 0.16, 4, 12]} />
        <meshStandardMaterial color={BLACK} transparent opacity={0.5} roughness={0.6} depthWrite={false} />
      </mesh>
      <group ref={fore} position={[0, -0.27, 0]}>
        <mesh position={[0, -0.09, 0]}>
          <capsuleGeometry args={[0.039, 0.11, 4, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        {/* puffed sheer sleeve gathered at a cuff */}
        <mesh position={[0, -0.06, 0]} scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.063, 16, 12]} />
          <meshStandardMaterial color={BLACK} transparent opacity={0.5} roughness={0.6} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.044, 0.011, 8, 20]} />
          <meshStandardMaterial color={BLACK} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.21, 0]}>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        {accessory === "watch" ? (
          <group position={[0, -0.178, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.046, 0.007, 8, 20]} />
              <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.047]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
              <meshStandardMaterial color="#f6ecd4" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        ) : (
          [-0.175, -0.195].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.046, 0.005, 8, 20]} />
              <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} />
            </mesh>
          ))
        )}
        {children}
      </group>
    </group>
  );
}
