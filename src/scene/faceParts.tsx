import type { MutableRefObject } from "react";
import type { Group } from "three";

interface EyeProps {
  groupRef: MutableRefObject<Group | null>;
  side: 1 | -1;
  iris: string;
  size?: number;
  lash?: string;
}

/** Layered, cinematic anime eye. The outer group remains the blink pivot used by both rigs. */
export function AnimeEye({ groupRef, side, iris, size = 1, lash = "#1a1014" }: EyeProps) {
  return (
    <group ref={groupRef} position={[side * 0.095, -0.015, 0.232]}>
      <group scale={size}>
        {/* Soft eye socket and almond-shaped sclera */}
        <mesh position={[0, -0.002, -0.006]} scale={[1.12, 0.78, 0.35]}>
          <sphereGeometry args={[0.052, 24, 18]} />
          <meshBasicMaterial color="#9c665c" transparent opacity={0.13} />
        </mesh>
        <mesh scale={[1.08, 0.64, 0.43]}>
          <sphereGeometry args={[0.05, 28, 20]} />
          <meshStandardMaterial color="#fffaf5" roughness={0.22} />
        </mesh>
        {/* Iris with a dark limbal ring, warm inner colour and pupil */}
        <mesh position={[0, -0.001, 0.013]} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.034, 28, 22]} />
          <meshStandardMaterial color="#24130f" roughness={0.24} />
        </mesh>
        <mesh position={[0, -0.001, 0.018]} scale={[0.84, 0.92, 0.5]}>
          <sphereGeometry args={[0.032, 28, 22]} />
          <meshStandardMaterial color={iris} roughness={0.2} metalness={0.04} />
        </mesh>
        <mesh position={[0, 0.002, 0.025]} scale={[0.48, 0.78, 0.45]}>
          <sphereGeometry args={[0.025, 22, 18]} />
          <meshBasicMaterial color="#10090b" />
        </mesh>
        {/* Anime-film catchlights */}
        <mesh position={[0.012, 0.014, 0.034]}>
          <sphereGeometry args={[0.009, 12, 10]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.011, -0.009, 0.034]}>
          <sphereGeometry args={[0.0045, 10, 8]} />
          <meshBasicMaterial color="#fff0d8" toneMapped={false} />
        </mesh>
        {/* Defined upper lid and fine lower lash */}
        <group scale={[1.06, 0.7, 1]}>
          <mesh position={[0, 0.002, 0.022]}>
            <torusGeometry args={[0.05, 0.008, 7, 28, Math.PI]} />
            <meshStandardMaterial color={lash} roughness={0.48} />
          </mesh>
        </group>
        <mesh position={[0, -0.031, 0.018]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.043, 0.003, 6, 24, Math.PI * 0.72]} />
          <meshStandardMaterial color="#76534d" transparent opacity={0.7} />
        </mesh>
        <mesh position={[side * 0.052, 0.016, 0.02]} rotation={[0, 0, -side * 0.7]}>
          <capsuleGeometry args={[0.004, 0.019, 3, 7]} />
          <meshStandardMaterial color={lash} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

interface BrowProps {
  side: 1 | -1;
  color: string;
  radius: number;
  length: number;
  tilt: number;
  y?: number;
}

export function Brow({ side, color, radius, length, tilt, y = 0.056 }: BrowProps) {
  return (
    <group position={[side * 0.097, y, 0.24]} rotation={[0.15, 0, Math.PI / 2 + side * tilt]}>
      <mesh>
        <capsuleGeometry args={[radius, length, 5, 10]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      <mesh position={[0, length * 0.43, 0.001]} scale={[0.62, 0.72, 0.72]}>
        <sphereGeometry args={[radius, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}
