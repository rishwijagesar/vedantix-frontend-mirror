import { SOFTWARE_HEADLINE, SOFTWARE_INTRO, SCAN_URL } from "../data/positioning";
import HeroLiveExperience from "../components/home/HeroLiveExperience";
import "../styles/home-hero.css";

const HERO_CHECKS = [
  "Jouw processen centraal",
  "Minder dubbel werk",
  "Zorgvuldig getest",
  "Heldere beheerafspraken",
];

export default function HomeHero() {
  return (
    <>
      <section className="hero hero--photo">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">Software op maat voor mkb en zelfstandigen</div>

            <h1>
              Software die meegroeit
              <br />
              <span>met jouw bedrijf.</span>
            </h1>

            <p className="hero-sub">
              {SOFTWARE_INTRO}
            </p>

            <div className="hero-ctas">
              <a
                href={SCAN_URL}
                className="hero-btn-primary"
              >
                Plan een bedrijfsscan →
              </a>

              <a
                href="/website-laten-maken"
                className="hero-btn-ghost"
              >
                Website laten maken →
              </a>
            </div>

            <div className="hero-cta-note">
              Processen eerst · gefaseerd bouwen · afspraken vooraf
            </div>
          </div>

        </div>
        <div className="hero-visual">
          <picture>
            <source
              srcSet="/images/vedantix-ondernemers-hero-small.webp 768w, /images/vedantix-ondernemers-hero.webp 1536w"
              sizes="(max-width: 900px) 100vw, 68vw"
              type="image/webp"
            />
            <img
              src="/images/vedantix-ondernemers-hero.webp"
              alt="Sfeerbeeld van twee ondernemers die tevreden samen aan een laptop werken."
              width="1536"
              height="1024"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <HeroLiveExperience />
        </div>
      </section>

      <section className="hero-trust-section" aria-label="Waarom ondernemers kiezen voor Vedantix">
        <div className="hero-trust-container">
          {HERO_CHECKS.map((item) => (
            <div className="hero-trust-item" key={item}>
              <div className="hero-trust-stat">✓ {item}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="hero-sticky-cta">
        <a
          href="https://wa.me/31626219989"
          target="_blank"
          rel="noreferrer"
          className="hero-btn-wa"
        >
          💬 Start gesprek
        </a>
      </div>
    </>
  );
}
