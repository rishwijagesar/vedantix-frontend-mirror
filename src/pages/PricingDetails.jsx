import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import "../styles/pricing-details.css";
import { fetchPackages } from "../api/pricing.api";

const PACKAGE_DETAILS_FALLBACK = {
  starter: {
    included: ["Professionele website", "Tot 5 pagina’s", "1 zakelijk mailadres", "Mobielvriendelijk ontwerp", "Contactformulier en WhatsApp-knop", "Onderhoud en kleine updates", "Je website blijft online en veilig"],
    notIncluded: ["Geen klantomgeving of login", "Geen uitgebreide reserveringsmodule", "Geen maatwerk functionaliteit", "Niet bedoeld voor complexe processen"],
    addons: ["Extra mailadressen", "Extra pagina’s", "Lokale SEO uitbreiding", "Blog of FAQ uitbreiding", "Extra formulieren of secties"],
  },
  growth: {
    included: ["Alles uit Starter", "Meer pagina’s en meer inhoud", "5 zakelijke mailadressen", "Blog of FAQ mogelijk", "Sterkere SEO-opbouw", "Meer ruimte voor dienstenpagina’s en landingspagina’s"],
    notIncluded: ["Geen uitgebreide klantomgeving standaard", "Geen zwaar maatwerk standaard", "Niet bedoeld voor complexe interne workflows"],
    addons: ["Extra pagina’s", "Extra mailadressen", "Reserveringsmodule", "Uitgebreidere leadformulieren", "Extra SEO-landingspagina’s"],
  },
  pro: {
    included: ["Alles uit Growth", "10 zakelijke mailadressen", "Klantomgeving of dashboard mogelijk", "Reserveringen, intake of workflows mogelijk", "Meer maatwerk en doorontwikkeling", "Geschikt voor bedrijven die online processen willen ondersteunen"],
    notIncluded: ["Zeer specialistisch maatwerk alleen op offertebasis"],
    addons: ["Extra mailadressen", "Extra opslag of uitgebreide formulieren", "Extra beveiliging", "Extra maatwerk modules"],
  },
  custom: {
    included: ["Scope op maat", "Geschikt voor complexere wensen", "Mogelijkheid tot koppelingen en afwijkende flows", "Maatwerk op basis van jouw proces"],
    notIncluded: ["Geen vaste standaardscope", "Geen vaste standaarddoorlooptijd", "Prijs alleen op basis van concrete invulling"],
    addons: ["Externe integraties", "Complexe dashboards", "Geavanceerde workflows", "Aanvullende maatwerkmodules"],
  },
};

const PACKAGE_META_FALLBACK = {
  STARTER: {
    title: "Voor professioneel online zichtbaar zijn",
    note: "Geschikt als instap wanneer je vooral professioneel zichtbaar wilt zijn zonder extra complexiteit.",
  },
  GROWTH: {
    title: "Voor meer aanvragen en groeiruimte",
    note: "Beste balans tussen prijs, inhoud en groeiruimte voor de meeste lokale ondernemers.",
  },
  PRO: {
    title: "Voor functionaliteit en doorontwikkeling",
    note: "Voor bedrijven die hun website echt als onderdeel van hun proces of dienstverlening willen inzetten.",
  },
  CUSTOM: {
    title: "Voor maatwerk en afwijkende trajecten",
    note: "Voor bedrijven met afwijkende wensen, extra logica of een traject dat niet netjes binnen een standaard pakket past.",
  },
};

const MAILBOX_BUNDLES = [
  "Starter: 1 zakelijk mailadres inbegrepen",
  "Growth: 5 zakelijke mailadressen inbegrepen",
  "Pro: 10 zakelijke mailadressen inbegrepen",
  "Custom: afhankelijk van scope en voorstel",
  "Extra mailadressen kunnen later worden toegevoegd",
  "Aliassen zoals info@ of hello@ zijn vaak slim genoeg voor kleinere teams",
];

const DATA_RULES = [
  "Starter is bedoeld voor een duidelijke bedrijfswebsite zonder complexe functionaliteit",
  "Growth biedt meer ruimte voor formulieren, inhoud en uitbreidingen",
  "Pro is bedoeld voor bedrijven die ook processen via hun website willen ondersteunen",
  "Custom is voor trajecten die buiten de standaard pakketten vallen",
  "Complex maatwerk wordt alleen toegevoegd als het echt nodig is",
  "Je betaalt dus niet direct voor techniek die je nog niet gebruikt",
];

const PACKAGE_BASICS = [
  "Professionele uitstraling",
  "Mobielvriendelijke website",
  "Onderhoud en support",
  "Eén vast aanspreekpunt",
  "Duidelijke maandprijs",
  "Geen technisch gedoe",
  "Gebouwd voor lokale ondernemers",
];

function currency(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizePackages(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.packages)) return payload.packages;
  if (Array.isArray(payload?.data?.packages)) return payload.data.packages;
  return [];
}

function slugFromCode(code) {
  return String(code || "").toLowerCase();
}

function headClass(slug) {
  if (slug === "starter") return "starter";
  if (slug === "growth") return "growth";
  if (slug === "pro") return "pro";
  return "custom";
}

function listOrFallback(value, fallback) {
  return Array.isArray(value) && value.length > 0 ? value : fallback;
}

export default function PricingDetails() {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchPackages()
      .then((result) => {
        if (!active) return;
        setPackages(normalizePackages(result));
      })
      .catch(() => {
        if (!active) return;
        setPackages([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visiblePackages = useMemo(() => {
    return [...packages]
      .filter((item) => item?.isActive !== false)
      .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0));
  }, [packages]);

  return (
    <>
      <SEO
        title="Pakketvergelijking | Vedantix"
        description="Vergelijk alle Vedantix pakketten en zie in gewone taal welk pakket past bij jouw bedrijf, doelen en groeifase."
        canonical="https://vedantix.nl/pakketvergelijking"
      />

      <div className="pricing-page">
        <NavBar />

        <main>
          <section className="page-hero">
            <div className="page-wrap">
              <div className="eyebrow">Pakketvergelijking</div>
              <h1>Vergelijk de pakketten en kies wat past bij jouw bedrijf</h1>
              <p>
                Hier zie je in gewone taal welk pakket past bij jouw fase:
                professioneel zichtbaar zijn, meer aanvragen genereren of extra
                functionaliteit toevoegen aan je website.
              </p>
            </div>
          </section>

          <section className="section">
            <div className="page-wrap">
              <h2 className="section-title">Vergelijk de pakketten naast elkaar</h2>
              <p className="section-sub">
                Dit overzicht haalt de prijzen en inhoud op uit dezelfde bron als je admin dashboard.
                Als jij teksten of prijzen aanpast in admin, zie je dat hier ook terug.
              </p>

              {isLoading ? (
                <div className="pricing-loading-card">Pakketten laden...</div>
              ) : (
                <div className={`pricing-compare-table ${visiblePackages.length === 4 ? "is-four-columns" : ""}`}>
                  {visiblePackages.map((pkg) => {
                    const slug = slugFromCode(pkg.code);
                    const fallbackDetails = PACKAGE_DETAILS_FALLBACK[slug] || {
                      included: [],
                      notIncluded: [],
                      addons: [],
                    };
                    const fallbackMeta = PACKAGE_META_FALLBACK[pkg.code] || {
                      title: pkg.label,
                      note: "Neem contact op voor de precieze invulling van dit pakket.",
                    };

                    const monthlyIncl = Number(pkg.monthlyPriceInclVat ?? pkg.monthlyPrice ?? 0);
                    const setupIncl = Number(pkg.setupPriceInclVat ?? pkg.setupPrice ?? 0);

                    const included = listOrFallback(pkg.included, fallbackDetails.included);
                    const notIncluded = listOrFallback(pkg.notIncluded, fallbackDetails.notIncluded);
                    const addons = listOrFallback(pkg.addons, fallbackDetails.addons);

                    return (
                      <div key={pkg.code} className={`pricing-column ${pkg.featured ? "featured" : ""}`}>
                        <div className={`pricing-head ${headClass(slug)}`}>
                          <div className="pricing-tag">
                            {pkg.label}
                            {pkg.featured ? <span className="pricing-featured-badge">Meest gekozen</span> : null}
                          </div>

                          <div className="pricing-title">{pkg.description || fallbackMeta.title}</div>
                          <div className="pricing-sub">{pkg.fit || "Pakketinformatie"}</div>
                        </div>

                        <div className="pricing-price-wrap">
                          <div className="pricing-price">
                            <sup>€</sup>
                            {Math.round(monthlyIncl)}
                            <span>/m</span>
                          </div>

                          <div className="pricing-setup">
                            + {currency(setupIncl)} eenmalige setup
                          </div>

                          <div className="pricing-terms">
                            {pkg.cancelNote || "Neem contact op voor de precieze voorwaarden."}
                          </div>
                        </div>

                        <div className="pricing-section-block">
                          <div className="pricing-block-title">Inbegrepen</div>
                          <ul className="pricing-list">
                            {included.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>

                        <div className="pricing-section-block">
                          <div className="pricing-block-title">Niet inbegrepen</div>
                          <ul className="pricing-list minus">
                            {notIncluded.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>

                        <div className="pricing-section-block">
                          <div className="pricing-block-title">Uitbreidingen</div>
                          <ul className="pricing-list">
                            {addons.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>

                        <div className="pricing-cta-note">{fallbackMeta.note}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="section alt">
            <div className="page-wrap">
              <h2 className="section-title">Belangrijke nuances</h2>
              <p className="section-sub">
                Extra context over mailadressen, uitbreidingen en wat in alle pakketten centraal staat.
              </p>

              <div className="notes-grid">
                <div className="note-card">
                  <h3>Mailadressen</h3>
                  <ul>{MAILBOX_BUNDLES.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>

                <div className="note-card">
                  <h3>Groei en functionaliteit</h3>
                  <ul>{DATA_RULES.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>

                <div className="note-card">
                  <h3>In alle pakketten centraal</h3>
                  <ul>{PACKAGE_BASICS.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>

              <a href="/" className="back-link">← Terug naar homepage</a>
            </div>
          </section>
        </main>

      </div>
    </>
  );
}
