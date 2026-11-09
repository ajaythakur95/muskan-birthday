import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { screenVariants } from "../animations/variants";
import Loader3D from "../components/Loader3D";
import MagicBackground from "../components/MagicBackground";
import { birthdayConfig } from "../config/birthday";

// three.js is large, so the 3D scene loads only when this screen opens.
const SceneRoot = lazy(() => import("../scene/SceneRoot"));

interface BirthdayEnvironmentProps {
  onBack: () => void;
  onMemories: () => void;
  onLetter: () => void;
}

/** Main birthday world: the cinematic 3D gift → girl → cake sequence. */
export default function BirthdayEnvironment({ onBack, onMemories, onLetter }: BirthdayEnvironmentProps) {
  return (
    <motion.div
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label={birthdayConfig.environment.ariaLabel}
    >
      <MagicBackground variant="dream">
        <Suspense fallback={<Loader3D />}>
          <SceneRoot onBack={onBack} onMemories={onMemories} onLetter={onLetter} />
        </Suspense>
      </MagicBackground>
    </motion.div>
  );
}
