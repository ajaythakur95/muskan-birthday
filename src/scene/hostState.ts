import type { Sim } from "./layout";

/** Numbers shared between the 3D slideshow host and the page's GSAP timeline (no re-renders). */
export interface HostState {
  /** Screen position (px) of Ajay's right hand. */
  handX: number;
  handY: number;
  /** Screen pixels per world unit at Ajay's depth. */
  pxPerUnit: number;
  baseX: number;
  baseY: number;
  scale: number;
  /** True once Ajay has moved to the centre for the final scene. */
  finale: boolean;
}

/** Plain objects only (no three.js), so the page can create them without loading the 3D chunk. */
export function createHost(): { host: HostState; sim: Sim } {
  return {
    host: { handX: 0, handY: 0, pxPerUnit: 100, baseX: 0, baseY: 0, scale: 1, finale: false },
    sim: {
      floatAmt: 0, hovered: false, pressed: false, walking: false, boyWalking: false, swingArms: false,
      closed: 0, mouthO: 0, smileScale: 1, fireworks: false, balloonsStart: -1,
    },
  };
}
