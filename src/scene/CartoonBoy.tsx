import { useLayoutEffect, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { GirlRig } from "./CartoonGirl";
import type { Sim } from "./layout";
import { softDotTexture } from "./textures";

const SKIN = "#f6cfb2";
const HAIR = "#2f211f";
const SHIRT = "#b9a2ff";
const SHIRT_DARK = "#9b7ad8";
const PANTS = "#5b4aa8";
const WHITE = "#fffaf5";

interface Props {
  rig: MutableRefObject<GirlRig | null>;
  sim: Sim;
}

/**
 * Ajay: a cute original cartoon boy (same joint layout as Muskan, so the timeline
 * drives both the same way). He only ever appears during the cake-cutting scene.
 */
export default function CartoonBoy({ rig, sim }: Props) {
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
  const blinkTimer = useRef(1.4);
  const blinkT = useRef(0);
  const walkPhase = useRef(0);

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
    if (!root.current?.visible) return;
    const t = state.clock.elapsedTime;
    const step = Math.min(dt, 0.05);
    blinkTimer.current -= step;
    if (blinkTimer.current <= 0) {
      blinkT.current = 0.18;
      blinkTimer.current = 2.4 + Math.random() * 3;
    }
    let blink = 0;
    if (blinkT.current > 0) {
      blinkT.current -= step;
      blink = Math.sin(Math.PI * Math.min(Math.max(1 - blinkT.current / 0.18, 0), 1));
    }
    eyeL.current!.scale.y = eyeR.current!.scale.y = 1 - blink * 0.93;
    torso.current!.scale.y = 1 + Math.sin(t * 2.1 + 1) * 0.012;
    head.current!.rotation.y = Math.sin(t * 0.8 + 2) * 0.08;
    smile.current!.scale.setScalar(sim.smileScale);

    if (sim.boyWalking) {
      walkPhase.current += step * 8.5;
      const s = Math.sin(walkPhase.current);
      legL.current!.rotation.x = s * 0.7;
      legR.current!.rotation.x = -s * 0.7;
      armL.current!.rotation.x = -s * 0.55;
      armR.current!.rotation.x = s * 0.55;
      body.current!.position.y = Math.abs(Math.cos(walkPhase.current)) * 0.05;
    } else {
      body.current!.position.y *= 0.8;
    }
  });

  const dot = softDotTexture();

  return (
    <group ref={root}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial map={dot} color="#3b2466" transparent opacity={0.4} depthWrite={false} />
      </mesh>

      <group ref={body}>
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? legL : legR} position={[s * 0.1, 0.44, 0]}>
            <mesh position={[0, -0.1, 0]}>
              <capsuleGeometry args={[0.07, 0.14, 4, 10]} />
              <meshStandardMaterial color={PANTS} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.27, 0]}>
              <capsuleGeometry args={[0.045, 0.1, 4, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.385, 0.035]} scale={[1, 0.7, 1.45]}>
              <sphereGeometry args={[0.078, 16, 12]} />
              <meshStandardMaterial color={WHITE} roughness={0.4} />
            </mesh>
          </group>
        ))}
        {/* Shorts */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.2, 28]} />
          <meshStandardMaterial color={PANTS} roughness={0.7} />
        </mesh>

        <group ref={torso} position={[0, 0.6, 0]}>
          {/* Shirt */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.18, 0.21, 0.4, 32]} />
            <meshStandardMaterial color={SHIRT} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.03, 10, 28]} />
            <meshStandardMaterial color={WHITE} roughness={0.5} />
          </mesh>
          {/* Little bow tie */}
          <group position={[0, 0.37, 0.18]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.035, 0, 0]} scale={[1.2, 0.8, 0.5]}>
                <sphereGeometry args={[0.035, 12, 10]} />
                <meshStandardMaterial color="#f78fbb" roughness={0.4} />
              </mesh>
            ))}
          </group>

          {[-1, 1].map((s) => (
            <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.23, 0.35, 0]} rotation={[0, 0, s * 0.12]}>
              <mesh>
                <sphereGeometry args={[0.075, 14, 12]} />
                <meshStandardMaterial color={SHIRT_DARK} roughness={0.6} />
              </mesh>
              <mesh position={[0, -0.14, 0]}>
                <capsuleGeometry args={[0.043, 0.15, 4, 10]} />
                <meshStandardMaterial color={SKIN} roughness={0.7} />
              </mesh>
              <group ref={s < 0 ? foreL : foreR} position={[0, -0.26, 0]}>
                <mesh position={[0, -0.09, 0]}>
                  <capsuleGeometry args={[0.04, 0.11, 4, 10]} />
                  <meshStandardMaterial color={SKIN} roughness={0.7} />
                </mesh>
                <mesh position={[0, -0.21, 0]}>
                  <sphereGeometry args={[0.055, 14, 10]} />
                  <meshStandardMaterial color={SKIN} roughness={0.7} />
                </mesh>
              </group>
            </group>
          ))}
          {/* Unused knife anchor so Ajay shares the girl's rig shape */}
          <group ref={knife} visible={false} />

          <group ref={head} position={[0, 0.42, 0]}>
            <group position={[0, 0.26, 0]}>
              <mesh scale={[1, 0.97, 0.97]}>
                <sphereGeometry args={[0.26, 40, 32]} />
                <meshStandardMaterial color={SKIN} roughness={0.7} />
              </mesh>
              {/* Short hair: back shell + top cap + side tufts */}
              <mesh position={[0, 0, -0.02]} scale={[1, 1.03, 1]}>
                <sphereGeometry args={[0.275, 36, 24, Math.PI, Math.PI, 0, Math.PI * 0.75]} />
                <meshStandardMaterial color={HAIR} roughness={0.6} side={2} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.278, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
                <meshStandardMaterial color={HAIR} roughness={0.6} />
              </mesh>
              <mesh position={[0.06, 0.28, 0.08]} rotation={[0.5, 0, -0.5]}>
                <coneGeometry args={[0.05, 0.14, 10]} />
                <meshStandardMaterial color={HAIR} roughness={0.6} />
              </mesh>
              {/* Party hat */}
              <group position={[-0.08, 0.27, 0.02]} rotation={[0, 0, 0.35]}>
                <mesh position={[0, 0.1, 0]}>
                  <coneGeometry args={[0.1, 0.24, 20]} />
                  <meshStandardMaterial color="#ffb6d3" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.23, 0]}>
                  <sphereGeometry args={[0.03, 10, 8]} />
                  <meshStandardMaterial color="#fff2e0" roughness={0.4} />
                </mesh>
              </group>

              {[-1, 1].map((s) => (
                <group key={s} ref={s < 0 ? eyeL : eyeR} position={[s * 0.095, -0.015, 0.232]}>
                  <mesh scale={[0.8, 1.15, 0.5]}>
                    <sphereGeometry args={[0.05, 20, 16]} />
                    <meshStandardMaterial color="#1f1426" roughness={0.15} metalness={0.1} />
                  </mesh>
                  <mesh position={[0.013, 0.02, 0.024]}>
                    <sphereGeometry args={[0.013, 10, 8]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                  </mesh>
                </group>
              ))}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.165, -0.07, 0.195]} scale={[1, 0.6, 0.25]}>
                  <sphereGeometry args={[0.046, 14, 10]} />
                  <meshStandardMaterial color="#ff9db8" transparent opacity={0.5} roughness={1} />
                </mesh>
              ))}
              <mesh position={[0, -0.05, 0.258]}>
                <sphereGeometry args={[0.014, 10, 8]} />
                <meshStandardMaterial color="#e8b99b" roughness={0.8} />
              </mesh>
              <group ref={smile} position={[0, -0.095, 0.245]} rotation={[0, 0, Math.PI]}>
                <mesh>
                  <torusGeometry args={[0.05, 0.0085, 8, 24, Math.PI]} />
                  <meshStandardMaterial color="#c4506f" roughness={0.6} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
