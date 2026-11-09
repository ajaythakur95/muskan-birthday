import { Component, useLayoutEffect, useMemo, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { Vector3 } from "three";
import CartoonBoy from "./CartoonBoy";
import type { GirlRig } from "./CartoonGirl";
import type { HostState } from "./hostState";
import type { Sim } from "./layout";

interface Props {
  rig: MutableRefObject<GirlRig | null>;
  sim: Sim;
  host: HostState;
  mobile: boolean;
  onReady: () => void;
  onFail: () => void;
}

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.error("Slideshow host failed:", e);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const tmp = new Vector3();

function HostScene({ rig, sim, host, mobile, onReady }: Omit<Props, "onFail">) {
  const { viewport, size, camera } = useThree();

  // Place Ajay at the left of the screen, feet on an invisible floor, sized to the screen.
  useLayoutEffect(() => {
    const r = rig.current;
    if (!r) return;
    // Desktop: Ajay on the left, photo on the right. Mobile: Ajay centred under the photo.
    const scale = (viewport.height * (mobile ? 0.24 : 0.5)) / 1.9;
    host.scale = scale;
    host.baseX = mobile ? 0 : -viewport.width / 2 + viewport.width * 0.15;
    host.baseY = -viewport.height / 2 + viewport.height * (mobile ? 0.17 : 0.2);
    host.pxPerUnit = size.width / viewport.width;
    r.root.scale.setScalar(scale);
    r.root.position.y = host.baseY;
    if (!host.finale) r.root.position.x = host.baseX;
    r.root.rotation.y = host.finale ? 0 : mobile ? 0.15 : 0.45;
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width, viewport.height, size.width, mobile]);

  // Every frame: where is his hand on screen?
  useFrame(() => {
    const r = rig.current;
    if (!r) return;
    r.root.updateWorldMatrix(true, true);
    tmp.set(0, -0.24, 0);
    r.foreR.localToWorld(tmp);
    tmp.project(camera);
    host.handX = (tmp.x * 0.5 + 0.5) * size.width;
    host.handY = (-tmp.y * 0.5 + 0.5) * size.height;
  });

  return (
    <>
      <ambientLight intensity={1.0} color="#fff1f8" />
      <hemisphereLight args={["#fff6ea", "#d9c8ff", 0.8]} />
      <directionalLight position={[2, 4, 5]} intensity={2.2} color="#fff0e0" />
      <directionalLight position={[-4, 2, 2]} intensity={0.8} color="#ffb6e0" />
      <CartoonBoy rig={rig} sim={sim} />
      <Sparkles count={mobile ? 14 : 30} scale={[2.2, 3, 1.5]} position={[mobile ? 0 : -viewport.width / 2 + viewport.width * 0.15, -viewport.height * (mobile ? 0.2 : 0.3), 0.3]} size={4} speed={0.4} color="#fff" opacity={0.8} />
    </>
  );
}

/** Transparent full-page canvas containing only Ajay. Pointer events pass through to the page. */
export default function SlideshowHost({ rig, sim, host, mobile, onReady, onFail }: Props) {
  const dpr = useMemo<[number, number]>(() => [1, mobile ? 1.5 : 2], [mobile]);
  return (
    <Boundary onError={onFail}>
      <Canvas
        aria-hidden="true"
        dpr={dpr}
        camera={{ fov: 35, near: 0.1, far: 50, position: [0, 0, 6] }}
        gl={{ alpha: true, antialias: !mobile }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onFail();
          });
        }}
      >
        <HostScene rig={rig} sim={sim} host={host} mobile={mobile} onReady={onReady} />
      </Canvas>
    </Boundary>
  );
}
