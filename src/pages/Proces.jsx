import { SOFTWARE_STEPS } from "../data/positioning";
import { Link } from "@/lib/router-compat";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  HeartHandshake,
  LifeBuoy,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";

const PROCESS_STYLES = `
  .proces-page {
    min-height: 100vh;
    background: #f4f7fb;
    color: #0f172a;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .proces-page a {
    text-decoration: none;
  }

  .proces-shell {
    width: min(1160px, calc(100% - 32px));
    margin: 0 auto;
  }

  .proces-hero {
    padding: 118px 0 76px;
    background:
      radial-gradient(circle at 80% 18%, rgba(96, 165, 250, .22), transparent 34%),
      radial-gradient(circle at 16% 78%, rgba(34, 197, 94, .13), transparent 30%),
      linear-gradient(150deg, #061023 0%, #0c1a33 55%, #0d2746 100%);
    color: #fff;
  }

  .proces-hero-grid {
    display: grid;
    gap: 32px;
    align-items: center;
  }

  .proces-kicker,
  .proces-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    max-width: 100%;
    color: #2563eb;
    font-size: .72rem;
    font-weight: 950;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .proces-kicker {
    margin-bottom: 18px;
    padding: 8px 13px;
    border: 1px solid rgba(255, 255, 255, .13);
    border-radius: 999px;
    background: rgba(255, 255, 255, .07);
    color: rgba(255, 255, 255, .88);
  }

  .proces-hero h1 {
    max-width: 820px;
    margin: 0;
    color: #fff;
    font-size: clamp(2.55rem, 10vw, 5rem);
    font-weight: 950;
    line-height: .98;
    letter-spacing: 0;
  }

  .proces-hero-text {
    display: grid;
    gap: 10px;
    max-width: 680px;
    margin-top: 22px;
  }

  .proces-hero-text p,
  .proces-section-heading p,
  .proces-card p,
  .proces-time-card p,
  .proces-expect-card p,
  .proces-closing-copy p {
    margin: 0;
    color: #64748b;
    font-size: .98rem;
    line-height: 1.7;
  }

  .proces-hero-text p {
    color: rgba(255, 255, 255, .76);
    font-size: clamp(1rem, 2.4vw, 1.14rem);
  }

  .proces-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
  }

  .proces-btn {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 13px 20px;
    border: 1px solid transparent;
    border-radius: 8px;
    font-size: .93rem;
    font-weight: 950;
    transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
  }

  .proces-btn:hover {
    transform: translateY(-1px);
  }

  .proces-btn-primary {
    background: #fff;
    color: #0f172a;
    box-shadow: 0 18px 42px rgba(0, 0, 0, .2);
  }

  .proces-btn-secondary {
    border-color: rgba(255, 255, 255, .16);
    background: rgba(255, 255, 255, .07);
    color: #fff;
  }

  .proces-section .proces-btn-primary,
  .proces-closing .proces-btn-primary {
    background: #0f172a;
    color: #fff;
  }

  .proces-section .proces-btn-secondary,
  .proces-closing .proces-btn-secondary {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .proces-visual {
    display: grid;
    gap: 12px;
    padding: 26px;
    border: 1px solid rgba(255, 255, 255, .13);
    border-radius: 8px;
    background: linear-gradient(165deg, rgba(255, 255, 255, .12), rgba(255, 255, 255, .06));
    box-shadow: 0 24px 70px rgba(0, 0, 0, .24);
  }

  .proces-visual-step {
    display: grid;
    grid-template-columns: 42px 1fr;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: 8px;
    background: rgba(255, 255, 255, .07);
  }

  .proces-visual-icon {
    display: grid;
    width: 42px;
    height: 42px;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(135deg, #2563eb, #22c55e);
    color: #fff;
  }

  .proces-visual-step strong {
    display: block;
    color: #fff;
    font-size: .88rem;
    font-weight: 950;
  }

  .proces-visual-step span {
    display: block;
    margin-top: 2px;
    color: rgba(255, 255, 255, .68);
    font-size: .78rem;
    font-weight: 750;
  }

  .proces-section {
    padding: 76px 0;
    background: #fff;
  }

  .proces-section-muted {
    background: #f4f7fb;
  }

  .proces-section-heading {
    max-width: 780px;
    margin-bottom: 28px;
  }

  .proces-section-heading.center {
    margin-right: auto;
    margin-left: auto;
    text-align: center;
  }

  .proces-section-heading h2,
  .proces-closing h2 {
    margin: 8px 0 0;
    color: #0f172a;
    font-size: clamp(1.9rem, 7vw, 3.2rem);
    font-weight: 950;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .proces-section-heading p {
    max-width: 680px;
    margin-top: 12px;
  }

  .proces-section-heading.center p {
    margin-right: auto;
    margin-left: auto;
  }

  .proces-timeline {
    position: relative;
    display: grid;
    gap: 18px;
  }

  .proces-card,
  .proces-time-card,
  .proces-expect-card,
  .proces-closing-card {
    border: 1px solid #c3d3ea;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, .065);
  }

  .proces-card {
    display: grid;
    gap: 18px;
    padding: 24px;
  }

  .proces-step-head {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }

  .proces-step-number,
  .proces-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 8px;
    color: #fff;
  }

  .proces-step-number {
    width: 46px;
    height: 46px;
    background: linear-gradient(135deg, #2563eb, #22c55e);
    font-weight: 950;
  }

  .proces-card h3,
  .proces-time-card h3,
  .proces-expect-card h3 {
    margin: 0 0 8px;
    color: #0f172a;
    font-size: 1.18rem;
    font-weight: 950;
    letter-spacing: 0;
  }

  .proces-step-body {
    display: grid;
    gap: 16px;
  }

  .proces-mini-grid {
    display: grid;
    gap: 12px;
  }

  .proces-mini-box {
    padding: 14px;
    border: 1px solid #c3d3ea;
    border-radius: 8px;
    background: #f8fafc;
  }

  .proces-mini-box strong,
  .proces-result strong {
    display: block;
    margin-bottom: 10px;
    color: #0f172a;
    font-size: .86rem;
    font-weight: 950;
  }

  .proces-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .proces-list li {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    color: #334155;
    font-size: .94rem;
    font-weight: 760;
    line-height: 1.45;
  }

  .proces-list svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: #16a34a;
  }

  .proces-list.plain li::before {
    content: "";
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    margin-top: .55em;
    border-radius: 999px;
    background: #2563eb;
  }

  .proces-result {
    padding: 14px;
    border: 1px solid rgba(34, 197, 94, .28);
    border-radius: 8px;
    background: #ecfdf5;
    color: #047857;
    font-size: .9rem;
    font-weight: 850;
    line-height: 1.55;
  }

  .proces-time-grid,
  .proces-expect-grid,
  .proces-faq-grid {
    display: grid;
    gap: 16px;
  }

  .proces-time-card,
  .proces-expect-card {
    padding: 24px;
  }

  .proces-faq-card {
    padding: 22px;
    border: 1px solid #c3d3ea;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, .055);
  }

  .proces-faq-card h3 {
    margin: 0 0 10px;
    color: #0f172a;
    font-size: 1.02rem;
    line-height: 1.3;
    font-weight: 950;
  }

  .proces-faq-card p {
    margin: 0;
    color: #64748b;
    font-size: .92rem;
    line-height: 1.7;
  }

  .proces-time-card.highlight {
    border-color: rgba(34, 197, 94, .34);
    background: #ecfdf5;
  }

  .proces-time-value {
    display: inline-flex;
    margin-bottom: 14px;
    padding: 8px 11px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: .82rem;
    font-weight: 950;
  }

  .proces-time-card.highlight .proces-time-value {
    background: #d1fae5;
    color: #047857;
  }

  .proces-icon {
    width: 58px;
    height: 58px;
    margin-bottom: 18px;
    background: #eff6ff;
    color: #2563eb;
  }

  .proces-closing {
    padding: 78px 0;
    background: #071225;
    color: #fff;
  }

  .proces-closing-card {
    display: grid;
    gap: 24px;
    padding: 30px;
    background:
      radial-gradient(circle at 86% 20%, rgba(34, 197, 94, .13), transparent 34%),
      linear-gradient(145deg, #0b1730, #0d2746);
    border-color: rgba(255, 255, 255, .13);
  }

  .proces-closing h2,
  .proces-closing .proces-label {
    color: #fff;
  }

  .proces-closing-copy {
    display: grid;
    gap: 12px;
    max-width: 720px;
  }

  .proces-closing-copy p {
    color: rgba(255, 255, 255, .74);
  }

  .proces-closing .proces-actions {
    margin-top: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .proces-card,
    .proces-time-card,
    .proces-expect-card,
    .proces-visual,
    .proces-closing-card {
      animation: proces-reveal .6s ease both;
    }
  }

  @keyframes proces-reveal {
    from {
      opacity: .2;
      transform: translateY(14px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (min-width: 760px) {
    .proces-hero-grid {
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, .7fr);
    }

    .proces-card {
      grid-template-columns: minmax(0, .84fr) minmax(0, 1.16fr);
    }

    .proces-mini-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .proces-time-grid,
    .proces-expect-grid,
    .proces-faq-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .proces-closing-card {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
  }

  @media (min-width: 1040px) {
    .proces-expect-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .proces-time-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 620px) {
    .proces-hero {
      padding: 104px 0 58px;
    }

    .proces-actions,
    .proces-closing .proces-actions {
      flex-direction: column;
    }

    .proces-btn {
      width: 100%;
    }

    .proces-step-head {
      align-items: center;
    }
  }
`;

const processSteps = [
  {
    "title": "Bedrijfsscan",
    "intro": "We brengen je echte werkwijze in kaart met de mensen die ermee werken.",
    "topicsTitle": "Wat we onderzoeken",
    "topics": [
      "Processen en afdelingen",
      "Bestaande tools",
      "Abonnementskosten",
      "Handwerk en knelpunten"
    ],
    "benefits": [
      "Een gedeeld vertrekpunt",
      "Kansen op minder dubbel werk",
      "Keuze tussen behoud en maatwerk"
    ],
    "result": "Een concreet beeld van wat een eerste fase moet oplossen."
  },
  {
    "title": "Voorstel en afspraken",
    "intro": "Je krijgt een voorstel met fases en kosten voordat we bouwen.",
    "topicsTitle": "Wat we vastleggen",
    "topics": [
      "Functionaliteit en rolrechten",
      "Opstartkosten en vast maandbedrag",
      "Inbegrepen gebruik en externe kosten",
      "Wijzigingen, uitbreiding en acceptatie"
    ],
    "benefits": [
      "Een afgebakende eerste fase",
      "Heldere kosten",
      "Beheer en overdracht vooraf besproken"
    ],
    "result": "Een voorstel dat je kunt beoordelen, zonder onbeperkte claims."
  },
  {
    "title": "Gefaseerde ontwikkeling",
    "intro": "AI helpt bij het bouwen; Vedantix controleert het resultaat professioneel.",
    "topicsTitle": "Wat we uitwerken",
    "topics": [
      "Echte bedrijfsprocessen",
      "Een centrale webapp",
      "Passende toegangsrechten",
      "Instructies binnen de scope"
    ],
    "benefits": [
      "Stapsgewijze feedback",
      "Controleerbare resultaten",
      "Aansluiting op het dagelijks werk"
    ],
    "result": "Een werkende fase die klaar is voor de afgesproken tests."
  },
  {
    "title": "Testen en accepteren",
    "intro": "We controleren de afgesproken functies, rollen en foutgevallen samen met je team.",
    "topicsTitle": "Voor livegang",
    "topics": [
      "Functionele tests",
      "Toegangscontroles",
      "Projectspecifieke hersteltests",
      "Jouw acceptatie"
    ],
    "benefits": [
      "Bevindingen vastgelegd",
      "Een beoordeelde oplevering",
      "Duidelijke uitleg voor gebruikers"
    ],
    "result": "Pas na acceptatie gaat de betreffende fase live."
  },
  {
    "title": "Beheer en uitbreiding",
    "intro": "Hosting, opslag, onderhoud en support volgen de overeengekomen dienstverlening.",
    "topicsTitle": "Doorlopende afspraken",
    "topics": [
      "Gebruik en support",
      "Updates en monitoring",
      "Backups en herstel",
      "Instructies, uitbreiding en export"
    ],
    "benefits": [
      "Heldere verantwoordelijkheden",
      "Bijgehouden instructies binnen scope",
      "Uitbreiden wanneer nodig"
    ],
    "result": "Afspraken over continuïteit, kosten en overdraagbaarheid op maat."
  }
];

const timeCards = [
  {
    "title": "Bedrijfsscan",
    "time": "Omvang vooraf afgesproken",
    "text": "Je team helpt de huidige werkwijze, tools en knelpunten in kaart te brengen."
  },
  {
    "title": "Voorbereiding",
    "time": "Per project afgestemd",
    "text": "We spreken af welke gegevens, voorbeelden en informatie nodig zijn."
  },
  {
    "title": "Feedback en acceptatie",
    "time": "Per fase gepland",
    "text": "De betrokken gebruikers beoordelen de afgesproken functies en tests."
  },
  {
    "title": "Beheer",
    "time": "Binnen afgesproken scope",
    "text": "Hosting, opslag, onderhoud, support en instructies volgen de offerte.",
    "highlight": true
  }
];

const expectations = [
  {
    title: "Persoonlijk contact",
    text: "Geen anoniem ticketsysteem.",
    icon: HeartHandshake,
  },
  {
    title: "Duidelijke communicatie",
    text: "We leggen scope, verantwoordelijkheden en contactmomenten vast.",
    icon: MessageCircle,
  },
  {
    title: "Geen technische zorgen",
    text: "Wij regelen de techniek.",
    icon: Wrench,
  },
  {
    title: "Focus op resultaat",
    text: "Een oplossing voor jouw echte werkproces.",
    icon: Target,
  },
  {
    title: "Professionele uitstraling",
    text: "Meer vertrouwen bij bezoekers.",
    icon: ShieldCheck,
  },
  {
    title: "Ondersteuning na oplevering",
    text: "Support en opvolging volgens de afgesproken dienstverlening.",
    icon: LifeBuoy,
  },
];

const visualSteps = SOFTWARE_STEPS.map((step, index) => ({ ...step, icon: [MessageCircle, Target, Globe2, ShieldCheck, LifeBuoy][index] }));

const PROCESS_FAQS = [
  {
    "question": "Hoe verloopt het traject bij Vedantix?",
    "answer": "Bedrijfsscan, concreet voorstel, gefaseerde ontwikkeling, testen en acceptatie voor livegang, daarna beheer volgens afspraak. Voor een website spreken we een passende eigen scope af."
  },
  {
    "question": "Moet ik zelf technische kennis hebben?",
    "answer": "Nee. Je brengt je bedrijfsprocessen en voorbeelden mee en geeft feedback. We leggen de aanpak in gewone taal uit. Onboarding en bijgehouden instructies stemmen we af op de afgesproken dienstverlening."
  },
  {
    "question": "Hoe wordt beveiliging afgesproken?",
    "answer": "We leggen vooraf toegangsrechten, MFA waar passend, backups en hersteltests, updates, monitoring en dataverwerking vast. Maatregelen en bewijs van controles worden afgestemd op het project, zonder absolute veiligheidsgarantie."
  },
  {
    "question": "Wat gebeurt er na livegang?",
    "answer": "Het vaste maandbedrag geldt voor afgesproken functionaliteit, hosting, opslag, onderhoud en support. Inbegrepen gebruik, wijzigingen, uitbreiding, externe kosten en overdracht/export zijn vooraf vastgelegd."
  }
];

function CheckList({ items }) {
  return (
    <ul className="proces-list">
      {items.map((item) => (
        <li key={item}>
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PlainList({ items }) {
  return (
    <ul className="proces-list plain">
      {items.map((item) => (
        <li key={item}>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Proces() {
  const canonical = "https://vedantix.nl/proces";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Proces", url: canonical },
  ]);
  const faqSchema = createFAQSchema(PROCESS_FAQS);

  return (
    <>
      <SEO
        title="Werkwijze | Van bedrijfsscan tot beheerde software | Vedantix"
        description="Van bedrijfsscan en concreet voorstel tot gefaseerd bouwen, testen, acceptatie en beheer. Heldere afspraken voor software en websites bij Vedantix."
        canonical={canonical}
        schemas={[breadcrumbSchema, faqSchema]}
      />

      <style>{PROCESS_STYLES}</style>

      <div className="proces-page">
        <NavBar />

        <main>
          <section className="proces-hero">
            <div className="proces-shell proces-hero-grid">
              <div>
                <div className="proces-kicker">
                  <Sparkles size={16} aria-hidden="true" />
                  Van bedrijfsscan naar werkende software
                </div>
                <h1>Van jouw werkproces naar een passende applicatie</h1>
                <div className="proces-hero-text">
                  <p>Eerst begrijpen wat jouw bedrijf nodig heeft.</p>
                  <p>Daarna helder afspreken en in fases bouwen.</p>
                  <p>
                    We bespreken processen, tools, abonnementen en handwerk. Je krijgt
                    een concreet voorstel met opstartkosten en een vast maandbedrag voor
                    de afgesproken dienstverlening.
                  </p>
                </div>
                <div className="proces-actions" aria-label="Belangrijkste acties">
                  <Link className="proces-btn proces-btn-primary" to="/contact#contact-form">
                    Plan een bedrijfsscan <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="proces-btn proces-btn-secondary" to="/prijzen">
                    Bekijk onze pakketten
                  </Link>
                </div>
              </div>

              <aside className="proces-visual" aria-label="Groeipad van Vedantix">
                {visualSteps.map(({ title, text, icon: Icon }) => (
                  <div className="proces-visual-step" key={title}>
                    <span className="proces-visual-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </div>
                  </div>
                ))}
              </aside>
            </div>
          </section>

          <section className="proces-section" aria-labelledby="samenwerking-title">
            <div className="proces-shell">
              <div className="proces-section-heading center">
                <p className="proces-label">Samenwerking</p>
                <h2 id="samenwerking-title">Zo verloopt een samenwerking met Vedantix</h2>
                <p>Een duidelijk proces zorgt voor betere resultaten en minder verrassingen.</p>
              </div>

              <div className="proces-timeline">
                {processSteps.map((step, index) => (
                  <article className="proces-card" key={step.title}>
                    <div className="proces-step-head">
                      <span className="proces-step-number">{index + 1}</span>
                      <div>
                        <p className="proces-label">Stap {index + 1}</p>
                        <h3>{step.title}</h3>
                        <p>{step.intro}</p>
                      </div>
                    </div>

                    <div className="proces-step-body">
                      <div className="proces-mini-grid">
                        <div className="proces-mini-box">
                          <strong>{step.topicsTitle}</strong>
                          <PlainList items={step.topics} />
                        </div>
                        <div className="proces-mini-box">
                          <strong>Wat levert dit jou op?</strong>
                          <CheckList items={step.benefits} />
                        </div>
                      </div>

                      <div className="proces-result">
                        <strong>Resultaat</strong>
                        {step.result}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="proces-section proces-section-muted" aria-labelledby="tijd-title">
            <div className="proces-shell">
              <div className="proces-section-heading">
                <p className="proces-label">Tijdsinvestering</p>
                <h2 id="tijd-title">Hoeveel tijd kost dit jou?</h2>
                <p>We plannen gesprekken, informatie, feedback en acceptatie samen met de betrokken mensen.</p>
                <p>De tijdsinvestering en planning hangen af van het project; we beloven geen algemene levertijd.</p>
              </div>

              <div className="proces-time-grid">
                {timeCards.map((card) => (
                  <article
                    className={`proces-time-card ${card.highlight ? "highlight" : ""}`}
                    key={card.title}
                  >
                    <span className="proces-time-value">{card.time}</span>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="proces-section" aria-labelledby="verwachtingen-title">
            <div className="proces-shell">
              <div className="proces-section-heading center">
                <p className="proces-label">Wat je mag verwachten</p>
                <h2 id="verwachtingen-title">Wat je van ons mag verwachten</h2>
              </div>

              <div className="proces-expect-grid">
                {expectations.map(({ title, text, icon: Icon }) => (
                  <article className="proces-expect-card" key={title}>
                    <span className="proces-icon">
                      <Icon size={28} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="proces-section proces-section-muted" aria-labelledby="proces-ai-title">
            <div className="proces-shell">
              <div className="proces-section-heading center">
                <p className="proces-label">AI-readiness</p>
                <h2 id="proces-ai-title">Professionele controle, ook met AI</h2>
                <p>AI is een ontwikkelhulpmiddel, geen kwaliteits- of veiligheidsgarantie.</p>
                <p>
                  Vedantix controleert de code en test de afgesproken processen.
                  Beveiliging, dataverwerking en beheer krijgen projectspecifieke afspraken.
                </p>
              </div>

              <div className="proces-faq-grid">
                {PROCESS_FAQS.map((faq) => (
                  <article className="proces-faq-card" key={faq.question}>
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="proces-closing" aria-labelledby="waarom-title">
            <div className="proces-shell">
              <div className="proces-closing-card">
                <div>
                  <p className="proces-label">Waarom Vedantix</p>
                  <h2 id="waarom-title">Waarom ondernemers voor Vedantix kiezen</h2>
                  <div className="proces-closing-copy">
                    <p>We kijken naar het werk dat jouw bedrijf dagelijks doet.</p>
                    <p>
                      Een oplossing moet passen bij je mensen, gegevens en werkprocessen.
                      Websites en hosting blijven beschikbaar als zelfstandige diensten.
                    </p>
                    <p>Daarom kijken wij verder dan alleen design.</p>
                    <p>
                      Wij leggen scope, gebruik, support en beheer vooraf vast. Overdracht en
                      exportmogelijkheden spreken we samen af.
                    </p>
                  </div>
                </div>

                <div className="proces-actions" aria-label="Volgende stap">
                  <Link className="proces-btn proces-btn-primary" to="/prijzen">
                    Bekijk onze pakketten <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="proces-btn proces-btn-secondary" to="/contact#contact-form">
                    Plan een bedrijfsscan
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
