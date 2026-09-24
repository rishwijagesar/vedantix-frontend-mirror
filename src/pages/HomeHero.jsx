import HeroGrowthChart from "../components/home/HeroGrowthChart";
import "../styles/home-hero.css";

const HERO_CHECKS = [
  "Meer klanten",
  "Meer zichtbaarheid",
  "Minder handwerk",
  "Alles onder één dak",
];

export default function HomeHero() {
  return (
    <>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">Websites, AI & apps voor ondernemers</div>

            <h1>
              Meer klanten.
              <br />
              <span>Meer zichtbaarheid.</span>
              <br />
              Minder gedoe.
            </h1>

            <p className="hero-sub">
              Websites die klanten aantrekken. AI en apps die werk uit handen nemen.
              Wij helpen jouw bedrijf groeien én slimmer werken.
            </p>

            <p className="hero-sub hero-sub-strong">
              Van eerste idee tot een oplossing die voor je werkt.
            </p>

            <div className="hero-ctas">
              <a
                href="/diensten"
                className="hero-btn-primary"
              >
                Ontdek onze diensten →
              </a>

              <a
                href="https://wa.me/31626219989?text=Hallo%20Vedantix%2C%20ik%20wil%20graag%20een%20kennismaking%20plannen%20over%20online%20groei."
                target="_blank"
                rel="noreferrer"
                className="hero-btn-ghost"
              >
                Plan een Kennismaking →
              </a>
            </div>

            <div className="hero-cta-note">
              Vrijblijvend advies · focus op groei · geen technische rompslomp
            </div>
          </div>

          <HeroGrowthChart />
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
