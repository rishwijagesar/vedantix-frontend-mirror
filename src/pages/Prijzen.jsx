import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  FilePlus2,
  Globe2,
  Headphones,
  Mail,
  MessageCircle,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { fetchPricingSummary } from "../api/pricing.api";
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/prijzen.css";

const FALLBACK_PACKAGES = [
  {
    code: "STARTER",
    label: "Starter",
    description: "Voor een professionele website zonder onnodige extra's.",
    monthlyPriceInclVat: 99,
    setupPriceInclVat: 999,
    featured: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: "GROWTH",
    label: "Growth",
    description: "Voor bedrijven die meer diensten en groeiruimte nodig hebben.",
    monthlyPriceInclVat: 149,
    setupPriceInclVat: 1499,
    featured: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: "PRO",
    label: "Pro",
    description: "Voor bedrijven met uitgebreidere wensen en meer maatwerk.",
    monthlyPriceInclVat: 249,
    setupPriceInclVat: 1999,
    featured: false,
    isActive: true,
    sortOrder: 3,
  },
];

const ONE_TIME_PACKAGES = [
  {
    code: "STARTER",
    label: "Starter",
    description: "Voor starters en zzp'ers die professioneel online willen.",
    oneTimePriceInclVat: 1295,
    sortOrder: 1,
  },
  {
    code: "GROWTH",
    label: "Growth",
    description: "Voor bedrijven met meerdere diensten en meer groeiruimte.",
    oneTimePriceInclVat: 1995,
    sortOrder: 2,
  },
  {
    code: "PRO",
    label: "Pro",
    description: "Voor een uitgebreide website met ruimte voor maatwerk.",
    oneTimePriceInclVat: 2995,
    sortOrder: 3,
  },
];

const PACKAGE_META = {
  STARTER: {
    label: "Professionele basis",
    pages: "Tot 5 pagina's",
    features: [
      "Contactformulier en WhatsApp-knop",
      "Sterke basis voor Google en AI-tools",
      "3 feedbackrondes",
    ],
  },
  GROWTH: {
    label: "Voor lokale groei",
    pages: "Tot 10 pagina's",
    features: [
      "Diensten-, review- en FAQ-opbouw",
      "Extra aandacht voor lokale vindbaarheid",
      "Meer ruimte voor contactmomenten",
    ],
  },
  PRO: {
    label: "Maximale slagkracht",
    pages: "Tot 20 pagina's",
    features: [
      "Commerciële structuur en positionering",
      "Uitgebreide Google- en AI-vindbaarheid",
      "Koppelingen en functies op maat",
    ],
  },
};

const COMPARISON_ROWS = [
  {
    label: "Website",
    values: {
      STARTER: "Tot 5 pagina's",
      GROWTH: "Tot 10 pagina's",
      PRO: "Tot 20 pagina's",
    },
  },
  {
    label: "Feedbackrondes",
    values: { STARTER: "3", GROWTH: "3", PRO: "3" },
  },
  {
    label: "Google-vindbaarheid",
    values: {
      STARTER: "Sterke basis",
      GROWTH: "Lokale groeibasis",
      PRO: "Uitgebreid",
    },
  },
  {
    label: "AI-vindbaarheid",
    values: {
      STARTER: "Sterke basis",
      GROWTH: "Uitgebreidere inhoud",
      PRO: "Uitgebreid",
    },
  },
  {
    label: "Reviews en bewijs",
    values: {
      STARTER: "Reviewsectie",
      GROWTH: "Uitgebreide opbouw",
      PRO: "Reviewstrategie",
    },
  },
  {
    label: "Maatwerk",
    values: {
      STARTER: "Beperkt",
      GROWTH: "Licht maatwerk",
      PRO: "Meer maatwerkruimte",
    },
  },
];

const ONLINE_OPTIONS = [
  {
    period: "1 jaar",
    price: 249,
    description: "Veilig en betrouwbaar online.",
  },
  {
    period: "3 jaar",
    price: 599,
    description: "De populairste keuze.",
    featured: true,
  },
  {
    period: "5 jaar",
    price: 899,
    description: "De laagste prijs per jaar.",
  },
];

const ADD_ONS = [
  {
    title: "Zakelijke e-mail",
    price: "Vanaf €149",
    text: "Een professioneel e-mailadres op je eigen bedrijfsnaam.",
    icon: Mail,
  },
  {
    title: "Beter gevonden in Google",
    price: "€299",
    text: "Een betere basis voor je diensten en werkgebied.",
    icon: Search,
  },
  {
    title: "Vindbaar in AI-tools",
    price: "€399",
    text: "Een duidelijke structuur voor moderne AI-platformen.",
    icon: Sparkles,
  },
  {
    title: "Inzicht in bezoekers",
    price: "€199",
    text: "Zie hoeveel mensen je site bezoeken en contact opnemen.",
    icon: BarChart3,
  },
  {
    title: "Online afspraken",
    price: "Vanaf €299",
    text: "Laat klanten rechtstreeks een afspraak aanvragen.",
    icon: CalendarCheck2,
  },
  {
    title: "Extra pagina",
    price: "Vanaf €149",
    text: "Voor een extra dienst, locatie, product of campagne.",
    icon: FilePlus2,
  },
  {
    title: "Teksten laten schrijven",
    price: "Vanaf €175",
    text: "Professionele webteksten die aanzetten tot contact.",
    icon: PenLine,
  },
  {
    title: "Ondersteuning achteraf",
    price: "Vanaf €95",
    text: "Losse hulp bij wijzigingen, vragen of verbeteringen.",
    icon: Headphones,
  },
];

const PRICE_FAQS = [
  {
    question: "Wat kost een website bij Vedantix?",
    answer:
      "Een website die je volledig laat opleveren begint bij €1.295 eenmalig. Een beheerd abonnement begint bij €999 voor de bouw en inrichting, gevolgd door €99 per maand.",
  },
  {
    question: "Wat is het verschil tussen eenmalig en een abonnement?",
    answer:
      "Bij eenmalig betalen leveren we de website compleet op en beheer je hem daarna zelf. Bij een abonnement blijven wij de website online houden, beveiligen, bijwerken en ondersteunen.",
  },
  {
    question: "Moet ik bij een eenmalige website nog maandelijks betalen?",
    answer:
      "Nee, er is geen verplicht maandbedrag aan Vedantix. Je hebt wel een plek en domeinnaam nodig om de website online te houden. Dat kun je zelf regelen of vooraf voor één, drie of vijf jaar bij Vedantix afnemen.",
  },
  {
    question: "Zijn de prijzen inclusief btw?",
    answer:
      "Ja. De genoemde websiteprijzen op deze pagina zijn inclusief btw. Eventuele externe kosten bespreken we altijd vooraf.",
  },
  {
    question: "Kan ik later uitbreidingen toevoegen?",
    answer:
      "Ja. Je kunt later onder andere zakelijke e-mail, extra pagina's, online afspraken, betere vindbaarheid of losse ondersteuning toevoegen.",
  },
];

function currency(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizePackages(payload) {
  const packages = Array.isArray(payload?.packages)
    ? payload.packages
    : Array.isArray(payload?.data?.packages)
      ? payload.data.packages
      : [];

  return packages.length > 0 ? packages : FALLBACK_PACKAGES;
}

function activePackages(packages) {
  return [...packages]
    .filter((item) => item?.isActive !== false)
    .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0));
}

function codeOf(pkg) {
  return String(pkg?.code || "").toUpperCase();
}

function shouldLoadRemotePricing() {
  if (import.meta.env.VITE_API_BASE_URL) return true;
  if (typeof window === "undefined") return false;
  return ["vedantix.nl", "www.vedantix.nl"].includes(window.location.hostname);
}

function whatsappFor(pkg, paymentModel) {
  const paymentDescription = paymentModel === "one-time"
    ? "een website die ik eenmalig betaal"
    : "een website met een beheerd abonnement";

  return `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
    `Hallo Vedantix, ik wil graag meer weten over ${paymentDescription}. Ik kijk naar het ${pkg.label}-pakket.`
  )}`;
}

function addonWhatsapp(title) {
  return `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
    `Hallo Vedantix, ik wil graag meer weten over de losse uitbreiding: ${title}.`
  )}`;
}

export default function Prijzen() {
  const [pricing, setPricing] = useState({ packages: FALLBACK_PACKAGES });
  const [status, setStatus] = useState("loading");
  const [paymentModel, setPaymentModel] = useState("one-time");

  useEffect(() => {
    let active = true;

    if (!shouldLoadRemotePricing()) {
      setStatus("static");
      return () => {
        active = false;
      };
    }

    fetchPricingSummary()
      .then((summary) => {
        if (!active) return;
        setPricing({ packages: normalizePackages(summary) });
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setPricing({ packages: FALLBACK_PACKAGES });
        setStatus("fallback");
      });

    return () => {
      active = false;
    };
  }, []);

  const subscriptionPackages = useMemo(
    () => activePackages(pricing.packages),
    [pricing.packages]
  );
  const displayedPackages = paymentModel === "one-time"
    ? ONE_TIME_PACKAGES
    : subscriptionPackages;
  const canonical = "https://vedantix.nl/prijzen";
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Prijzen", url: canonical },
  ]);
  const faqSchema = createFAQSchema(PRICE_FAQS);
  const isOneTime = paymentModel === "one-time";

  return (
    <>
      <SEO
        title="Duidelijke websiteprijzen | Eenmalig of per maand | Vedantix"
        description="Een professionele website vanaf €1.295 eenmalig of vanaf €99 per maand plus bouw en inrichting. Bekijk direct wat je betaalt en wat je krijgt."
        canonical={canonical}
        schemas={[breadcrumbSchema, faqSchema]}
      />

      <div className="pricing-page">
        <NavBar />

        <main>
          <section className="pricing-hero" aria-labelledby="pricing-title">
            <div className="pricing-hero-glow" aria-hidden="true" />
            <div className="pricing-container pricing-hero-inner">
              <header className="pricing-hero-header">
                <div className="pricing-eyebrow">
                  <span /> Duidelijk vanaf het eerste moment
                </div>
                <h1 id="pricing-title">Dit betaal je voor jouw website.</h1>
                <p>
                  Kies één keer betalen of volledige ontzorging. Je ziet hieronder direct
                  wat je bij de start betaalt én of er daarna maandelijkse kosten zijn.
                </p>
              </header>

              <div className="pricing-mode-switch" role="group" aria-label="Kies hoe je wilt betalen">
                <button
                  type="button"
                  className={isOneTime ? "active" : ""}
                  aria-pressed={isOneTime}
                  onClick={() => setPaymentModel("one-time")}
                >
                  <span>Eenmalig betalen</span>
                  <strong>Vanaf €1.295</strong>
                </button>
                <button
                  type="button"
                  className={!isOneTime ? "active" : ""}
                  aria-pressed={!isOneTime}
                  onClick={() => setPaymentModel("subscription")}
                >
                  <span>Beheerd abonnement</span>
                  <strong>Vanaf €99 per maand</strong>
                </button>
              </div>

              <div className="pricing-package-grid" aria-live="polite">
                {displayedPackages.map((pkg) => {
                  const code = codeOf(pkg);
                  const meta = PACKAGE_META[code] || PACKAGE_META.PRO;
                  const oneTimePrice = Number(pkg.oneTimePriceInclVat || 0);
                  const monthlyPrice = Number(pkg.monthlyPriceInclVat ?? pkg.monthlyPrice ?? 0);
                  const setupPrice = Number(pkg.setupPriceInclVat ?? pkg.setupPrice ?? 0);
                  const recommended = isOneTime
                    ? code === "STARTER"
                    : pkg.featured || code === "GROWTH";

                  return (
                    <article
                      className={`pricing-package-card ${recommended ? "recommended" : ""}`}
                      key={pkg.code || pkg.label}
                    >
                      {recommended ? (
                        <div className="pricing-recommended-badge">
                          {isOneTime ? "Meest gekozen door starters" : "Meest gekozen"}
                        </div>
                      ) : null}

                      <div className="pricing-card-heading">
                        <div>
                          <span>{meta.label}</span>
                          <h2>{pkg.label}</h2>
                        </div>
                        <span className="pricing-page-count">{meta.pages}</span>
                      </div>
                      <p className="pricing-card-description">{pkg.description}</p>

                      {isOneTime ? (
                        <div className="pricing-cost-box">
                          <span>Je betaalt één keer</span>
                          <div className="pricing-main-price">
                            {currency(oneTimePrice)} <small>eenmalig</small>
                          </div>
                          <div className="pricing-zero-cost">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            Daarna €0 verplicht per maand
                          </div>
                        </div>
                      ) : (
                        <div className="pricing-split-costs">
                          <div>
                            <span>Bij de start</span>
                            <strong>{currency(setupPrice)}</strong>
                            <small>bouw en inrichting</small>
                          </div>
                          <div className="accent">
                            <span>Daarna</span>
                            <strong>{currency(monthlyPrice)}</strong>
                            <small>per maand</small>
                          </div>
                        </div>
                      )}

                      <ul className="pricing-feature-list">
                        {meta.features.map((feature) => (
                          <li key={feature}>
                            <Check size={16} aria-hidden="true" /> {feature}
                          </li>
                        ))}
                      </ul>

                      <a
                        className="pricing-card-cta"
                        href={whatsappFor(pkg, paymentModel)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Bespreek {pkg.label} <ArrowRight size={16} aria-hidden="true" />
                      </a>
                    </article>
                  );
                })}
              </div>

              <div className="pricing-hero-footer">
                <span>Alle getoonde prijzen zijn inclusief btw</span>
                <span className="pricing-footer-divider" aria-hidden="true" />
                <span>De definitieve scope spreken we vooraf met je af</span>
                <a href="#uitleg">
                  Bekijk de uitleg <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>

              {!isOneTime && status === "fallback" ? (
                <p className="pricing-data-note">
                  De actuele prijsservice is tijdelijk niet bereikbaar. Je ziet de standaardprijzen.
                </p>
              ) : null}
            </div>
          </section>

          <section className="pricing-section pricing-payment-section" id="uitleg">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">De keuze in gewone taal</div>
                <h2>Wat gebeurt er na de oplevering?</h2>
                <p>Het verschil zit niet in kwaliteit, maar in wie je website daarna beheert.</p>
              </div>

              <div className="pricing-payment-grid">
                <article className={isOneTime ? "selected" : ""}>
                  <span className="pricing-icon"><Globe2 size={22} aria-hidden="true" /></span>
                  <div>
                    <span className="pricing-card-label">Zelf beheren</span>
                    <h3>Eenmalig betalen</h3>
                    <p>
                      Wij bouwen en leveren je website compleet op. Daarna bepaal je zelf waar
                      je hem online houdt en wanneer je nog hulp inkoopt.
                    </p>
                  </div>
                  <button type="button" onClick={() => setPaymentModel("one-time")}>
                    Toon eenmalige prijzen <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </article>

                <article className={!isOneTime ? "selected" : ""}>
                  <span className="pricing-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
                  <div>
                    <span className="pricing-card-label">Volledig ontzorgd</span>
                    <h3>Beheerd abonnement</h3>
                    <p>
                      Wij houden je website online, veilig en actueel. Je hebt één aanspreekpunt
                      voor vragen en kleine wijzigingen.
                    </p>
                  </div>
                  <button type="button" onClick={() => setPaymentModel("subscription")}>
                    Toon abonnementsprijzen <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </article>
              </div>
            </div>
          </section>

          <section className="pricing-section pricing-compare-section" id="vergelijk">
            <div className="pricing-container">
              <div className="pricing-section-heading compact">
                <div className="pricing-kicker">Vergelijk de inhoud</div>
                <h2>Welk pakket past bij jouw bedrijf?</h2>
                <p>Alleen de belangrijkste verschillen, zodat je snel kunt kiezen.</p>
              </div>

              <div className="pricing-table-shell">
                <table className="pricing-compare-table">
                  <thead>
                    <tr>
                      <th>Onderdeel</th>
                      {displayedPackages.map((pkg) => (
                        <th key={pkg.code || pkg.label}>{pkg.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        {displayedPackages.map((pkg) => (
                          <td key={`${row.label}-${pkg.code || pkg.label}`}>
                            {row.values[codeOf(pkg)] || "Volgens afspraak"}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="pricing-price-row">
                      <td>Prijs</td>
                      {displayedPackages.map((pkg) => (
                        <td key={`price-${pkg.code || pkg.label}`}>
                          {isOneTime ? (
                            <strong>{currency(pkg.oneTimePriceInclVat)} eenmalig</strong>
                          ) : (
                            <strong>
                              {currency(pkg.setupPriceInclVat ?? pkg.setupPrice)} + {currency(pkg.monthlyPriceInclVat ?? pkg.monthlyPrice)}/m
                            </strong>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="pricing-section pricing-addons-section" id="uitbreidingen">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Later uitbreiden kan altijd</div>
                <h2>Neem alleen af wat je echt nodig hebt.</h2>
                <p>Geen groter pakket nodig? Voeg een onderdeel gewoon los toe.</p>
              </div>

              <article className="pricing-online-card">
                <div className="pricing-online-copy">
                  <span className="pricing-icon"><Globe2 size={22} aria-hidden="true" /></span>
                  <span className="pricing-card-label">Populaire losse keuze</span>
                  <h3>Website Online</h3>
                  <p>
                    Wij regelen de domeinnaam, veilige verbinding, reservekopieën en zorgen dat
                    je website bereikbaar blijft. Je betaalt vooraf voor de gekozen periode.
                  </p>
                </div>
                <div className="pricing-online-options">
                  {ONLINE_OPTIONS.map((option) => (
                    <a
                      className={option.featured ? "featured" : ""}
                      href={addonWhatsapp(`Website Online voor ${option.period}`)}
                      key={option.period}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {option.featured ? <span>Meest gekozen</span> : null}
                      <strong>{option.period}</strong>
                      <b>{currency(option.price)}</b>
                      <small>{option.description}</small>
                    </a>
                  ))}
                </div>
              </article>

              <details className="pricing-more-addons">
                <summary>
                  <span>Bekijk alle losse uitbreidingen</span>
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <div className="pricing-addon-grid">
                  {ADD_ONS.map((addon) => {
                    const Icon = addon.icon;
                    return (
                      <article key={addon.title}>
                        <span className="pricing-icon"><Icon size={20} aria-hidden="true" /></span>
                        <strong>{addon.price}</strong>
                        <h3>{addon.title}</h3>
                        <p>{addon.text}</p>
                        <a href={addonWhatsapp(addon.title)} target="_blank" rel="noreferrer">
                          Bespreek uitbreiding <ArrowRight size={15} aria-hidden="true" />
                        </a>
                      </article>
                    );
                  })}
                </div>
              </details>
            </div>
          </section>

          <section className="pricing-section pricing-faq-section" aria-labelledby="pricing-faq-title">
            <div className="pricing-container pricing-faq-layout">
              <div className="pricing-section-heading compact">
                <div className="pricing-kicker">Nog iets onduidelijk?</div>
                <h2 id="pricing-faq-title">Veelgestelde vragen</h2>
                <p>De belangrijkste antwoorden over betalen, beheer en uitbreiden.</p>
                <Link className="pricing-secondary-cta" to="/contact">
                  Stel je vraag <MessageCircle size={17} aria-hidden="true" />
                </Link>
              </div>

              <div className="pricing-faq-list">
                {PRICE_FAQS.map((faq) => (
                  <details key={faq.question}>
                    <summary>
                      {faq.question} <ChevronDown size={19} aria-hidden="true" />
                    </summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="pricing-final-cta">
            <div className="pricing-container pricing-final-cta-inner">
              <div>
                <span>Klaar om te starten?</span>
                <h2>Weet je nog niet welk pakket past?</h2>
                <p>Vertel ons wat je nodig hebt. Je krijgt een duidelijk advies zonder verplichtingen.</p>
              </div>
              <div className="pricing-final-actions">
                <Link className="pricing-primary-cta" to="/planning">
                  Plan een kennismaking <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a
                  className="pricing-whatsapp-cta"
                  href={`${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
                    "Hallo Vedantix, ik wil graag advies over welk websitepakket bij mijn bedrijf past."
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Vraag advies via WhatsApp
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
