import { Vector3 } from "three";

/** World-space layout of the scene (metres-ish units). Camera looks down -Z. */
export const GIFT_H = 1.1; // height of the box body
export const GIRL_SCALE = 0.85;

/** The girl turns this far (radians around Y) to walk toward / face the cake. */
export const GIRL_YAW = 1.27;
const DIR = new Vector3(Math.sin(GIRL_YAW), 0, Math.cos(GIRL_YAW)); // her "forward" at that yaw

export const GIRL_LANDING = new Vector3(0.9, 0, 1.5);
export const GIRL_AT_CAKE = GIRL_LANDING.clone().addScaledVector(DIR, 2.2);
export const CAKE_POS = GIRL_AT_CAKE.clone().addScaledVector(DIR, 1.3);
/** Direction from the cake toward the girl (the side the slice is cut from). */
export const CAKE_TO_GIRL = DIR.clone().multiplyScalar(-1);


/** Ajay appears only at the cake: he stands on Muskan's left (toward the camera's old side). */
const SIDE = new Vector3(-DIR.z, 0, DIR.x); // Muskan's left in world XZ
export const AJAY_SCALE = 0.9;
export const AJAY_AT_CAKE = GIRL_AT_CAKE.clone().addScaledVector(SIDE, 0.78).addScaledVector(DIR, 0.22);
export const AJAY_START = AJAY_AT_CAKE.clone().addScaledVector(SIDE, 4.2);
/** Camera for the cutting scene: across the table, so they stand side by side. */
export const CUT_CAMERA = {
  pos: CAKE_POS.clone().addScaledVector(DIR, 2.7).setY(2.3),
  look: GIRL_AT_CAKE.clone().add(AJAY_AT_CAKE).multiplyScalar(0.5).setY(1.0),
};

export const CAMERA_START = { pos: new Vector3(0, 2.1, 7.4), look: new Vector3(0, 0.9, 0) };

/** Everything the animation timeline can drive, shared without causing React re-renders. */
export interface Sim {
  floatAmt: number; // 0..1 gentle floating of the gift
  hovered: boolean;
  pressed: boolean;
  walking: boolean;
  boyWalking: boolean;
  swingArms: boolean;
  closed: number; // 0 open eyes .. 1 closed
  mouthO: number; // 0 smile .. 1 blowing "o"
  smileScale: number;
  fireworks: boolean;
  balloonsStart: number; // performance.now()/1000 when balloons launch, -1 = not yet
}

export const createSim = (): Sim => ({
  floatAmt: 1,
  hovered: false,
  pressed: false,
  walking: false,
  boyWalking: false,
  swingArms: false,
  closed: 0,
  mouthO: 0,
  smileScale: 1,
  fireworks: false,
  balloonsStart: -1,
});

export type Phase =
  | "idle" | "opening" | "emerging" | "waving" | "walking"
  | "candles" | "wish" | "blowing" | "cutting" | "ajay" | "cuttingTogether" | "celebrating" | "finale";
