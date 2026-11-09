import { useEffect, useState } from "react";
import { music } from "./audio/musicEngine";
import { useMusic } from "./hooks/useMusic";
import { AnimatePresence, MotionConfig } from "framer-motion";
import Loader from "./components/Loader";
import { birthdayConfig } from "./config/birthday";
import { useAppReady } from "./hooks/useAppReady";
import BirthdayEnvironment from "./pages/BirthdayEnvironment";
import MusicPlayer from "./components/music/MusicPlayer";
import FinalPage from "./pages/FinalPage";
import GalleryPage from "./pages/GalleryPage";
import LetterPage from "./pages/LetterPage";
import SlideshowPage from "./pages/SlideshowPage";
import WelcomePage from "./pages/WelcomePage";

type Stage = "welcome" | "environment" | "letter" | "slideshow" | "final" | "gallery";

export default function App() {
  useMusic(); // restores the saved volume
  // Browsers only allow sound after a user gesture: start the music on the very first one,
  // from the welcome screen, then keep it playing through every scene.
  useEffect(() => {
    const first = () => {
      cleanup();
      void music.play();
    };
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, first));
    events.forEach((e) => window.addEventListener(e, first, { passive: true }));
    return cleanup;
  }, []);
  const ready = useAppReady(birthdayConfig.loader.minDurationMs);
  const [stage, setStage] = useState<Stage>("welcome");
  // Where the gallery's back button returns to.
  const [galleryFrom, setGalleryFrom] = useState<Stage>("environment");
  const openMemories = (from: Stage) => {
    setGalleryFrom(from);
    setStage("gallery");
  };

  return (
    // Honors the visitor's "reduce motion" setting for all transform animations.
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {!ready ? (
          <Loader key="loader" />
        ) : stage === "welcome" ? (
          <WelcomePage key="welcome" onBegin={() => setStage("environment")} />
        ) : stage === "environment" ? (
          <BirthdayEnvironment
            key="environment"
            onBack={() => setStage("welcome")}
            onMemories={() => openMemories("environment")}
            onLetter={() => setStage("letter")}
          />
        ) : stage === "letter" ? (
          <LetterPage key="letter" onBack={() => setStage("environment")} onContinue={() => setStage("slideshow")} />
        ) : stage === "slideshow" ? (
          <SlideshowPage key="slideshow" onBack={() => setStage("letter")} onContinue={() => setStage("final")} />
        ) : stage === "final" ? (
          <FinalPage
            key="final"
            onBack={() => setStage("slideshow")}
            onReplay={() => setStage("environment")}
            onMemories={() => openMemories("final")}
          />
        ) : (
          <GalleryPage key="gallery" onBack={() => setStage(galleryFrom)} />
        )}
      </AnimatePresence>

      {/* Music starts on the first tap/click, plays through every scene, and can be turned ON/OFF here. */}
      {ready && (stage === "letter" || stage === "final") && <MusicPlayer variant="full" />}
      {ready && stage !== "letter" && stage !== "final" && <MusicPlayer variant="compact" />}
    </MotionConfig>
  );
}
