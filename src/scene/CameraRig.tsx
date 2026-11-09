import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";

export interface CameraTarget {
  pos: Vector3;
  look: Vector3;
}

const tmp = new Vector3();

/**
 * The timeline tweens `target.pos` / `target.look`; this smooths the real camera toward them,
 * adds a hint of pointer parallax, and backs the camera off on narrow (portrait) screens
 * so the whole scene still fits.
 */
export default function CameraRig({ target, parallax }: { target: CameraTarget; parallax: boolean }) {
  useFrame((state, dt) => {
    const aspect = state.size.width / state.size.height;
    const k = aspect < 0.7 ? 1.7 : aspect < 1 ? 1.4 : aspect < 1.3 ? 1.15 : 1;
    tmp.copy(target.pos).sub(target.look).multiplyScalar(k).add(target.look);
    if (parallax) {
      tmp.x += state.pointer.x * 0.3;
      tmp.y += state.pointer.y * 0.15;
    }
    const a = 1 - Math.exp(-dt * 3.2);
    state.camera.position.set(
      MathUtils.lerp(state.camera.position.x, tmp.x, a),
      MathUtils.lerp(state.camera.position.y, tmp.y, a),
      MathUtils.lerp(state.camera.position.z, tmp.z, a),
    );
    state.camera.lookAt(target.look);
  });
  return null;
}
