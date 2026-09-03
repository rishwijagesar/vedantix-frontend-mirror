import React from "react";
import "../styles/home-pricing.css";

const PACKAGES = [
  {
    code: "STARTER",
    tier: "Starter",
    name: "Professionele onepage",
    fit: "Voor starters en zzp'ers",
    featured: false,
    price: 399,
    bullets: [
      "Professionele responsive onepage",
      "Contactformulier en WhatsApp-knop",
      "Technische SEO-basis voor Google",
    ],
  },
  {
    code: "GROWTH",
    tier: "Growth",
    name: "Complete bedrijfswebsite",
    fit: "Voor lokale bedrijven met meerdere diensten",
    featured: true,
    price: 599,
    bullets: [
      "Tot 5 pagina's met sterke dienstenstructuur",
      "SEO en lokale vindbaarheidsbasis",
      "AEO-basis met FAQ en structured data",
    ],
  },
  {
    code: "PRO",
    tier: "Pro",
    name: "Website voor online groei",
    fit: "Voor bedrijven die meer uit hun website willen halen",
    featured: false,
    price: 999,
    bullets: [
      "Tot 10 pagina's en meer maatwerkruimte",
      "Uitgebreidere SEO en lokale structuur",
      "AEO + GEO/AIO-basis voor AI-platformen",
    ],
  },
];

export default function HomePricing() {
  return (
    <section id="pricing" className="pricing-section anchor-section">
      <div className="section-wrap">
        <div className="pricing-intro">
          <div className="pricing-kicker">
            Professionele websites zonder verplicht bureau-abonnement
          </div>
        </div>

        <div className="section-header center">
          <div className="section-label">Pakketten</div>
          <h2 className="section-h2">
            Begin betaalbaar. Voeg groei toe wanneer je die nodig hebt.
          </h2>
          <p className="section-p">
            Je betaalt de website één keer. Hosting kost vanaf €30 per jaar. SEO, AEO,
            GEO/AIO en doorlopende groei kun je uitbreiden zonder dat iedere klant daarvoor
            standaard een maandabonnement nodig heeft.
          </p>
        </div>

        <div className="pricing-payment-choice">
          <div>
            <span>Website laten maken</span>
            <strong>Vanaf €399 eenmalig</strong>
            <p>Geen verplicht maandabonnement. Je kiest alleen wat bij jouw bedrijf past.</p>
          </div>
          <div>
            <span>Hosting & zakelijke e-mail</span>
            <strong>Vanaf €30 per jaar</strong>
            <p>Hosting en mailboxen staan los van je websitepakket en blijven transparant geprijsd.</p>
          </div>
          <a href="/prijzen">Bekijk alle prijzen en vindbaarheid →</a>
        </div>

        <div className="pricing-grid">
          {PACKAGES.map((pkg) => (
            <div key={pkg.code} className={`pricing-card ${pkg.featured ? "featured" : ""}`}>
              {pkg.featured && <div className="pricing-badge">Meest gekozen</div>}

              <div className="p-tier">{pkg.tier}</div>
              <div className="p-name">{pkg.name}</div>
              <div className="p-fit">{pkg.fit}</div>

              <div className="p-price-row">
                <div className="p-price">
                  <sup>€</sup>
                  {pkg.price}
                  <span> eenmalig</span>
                </div>
              </div>

              <div className="p-setup">Daarna €0 verplicht per maand</div>

              <div className="p-terms">Alle websiteprijzen zijn inclusief btw</div>
              <div className="p-divider" />

              <ul className="p-features">
                {pkg.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <a
                href={`https://wa.me/310626219989?text=${encodeURIComponent(
                  `Hallo Vedantix, ik wil graag meer weten over het ${pkg.tier}-websitepakket van €${pkg.price}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className={`p-cta ${pkg.featured ? "featured" : "default"}`}
              >
                Bespreek {pkg.tier} →
              </a>
            </div>
          ))}
        </div>

        <div className="pricing-decision">
          <h3>Google én AI-vindbaarheid nodig?</h3>
          <p>
            <strong>Growth</strong> geeft een goede SEO- en AEO-basis. Met <strong>Pro</strong>
            voegen we daar een uitgebreidere GEO/AIO-basis aan toe. Voor structurele groei kun je
            daarna een optioneel Google- of Google + AI-groeipakket kiezen.
          </p>
        </div>

        <div className="pricing-help">
          <a href="/prijzen#vergelijk">Vergelijk SEO, AEO, GEO en AIO per pakket →</a>
        </div>
      </div>
    </section>
  );
}
