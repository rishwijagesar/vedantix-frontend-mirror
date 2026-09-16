import { fetchPublicCatalog } from "../lib/public-content";
import { usePublicContent } from "../lib/use-public-content";
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
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/prijzen.css";

const WEBSITE_PACKAGE_DETAILS = [
  {
    code: "STARTER",
    label: "Starter",
    eyebrow: "Snel professioneel online",
    description: "Voor starters en zzp'ers die een sterke onepage website nodig hebben.",
    pages: "1 pagina",
    featured: false,
    features: [
      "Responsive ontwerp voor mobiel, tablet en desktop",
      "Contactformulier en WhatsApp-knop",
      "Technische SEO-basis voor Google",
    ],
  },
  {
    code: "GROWTH",
    label: "Growth",
    eyebrow: "Beste prijs-kwaliteit",
    description: "Voor lokale bedrijven met meerdere diensten die beter gevonden willen worden.",
    pages: "Tot 5 pagina's",
    featured: true,
    features: [
      "SEO- en lokale vindbaarheidsbasis",
      "AEO-basis met FAQ en structured data",
      "Sterke diensten- en conversiestructuur",
    ],
  },
  {
    code: "PRO",
    label: "Pro",
    eyebrow: "Voor serieuze online groei",
    description: "Voor bedrijven die meer inhoud, maatwerk en Google- én AI-vindbaarheid willen.",
    pages: "Tot 10 pagina's",
    featured: false,
    features: [
      "Uitgebreidere SEO en lokale structuur",
      "AEO + GEO/AIO-basis voor AI-platformen",
      "Analytics, structured data en meer maatwerkruimte",
    ],
  },
];

const COMPARISON_ROWS = [
  {
    label: "Website",
    values: { STARTER: "1 pagina", GROWTH: "Tot 5 pagina's", PRO: "Tot 10 pagina's" },
  },
  {
    label: "Responsive maatwerkdesign",
    values: { STARTER: "Ja", GROWTH: "Ja", PRO: "Ja" },
  },
  {
    label: "SEO – Google-vindbaarheid",
    values: { STARTER: "Technische basis", GROWTH: "SEO-basis", PRO: "Uitgebreide basis" },
  },
  {
    label: "Lokale SEO",
    values: { STARTER: "Basis", GROWTH: "Diensten + werkgebied", PRO: "Uitgebreide lokale structuur" },
  },
  {
    label: "AEO – antwoordmachines",
    values: { STARTER: "—", GROWTH: "Basis", PRO: "Uitgebreid" },
  },
  {
    label: "GEO/AIO – AI-vindbaarheid",
    values: { STARTER: "—", GROWTH: "AI-leesbare basis", PRO: "Uitgebreide basis" },
  },
  {
    label: "Structured data / schema",
    values: { STARTER: "Basis", GROWTH: "Uitgebreid", PRO: "Uitgebreid + maatwerk" },
  },
  {
    label: "Analytics",
    values: { STARTER: "Optioneel", GROWTH: "Optioneel", PRO: "Inbegrepen" },
  },
  {
    label: "Feedbackrondes",
    values: { STARTER: "2", GROWTH: "3", PRO: "3" },
  },
];

const BASE_PRICE_FAQS = [
  {
    question: "Wat kost een website bij Vedantix?",
    answer:
      "De actuele pakketprijzen staan op deze pagina. Hosting, e-mail en eventuele groeidiensten kies je apart.",
  },
  {
    question: "Wat is het verschil tussen SEO, AEO, GEO en AIO?",
    answer:
      "SEO richt zich op vindbaarheid in zoekmachines zoals Google. AEO helpt systemen duidelijke antwoorden uit je website te halen. GEO en AIO richten zich op hoe generatieve AI- en antwoordplatformen je bedrijf, diensten en expertise kunnen begrijpen en gebruiken. Vedantix combineert deze technieken waar dat bij het pakket of de groeidienst hoort.",
  },
  {
    question: "Is SEO en AI-vindbaarheid standaard inbegrepen?",
    answer:
      "Iedere Vedantix-website krijgt een technisch sterke basis. Growth en Pro krijgen meer SEO, structured data en antwoordgerichte optimalisatie. Uitgebreide of doorlopende SEO, AEO en GEO/AIO kun je los of als groeipakket afnemen.",
  },
  {
    question: "Wat kost hosting?",
    answer:
      "Bekijk de actuele hostingtarieven op deze pagina. Domeinnamen, mailboxen en uitzonderlijk zwaar gebruik kunnen apart worden berekend.",
  },
  {
    question: "Kan Vedantix garanderen dat ik bovenaan Google of in ChatGPT kom?",
    answer:
      "Nee. Geen betrouwbare partij kan een specifieke positie in Google of vermelding door een AI-platform garanderen. We kunnen wel de techniek, inhoud, structuur en meetbaarheid verbeteren zodat zoekmachines en AI-systemen je bedrijf beter kunnen begrijpen en beoordelen.",
  },
  {
    question: "Zijn de prijzen inclusief btw?",
    answer:
      "De hoofdprijzen zijn exclusief btw. Het bedrag inclusief btw staat er ook bij. Eventuele externe kosten of maatwerk bespreken we vooraf.",
  },
  {
    question: "Kan ik later uitbreidingen toevoegen?",
    answer:
      "Ja. Je kunt later onder andere hosting, zakelijke e-mail, extra pagina's, afspraken, SEO, AEO, GEO/AIO, analytics en losse ondersteuning toevoegen.",
  },
];

function currency(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function packageWhatsapp(pkg) {
  return `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
    `Hallo Vedantix, ik wil graag meer weten over het ${pkg.label}-websitepakket van ${currency(pkg.price)} excl. btw ${pkg.suffix}.`
  )}`;
}

function addonWhatsapp(title) {
  return `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
    `Hallo Vedantix, ik wil graag meer weten over: ${title}.`
  )}`;
}

export default function Prijzen({ initialProducts = null }) {
  const { data: products, loading, error } = usePublicContent(fetchPublicCatalog, initialProducts);
  const suffix = type => type === "MONTHLY" ? "per maand" : type === "YEARLY" ? "per jaar" : "eenmalig";
  const WEBSITE_PACKAGES = products.filter(p => p.category.toUpperCase() === "WEBSITE").map(p => {
    const details = WEBSITE_PACKAGE_DETAILS.find(d => d.code === p.code);
    return {
      ...details, code: p.code, label: p.name.split(/[—–]/)[0].trim(),
      description: p.description || details?.description || "", eyebrow: details?.eyebrow || "Website op maat",
      pages: details?.pages || "Op maat", features: details?.features || [p.description || "Professionele website"],
      price: Number(p.price_ex_vat), priceIncl: Number(p.price_incl_vat), suffix: suffix(p.billing_type), oneTime: p.billing_type === "ONE_TIME",
    };
  });
  const GROWTH_PLANS = products.filter(p => p.category.toUpperCase() === "GROWTH").map(p => ({
    name: p.name, price: Number(p.price_ex_vat), priceIncl: Number(p.price_incl_vat),
    note: p.description, featured: p.code === "GOOGLE_GROWTH", suffix: suffix(p.billing_type),
  }));
  const HOSTING_OPTIONS = products.filter(p => p.category.toUpperCase() === "HOSTING").map(p => ({
    code: p.code, period: `${Number(p.duration_years || 1)} jaar`, price: Number(p.price_ex_vat),
    priceIncl: Number(p.price_incl_vat), description: p.description, featured: Number(p.duration_years) === 3,
  }));
  const addonIcons = { EMAIL: Mail, SEO_START: Search, AEO_START: MessageCircle, GEO_AIO_START: Sparkles, ANALYTICS: BarChart3, APPOINTMENTS: CalendarCheck2, EXTRA_PAGE: FilePlus2, COPYWRITING: PenLine, SUPPORT: Headphones };
  const ADD_ONS = products.filter(p => !["WEBSITE","GROWTH","HOSTING"].includes(p.category.toUpperCase())).map(p => ({
    title: p.name, price: `${p.from_price ? "Vanaf " : ""}${currency(p.price_ex_vat)} ${suffix(p.billing_type)}`,
    priceIncl: Number(p.price_incl_vat), text: p.description, icon: addonIcons[p.code] || Sparkles,
  }));
  const lowest = WEBSITE_PACKAGES.length ? Math.min(...WEBSITE_PACKAGES.map(p => p.price)) : null;
  const yearlyHosting = products.find(p => p.code === "HOSTING_YEAR");
  const heading = lowest === null ? "Een professionele website voor jouw bedrijf." : `Een professionele website vanaf ${currency(lowest)}.`;
  const PRICE_FAQS = BASE_PRICE_FAQS.map(faq => {
    if (faq.question === "Wat kost een website bij Vedantix?" && WEBSITE_PACKAGES.length) return { ...faq, answer: WEBSITE_PACKAGES.map(p => `${p.label}: ${currency(p.price)} excl. btw (${currency(p.priceIncl)} incl. btw), ${p.suffix}.`).join(" ") + " Hosting, e-mail en groeidiensten kies je apart." };
    if (faq.question === "Wat kost hosting?" && yearlyHosting) return { ...faq, answer: `Jaarlijkse hosting kost ${currency(yearlyHosting.price_ex_vat)} excl. btw (${currency(yearlyHosting.price_incl_vat)} incl. btw). Domeinnamen en mailboxen staan los van hosting.` };
    return faq;
  });
  const canonical = "https://vedantix.nl/prijzen";
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Prijzen", url: canonical },
  ]);
  const faqSchema = createFAQSchema(PRICE_FAQS);

  return (
    <>
      <SEO
        title={lowest === null ? "Websiteprijzen en pakketten | Vedantix" : `Website vanaf ${currency(lowest)} excl. btw | Vedantix`}
        description="Bekijk de actuele prijzen voor websites, hosting, SEO en online groei. Kies het pakket dat past bij jouw bedrijf."
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
                  <span /> Geen bureauprijzen. Wel een professionele basis.
                </div>
                <h1 id="pricing-title">{heading}</h1>
                <p>
                  Betaal je website één keer. Geen verplicht maandabonnement. Wil je daarna
                  actiever groeien in Google of AI-platformen? Dan kies je alleen de zichtbaarheid
                  en ondersteuning die bij jouw bedrijf past.
                </p>
              </header>

              {loading ? <p role="status">Actuele prijzen laden…</p> : null}
              {error ? <p role="alert">De prijzen zijn tijdelijk niet beschikbaar. Neem contact op voor een offerte.</p> : null}
              <div className="pricing-package-grid">
                {WEBSITE_PACKAGES.map((pkg) => (
                  <article
                    className={`pricing-package-card ${pkg.featured ? "recommended" : ""}`}
                    key={pkg.code}
                  >
                    {pkg.featured ? (
                      <div className="pricing-recommended-badge">Meest gekozen</div>
                    ) : null}

                    <div className="pricing-card-heading">
                      <div>
                        <span>{pkg.eyebrow}</span>
                        <h2>{pkg.label}</h2>
                      </div>
                      <span className="pricing-page-count">{pkg.pages}</span>
                    </div>
                    <p className="pricing-card-description">{pkg.description}</p>

                    <div className="pricing-cost-box">
                      <span>Prijs exclusief btw</span>
                      <div className="pricing-main-price">
                        {currency(pkg.price)} <small>{pkg.suffix}</small>
                      </div>
                      <div className="pricing-zero-cost">{currency(pkg.priceIncl)} inclusief btw</div>
                      <div className="pricing-zero-cost">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        {pkg.oneTime ? "Geen verplicht maandabonnement" : `Facturatie ${pkg.suffix}`}
                      </div>
                    </div>

                    <ul className="pricing-feature-list">
                      {pkg.features.map((feature) => (
                        <li key={feature}>
                          <Check size={16} aria-hidden="true" /> {feature}
                        </li>
                      ))}
                    </ul>

                    <a
                      className="pricing-card-cta"
                      href={packageWhatsapp(pkg)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Bespreek {pkg.label} <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>

              <div className="pricing-hero-footer">
                <span>Hoofdprijzen exclusief btw; bedragen inclusief btw staan erbij</span>
                <span className="pricing-footer-divider" aria-hidden="true" />
                {yearlyHosting ? <span>Hosting {currency(yearlyHosting.price_ex_vat)} excl. btw per jaar</span> : null}
                <a href="#vindbaarheid">
                  Bekijk vindbaarheid <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          <section className="pricing-section pricing-payment-section" id="vindbaarheid">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Waar Vedantix zich onderscheidt</div>
                <h2>Niet alleen een mooie website. Ook gebouwd om gevonden en begrepen te worden.</h2>
                <p>
                  Iedere website krijgt een sterke technische basis. Bij Growth, Pro en onze
                  groeidiensten gaan we verder met verschillende vormen van zoek- en AI-vindbaarheid.
                </p>
              </div>

              <div className="pricing-payment-grid">
                <article>
                  <span className="pricing-icon"><Search size={22} aria-hidden="true" /></span>
                  <div>
                    <span className="pricing-card-label">SEO</span>
                    <h3>Vindbaar in Google</h3>
                    <p>
                      We maken pagina's technisch en inhoudelijk duidelijk voor zoekmachines,
                      met aandacht voor diensten, zoekintentie, snelheid en lokale relevantie.
                    </p>
                  </div>
                </article>

                <article>
                  <span className="pricing-icon"><MessageCircle size={22} aria-hidden="true" /></span>
                  <div>
                    <span className="pricing-card-label">AEO</span>
                    <h3>Geschikt voor directe antwoorden</h3>
                    <p>
                      FAQ's, concrete antwoorden en structured data helpen zoek- en
                      antwoordsystemen sneller begrijpen wat jouw bedrijf kan betekenen.
                    </p>
                  </div>
                </article>

                <article>
                  <span className="pricing-icon"><Sparkles size={22} aria-hidden="true" /></span>
                  <div>
                    <span className="pricing-card-label">GEO</span>
                    <h3>Beter te begrijpen door generatieve AI</h3>
                    <p>
                      We structureren expertise, diensten, locaties en bewijs zodat generatieve
                      systemen je merk en aanbod beter kunnen interpreteren.
                    </p>
                  </div>
                </article>

                <article>
                  <span className="pricing-icon"><Globe2 size={22} aria-hidden="true" /></span>
                  <div>
                    <span className="pricing-card-label">AIO</span>
                    <h3>Brede optimalisatie voor AI-platformen</h3>
                    <p>
                      We combineren techniek, content, entiteiten en meetbaarheid om je website
                      toekomstbestendiger te maken voor AI-gedreven zoeken en antwoorden.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section className="pricing-section pricing-compare-section" id="vergelijk">
            <div className="pricing-container">
              <div className="pricing-section-heading compact">
                <div className="pricing-kicker">Vergelijk de websitepakketten</div>
                <h2>Hoeveel vindbaarheid heb je bij de start nodig?</h2>
                <p>
                  Starter houdt het bewust eenvoudig. Growth voegt een serieuze Google- en
                  antwoordbasis toe. Pro legt daarnaast een uitgebreidere AI-vindbaarheidsbasis.
                </p>
              </div>

              <div className="pricing-table-shell">
                <table className="pricing-compare-table">
                  <thead>
                    <tr>
                      <th>Onderdeel</th>
                      {WEBSITE_PACKAGES.map((pkg) => (
                        <th key={pkg.code}>{pkg.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        {WEBSITE_PACKAGES.map((pkg) => (
                          <td key={`${row.label}-${pkg.code}`}>{row.values[pkg.code] || "Op aanvraag"}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="pricing-price-row">
                      <td>Prijs</td>
                      {WEBSITE_PACKAGES.map((pkg) => (
                        <td key={`price-${pkg.code}`}>
                          <strong>{currency(pkg.price)} {pkg.suffix}</strong><small> excl. btw</small>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="pricing-section pricing-addons-section" id="groei">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Optioneel doorlopend groeien</div>
                <h2>Wil je meer dan alleen online staan?</h2>
                <p>
                  Een groeipakket is niet verplicht. Kies het alleen als je Vedantix structureel
                  aan je zichtbaarheid, content en vindbaarheid wilt laten werken.
                </p>
              </div>

              <article className="pricing-online-card">
                <div className="pricing-online-copy">
                  <span className="pricing-icon"><Sparkles size={22} aria-hidden="true" /></span>
                  <span className="pricing-card-label">Online groei</span>
                  <h3>Google, antwoorden en AI als losse groeilaag</h3>
                  <p>
                    Zo blijft de instapprijs van je website laag, terwijl bedrijven die echt willen
                    groeien kunnen investeren in SEO, AEO, GEO en AIO zonder dat iedere klant ervoor betaalt.
                  </p>
                </div>
                <div className="pricing-online-options">
                  {GROWTH_PLANS.map((plan) => (
                    <a
                      className={plan.featured ? "featured" : ""}
                      href={addonWhatsapp(plan.name)}
                      key={plan.name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {plan.featured ? <span>Meest gekozen</span> : null}
                      <strong>{plan.name}</strong>
                      <b>{currency(plan.price)} {plan.suffix} excl. btw</b><small>{currency(plan.priceIncl)} incl. btw</small>
                      <small>{plan.note}</small>
                    </a>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="pricing-section pricing-addons-section" id="uitbreidingen">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Hosting en losse uitbreidingen</div>
                <h2>Neem alleen af wat je echt nodig hebt.</h2>
                <p>Geen verplicht servicepakket. Hosting, e-mail en extra optimalisatie kies je los.</p>
              </div>

              <article className="pricing-online-card">
                <div className="pricing-online-copy">
                  <span className="pricing-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
                  <span className="pricing-card-label">Voordelige hosting</span>
                  <h3>Website Hosting</h3>
                  <p>
                    Wij zorgen dat je Vedantix-website veilig bereikbaar blijft met HTTPS en een
                    moderne hostingomgeving. Domeinregistratie en mailboxen staan los van hosting.
                  </p>
                </div>
                <div className="pricing-online-options">
                  {HOSTING_OPTIONS.map((option) => (
                    <a
                      className={option.featured ? "featured" : ""}
                      href={addonWhatsapp(`Website Hosting voor ${option.period}`)}
                      key={option.code}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {option.featured ? <span>Voordelig</span> : null}
                      <strong>{option.period}</strong>
                      <b>{currency(option.price)} excl. btw</b><small>{currency(option.priceIncl)} incl. btw</small>
                      <small>{option.description}</small>
                    </a>
                  ))}
                </div>
              </article>

              <details className="pricing-more-addons" open>
                <summary>
                  <span>Losse uitbreidingen</span>
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <div className="pricing-addon-grid">
                  {ADD_ONS.map((addon) => {
                    const Icon = addon.icon;
                    return (
                      <article key={addon.title}>
                        <span className="pricing-icon"><Icon size={20} aria-hidden="true" /></span>
                        <strong>{addon.price} excl. btw</strong><small>{currency(addon.priceIncl)} incl. btw</small>
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
                <p>De belangrijkste antwoorden over prijs, hosting en vindbaarheid.</p>
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
                <h2>Begin met de website. Groei wanneer jij eraan toe bent.</h2>
                <p>
                  Vertel ons wat je bedrijf nodig heeft. Je krijgt een duidelijk advies zonder
                  dat we je in een onnodig groot abonnement stoppen.
                </p>
              </div>
              <div className="pricing-final-actions">
                <Link className="pricing-primary-cta" to="/planning">
                  Plan een kennismaking <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a
                  className="pricing-whatsapp-cta"
                  href={`${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
                    "Hallo Vedantix, ik wil graag advies over welk website- en vindbaarheidspakket bij mijn bedrijf past."
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
