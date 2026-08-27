import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createBreadcrumbSchema, createFAQSchema, createServiceSchema } from "../utils/schema";

const RESULT_STYLES = `
  * { box-sizing: border-box; }

  .results-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%);
    color: #0f172a;
  }

  .results-shell {
    width: min(1160px, calc(100% - 32px));
    margin: 0 auto;
    padding: 116px 0 76px;
  }

  .results-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
    gap: 34px;
    align-items: stretch;
  }

  .results-panel {
    background: rgba(255,255,255,0.92);
    border: 1px solid #dbe7f5;
    border-radius: 22px;
    box-shadow: 0 24px 58px rgba(15,23,42,0.08);
    padding: 34px;
  }

  .results-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .results-hero h1 {
    font-size: clamp(2.45rem, 5vw, 4.7rem);
    line-height: 0.98;
    letter-spacing: -0.04em;
    margin: 0 0 18px;
  }

  .results-lead {
    max-width: 720px;
    color: #475569;
    line-height: 1.75;
    font-size: 1.08rem;
    margin: 0 0 26px;
  }

  .results-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .results-primary,
  .results-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 18px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 850;
    font-size: 0.92rem;
  }

  .results-primary {
    background: #0f172a;
    color: #fff;
    box-shadow: 0 16px 32px rgba(15,23,42,0.14);
  }

  .results-secondary {
    background: #fff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
  }

  .results-scorecard {
    background: linear-gradient(145deg, #0f172a 0%, #172554 100%);
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  .results-scorecard::after {
    content: "";
    position: absolute;
    inset: auto -80px -90px auto;
    width: 220px;
    height: 220px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(96,165,250,0.34), transparent 66%);
    pointer-events: none;
  }

  .results-score-grid {
    display: grid;
    gap: 12px;
    position: relative;
    z-index: 1;
  }

  .results-score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
  }

  .results-score-row strong {
    font-size: 1.1rem;
  }

  .results-section {
    margin-top: 34px;
  }

  .results-section-header {
    max-width: 760px;
    margin-bottom: 22px;
  }

  .results-section-header.center {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }

  .results-section-label {
    color: #2563eb;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .results-section h2 {
    font-size: clamp(1.9rem, 3.6vw, 3rem);
    letter-spacing: -0.035em;
    line-height: 1.05;
    margin: 0 0 12px;
  }

  .results-section p {
    color: #64748b;
    line-height: 1.75;
    margin: 0;
  }

  .results-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .results-card {
    background: #fff;
    border: 1px solid #dbe7f5;
    border-radius: 18px;
    padding: 22px;
    box-shadow: 0 16px 34px rgba(15,23,42,0.05);
  }

  .results-card svg {
    color: #2563eb;
    margin-bottom: 14px;
  }

  .results-card h3 {
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .results-case {
    display: grid;
    grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
    gap: 18px;
  }

  .results-case-list {
    display: grid;
    gap: 12px;
    margin: 20px 0 0;
    padding: 0;
    list-style: none;
  }

  .results-case-list li {
    display: grid;
    grid-template-columns: 22px 1fr;
    gap: 10px;
    color: #334155;
    line-height: 1.55;
  }

  .results-case-list svg {
    color: #10b981;
    margin-top: 2px;
  }

  .results-faq-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .results-faq {
    background: #fff;
    border: 1px solid #dbe7f5;
    border-radius: 16px;
    padding: 20px;
  }

  .results-faq h3 {
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .results-bottom {
    text-align: center;
    background: linear-gradient(135deg, #0f172a, #1e3a8a);
    color: #fff;
  }

  .results-bottom p {
    color: rgba(255,255,255,0.74);
    max-width: 680px;
    margin: 0 auto 22px;
  }

  @media (max-width: 920px) {
    .results-hero,
    .results-case {
      grid-template-columns: 1fr;
    }

    .results-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .results-shell {
      width: min(100% - 24px, 1160px);
      padding: 98px 0 54px;
    }

    .results-panel {
      padding: 24px 20px;
      border-radius: 18px;
    }

    .results-card-grid,
    .results-faq-grid {
      grid-template-columns: 1fr;
    }

    .results-actions {
      flex-direction: column;
    }
  }
`;

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

export default function Resultaten() {
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
        title="Resultaten voor lokale ondernemers | Vedantix"
        description="Bekijk hoe Vedantix lokale ondernemers helpt met meer zichtbaarheid, meer vertrouwen, betere websites en meer aanvragen."
        canonical={canonical}
        schemas={[serviceSchema, faqSchema, breadcrumbSchema]}
      />

      <style>{RESULT_STYLES}</style>

      <div className="results-page">
        <NavBar />
        <main className="results-shell">
          <section className="results-hero" aria-labelledby="results-title">
            <div className="results-panel">
              <div className="results-kicker">
                <TrendingUp size={16} aria-hidden="true" />
                Resultaten
              </div>
              <h1 id="results-title">Websites die ondernemers helpen groeien</h1>
              <p className="results-lead">
                Een website moet niet alleen mooi zijn. Hij moet bezoekers overtuigen,
                vertrouwen opbouwen en kansen creëren op nieuwe klanten.
              </p>
              <div className="results-actions">
                <a href="/online-groei-audit" className="results-primary">
                  Vraag een gratis Online Groei Audit aan
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
                <Link to="/prijzen" className="results-secondary">
                  Bekijk pakketten
                </Link>
              </div>
            </div>

            <aside className="results-panel results-scorecard" aria-label="Online groei indicatoren">
              <div className="results-section-label">Wat wij zichtbaar maken</div>
              <h2 style={{ color: "#fff", marginBottom: 18 }}>Van website naar groeikanaal</h2>
              <div className="results-score-grid">
                <div className="results-score-row">
                  <span>Zichtbaarheid</span>
                  <strong>Google</strong>
                </div>
                <div className="results-score-row">
                  <span>Vertrouwen</span>
                  <strong>Reviews</strong>
                </div>
                <div className="results-score-row">
                  <span>Contact</span>
                  <strong>WhatsApp</strong>
                </div>
                <div className="results-score-row">
                  <span>Groei</span>
                  <strong>Aanvragen</strong>
                </div>
              </div>
            </aside>
          </section>

          <section className="results-section" aria-labelledby="improvements-title">
            <div className="results-section-header center">
              <div className="results-section-label">Wat wij verbeteren</div>
              <h2 id="improvements-title">Bewijs dat jouw website werkt</h2>
              <p>
                Vedantix vertaalt technische onderdelen naar ondernemersvoordeel:
                zichtbaarheid, vertrouwen, contact en groei.
              </p>
            </div>

            <div className="results-card-grid">
              {IMPROVEMENTS.map(({ title, text, icon: Icon }) => (
                <article className="results-card" key={title}>
                  <Icon size={28} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="results-section results-case" aria-labelledby="case-title">
            <div className="results-panel">
              <div className="results-section-label">Voorbeeldcase</div>
              <h2 id="case-title">Jitan Sports</h2>
              <p>
                Voor Jitan Sports draait online groei om vertrouwen, duidelijke diensten,
                lokale zichtbaarheid en laagdrempelige contactmomenten.
              </p>
              <ul className="results-case-list">
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Heldere positionering rondom personal training, massage en begeleiding.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>CTA’s ingericht op proefles, WhatsApp en direct contact.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Structuur gericht op vertrouwen, lokale vindbaarheid en conversie.</span>
                </li>
              </ul>
            </div>

            <div className="results-panel">
              <div className="results-section-label">Waarom dit werkt</div>
              <h2>Een website moet keuzes makkelijker maken</h2>
              <p>
                Bezoekers vergelijken snel. Ze willen weten of een bedrijf professioneel is,
                of de dienst past bij hun vraag en hoe ze eenvoudig contact opnemen.
              </p>
              <p style={{ marginTop: 14 }}>
                Daarom verbeteren we niet alleen de vormgeving, maar ook de route van bezoeker
                naar aanvraag.
              </p>
              <div className="results-actions" style={{ marginTop: 22 }}>
                <a href="/online-groei-audit" className="results-primary">
                  Vraag jouw audit aan
                </a>
                <Link to="/website/personal-trainer" className="results-secondary">
                  Bekijk branchevoorbeeld
                </Link>
              </div>
            </div>
          </section>

          <section className="results-section" aria-labelledby="results-faq-title">
            <div className="results-section-header center">
              <div className="results-section-label">Veelgestelde vragen</div>
              <h2 id="results-faq-title">Vragen over resultaten</h2>
            </div>
            <div className="results-faq-grid">
              {FAQS.map((faq) => (
                <article className="results-faq" key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="results-section results-panel results-bottom">
            <BarChart3 size={34} aria-hidden="true" />
            <h2>Ontdek waar jouw website groei laat liggen</h2>
            <p>
              De gratis Online Groei Audit laat zien hoe je website scoort op vindbaarheid,
              vertrouwen, snelheid, mobiel gebruik en contactmomenten.
            </p>
            <a href="/online-groei-audit" className="results-primary">
              Vraag een gratis Online Groei Audit aan
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </section>
        </main>
      </div>
    </>
  );
}
