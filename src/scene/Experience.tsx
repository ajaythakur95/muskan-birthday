import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Environment, Lightformer, Sparkles, Stars } from "@react-three/drei";
import { gsap } from "gsap";
import { AdditiveBlending, DoubleSide, Vector3, type Mesh, type MeshBasicMaterial, type SpotLight } from "three";
import { sfx } from "../audio/sfx";
import BirthdayCake, { type CakeParts } from "./BirthdayCake";
import CameraRig, { type CameraTarget } from "./CameraRig";
import CartoonBoy from "./CartoonBoy";
import CartoonGirl, { type GirlRig } from "./CartoonGirl";
import { Balloons, Confetti, Fireworks, Floor, Smoke, type ConfettiHandle, type SmokeHandle } from "./Effects";
import GiftBox3D, { type GiftParts } from "./GiftBox3D";
import {
  AJAY_AT_CAKE, AJAY_SCALE, AJAY_START, CAKE_POS, CAKE_TO_GIRL, CAMERA_START, CUT_CAMERA, GIFT_H,
  GIRL_AT_CAKE, GIRL_LANDING, GIRL_SCALE, GIRL_YAW,
  createSim, type Phase,
} from "./layout";
import type { Tier } from "./support";

interface ExperienceProps {
  tier: Tier;
  reduced: boolean;
  /** Becomes true when the visitor presses "Open Your Surprise" (or taps the 3D box). */
  started: boolean;
  onStart: () => void;
  onPhase: (p: Phase) => void;
  /** Lets the page fast-forward the whole sequence. */
  skipRef: { current: (() => void) | null };
}

const v3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** The whole 3D world + the GSAP master timeline that directs it. */
export default function Experience({ tier, reduced, started, onStart, onPhase, skipRef }: ExperienceProps) {
  const low = tier === "low";
  const sim = useMemo(() => createSim(), []);
  const camera = useMemo<CameraTarget>(
    () => ({ pos: CAMERA_START.pos.clone(), look: CAMERA_START.look.clone() }),
    [],
  );
  const gift = useRef<GiftParts | null>(null);
  const girl = useRef<GirlRig | null>(null);
  const boy = useRef<GirlRig | null>(null);
  const spot = useRef<SpotLight>(null);
  const ring = useRef<Mesh>(null);
  const [giftMagic, setGiftMagic] = useState(false);
  const [cakeMagic, setCakeMagic] = useState(false);
  const cake = useRef<CakeParts | null>(null);
  const confetti = useRef<ConfettiHandle>(null);
  const smoke = useRef<SmokeHandle>(null);
  const [night, setNight] = useState(false);
  const onPhaseRef = useRef(onPhase);
  onPhaseRef.current = onPhase;
  const playedRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Hidden until their moment in the story.
  useLayoutEffect(() => {
    girl.current!.root.visible = false;
    girl.current!.root.position.set(0, 0.1, 0);
    girl.current!.root.scale.setScalar(GIRL_SCALE * 0.45);
    // Ajay is NOT in the scene until the cake-cutting moment.
    boy.current!.root.visible = false;
    boy.current!.root.position.copy(AJAY_START);
    boy.current!.root.scale.setScalar(AJAY_SCALE);
    spot.current!.target.position.copy(CAKE_POS).setY(0.9);
    spot.current!.target.updateMatrixWorld();
    cake.current!.root.position.copy(CAKE_POS);
    cake.current!.root.visible = false;
    cake.current!.root.scale.setScalar(0.01);
  }, []);

  useEffect(() => {
    if (!started || playedRef.current) return;
    playedRef.current = true;
    const g = gift.current!, gr = girl.current!, ck = cake.current!, by = boy.current!;
    let skipped = false;
    const fx = (name: Parameters<typeof sfx.play>[0], delay = 0) => () => { if (!skipped) sfx.play(name, delay); };
    const phase = (p: Phase) => onPhaseRef.current(p);
    const S = GIRL_SCALE;
    const cakeTop = (i: number) => ck.candleTops[i].clone().add(CAKE_POS);
    const confettiAt = (x: number, y: number, z: number, n?: number, power?: number) =>
      confetti.current?.fire(v3(x, y, z), n, power);

    const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });
    tlRef.current = tl;
    document.body.style.cursor = "";

    /* ── ACT 1 · The gift opens (0 → 4.1s) ─────────────────── */
    tl.call(() => phase("opening"), undefined, 0);
    tl.call(fx("ribbon"), undefined, 0.9);
    tl.to(sim, { floatAmt: 0, duration: 0.6 }, 0);
    tl.to(camera.pos, { x: 0, y: 2.5, z: 5.3, duration: 1.9 }, 0.2);
    tl.to(camera.look, { x: 0, y: 1.1, z: 0, duration: 1.9 }, 0.2);

    // The ribbon unties: the bow wiggles, loosens, drops its tails and lifts away.
    tl.to(g.bow.rotation, { z: 0.14, duration: 0.09, repeat: 5, yoyo: true, ease: "sine.inOut" }, 0.7);
    tl.to([g.loopL.scale, g.loopR.scale], { y: 0.08, duration: 0.5, ease: "power2.in" }, 1.3);
    tl.to(g.tailL.rotation, { z: 1.5, duration: 0.55, ease: "power1.in" }, 1.35);
    tl.to(g.tailR.rotation, { z: -1.5, duration: 0.55, ease: "power1.in" }, 1.35);
    tl.to(g.bow.position, { y: "+=0.55", duration: 0.5, ease: "power2.out" }, 1.8);
    tl.to(g.bow.rotation, { y: 3.2, duration: 0.5 }, 1.8);
    tl.to(g.bow.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.5, ease: "power2.in" }, 1.8);

    // The lid swings open on its hinge and light pours out.
    const L = 2.4;
    tl.call(() => { setGiftMagic(true); fx("giftOpen")(); }, undefined, L);
    tl.to(g.lid.rotation, { x: -2.15, duration: 1.3, ease: "back.out(1.4)" }, L);
    // Shockwave ring of light + a warm flash from inside the box.
    tl.fromTo(ring.current!.scale, { x: 0.3, y: 0.3, z: 0.3 }, { x: 6, y: 6, z: 6, duration: 1.4, ease: "power2.out", immediateRender: false }, L + 0.2);
    tl.fromTo(ring.current!.material as MeshBasicMaterial, { opacity: 0.9 }, { opacity: 0, duration: 1.4, ease: "power1.out", immediateRender: false }, L + 0.2);
    tl.fromTo(g.light, { intensity: 0 }, { intensity: 14, duration: 0.25, ease: "power2.out", immediateRender: false }, L + 0.15);
    tl.to(g.beamMat, { opacity: 0.5, duration: 0.8, ease: "power1.out" }, L + 0.2);
    tl.to(g.light, { intensity: 7, duration: 0.8 }, L + 0.4);
    tl.call(fx("pop"), undefined, L + 0.4);
    tl.call(() => confettiAt(0, GIFT_H + 0.3, 0, undefined, 1.2), undefined, L + 0.35);
    tl.call(() => confettiAt(0, GIFT_H + 0.3, 0, undefined, 0.8), undefined, L + 0.85);
    tl.to(camera.pos, { x: 0, y: 2.8, z: 4.3, duration: 1.5 }, L);
    tl.to(camera.look, { x: 0, y: 1.5, z: 0, duration: 1.5 }, L);

    /* ── ACT 2 · She climbs out and waves ──────────────────── */
    const E = L + 1.5;
    tl.call(() => { gr.root.visible = true; phase("emerging"); fx("whoosh")(); }, undefined, E);
    tl.to(gr.root.position, { y: 1.55, duration: 1.2, ease: "power3.out" }, E);
    tl.to(gr.root.scale, { x: S, y: S, z: S, duration: 1.2, ease: "power2.out" }, E);
    tl.to(gr.head.rotation, { z: -0.12, duration: 0.5, repeat: 1, yoyo: true }, E + 0.5);
    tl.call(() => setGiftMagic(false), undefined, E + 3);
    tl.to(g.beamMat, { opacity: 0.18, duration: 1.4 }, E + 0.6);
    tl.to(g.light, { intensity: 1.2, duration: 1.4 }, E + 0.6);
    // Hop: up, then down while drifting forward past the front wall.
    const H = E + 1.1;
    tl.to(gr.root.position, { y: 1.95, duration: 0.3, ease: "power2.out" }, H);
    tl.to(gr.root.position, { y: 0, duration: 0.55, ease: "power2.in" }, H + 0.3);
    tl.to(gr.root.position, { x: GIRL_LANDING.x, z: GIRL_LANDING.z, duration: 0.85, ease: "none" }, H);
    tl.call(() => { confettiAt(GIRL_LANDING.x, 0.2, GIRL_LANDING.z, 50, 0.6); fx("pop")(); }, undefined, H + 0.85);

    const W = H + 1.2;
    tl.call(() => phase("waving"), undefined, W);
    tl.to(camera.pos, { x: 0.7, y: 1.9, z: 6.4, duration: 1.4 }, W - 0.4);
    tl.to(camera.look, { x: 0.7, y: 1.0, z: 1.2, duration: 1.4 }, W - 0.4);
    tl.to(sim, { smileScale: 1.35, duration: 0.3 }, W);
    tl.to(gr.armR.rotation, { z: 2.55, duration: 0.55 }, W);
    tl.to(gr.foreR.rotation, { z: 0.75, duration: 0.2, repeat: 7, yoyo: true, ease: "sine.inOut" }, W + 0.55);
    tl.to(gr.head.rotation, { z: 0.14, duration: 0.45, repeat: 1, yoyo: true }, W + 0.4);
    tl.to(gr.armR.rotation, { z: 0.12, duration: 0.6 }, W + 2.3);
    tl.to(sim, { smileScale: 1, duration: 0.3 }, W + 2.6);

    /* ── ACT 3 · Walk to the cake ──────────────────────────── */
    const K = W + 3.0;
    tl.call(() => {
      phase("walking");
      sim.walking = true;
      sim.swingArms = true;
      ck.root.visible = true;
    }, undefined, K);
    tl.to(gr.root.rotation, { y: GIRL_YAW, duration: 0.5 }, K);
    tl.to(gr.root.position, { x: GIRL_AT_CAKE.x, z: GIRL_AT_CAKE.z, duration: 3.0, ease: "none" }, K + 0.3);
    tl.to(camera.pos, { x: 3.4, y: 1.9, z: 6.7, duration: 3.4 }, K);
    tl.to(camera.look, { x: 3.5, y: 1.1, z: 2.2, duration: 3.4 }, K);
    tl.call(fx("whoosh"), undefined, K + 1.1);
    tl.to(ck.root.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "back.out(1.6)" }, K + 1.2);
    tl.fromTo(ck.root.rotation, { y: -0.9 }, { y: 0, duration: 1.4, ease: "power2.out", immediateRender: false }, K + 1.2);
    tl.call(() => confettiAt(CAKE_POS.x, 0.4, CAKE_POS.z, 40, 0.5), undefined, K + 1.5);
    tl.call(() => { sim.walking = false; sim.swingArms = false; }, undefined, K + 3.3);
    tl.to([gr.legL.rotation, gr.legR.rotation, gr.armL.rotation, gr.armR.rotation], { x: 0, duration: 0.3 }, K + 3.3);

    /* ── ACT 4 · Candles & the wish ────────────────────────── */
    const C = K + 4.0;
    tl.call(() => { phase("candles"); setCakeMagic(true); }, undefined, C);
    tl.to(spot.current!, { intensity: 90, duration: 1.4 }, C);
    ck.flames.forEach((f, i) => {
      tl.to(f.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: "back.out(3)" }, C + i * 0.28);
      tl.call(fx("candle"), undefined, C + i * 0.28);
    });
    tl.to(ck.light, { intensity: 2.4, duration: 1.0 }, C);
    tl.to(camera.pos, { x: 3.4, y: 1.8, z: 5.6, duration: 1.6 }, C);
    tl.to(camera.look, { x: 3.6, y: 1.15, z: 2.2, duration: 1.6 }, C);

    const Wsh = C + 1.8;
    tl.call(() => { phase("wish"); fx("wish")(); }, undefined, Wsh);
    tl.to(sim, { closed: 1, duration: 0.4 }, Wsh + 0.2);
    // Hands together in front of her for the wish.
    tl.to([gr.armL.rotation, gr.armR.rotation], { x: -0.85, duration: 0.6 }, Wsh + 0.2);
    tl.to(gr.armL.rotation, { z: 0.3, duration: 0.6 }, Wsh + 0.2);
    tl.to(gr.armR.rotation, { z: -0.3, duration: 0.6 }, Wsh + 0.2);
    tl.to([gr.foreL.rotation, gr.foreR.rotation], { x: -1.1, duration: 0.6 }, Wsh + 0.2);
    tl.to(gr.head.rotation, { x: -0.1, duration: 0.5 }, Wsh + 0.2);

    // Blow!
    const B = Wsh + 3.6;
    tl.call(() => phase("blowing"), undefined, B);
    tl.call(fx("blow"), undefined, B + 0.45);
    tl.to(sim, { closed: 0, duration: 0.25 }, B);
    tl.to(gr.torso.rotation, { x: 0.4, duration: 0.5 }, B);
    tl.to(gr.head.rotation, { x: -0.18, duration: 0.5 }, B);
    tl.to(sim, { mouthO: 1, duration: 0.02 }, B + 0.45);
    ck.flames.forEach((f, i) => {
      tl.to(f.rotation, { z: -0.95, duration: 0.14, repeat: 3, yoyo: true, ease: "sine.inOut" }, B + 0.55);
      tl.to(f.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.18, ease: "power2.in" }, B + 1.15 + i * 0.1);
      tl.call(() => smoke.current?.puff(cakeTop(i)), undefined, B + 1.15 + i * 0.1);
    });
    tl.to(ck.light, { intensity: 0, duration: 0.8 }, B + 1.3);
    tl.to(sim, { mouthO: 0, duration: 0.02 }, B + 2.0);
    tl.to(gr.torso.rotation, { x: 0, duration: 0.5 }, B + 2.0);
    tl.to(gr.head.rotation, { x: 0, duration: 0.5 }, B + 2.0);
    tl.to([gr.armL.rotation, gr.armR.rotation], { x: 0, duration: 0.5 }, B + 2.0);
    tl.to(gr.armL.rotation, { z: -0.12, duration: 0.5 }, B + 2.0);
    tl.to(gr.armR.rotation, { z: 0.12, duration: 0.5 }, B + 2.0);
    tl.to([gr.foreL.rotation, gr.foreR.rotation], { x: 0, duration: 0.5 }, B + 2.0);
    tl.to(sim, { smileScale: 1.35, duration: 0.3 }, B + 2.1);

    /* ── ACT 5 · Ajay joins; they cut the cake together ────── */
    const T = B + 3.3;
    tl.call(() => { phase("cutting"); setCakeMagic(false); }, undefined, T);
    tl.to(gr.torso.rotation, { x: 0.3, duration: 0.6 }, T);
    tl.to(gr.armL.rotation, { x: -1.15, z: -0.08, duration: 0.7 }, T);
    tl.to(gr.foreL.rotation, { x: -0.5, duration: 0.4 }, T + 0.25);
    tl.call(() => { ck.knifeTable.visible = false; gr.knife.visible = true; }, undefined, T + 1.0);
    tl.to(gr.armL.rotation, { x: -1.8, duration: 0.6 }, T + 1.1);
    tl.to(gr.foreL.rotation, { x: -0.2, duration: 0.6 }, T + 1.1);

    // Camera glides around the table so both of them are seen side by side.
    tl.to(camera.pos, { x: CUT_CAMERA.pos.x, y: CUT_CAMERA.pos.y, z: CUT_CAMERA.pos.z, duration: 2.6, ease: "power2.inOut" }, T + 0.1);
    tl.to(camera.look, { x: CUT_CAMERA.look.x, y: CUT_CAMERA.look.y, z: CUT_CAMERA.look.z, duration: 2.6, ease: "power2.inOut" }, T + 0.1);

    // Ajay walks in (he does not exist before this moment).
    const A = T + 1.0;
    tl.call(() => {
      by.root.visible = true;
      phase("ajay");
      sim.boyWalking = true;
      by.root.rotation.y = Math.atan2(AJAY_AT_CAKE.x - AJAY_START.x, AJAY_AT_CAKE.z - AJAY_START.z);
      fx("hello")();
    }, undefined, A);
    tl.to(by.root.position, { x: AJAY_AT_CAKE.x, z: AJAY_AT_CAKE.z, duration: 2.6, ease: "none" }, A);
    tl.call(() => { sim.boyWalking = false; }, undefined, A + 2.6);
    tl.to([by.legL.rotation, by.legR.rotation, by.armL.rotation, by.armR.rotation], { x: 0, duration: 0.3 }, A + 2.6);
    tl.to(by.root.rotation, { y: GIRL_YAW, duration: 0.6 }, A + 2.4);
    tl.to(by.armR.rotation, { z: 2.4, duration: 0.5 }, A + 3.0); // a little hello wave
    tl.to(by.foreR.rotation, { z: 0.7, duration: 0.18, repeat: 3, yoyo: true, ease: "sine.inOut" }, A + 3.4);
    tl.to(by.armR.rotation, { z: 0.12, duration: 0.5 }, A + 4.1);

    // Both take the knife together.
    const U = A + 4.6;
    tl.call(() => phase("cuttingTogether"), undefined, U - 0.2);
    tl.to(gr.armL.rotation, { z: -0.5, duration: 0.6 }, U - 0.2);
    tl.to(by.armR.rotation, { x: -1.8, z: 0.55, duration: 0.7 }, U - 0.2);
    tl.to(by.foreR.rotation, { x: -0.2, duration: 0.7 }, U - 0.2);
    tl.to([gr.torso.rotation, by.torso.rotation], { x: 0.45, duration: 0.5 }, U + 0.3);
    tl.to([gr.armL.rotation, by.armR.rotation], { x: -0.95, duration: 0.5, ease: "power2.in" }, U + 0.4);
    tl.call(() => { ck.reveal(); fx("cut")(); }, undefined, U + 0.9);
    tl.to([gr.armL.rotation, by.armR.rotation], { x: -1.5, duration: 0.4 }, U + 1.0);
    tl.to([gr.armL.rotation, by.armR.rotation], { x: -1.0, duration: 0.35, ease: "power2.in" }, U + 1.45);
    tl.call(fx("cut"), undefined, U + 1.7);
    tl.to(ck.wedge.position, { x: CAKE_TO_GIRL.x * 0.5, z: CAKE_TO_GIRL.z * 0.5, duration: 0.9 }, U + 1.9);
    tl.call(fx("clink"), undefined, U + 2.7);
    tl.to(gr.armL.rotation, { x: -0.1, z: -0.12, duration: 0.7 }, U + 2.3);
    tl.to(by.armR.rotation, { x: 0, z: 0.12, duration: 0.7 }, U + 2.3);
    tl.to([gr.foreL.rotation, by.foreR.rotation], { x: 0, duration: 0.7 }, U + 2.3);
    tl.to([gr.torso.rotation, by.torso.rotation], { x: 0, duration: 0.6 }, U + 2.3);
    tl.call(() => { gr.knife.visible = false; }, undefined, U + 3.0);

    /* ── ACT 6 · Celebration ───────────────────────────────── */
    const F = U + 3.3;
    tl.call(() => {
      phase("celebrating");
      setNight(true);
      sim.fireworks = true;
      sim.balloonsStart = performance.now() / 1000;
      fx("pop")();
    }, undefined, F);
    tl.to(spot.current!, { intensity: 40, duration: 1.5 }, F);
    [0, 0.45, 0.9, 1.5].forEach((d, i) =>
      tl.call(
        () => { confettiAt(CAKE_POS.x + (i - 1.5) * 0.9, 2.4 + (i % 2) * 0.5, CAKE_POS.z - 0.5, undefined, 1.1); fx("pop")(); },
        undefined, F + d,
      ),
    );
    tl.to([gr.armL.rotation, by.armL.rotation], { x: 0, z: -2.7, duration: 0.6 }, F);
    tl.to([gr.armR.rotation, by.armR.rotation], { x: 0, z: 2.7, duration: 0.6 }, F);
    tl.to([gr.foreL.rotation, gr.foreR.rotation, by.foreL.rotation, by.foreR.rotation], { x: 0, z: 0, duration: 0.4 }, F);
    tl.to(gr.root.position, { y: 0.35, duration: 0.3, repeat: 5, yoyo: true, ease: "sine.out" }, F + 0.2);
    tl.to(by.root.position, { y: 0.35, duration: 0.3, repeat: 5, yoyo: true, ease: "sine.out" }, F + 0.35);
    tl.to(camera.pos, { x: 3.4, y: 2.9, z: 10.6, duration: 4.0, ease: "power2.inOut" }, F);
    tl.to(camera.look, { x: 3.5, y: 2.5, z: 1.5, duration: 4.0, ease: "power2.inOut" }, F);
    tl.call(() => phase("finale"), undefined, F + 2.2);

    skipRef.current = () => {
      // Jump to the end with events enabled so every state change still runs.
      skipped = true; // no sound pile-up; fireworks keep their own sounds
      tl.progress(1, false);
    };

    return () => {
      // Only on unmount (replay remounts the whole scene).
      tl.kill();
      skipRef.current = null;
    };
  }, [started, sim, camera, skipRef]);

  const handleActivate = () => {
    if (!started) onStart();
  };

  const confettiMax = low ? 110 : 260;
  const fwBursts = low ? 4 : 6;
  const fwParticles = low ? 34 : 64;
  const balloonCount = low ? 6 : 10;
  const fireworkCenter = useMemo(() => v3(CAKE_POS.x, 0, CAKE_POS.z), []);

  return (
    <>
      <CameraRig target={camera} parallax={!reduced} />

      <ambientLight intensity={0.75} color="#fff1f8" />
      <hemisphereLight args={["#fff6ea", "#d9c8ff", 0.7]} />
      <directionalLight position={[4, 7, 5]} intensity={2.1} color="#fff0e0" />
      <directionalLight position={[-5, 3, -3]} intensity={0.9} color="#ffb6e0" />
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#fff0f6" position={[0, 5, 4]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#d9c8ff" position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#ffc4dc" position={[6, 2, 1]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
        </Environment>
      </Suspense>

      <spotLight ref={spot} position={[CAKE_POS.x - 1.5, 7, CAKE_POS.z + 2]} angle={0.5} penumbra={1} intensity={0} decay={1.2} color="#ffe6f4" />

      <Floor />
      {/* Magic dust: swirling around the gift as it opens, around the cake as the candles light */}
      {giftMagic && <Sparkles count={low ? 30 : 90} scale={[2.6, 3.4, 2.6]} position={[0, 1.8, 0]} size={low ? 5 : 6} speed={1.2} color="#fff3c9" noise={1.5} />}
      {cakeMagic && <Sparkles count={low ? 20 : 60} scale={[2.2, 2.2, 2.2]} position={[CAKE_POS.x, 1.4, CAKE_POS.z]} size={5} speed={0.8} color="#ffd1e8" noise={1} />}
      <mesh ref={ring} position={[0, GIFT_H + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.3}>
        <ringGeometry args={[0.45, 0.55, 64]} />
        <meshBasicMaterial color="#fff0c2" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} toneMapped={false} />
      </mesh>
      <Sparkles count={low ? 24 : 70} scale={[12, 5, 8]} position={[2, 2.5, 1]} size={low ? 4 : 3} speed={0.35} color="#fff" opacity={0.8} />
      {night && <Stars radius={60} depth={30} count={low ? 600 : 1800} factor={4} fade speed={0.6} />}

      <GiftBox3D parts={gift} sim={sim} interactive={!started} onActivate={handleActivate} reduced={reduced} />
      <CartoonGirl rig={girl} sim={sim} />
      <CartoonBoy rig={boy} sim={sim} />
      <BirthdayCake parts={cake} />

      <Confetti ref={confetti} max={confettiMax} />
      <Smoke ref={smoke} count={low ? 14 : 24} />
      <Balloons sim={sim} center={fireworkCenter} count={balloonCount} />
      <Fireworks sim={sim} center={fireworkCenter} bursts={fwBursts} perBurst={fwParticles} onBurst={() => sfx.play("firework")} />
    </>
  );
}
