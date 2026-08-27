import "../styles/home-hero.css";

const HERO_CHECKS = [
  "Meer klanten",
  "Meer zichtbaarheid",
  "Meer vertrouwen",
  "Alles onder één dak",
];

const GROWTH_METRICS = [
  ["Zichtbaarheid", "+38%"],
  ["Aanvragen", "+21%"],
  ["Mobiele acties", "+34%"],
];

export default function HomeHero() {
  return (
    <>
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">Online groei voor lokale ondernemers</div>

            <h1>
              Meer klanten.
              <br />
              <span>Meer zichtbaarheid.</span>
              <br />
              Minder gedoe.
            </h1>

            <p className="hero-sub">
              Wij helpen lokale ondernemers groeien met websites die vertrouwen wekken, beter
              gevonden worden in Google en meer aanvragen opleveren.
            </p>

            <p className="hero-sub hero-sub-strong">
              Niet alleen een website. Een complete online groeistrategie.
            </p>

            <div className="hero-ctas">
              <a
                href="/online-groei-audit"
                className="hero-btn-primary"
              >
                Gratis Online Groei Audit →
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

          <div className="hero-mockup-wrap" aria-hidden="true">
            <div className="hero-mockup">
              <div className="mockup-bar">
                <div className="mockup-dot" style={{ background: "#ff5f57" }} />
                <div className="mockup-dot" style={{ background: "#febc2e" }} />
                <div className="mockup-dot" style={{ background: "#28c840" }} />
                <div className="mockup-url">
                  <span>vedantix-groeiplan.nl</span>
                </div>
              </div>

              <div className="mockup-header">
                <div className="mockup-label">Online Groei Dashboard</div>
                <div className="mockup-title">Lokale zichtbaarheid stijgt</div>
                <div className="mockup-sub">
                  Website, SEO, reviews en aanvragen werken samen.
                </div>

                <div className="mockup-meta">
                  <span>🔎 Beter gevonden</span>
                  <span>💬 Meer contactmomenten</span>
                </div>
              </div>

              <div className="mockup-services">
                {GROWTH_METRICS.map(([name, value]) => (
                  <div key={name} className="mockup-item">
                    <span>{name}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <div className="mockup-actions">
                <div className="mockup-action mockup-action-primary">Groei Audit</div>
                <div className="mockup-action mockup-action-wa">Nieuwe aanvraag</div>
              </div>
            </div>

            <p className="mockup-note">
              Groei-indicatie • bedoeld om kansen zichtbaar te maken
            </p>
          </div>
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
