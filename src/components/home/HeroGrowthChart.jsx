import { useEffect, useId, useRef } from "react";
import { Check, MessageSquare, Search, TrendingUp, Users } from "lucide-react";
import "../../styles/hero-growth-chart.css";

const STAGES = [
  { label: "Beter gevonden", Icon: Search, threshold: 0.18 },
  { label: "Meer aanvragen", Icon: MessageSquare, threshold: 0.54 },
  { label: "Meer klanten", Icon: Users, threshold: 0.96 },
];

function growthPath(width, height) {
  const left = 10;
  const span = width - 24;
  const x = (fraction) => left + span * fraction;
  const y = (value) => (value / 280) * height;
  return `M ${left} ${y(247)} C ${x(0.12)} ${y(247)} ${x(0.2)} ${y(239)} ${x(0.29)} ${y(220)} S ${x(0.44)} ${y(209)} ${x(0.52)} ${y(181)} S ${x(0.66)} ${y(169)} ${x(0.74)} ${y(128)} S ${x(0.88)} ${y(103)} ${x(1)} ${y(47)}`;
}

// Server-rendered artwork stays visible when JavaScript or observers are unavailable.
const INITIAL_PATH = growthPath(520, 320);

export default function HeroGrowthChart() {
  const rootRef = useRef(null);
  const id = `hero-growth-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const plot = root.querySelector("svg[data-growth-plot]");
    const line = root.querySelector("[data-growth-line]");
    const glow = root.querySelector("[data-growth-glow]");
    const area = root.querySelector("[data-growth-area]");
    const reveal = root.querySelector("[data-growth-reveal]");
    const heads = root.querySelectorAll("[data-growth-head]");
    const labels = root.querySelectorAll("[data-growth-stage]");
    const dots = root.querySelectorAll("[data-growth-dot]");
    const grid = root.querySelectorAll("[data-growth-grid]");
    const notice = root.querySelector("[data-growth-notice]");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let length = 1;
    let progress = 1;
    let animationFrame = 0;
    let started = false;

    function paint(nextProgress) {
      progress = nextProgress;
      const offset = length * (1 - progress);
      line.style.strokeDashoffset = String(offset);
      glow.style.strokeDashoffset = String(offset);
      const current = line.getPointAtLength(length * progress);
      reveal.setAttribute("width", String(current.x + 1));
      heads.forEach((head) => {
        head.setAttribute("cx", String(current.x));
        head.setAttribute("cy", String(current.y));
      });
      STAGES.forEach(({ threshold }, index) => {
        const active = progress >= threshold;
        labels[index].style.opacity = active ? "1" : "0.3";
        dots[index].style.opacity = active ? "1" : "0.12";
      });
      notice.style.opacity = progress > 0.97 ? "1" : "0";
      notice.style.transform = progress > 0.97 ? "translateY(0)" : "translateY(8px)";
    }

    function resize() {
      const { width, height } = plot.getBoundingClientRect();
      if (!width || !height) return;
      const path = growthPath(width, height);
      plot.setAttribute("viewBox", `0 0 ${width} ${height}`);
      line.setAttribute("d", path);
      glow.setAttribute("d", path);
      area.setAttribute("d", `${path} L ${width - 14} ${height} L 10 ${height} Z`);
      reveal.setAttribute("height", String(height));
      length = line.getTotalLength();
      line.style.strokeDasharray = String(length);
      glow.style.strokeDasharray = String(length);
      grid.forEach((mark, index) => {
        const y = height * [0.23, 0.47, 0.71, 0.99][index];
        mark.setAttribute("x2", String(width - 10));
        mark.setAttribute("y1", String(y));
        mark.setAttribute("y2", String(y));
      });
      STAGES.forEach(({ threshold }, index) => {
        const point = line.getPointAtLength(length * threshold);
        dots[index].setAttribute("cx", String(point.x));
        dots[index].setAttribute("cy", String(point.y));
        const halfLabel = labels[index].getBoundingClientRect().width / 2;
        const labelX = Math.min(width - halfLabel - 2, Math.max(halfLabel + 2, point.x));
        // Keep the whole label below the curve, including its downhill left edge.
        const labelLeft = Math.max(10, labelX - halfLabel);
        let low = 0;
        let high = length;
        for (let sample = 0; sample < 16; sample += 1) {
          const middle = (low + high) / 2;
          if (line.getPointAtLength(middle).x < labelLeft) low = middle;
          else high = middle;
        }
        const labelY = line.getPointAtLength(high).y + 12;
        labels[index].style.left = `${labelX}px`;
        labels[index].style.top = `${labelY}px`;
      });
      paint(progress);
    }

    function animate() {
      if (started || motion.matches) return;
      started = true;
      const start = performance.now();
      paint(0);
      function tick(now) {
        const elapsed = Math.min((now - start) / 3600, 1);
        const eased = elapsed < 0.5 ? 2 * elapsed * elapsed : 1 - Math.pow(-2 * elapsed + 2, 2) / 2;
        paint(eased);
        if (elapsed < 1) animationFrame = requestAnimationFrame(tick);
      }
      animationFrame = requestAnimationFrame(tick);
    }

    function motionChanged() {
      if (motion.matches) {
        cancelAnimationFrame(animationFrame);
        paint(1);
      }
    }

    resize();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(plot);
    const visibilityObserver = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            animate();
            visibilityObserver.disconnect();
          }
        }, { threshold: 0.3 })
      : null;
    visibilityObserver?.observe(root);
    motion.addEventListener("change", motionChanged);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      motion.removeEventListener("change", motionChanged);
    };
  }, []);

  return (
    <figure className="hero-growth-chart" ref={rootRef} aria-labelledby={`${id}-caption`}>
      <div className="hero-growth-chart__heading">
        <span>Ruimte om te groeien</span>
        <TrendingUp size={20} aria-hidden="true" />
      </div>
      <div className="hero-growth-chart__canvas">
        <svg className="hero-growth-chart__plot" data-growth-plot viewBox="0 0 520 320" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-line`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#64a6ff" />
              <stop offset="100%" stopColor="#a58aff" />
            </linearGradient>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8c82ff" stopOpacity="0.23" />
              <stop offset="100%" stopColor="#648dff" stopOpacity="0" />
            </linearGradient>
            <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <clipPath id={`${id}-clip`}>
              <rect data-growth-reveal x="0" y="0" width="520" height="320" />
            </clipPath>
          </defs>
          {[74, 150, 227, 317].map((y) => (
            <line key={y} data-growth-grid className="hero-growth-chart__grid" x1="10" x2="510" y1={y} y2={y} />
          ))}
          <path data-growth-area d={`${INITIAL_PATH} L 506 320 L 10 320 Z`} fill={`url(#${id}-fill)`} clipPath={`url(#${id}-clip)`} />
          <path data-growth-glow d={INITIAL_PATH} fill="none" stroke={`url(#${id}-line)`} strokeWidth="9" opacity="0.36" filter={`url(#${id}-glow)`} />
          <path data-growth-line d={INITIAL_PATH} fill="none" stroke={`url(#${id}-line)`} strokeWidth="3.5" strokeLinecap="round" />
          {STAGES.map(({ label }, index) => (
            <circle key={label} data-growth-dot cx={[123, 320, 496][index]} cy={[271, 184, 70][index]} r="4" fill="#a8b8ff" stroke="#12213f" strokeWidth="2" />
          ))}
          <circle data-growth-head cx="506" cy="53.7" r="12" fill="#a58aff" opacity="0.16" />
          <circle data-growth-head cx="506" cy="53.7" r="4.5" fill="#e7e1ff" />
        </svg>
        {STAGES.map(({ label, Icon }, index) => (
          <span key={label} data-growth-stage className={`hero-growth-chart__stage hero-growth-chart__stage--${index}`}>
            <Icon size={15} aria-hidden="true" />
            {label}
          </span>
        ))}
        <div className="hero-growth-chart__notice" data-growth-notice aria-hidden="true">
          <span className="hero-growth-chart__check"><Check size={17} /></span>
          <span><strong>Nieuwe aanvraag</strong><small>Via jouw website</small></span>
          <span className="hero-growth-chart__example">Voorbeeld</span>
        </div>
      </div>
      <div className="hero-growth-chart__baseline" aria-hidden="true">
        <span>Jouw online basis</span>
        <span>Jouw volgende stap ↗</span>
      </div>
      <figcaption id={`${id}-caption`}>Illustratie van groeipotentieel</figcaption>
    </figure>
  );
}
