import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Globe2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Smartphone,
  Sparkles,
} from "lucide-react";
import "../../styles/hero-live-experience.css";

const STEPS = [
  {
    label: "Website",
    Icon: Globe2,
    title: "Van bezoeker naar aanvraag.",
    text: "Een duidelijke website maakt de eerste stap eenvoudig.",
    activity: "Een nieuwe aanvraag komt binnen",
  },
  {
    label: "AI",
    Icon: Sparkles,
    title: "Minder uitzoeken. Sneller verder.",
    text: "AI bundelt de informatie en bereidt de opvolging voor.",
    activity: "AI zet de informatie voor je klaar",
  },
  {
    label: "App",
    Icon: Smartphone,
    title: "Alles klaar voor jouw volgende stap.",
    text: "De aanvraag staat overzichtelijk in je app. Jij houdt de regie.",
    activity: "Klaar om persoonlijk op te volgen",
  },
];

export default function HeroLiveExperience() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const rootRef = useRef(null);
  const id = `hero-demo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
    const timer = window.setInterval(() => setStep(current => (current + 1) % STEPS.length), 4800);
    return () => window.clearInterval(timer);
  }, [running]);

  function selectStep(index) {
    setStep(index);
    setPaused(true);
  }

  const current = STEPS[step];

  return (
    <figure
      ref={rootRef}
      className="hero-live"
      data-step={step}
      data-running={running}
      aria-labelledby={`${id}-title`}

    >
      <div className="hero-live__halo" aria-hidden="true" />
      <div className="hero-live__topline">
        <span id={`${id}-title`}>Jouw bedrijf, in beweging</span>
        <span className="hero-live__demo-label">Interactieve demo</span>
      </div>

      <div className="hero-live__workspace">
        <div className="hero-live__toolbar">
          <span className="hero-live__window-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>Alles werkt samen</span>
          <span className="hero-live__connection"><i /> Verbonden</span>
        </div>

        <div className="hero-live__scene" aria-hidden="true">
          <div className={`hero-live__website ${step === 0 ? "is-active" : ""}`}>
            <div className="hero-live__website-nav"><span><Globe2 size={13} /> Jouw bedrijf</span><span>•••</span></div>
            <div className="hero-live__website-body">
              <span className="hero-live__tiny-label">Een sterke eerste indruk</span>
              <strong>Goed gevonden.<br /><em>Zo geregeld.</em></strong>
              <div className="hero-live__preview-lines"><i /><i /></div>
              <span className="hero-live__mock-button">Plan een kennismaking <ArrowUpRight size={12} /></span>
            </div>
            <div className="hero-live__request" key={`request-${step}`}>
              <span className="hero-live__request-icon"><MessageSquare size={15} /></span>
              <span><b>Nieuwe aanvraag</b><small>“Ik wil graag kennismaken.”</small></span>
              <span className="hero-live__request-check"><Check size={13} /></span>
            </div>
          </div>

          <div className={`hero-live__phone ${step === 2 ? "is-active" : ""}`}>
            <div className="hero-live__phone-notch" />
            <div className="hero-live__phone-heading"><span>Jouw overzicht</span><Plus size={13} /></div>
            <b className="hero-live__phone-title">Klaar voor<br />de volgende stap.</b>
            <div className={`hero-live__app-task ${step === 2 ? "is-ready" : ""}`}>
              <span className="hero-live__task-icon"><Check size={16} /></span>
              <strong>Nieuwe aanvraag</strong>
              <small>{step === 2 ? "Klaar om op te volgen" : "Wordt voorbereid"}</small>
              <span className="hero-live__task-tag">{step === 2 ? "Opvolgen" : "In behandeling"}</span>
            </div>
            <div className="hero-live__phone-bottom"><i /><i /><i /></div>
          </div>

          <div className="hero-live__bridge"><span /><ArrowDown size={16} /><span /></div>

          <div className={`hero-live__ai ${step === 1 ? "is-active" : ""}`}>
            <span className="hero-live__ai-icon"><Sparkles size={22} /></span>
            <div className="hero-live__ai-content">
              <div className="hero-live__ai-heading"><strong>Je slimme assistent</strong><span>{step === 0 ? "Staat klaar" : step === 1 ? "Aan het werk" : "Voorbereid"}</span></div>
              <div className="hero-live__ai-tasks">
                <span className={step > 0 ? "is-done" : ""}><Check size={12} /> Vraag samengevat</span>
                <span className={step === 2 ? "is-done" : ""}><Check size={12} /> Opvolging voorbereid</span>
              </div>
              <div className="hero-live__processing"><span /></div>
            </div>
          </div>
        </div>

        <div className="hero-live__activity" aria-hidden="true">
          <span className="hero-live__activity-dot" />
          <span key={step}>{current.activity}</span>
          <ArrowUpRight size={15} />
        </div>
      </div>

      <div className="hero-live__controls">
        <div className="hero-live__steps" role="group" aria-label="Kies een stap in de demo">
          {STEPS.map(({ label, Icon }, index) => (
            <button key={label} type="button" aria-pressed={step === index} aria-controls={`${id}-explanation`} onClick={() => selectStep(index)}>
              <Icon size={15} aria-hidden="true" /><span>{label}</span>
              {index < 2 ? <ChevronRight className="hero-live__step-arrow" size={12} aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
        {!reducedMotion ? <button type="button" className="hero-live__play" onClick={() => setPaused(value => !value)} aria-label={paused ? "Demo afspelen" : "Demo pauzeren"}>
          {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
        </button> : null}
      </div>
      <figcaption id={`${id}-explanation`} className="hero-live__caption" aria-live={paused ? "polite" : "off"} aria-atomic="true">
        <strong>{current.title}</strong><span>{current.text}</span>
      </figcaption>
    </figure>
  );
}
