import { useState } from "react";
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
import PageHero from "../components/PageHero";
import ServicePrices from "../components/ServicePrices";
import { PROJECT_CATEGORIES } from "../data/services";
import "../styles/services.css";
import { CONTACT } from "../constants/contact";
import { SCAN_URL } from "../data/positioning";
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

const WEBSITE_VALUE = [
  { title: "Maatwerkdesign", text: "Ontworpen voor jouw bedrijf en responsive op mobiel, tablet en desktop.", icon: PenLine },
  { title: "Vindbaarheid zit erin", text: "Elk pakket krijgt een technische SEO-basis. Growth en Pro ook AEO en structured data.", icon: Search },
  { title: "Eén vast aanspreekpunt", text: "Je praat met degene die bouwt en beheert. Geen accountmanagers ertussen.", icon: MessageCircle },
  { title: "Vaste prijs, geen abonnement", text: "Eenmalig betalen. Hosting en extra's kies je alleen als je ze nodig hebt.", icon: ShieldCheck },
  { title: "Feedbackrondes vastgelegd", text: "Twee rondes bij Starter, drie bij Growth en Pro. Je weet vooraf waar je aan toe bent.", icon: CheckCircle2 },
  { title: "Groeit mee met je bedrijf", text: "Later een klantportaal, koppeling of eigen app? Dat bouwt dezelfde partij.", icon: Sparkles },
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
    label: "Hosting en zakelijke e-mail",
    values: { STARTER: "Los te kiezen", GROWTH: "Los te kiezen", PRO: "Los te kiezen" },
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
    question: "Kan ik een website ook per maand betalen?",
    answer: "Ja. Met een websiteabonnement betaal je lage opstartkosten en daarna een vast maandbedrag, inclusief hosting, technisch onderhoud en kleine aanpassingen. Er geldt een minimale looptijd; daarna is het maandelijks opzegbaar.",
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

// Eenheid per uitbreiding, zodat "eenmalig" niet verkeerd wordt gelezen
const ADDON_UNITS = { SUPPORT: "per uur", COPYWRITING: "per pagina", EMAIL: "per mailbox per jaar" };

function currency(value) {
  const amount = Number(value || 0);
  // Hele bedragen zonder decimalen (€ 499), anders altijd twee (€ 36,30 i.p.v. € 36,3)
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(amount);
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

const VIEWS = {
  overview: {
    path: "/prijzen", crumb: "Prijzen", catalogName: "Vedantix diensten en prijzen",
    title: "Prijzen: websites, software op maat en beheer | Vedantix",
    description: "Bekijk de prijzen van Vedantix: websitepakketten eenmalig of als abonnement, bedrijfssoftware op maat op offerte en losse prijzen voor hosting, beheer en onderhoud.",
  },
  websites: {
    path: "/prijzen/websites", crumb: "Websites", catalogName: "Websitepakketten en uitbreidingen",
    title: "Website laten maken: prijzen eenmalig of per maand | Vedantix",
    description: "Websitepakketten met een vaste eenmalige prijs, of lage opstartkosten plus een vast maandbedrag inclusief hosting, onderhoud en kleine aanpassingen.",
  },
  software: {
    path: "/prijzen/software-op-maat", crumb: "Software op maat", catalogName: "Software op maat en AI-diensten",
    title: "Software op maat: zo werkt de prijs | Vedantix",
    description: "Bedrijfssoftware op maat met opstartkosten en een vast maandbedrag op offerte na een bedrijfsscan. Bekijk ook de vanafprijzen van afgebakende AI-, app- en koppelingsdiensten.",
  },
  beheer: {
    path: "/prijzen/beheer-onderhoud", crumb: "Beheer en onderhoud", catalogName: "Hosting, beheer en onderhoud",
    title: "Beheer, onderhoud en hosting: prijzen | Vedantix",
    description: "Losse prijzen voor hosting, zakelijke e-mail, technisch beheer, groeipakketten en ondersteuning voor je website of applicatie.",
  },
};

export default function Prijzen({ initialProducts = null, view = "overview" }) {
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
  const PLAN_BY_PACKAGE = Object.fromEntries(products.filter(p => p.category.toUpperCase() === "WEBSITE_PLAN" && p.base_package).map(p => [p.base_package, {
    monthly: Number(p.price_ex_vat), monthlyIncl: Number(p.price_incl_vat),
    setup: Number(p.setup_fee || 0), setupIncl: Number(p.setup_fee || 0) * (1 + Number(p.vat_rate || 21) / 100),
    term: Number(p.min_term_months || 12), hours: Number(p.included_hours || 0), code: p.code,
  }]));
  const hasPlans = Object.keys(PLAN_BY_PACKAGE).length > 0;
  const minPlan = hasPlans ? Object.values(PLAN_BY_PACKAGE).sort((a, b) => a.monthly - b.monthly)[0] : null;
  const ADD_ONS_ALL = products.filter(p => !["WEBSITE","WEBSITE_PLAN","GROWTH","HOSTING",...PROJECT_CATEGORIES].includes(p.category.toUpperCase())).map(p => {
    const onRequest = !(Number(p.price_ex_vat) > 0);
    const from = p.from_price ? "Vanaf " : "";
    return {
      title: p.name, text: p.description, icon: addonIcons[p.code] || Sparkles, onRequest,
      price: onRequest ? "Prijs op aanvraag" : `${from}${currency(p.price_ex_vat)} ${ADDON_UNITS[p.code] || suffix(p.billing_type)} excl. btw`,
      priceIncl: onRequest ? "Afhankelijk van de uitvoering" : `${from.toLowerCase()}${currency(p.price_incl_vat)} incl. btw`,
      code: p.code,
    };
  });
  const CARE_CODES = ["EMAIL", "SUPPORT"];
  const ADD_ONS = ADD_ONS_ALL.filter(a => !CARE_CODES.includes(a.code));
  const CARE_ADDONS = ADD_ONS_ALL.filter(a => CARE_CODES.includes(a.code));
  const careProducts = products.filter(p => p.category.toUpperCase() === "CARE");
  const projectProducts = products.filter(p => PROJECT_CATEGORIES.includes(p.category.toUpperCase()) && p.category.toUpperCase() !== "CARE");
  const [billing, setBilling] = useState("once");
  const yearlyHosting = products.find(p => p.code === "HOSTING_YEAR");
  const heading = <>Heldere prijzen. <span className="vx-grad">Ruimte om te groeien.</span></>;
  const PRICE_FAQS = BASE_PRICE_FAQS.map(faq => {
    if (faq.question === "Wat kost een website bij Vedantix?" && WEBSITE_PACKAGES.length) return { ...faq, answer: WEBSITE_PACKAGES.map(p => `${p.label}: ${currency(p.price)} excl. btw (${currency(p.priceIncl)} incl. btw), ${p.suffix}.`).join(" ") + " Hosting, e-mail en groeidiensten kies je apart." };
    if (faq.question === "Kan ik een website ook per maand betalen?" && hasPlans) return { ...faq, answer: `Ja. ${WEBSITE_PACKAGES.filter(p => PLAN_BY_PACKAGE[p.code]).map(p => `${p.label}: ${currency(PLAN_BY_PACKAGE[p.code].setup)} opstartkosten en ${currency(PLAN_BY_PACKAGE[p.code].monthly)} per maand`).join("; ")}, excl. btw. Hosting, technisch onderhoud en kleine aanpassingen zitten in het maandbedrag. Minimale looptijd ${minPlan.term} maanden, daarna maandelijks opzegbaar.` };
    if (faq.question === "Wat kost hosting?" && yearlyHosting) return { ...faq, answer: `Jaarlijkse hosting kost ${currency(yearlyHosting.price_ex_vat)} excl. btw (${currency(yearlyHosting.price_incl_vat)} incl. btw). Domeinnamen en mailboxen staan los van hosting.` };
    return faq;
  });
  const V = VIEWS[view] || VIEWS.overview;
  const canonical = `https://vedantix.nl${V.path}`;
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Prijzen", url: "https://vedantix.nl/prijzen" },
    ...(view === "overview" ? [] : [{ name: V.crumb, url: canonical }]),
  ]);
  const faqs = view === "beheer" ? PRICE_FAQS.filter(f => /hosting|uitbreiding|btw|per maand/i.test(f.question)) : view === "software" ? [] : PRICE_FAQS;
  const faqSchema = faqs.length ? createFAQSchema(faqs) : null;
  const catalogForView = view === "websites" ? products.filter(p => ["WEBSITE", "WEBSITE_PLAN", "ADDON"].includes(p.category.toUpperCase()))
    : view === "software" ? projectProducts
    : view === "beheer" ? products.filter(p => ["GROWTH", "HOSTING", "CARE"].includes(p.category.toUpperCase()) || CARE_CODES.includes(p.code))
    : products;
  const minWebsite = WEBSITE_PACKAGES.length ? Math.min(...WEBSITE_PACKAGES.map(p => p.price)) : null;

  return (
    <>
      <SEO
        title={V.title}
        description={V.description}
        canonical={canonical}
        schemas={[breadcrumbSchema, ...(faqSchema ? [faqSchema] : []), { "@context": "https://schema.org", "@type": "OfferCatalog", name: V.catalogName, itemListElement: catalogForView.map(p => ({ "@type": "Offer", url: canonical, itemOffered: { "@type": "Service", name: p.name, description: p.description, provider: { "@id": "https://vedantix.nl/#localbusiness" } }, priceSpecification: { "@type": "UnitPriceSpecification", [p.from_price ? "minPrice" : "price"]: Number(p.price_ex_vat), priceCurrency: "EUR", valueAddedTaxIncluded: false, ...(p.billing_type === "MONTHLY" ? { billingDuration: "P1M" } : p.billing_type === "YEARLY" ? { billingDuration: "P1Y" } : {}) } })) }]}
      />

      <div className="pricing-page">
        <NavBar />

        <main>
          {view === "overview" ? (
            <PageHero
              id="pricing-title"
              eyebrow="Prijzen"
              title={heading}
              lead="Kies wat je zoekt. Elke pagina laat de prijzen, wat erin zit en de voorwaarden zien, zonder kleine lettertjes."
            >
              <div className="pricing-routes pricing-routes--three">
                <Link className="pricing-route" to="/prijzen/websites">
                  <small>Voor zelfstandigen en starters</small>
                  <strong>Website laten maken</strong>
                  <span>{minWebsite ? `Vanaf ${currency(minWebsite)} eenmalig` : "Vaste pakketprijzen"}{minPlan ? `, of vanaf ${currency(minPlan.monthly)} per maand met ${currency(minPlan.setup)} opstartkosten` : ""}. Bedragen excl. btw.</span>
                  <em>Bekijk websiteprijzen <ArrowRight size={15} aria-hidden="true" /></em>
                </Link>
                <Link className="pricing-route pricing-route--main" to="/prijzen/software-op-maat">
                  <small>Voor mkb-bedrijven</small>
                  <strong>Bedrijfssoftware op maat</strong>
                  <span>Opstartkosten en een vast maandbedrag, vastgelegd in een offerte na de bedrijfsscan.</span>
                  <em>Zo werkt de prijs <ArrowRight size={15} aria-hidden="true" /></em>
                </Link>
                <Link className="pricing-route" to="/prijzen/beheer-onderhoud">
                  <small>Na de oplevering</small>
                  <strong>Beheer en onderhoud</strong>
                  <span>Hosting, zakelijke e-mail, technisch beheer, groeipakketten en losse ondersteuning.</span>
                  <em>Bekijk beheerprijzen <ArrowRight size={15} aria-hidden="true" /></em>
                </Link>
              </div>
            </PageHero>
          ) : null}

          {view === "websites" ? (
            <PageHero
              id="pricing-title"
              eyebrow="Prijzen · Websites"
              title={<>Een website die past bij <span className="vx-grad">je budget</span></>}
              lead="Betaal in één keer, of start met lage opstartkosten en een vast maandbedrag. Bij een abonnement zitten hosting, technisch onderhoud en kleine aanpassingen erbij."
            >
              <nav className="pricing-service-links" aria-label="Op deze pagina"><a href="#websites">Pakketten</a><a href="#vergelijk">Vergelijken</a><a href="#vindbaarheid">Vindbaarheid</a><a href="#uitbreidingen">Uitbreidingen</a></nav>
            </PageHero>
          ) : null}

          {view === "software" ? (
            <PageHero
              id="pricing-title"
              eyebrow="Prijzen · Software op maat"
              title={<>Software op maat, <span className="vx-grad">zonder verrassingen</span></>}
              lead="Na een bedrijfsscan krijg je een offerte met opstartkosten en een vast maandbedrag. Daarin staat precies wat er gebouwd wordt, wat het maandbedrag dekt en hoe uitbreiden werkt."
              actions={<>
                <Link className="vx-btn vx-btn--primary" to={SCAN_URL}>Plan een bedrijfsscan <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link className="vx-btn vx-btn--ghost" to="/software-op-maat">Meer over software op maat</Link>
              </>}
            />
          ) : null}

          {view === "beheer" ? (
            <PageHero
              id="pricing-title"
              eyebrow="Prijzen · Beheer en onderhoud"
              title={<>Na de lancering <span className="vx-grad">blijven we erbij</span></>}
              lead="Hosting, zakelijke e-mail, technisch beheer en doorlopende verbeteringen voor je website of applicatie. Je kiest alleen wat je nodig hebt."
            >
              <nav className="pricing-service-links" aria-label="Op deze pagina"><a href="#hosting">Hosting en e-mail</a><a href="#beheer">Technisch beheer</a><a href="#groei">Groeipakketten</a><a href="#software-beheer">Software</a></nav>
            </PageHero>
          ) : null}

          {view === "websites" ? (<>
          <section className="pricing-hero pricing-hero--continued" aria-label="Websitepakketten">
            <div className="pricing-container pricing-hero-inner">
              <div className="pricing-packages-head">
                <h2 id="websites">Websitepakketten</h2>
                {hasPlans ? (
                  <div className="pricing-billing-toggle" role="group" aria-label="Betaalwijze">
                    <button type="button" aria-pressed={billing === "once"} onClick={() => setBilling("once")}>Eenmalig</button>
                    <button type="button" aria-pressed={billing === "plan"} onClick={() => setBilling("plan")}>Per maand</button>
                  </div>
                ) : null}
              </div>
              {hasPlans && billing === "plan" ? (
                <p className="pricing-plan-intro">Lage opstartkosten en daarna een vast maandbedrag. Hosting, technisch onderhoud en kleine aanpassingen zitten erbij. Minimale looptijd {minPlan?.term || 12} maanden, daarna maandelijks opzegbaar.</p>
              ) : null}
              {loading ? <p role="status">Actuele prijzen laden…</p> : null}
              {error ? <p role="alert">De prijzen zijn tijdelijk niet beschikbaar. Neem contact op voor een offerte.</p> : null}
              <div className="pricing-package-grid">
                {WEBSITE_PACKAGES.map((pkg) => (
                  <article
                    className={`pricing-package-card ${pkg.featured ? "recommended" : ""}`}
                    key={pkg.code}
                  >
                    {pkg.featured ? (
                      <div className="pricing-recommended-badge">Aanbevolen</div>
                    ) : null}

                    <div className="pricing-card-heading">
                      <div>
                        <span>{pkg.eyebrow}</span>
                        <h2>{pkg.label}</h2>
                      </div>
                      <span className="pricing-page-count">{pkg.pages}</span>
                    </div>
                    <p className="pricing-card-description">{pkg.description}</p>

                    {billing === "plan" && PLAN_BY_PACKAGE[pkg.code] ? (() => { const plan = PLAN_BY_PACKAGE[pkg.code]; return (
                      <div className="pricing-cost-box">
                        <span>Abonnement, exclusief btw</span>
                        <div className="pricing-main-price">
                          {currency(plan.monthly)} <small>per maand</small>
                        </div>
                        <div className="pricing-zero-cost">+ {currency(plan.setup)} opstartkosten ({currency(plan.setupIncl)} incl. btw)</div>
                        <div className="pricing-zero-cost">{currency(plan.monthlyIncl)} per maand inclusief btw</div>
                        <div className="pricing-zero-cost">
                          <CheckCircle2 size={16} aria-hidden="true" />
                          Hosting en onderhoud inbegrepen{plan.hours ? `, ${plan.hours >= 1 ? `${plan.hours} uur` : `${Math.round(plan.hours * 60)} minuten`} aanpassingen per maand` : ""}
                        </div>
                      </div>
                    ); })() : (
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
                    )}

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
                      Bespreek {pkg.label}{billing === "plan" && PLAN_BY_PACKAGE[pkg.code] ? " als abonnement" : ""} <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>

              <div className="pricing-hero-footer">
                <span>Hoofdprijzen exclusief btw; bedragen inclusief btw staan erbij</span>
                <span className="pricing-footer-divider" aria-hidden="true" />
                {billing === "plan" ? <span>Abonnement: hosting en onderhoud inbegrepen</span> : yearlyHosting ? <span>Hosting {currency(yearlyHosting.price_ex_vat)} excl. btw per jaar, <Link to="/prijzen/beheer-onderhoud">zie beheer</Link></span> : null}
                <a href="#vindbaarheid">
                  Bekijk vindbaarheid <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          <section className="vx-page vx-section vx-section--soft" aria-labelledby="pricing-value-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Wat je voor je geld krijgt</p>
                <h2 id="pricing-value-title" className="vx-h2">Niet de goedkoopste. Wel een website die voor je werkt.</h2>
                <p className="vx-lead">Een losse pagina laten bouwen kan voor een paar honderd euro. Bij Vedantix krijg je daarnaast vindbaarheid, vaste afspraken en een partner die meegroeit.</p>
              </div>
              <div className="vx-grid vx-grid--3">
                {WEBSITE_VALUE.map(({ title, text, icon: Icon }) => (
                  <article className="vx-card" key={title}>
                    <div className="vx-icon"><Icon aria-hidden="true" /></div>
                    <h3 className="vx-h3">{title}</h3>
                    <p className="vx-card__text">{text}</p>
                  </article>
                ))}
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

          <section className="pricing-section pricing-addons-section" id="uitbreidingen">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Losse uitbreidingen</div>
                <h2>Neem alleen af wat je echt nodig hebt.</h2>
                <p>Extra pagina's, teksten, afspraken of vindbaarheid voeg je toe wanneer je het nodig hebt. Hosting, e-mail en beheer staan op <Link to="/prijzen/beheer-onderhoud">beheer en onderhoud</Link>.</p>
              </div>

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
                        <strong>{addon.price}</strong><small>{addon.priceIncl}</small>
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
          </>) : null}

          {view === "software" ? (<>
          <section className="pricing-section pricing-payment-section" id="zo-werkt-de-prijs">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Zo werkt de prijs</div>
                <h2>Twee bedragen, vooraf vastgelegd.</h2>
                <p>Geen uurtje-factuurtje achteraf. Je weet voor de start wat het bouwen kost en wat je daarna per maand betaalt.</p>
              </div>
              <div className="pricing-payment-grid">
                <article>
                  <span className="pricing-icon"><Search size={22} aria-hidden="true" /></span>
                  <div><span className="pricing-card-label">Stap 1</span><h3>Bedrijfsscan</h3><p>We brengen je processen, tools en dubbel werk in kaart. Daaruit volgt wat de software moet doen.</p></div>
                </article>
                <article>
                  <span className="pricing-icon"><FilePlus2 size={22} aria-hidden="true" /></span>
                  <div><span className="pricing-card-label">Opstartkosten</span><h3>Eenmalig voor het bouwen</h3><p>Ontwerp, bouw, inrichting en het overzetten van je gegevens, voor de afgesproken eerste fase.</p></div>
                </article>
                <article>
                  <span className="pricing-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
                  <div><span className="pricing-card-label">Vast maandbedrag</span><h3>Hosting, beheer en support</h3><p>Hosting, opslag, onderhoud en support voor de afgesproken functies. Inbegrepen gebruik staat in de offerte.</p></div>
                </article>
                <article>
                  <span className="pricing-icon"><Sparkles size={22} aria-hidden="true" /></span>
                  <div><span className="pricing-card-label">Uitbreiden</span><h3>Groeit mee in fases</h3><p>Nieuwe functies krijgen een eigen voorstel. Je beslist per fase, zonder verrassingen achteraf.</p></div>
                </article>
              </div>
            </div>
          </section>
          <section className="pricing-section" id="apps-ai"><div className="pricing-container"><div className="pricing-section-heading"><div className="pricing-kicker">Slimmer werken en digitaal uitbreiden</div><h2>Bedrijfssoftware op maat: heldere afspraken op offerte.</h2><p>Een bedrijfsscan leidt tot een concreet voorstel. Opstartkosten en het vaste maandbedrag dekken de afgesproken functionaliteit, hosting, opslag, onderhoud en support. Inbegrepen gebruik, wijzigingen, uitbreiding, dataverwerking en export spreken we vooraf af.</p><p>Behoud je externe tools, dan kunnen hun abonnementskosten blijven gelden. Onderstaande catalogusdiensten zijn losse, afgebakende diensten; hun vanafprijzen zijn geen prijs voor een complete maatwerkapplicatie.</p><a className="pricing-secondary-cta" href="/software-op-maat">Meer over software op maat →</a></div><ServicePrices products={projectProducts} details /><p className="service-scope">Je ontvangt vooraf een offerte met scope, planning en acceptatieafspraken. Hosting, model- en API-gebruik, licenties en appstorekosten worden apart begroot. Vanafprijzen zijn geen prijs voor iedere denkbare uitvoering. Bestaande offertes, contracten en abonnementen behouden hun afgesproken tarieven.</p><a href="/diensten">Vergelijk de diensten en toepassingen →</a></div></section>
          </>) : null}

          {view === "beheer" ? (<>
          <section className="pricing-section pricing-addons-section" id="hosting">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Hosting en e-mail</div>
                <h2>Veilig online, zonder gedoe.</h2>
                <p>Hosting en zakelijke e-mail kies je los. Bij een websiteabonnement zit hosting al in het maandbedrag.</p>
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
                  <span>Zakelijke e-mail en ondersteuning</span>
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <div className="pricing-addon-grid">
                  {CARE_ADDONS.map((addon) => {
                    const Icon = addon.icon;
                    return (
                      <article key={addon.title}>
                        <span className="pricing-icon"><Icon size={20} aria-hidden="true" /></span>
                        <strong>{addon.price}</strong><small>{addon.priceIncl}</small>
                        <h3>{addon.title}</h3>
                        <p>{addon.text}</p>
                        <a href={addonWhatsapp(addon.title)} target="_blank" rel="noreferrer">
                          Bespreek dit <ArrowRight size={15} aria-hidden="true" />
                        </a>
                      </article>
                    );
                  })}
                </div>
              </details>
            </div>
          </section>

          <section className="pricing-section" id="beheer">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Technisch beheer</div>
                <h2>Updates, controles en kleine verbeteringen.</h2>
                <p>Voor wie de techniek liever aan ons overlaat: we houden je website of koppelingen bij volgens vaste afspraken.</p>
              </div>
              {careProducts.length ? <ServicePrices products={careProducts} details /> : <p className="service-scope">Technisch beheer stemmen we af op je website of applicatie. <a href="/contact">Vraag een voorstel aan</a>.</p>}
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
                      {plan.featured ? <span>Aanbevolen</span> : null}
                      <strong>{plan.name}</strong>
                      <b>{currency(plan.price)} {plan.suffix} excl. btw</b><small>{currency(plan.priceIncl)} incl. btw</small>
                      <small>{plan.note}</small>
                    </a>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="pricing-section pricing-payment-section" id="software-beheer">
            <div className="pricing-container">
              <div className="pricing-section-heading">
                <div className="pricing-kicker">Beheer van maatwerksoftware</div>
                <h2>Bij software op maat zit beheer in het maandbedrag.</h2>
                <p>Het vaste maandbedrag uit je offerte dekt de afgesproken hosting, opslag, onderhoud en support. Wat inbegrepen gebruik is en hoe uitbreidingen werken, leggen we vooraf vast.</p>
                <Link className="pricing-secondary-cta" to="/prijzen/software-op-maat">Zo werkt de prijs van software op maat →</Link>
              </div>
            </div>
          </section>

          </>) : null}

          {faqs.length ? (
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
                {faqs.map((faq) => (
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
          ) : null}







          <section className="pricing-final-cta">
            <div className="pricing-container pricing-final-cta-inner">
              <div>
                <span>Klaar om te starten?</span>
                <h2>Begin bij wat jouw bedrijf nodig heeft.</h2>
                <p>
                  Vertel ons wat je bedrijf nodig heeft. Je krijgt een duidelijk advies zonder
                  dat we je in een onnodig groot abonnement stoppen.
                </p>
              </div>
              <div className="pricing-final-actions">
                <Link className="pricing-primary-cta" to={SCAN_URL}>
                  Plan een bedrijfsscan <ArrowRight size={17} aria-hidden="true" />
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

