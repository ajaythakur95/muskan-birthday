import { useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
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

const SKIN = "#ffdcc4";
const HAIR = "#4b2e28";
const DRESS = "#ffb6d3";
const DRESS_DARK = "#f48fb9";
const WHITE = "#fffaf5";

/**
 * An original cartoon girl built as a jointed rig (hips → torso → head, shoulders → elbows,
 * hips → legs). Blinking, breathing and the walk cycle run here every frame; the story
 * beats (waving, blowing candles, cutting cake) are rotations the GSAP timeline applies to the joints.
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
  const blinkTimer = useRef(2);
  const blinkT = useRef(0);
  const walkPhase = useRef(0);
  const dot = useMemo(() => softDotTexture(), []);

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

    // Walk cycle.
    if (sim.walking) {
      walkPhase.current += step * 8.5;
      const s = Math.sin(walkPhase.current);
      legL.current!.rotation.x = s * 0.7;
      legR.current!.rotation.x = -s * 0.7;
      body.current!.position.y = Math.abs(Math.cos(walkPhase.current)) * 0.05;
      if (sim.swingArms) {
        armL.current!.rotation.x = -s * 0.55;
        armR.current!.rotation.x = s * 0.55;
      }
    } else {
      body.current!.position.y *= 0.8;
    }
  });

  return (
    <group ref={root}>
      {/* Soft blob shadow on the floor */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[1.25, 1.25]} />
        <meshBasicMaterial map={dot} color="#3b2466" transparent opacity={0.4} depthWrite={false} />
      </mesh>

      <group ref={body}>
        {/* Legs */}
        <Leg groupRef={legL} x={-0.1} />
        <Leg groupRef={legR} x={0.1} />

        {/* Skirt */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.17, 0.41, 0.46, 40, 1, true]} />
          <meshStandardMaterial color={DRESS} roughness={0.55} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.405, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.4, 0.035, 10, 48]} />
          <meshStandardMaterial color={WHITE} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.345, 0.022, 8, 48]} />
          <meshStandardMaterial color={DRESS_DARK} roughness={0.5} />
        </mesh>

        {/* Torso (pivot at the waist) */}
        <group ref={torso} position={[0, 0.85, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.15, 0.19, 0.31, 32]} />
            <meshStandardMaterial color={DRESS} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.03, 10, 36]} />
            <meshStandardMaterial color={DRESS_DARK} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.03, 10, 32]} />
            <meshStandardMaterial color={WHITE} roughness={0.5} />
          </mesh>
          {/* Little heart button */}
          <mesh position={[0, 0.17, 0.17]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <meshStandardMaterial color="#fff" roughness={0.3} />
          </mesh>

          <Arm side={-1} upper={armL} fore={foreL}>
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
          <Arm side={1} upper={armR} fore={foreR} />

          {/* Head (pivot at the neck) */}
          <group ref={head} position={[0, 0.3, 0]}>
            <group position={[0, 0.26, 0]}>
              <mesh scale={[1, 0.97, 0.97]}>
                <sphereGeometry args={[0.26, 40, 32]} />
                <meshStandardMaterial color={SKIN} roughness={0.7} />
              </mesh>

              {/* Hair: back shell, fringe cap, side locks, pigtails, bow */}
              <mesh position={[0, 0.0, -0.02]} scale={[1, 1.04, 1]}>
                <sphereGeometry args={[0.285, 36, 28, Math.PI, Math.PI]} />
                <meshStandardMaterial color={HAIR} roughness={0.55} side={DoubleSide} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.285, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
                <meshStandardMaterial color={HAIR} roughness={0.55} />
              </mesh>
              {[-1, 1].map((s) => (
                <group key={s}>
                  <mesh position={[s * 0.245, -0.08, 0.04]} rotation={[0, 0, s * 0.12]}>
                    <capsuleGeometry args={[0.04, 0.17, 4, 10]} />
                    <meshStandardMaterial color={HAIR} roughness={0.55} />
                  </mesh>
                  <group position={[s * 0.275, 0.0, -0.07]}>
                    <mesh>
                      <sphereGeometry args={[0.075, 14, 12]} />
                      <meshStandardMaterial color={HAIR} roughness={0.55} />
                    </mesh>
                    <mesh position={[s * 0.035, -0.19, 0]} rotation={[0, 0, s * 0.22]}>
                      <capsuleGeometry args={[0.065, 0.2, 4, 12]} />
                      <meshStandardMaterial color={HAIR} roughness={0.55} />
                    </mesh>
                    <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[0.06, 0.016, 8, 20]} />
                      <meshStandardMaterial color="#f78fbb" roughness={0.4} />
                    </mesh>
                  </group>
                </group>
              ))}
              <group position={[0.12, 0.25, 0.1]} rotation={[-0.4, 0, -0.35]}>
                <mesh position={[-0.055, 0, 0]} rotation={[0, 0, 0.35]} scale={[1.4, 0.85, 0.5]}>
                  <sphereGeometry args={[0.05, 14, 10]} />
                  <meshStandardMaterial color="#f78fbb" roughness={0.4} />
                </mesh>
                <mesh position={[0.055, 0, 0]} rotation={[0, 0, -0.35]} scale={[1.4, 0.85, 0.5]}>
                  <sphereGeometry args={[0.05, 14, 10]} />
                  <meshStandardMaterial color="#f78fbb" roughness={0.4} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.026, 12, 10]} />
                  <meshStandardMaterial color="#ffd1e3" roughness={0.4} />
                </mesh>
              </group>

              {/* Face */}
              {[-1, 1].map((s) => (
                <group key={s} ref={s < 0 ? eyeL : eyeR} position={[s * 0.095, -0.015, 0.232]}>
                  <mesh scale={[0.8, 1.15, 0.5]}>
                    <sphereGeometry args={[0.052, 20, 16]} />
                    <meshStandardMaterial color="#2a1a2e" roughness={0.15} metalness={0.1} />
                  </mesh>
                  <mesh position={[0.014, 0.022, 0.024]}>
                    <sphereGeometry args={[0.014, 10, 8]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                  </mesh>
                  <mesh position={[-0.012, -0.018, 0.022]}>
                    <sphereGeometry args={[0.007, 8, 6]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                  </mesh>
                </group>
              ))}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.165, -0.07, 0.195]} scale={[1, 0.6, 0.25]}>
                  <sphereGeometry args={[0.048, 14, 10]} />
                  <meshStandardMaterial color="#ff9db8" transparent opacity={0.6} roughness={1} />
                </mesh>
              ))}
              <mesh position={[0, -0.05, 0.258]}>
                <sphereGeometry args={[0.014, 10, 8]} />
                <meshStandardMaterial color="#f2bfa3" roughness={0.8} />
              </mesh>
              <group ref={smile} position={[0, -0.095, 0.245]} rotation={[0, 0, Math.PI]}>
                <mesh>
                  <torusGeometry args={[0.045, 0.0085, 8, 24, Math.PI]} />
                  <meshStandardMaterial color="#c4506f" roughness={0.6} />
                </mesh>
              </group>
              <group ref={mouthO} position={[0, -0.1, 0.245]} visible={false}>
                <mesh scale={[1, 1.2, 0.4]}>
                  <sphereGeometry args={[0.026, 14, 10]} />
                  <meshStandardMaterial color="#b83e5e" roughness={0.7} />
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
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[0.054, 0.054, 0.12, 14]} />
        <meshStandardMaterial color={WHITE} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.385, 0.035]} scale={[1, 0.7, 1.45]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshStandardMaterial color="#f78fbb" roughness={0.35} />
      </mesh>
    </group>
  );
}

interface ArmProps {
  side: 1 | -1;
  upper: MutableRefObject<Group | null>;
  fore: MutableRefObject<Group | null>;
  children?: ReactNode;
}

/** Shoulder → elbow → hand. `side` −1 is her left arm (the one nearest the camera at the cake). */
function Arm({ side, upper, fore, children }: ArmProps) {
  return (
    <group ref={upper} position={[side * 0.21, 0.27, 0]} rotation={[0, 0, side * 0.12]}>
      <mesh>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshStandardMaterial color={DRESS} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <capsuleGeometry args={[0.042, 0.16, 4, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      <group ref={fore} position={[0, -0.27, 0]}>
        <mesh position={[0, -0.09, 0]}>
          <capsuleGeometry args={[0.039, 0.11, 4, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.21, 0]}>
          <sphereGeometry args={[0.055, 14, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        {children}
      </group>
    </group>
  );
}
