import { ArrowRight, BarChart3, MessageCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@/lib/router-compat";
import ClientCasesSection from "../components/home/ClientCasesSection";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createBreadcrumbSchema, createFAQSchema, createServiceSchema } from "../utils/schema";
import "../styles/vx-home.css";

const IMPROVEMENTS = [
  {
    title: "Sneller vertrouwen opbouwen",
    text: "Bezoekers moeten binnen enkele seconden begrijpen waarom jouw bedrijf betrouwbaar is.",
    icon: ShieldCheck,
  },
  {
    title: "Beter gevonden worden",
    text: "Duidelijke diensten, lokale signalen en sterke content helpen Google je bedrijf beter plaatsen.",
    icon: Search,
  },
  {
    title: "Meer contactmomenten",
    text: "WhatsApp, telefoon, offerteaanvragen en afspraken krijgen een logische plek in de route.",
    icon: MessageCircle,
  },
  {
    title: "Klaar voor AI-zoekmachines",
    text: "Heldere structuur en FAQ-content maken je website beter begrijpelijk voor moderne zoekervaringen.",
    icon: Sparkles,
  },
];

const FAQS = [
  {
    question: "Welke resultaten kan Vedantix verbeteren?",
    answer:
      "Vedantix richt zich op meer zichtbaarheid, meer vertrouwen, meer contactmomenten en minder technische zorgen. Concrete resultaten hangen af van markt, regio en concurrentie.",
  },
  {
    question: "Is dit alleen technisch werk?",
    answer:
      "Nee. Vedantix kijkt vooral naar ondernemersresultaat: welke informatie bezoekers nodig hebben, hoe vertrouwen ontstaat en hoe contact makkelijker wordt.",
  },
  {
    question: "Kan ik eerst laten analyseren waar kansen liggen?",
    answer:
      "Ja. Met de gratis Online Groei Audit bekijkt Vedantix vindbaarheid, snelheid, mobiele ervaring, reviews, conversie en call-to-actions.",
  },
  {
    question: "Werkt Vedantix voor lokale ondernemers?",
    answer:
      "Ja. De aanpak is specifiek ingericht voor lokale ondernemers die in hun regio beter zichtbaar willen worden en meer aanvragen willen ontvangen.",
  },
];

export default function Resultaten({ initialCases = null }) {
  const canonical = "https://vedantix.nl/resultaten";
  const faqSchema = createFAQSchema(FAQS);
  const serviceSchema = createServiceSchema({
    name: "Online groeiverbetering voor lokale ondernemers",
    slug: "resultaten",
    description:
      "Vedantix verbetert websites voor lokale ondernemers op zichtbaarheid, vertrouwen, contactmomenten en AI-vriendelijke structuur.",
    audienceType: "Lokale ondernemers",
    serviceType: "Online groei, SEO en conversie optimalisatie",
  });
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Resultaten", url: canonical },
  ]);

  return (
    <>
      <SEO
        title="Klantcases: websites voor ondernemers | Vedantix"
        description="Bekijk websites die Vedantix voor ondernemers heeft gebouwd. Lees wat we hebben gerealiseerd en bezoek de websites van onze klanten."
        canonical={canonical}
        schemas={[serviceSchema, faqSchema, breadcrumbSchema]}
      />

      <div className="vx-page">
        <NavBar />
        <main>
          <section className="vx-pagehero" aria-labelledby="results-title">
            <div className="vx-container vx-pagehero__inner">
              <p className="vx-eyebrow">Klantcases</p>
              <h1 id="results-title" className="vx-h1">Ons werk voor <span className="vx-grad">ondernemers</span></h1>
              <p className="vx-lead">
                Bekijk de websites die we hebben gebouwd, lees wat er is gerealiseerd en ontdek welke aanpak bij jouw bedrijf past.
              </p>
              <div className="vx-pagehero__actions">
                <a href="/online-groei-audit" className="vx-btn vx-btn--primary">Vraag een gratis Online Groei Audit aan <ArrowRight aria-hidden="true" /></a>
                <Link to="/prijzen" className="vx-btn vx-btn--ghost">Bekijk pakketten</Link>
              </div>
              <ul className="vx-pagehero__facts" aria-label="Waar we aan werken">
                {[["Zichtbaarheid", "Google"], ["Vertrouwen", "Reviews"], ["Contact", "WhatsApp"], ["Groei", "Aanvragen"]].map(([label, value]) => (
                  <li key={label}><span>{label}</span><strong>{value}</strong></li>
                ))}
              </ul>
            </div>
          </section>

          <section className="vx-section vx-section--soft vx-cases" aria-label="Klantcases">
            <div className="vx-container">
              <ClientCasesSection initialCases={initialCases} placement="results" />
            </div>
          </section>

          <section className="vx-section" aria-labelledby="improvements-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Wat wij verbeteren</p>
                <h2 id="improvements-title" className="vx-h2">Wat een goede website voor je kan doen</h2>
                <p className="vx-lead">Vedantix vertaalt technische onderdelen naar ondernemersvoordeel: zichtbaarheid, vertrouwen, contact en groei.</p>
              </div>
              <div className="vx-grid vx-grid--4">
                {IMPROVEMENTS.map(({ title, text, icon: Icon }) => (
                  <article className="vx-card vx-card--hover" key={title}>
                    <div className="vx-icon"><Icon aria-hidden="true" /></div>
                    <h3 className="vx-h3">{title}</h3>
                    <p className="vx-card__text">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="vx-section vx-section--soft" aria-labelledby="results-faq-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Veelgestelde vragen</p>
                <h2 id="results-faq-title" className="vx-h2">Vragen over resultaten</h2>
              </div>
              <div className="vx-faq">
                {FAQS.map((faq, index) => (
                  <details key={faq.question} open={index === 0}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="vx-final" aria-labelledby="results-cta-title">
            <div className="vx-container vx-final__inner">
              <BarChart3 aria-hidden="true" className="vx-final__icon" />
              <h2 id="results-cta-title" className="vx-h2">Ontdek waar jouw website groei laat liggen</h2>
              <p className="vx-lead">
                De gratis Online Groei Audit laat zien hoe je website scoort op vindbaarheid, vertrouwen, snelheid, mobiel gebruik en contactmomenten.
              </p>
              <div className="vx-final__actions">
                <a href="/online-groei-audit" className="vx-btn vx-btn--primary">Vraag een gratis Online Groei Audit aan <ArrowRight aria-hidden="true" /></a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
