import { useEffect, useRef, useState } from "react";
import {
  Check,
  MessageSquare,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import "../../styles/hero-live-experience.css";

const STEPS = [
  {
    Icon: MessageSquare,
    title: "Een nieuwe aanvraag.",
    text: "Binnen via jouw website.",
  },
  {
    Icon: Sparkles,
    title: "AI zet alles klaar.",
    text: "Minder handwerk. Meer overzicht.",
  },
  {
    Icon: Check,
    title: "Klaar voor opvolging.",
    text: "Alles op één plek in jouw app.",
  },
];

export default function HeroLiveExperience() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const rootRef = useRef(null);
  const running = inView && pageVisible && !paused && !reducedMotion;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      setReducedMotion(motion.matches);
      if (motion.matches) setStep(2);
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 })
      : null;
    if (observer && rootRef.current) observer.observe(rootRef.current);
    else setInView(true);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setStep(current => (current + 1) % STEPS.length), 6000);
    return () => window.clearInterval(timer);
  }, [running]);

  const current = STEPS[step];
  const Icon = current.Icon;

  return (
    <figure
      ref={rootRef}
      className="hero-live"
      data-step={step}
      data-running={running}
      aria-label="Voorbeeld: een aanvraag via je website, voorbereid met AI en klaar in je app."
    >
      <div className="hero-live__card">
        <div className="hero-live__status" key={step} aria-hidden="true">
          <span className="hero-live__icon"><Icon size={20} strokeWidth={1.5} /></span>
          <div>
            <span className="hero-live__example">Voorbeeld</span>
            <strong>{current.title}</strong>
            <p>{current.text}</p>
          </div>
        </div>
          {!reducedMotion ? (
            <button
              type="button"
              className="hero-live__play"
              onClick={() => setPaused(value => !value)}
              aria-label={paused ? "Animatie afspelen" : "Animatie pauzeren"}
            >
              {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
            </button>
          ) : null}
      </div>
    </figure>
  );
}
