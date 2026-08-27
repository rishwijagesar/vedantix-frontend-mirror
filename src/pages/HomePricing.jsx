import React, { useEffect, useMemo, useState } from "react";
import "../styles/home-pricing.css";
import { fetchPricingSummary } from "../api/pricing.api";

const DEFAULT_PRICING = {
  packages: [],
  addons: [],
};

function currency(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function activePackageOptions(options) {
  return [...options]
    .filter((item) => item.isActive !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

const PACKAGE_COPY = {
  STARTER: { tier: "Starter", name: "", fit: "", featured: false, cancelNote: "", bullets: [], cta: "" },
  GROWTH: { tier: "Growth", name: "", fit: "", featured: true, cancelNote: "", bullets: [], cta: "" },
  PRO: { tier: "Pro", name: "", fit: "", featured: false, cancelNote: "", bullets: [], cta: "" },
  CUSTOM: { tier: "Custom", name: "", fit: "", featured: false, cancelNote: "", bullets: [], cta: "" },
};

const CUSTOMER_FRIENDLY_BULLETS = {
  STARTER: [
    "Professionele website tot 5 pagina's",
    "Wij houden je website veilig en bereikbaar",
    "Contactformulier en WhatsApp-knop",
  ],
  GROWTH: [
    "Uitgebreide website tot 10 pagina's",
    "Meer aandacht voor lokale vindbaarheid",
    "Snellere hulp en doorlopende verbeteringen",
  ],
  PRO: [
    "Uitgebreide website met groeiruimte",
    "Doorlopende verbetering voor Google en AI-tools",
    "Voorrang bij ondersteuning en meer maatwerk",
  ],
};

export default function HomePricing() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchPricingSummary();
        if (!active) return;

        setPricing({
          packages: Array.isArray(data?.packages) ? data.packages : [],
          addons: Array.isArray(data?.addons) ? data.addons : [],
        });
      } catch {
        if (!active) return;
        setPricing(DEFAULT_PRICING);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const packages = useMemo(() => {
    return activePackageOptions(pricing.packages || []).map((pkg) => {
      const copy = PACKAGE_COPY[pkg.code] || {
        tier: pkg.label,
        name: "",
        fit: "",
        featured: false,
        cancelNote: "",
        bullets: [],
        cta: "",
      };

      return {
        code: pkg.code,
        tier: pkg.label || copy.tier,
        name: pkg.description || copy.name || pkg.label,
        fit: pkg.fit || copy.fit || "Pakketinformatie",
        featured: Boolean(pkg.featured ?? copy.featured),
        cancelNote: pkg.cancelNote || copy.cancelNote || "Neem contact op voor details",
        bullets: CUSTOMER_FRIENDLY_BULLETS[pkg.code]
          || (Array.isArray(pkg.bullets) && pkg.bullets.length > 0 ? pkg.bullets : copy.bullets),
        cta: pkg.cta || copy.cta || `Bespreek ${pkg.label} →`,
        priceInclVat: Number(pkg.monthlyPriceInclVat || 0),
        setupInclVat: Number(pkg.setupPriceInclVat || 0),
      };
    });
  }, [pricing]);

  return (
    <section id="pricing" className="pricing-section anchor-section">
      <div className="section-wrap">
        <div className="pricing-intro">
          <div className="pricing-kicker">
            Kies niet alleen een website — kies hoeveel hij voor je moet doen
          </div>
        </div>

        <div className="section-header center">
          <div className="section-label">Pakketten</div>
          <h2 className="section-h2">
            Kies eenmalig of laat ons voor je website zorgen
          </h2>
          <p className="section-p">
            Betaal je website één keer en beheer hem daarna zelf, of kies voor een abonnement
            waarbij Vedantix je website online, veilig en actueel houdt.
          </p>
        </div>

        <div className="pricing-payment-choice">
          <div>
            <span>Voor starters en zelfbeheerders</span>
            <strong>Eenmalige websites vanaf €1.295</strong>
            <p>Geen verplicht maandabonnement. Losse diensten voeg je alleen toe als je ze nodig hebt.</p>
          </div>
          <div>
            <span>Voor volledige ontzorging</span>
            <strong>Vanaf €99 per maand + bouw en inrichting</strong>
            <p>Wij blijven je website online houden, bijwerken en ondersteunen.</p>
          </div>
          <a href="/prijzen">Vergelijk beide mogelijkheden →</a>
        </div>

        <div className="pricing-grid">
          {packages.map((pkg) => (
            <div key={pkg.code} className={`pricing-card ${pkg.featured ? "featured" : ""}`}>
              {pkg.featured && <div className="pricing-badge">Meest gekozen</div>}

              <div className="p-tier">{pkg.tier}</div>
              <div className="p-name">{pkg.name}</div>
              <div className="p-fit">{pkg.fit}</div>

              <div className="p-price-row">
                <div className="p-price">
                  <sup>€</sup>
                  {Math.round(pkg.priceInclVat)}
                  <span>/m</span>
                </div>
              </div>

              <div className="p-setup">+ {currency(pkg.setupInclVat)} eenmalige setup</div>

              <div className="p-terms">{pkg.cancelNote}</div>
              <div className="p-divider" />

              <ul className="p-features">
                {pkg.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <a
                href={`https://wa.me/310626219989?text=${encodeURIComponent(
                  `Hallo Vedantix, ik wil graag meer weten over het ${pkg.tier} pakket en of dit bij mijn bedrijf past.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className={`p-cta ${pkg.featured ? "featured" : "default"}`}
              >
                {pkg.cta}
              </a>
            </div>
          ))}

          {!loading && packages.length === 0 && (
            <div className="pricing-empty">
              Momenteel zijn er geen actieve pakketten zichtbaar.
            </div>
          )}
        </div>

        <div className="pricing-decision">
          <h3>Twijfel je tussen de pakketten?</h3>
          <p>
            In de meeste gevallen is <strong>Growth</strong> de beste keuze. Dat pakket geeft
            meestal de beste balans tussen professionele uitstraling, groeiruimte en meer
            aanvragen.
          </p>
        </div>

        <div className="pricing-help">
          <a href="/prijzen#vergelijk">Bekijk de uitgebreide pakketvergelijking →</a>
        </div>
      </div>
    </section>
  );
}
