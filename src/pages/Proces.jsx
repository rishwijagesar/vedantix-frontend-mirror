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
    border: 1px solid #dbe4f0;
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
    border: 1px solid #dbe4f0;
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
    border: 1px solid #dbe4f0;
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
    title: "Kennismaking",
    intro: "We starten met een kort gesprek over jouw situatie, wensen en groeidoelen.",
    topicsTitle: "Wat we bespreken",
    topics: ["Jouw bedrijf", "Jouw doelgroep", "Jouw doelen", "Jouw wensen"],
    benefits: ["Duidelijkheid", "Persoonlijk advies", "Inzicht in kansen", "Geen verplichtingen"],
    result: "Je weet precies welke kansen er liggen voor jouw online aanwezigheid.",
  },
  {
    title: "Strategie & Plan",
    intro: "Voordat we beginnen bepalen we hoe jouw website moet bijdragen aan jouw bedrijf.",
    topicsTitle: "Wij kijken onder andere naar",
    topics: ["Structuur", "Vindbaarheid", "Concurrentie", "Gebruiksvriendelijkheid"],
    benefits: ["Een duidelijke richting", "Minder kans op verkeerde keuzes", "Een website die gericht is op groei"],
    result: "Een sterk fundament voor online succes.",
  },
  {
    title: "Ontwikkeling",
    intro: "Wij bouwen jouw website met focus op snelheid, mobiel gebruik en gebruiksvriendelijkheid.",
    topicsTitle: "Wij regelen",
    topics: ["Design", "Hosting", "Techniek", "Mobiele optimalisatie"],
    benefits: ["Professionele uitstraling", "Meer vertrouwen", "Gebruiksgemak", "Geen technisch gedoe"],
    result: "Een website die jouw bedrijf professioneel vertegenwoordigt.",
  },
  {
    title: "Lancering",
    intro: "Voordat jouw website live gaat controleren wij alles zorgvuldig.",
    topicsTitle: "Wij verzorgen onder andere",
    topics: ["Technische controles", "Snelheidscontroles", "Google indexatie", "Kwaliteitscontrole"],
    benefits: ["Een zorgeloze livegang", "Een goede eerste indruk", "Een sterke start"],
    result: "Jouw bedrijf is professioneel online zichtbaar.",
  },
  {
    title: "Groei & Ondersteuning",
    intro: "Voor ons stopt het niet bij oplevering.",
    topicsTitle: "Wij blijven ondersteunen met",
    topics: ["Onderhoud", "Optimalisaties", "Advies", "Content", "Online zichtbaarheid"],
    benefits: ["Meer rust", "Doorlopende verbeteringen", "Een website die blijft meegroeien"],
    result: "Een website die ook op de lange termijn waarde toevoegt aan jouw bedrijf.",
  },
];

const timeCards = [
  {
    title: "Kennismaking",
    time: "± 30 minuten",
    text: "We bespreken jouw wensen en doelen.",
  },
  {
    title: "Content aanleveren",
    time: "± 1 tot 2 uur",
    text: "Teksten, foto's en informatie verzamelen.",
  },
  {
    title: "Feedback geven",
    time: "± 15 minuten per feedbackronde",
    text: "Wij verwerken de wijzigingen.",
  },
  {
    title: "Wij regelen de rest",
    time: "Geen technisch werk voor jou",
    text: "Hosting, techniek, ontwikkeling, livegang en onderhoud.",
    highlight: true,
  },
];

const expectations = [
  {
    title: "Persoonlijk contact",
    text: "Geen anoniem ticketsysteem.",
    icon: HeartHandshake,
  },
  {
    title: "Duidelijke communicatie",
    text: "Je weet altijd waar je aan toe bent.",
    icon: MessageCircle,
  },
  {
    title: "Geen technische zorgen",
    text: "Wij regelen de techniek.",
    icon: Wrench,
  },
  {
    title: "Focus op resultaat",
    text: "Niet alleen een mooie website.",
    icon: Target,
  },
  {
    title: "Professionele uitstraling",
    text: "Meer vertrouwen bij bezoekers.",
    icon: ShieldCheck,
  },
  {
    title: "Ondersteuning na oplevering",
    text: "Wij blijven beschikbaar.",
    icon: LifeBuoy,
  },
];

const visualSteps = [
  { title: "Kennismaking", text: "helder vertrekpunt", icon: MessageCircle },
  { title: "Strategie", text: "gericht op groei", icon: Target },
  { title: "Website", text: "professioneel zichtbaar", icon: Globe2 },
  { title: "Lancering", text: "zorgeloos live", icon: Rocket },
  { title: "Groei", text: "blijvend verbeteren", icon: TrendingUp },
];

const PROCESS_FAQS = [
  {
    question: "Hoe verloopt het traject bij Vedantix?",
    answer:
      "Vedantix start met een kennismaking, maakt daarna een plan, ontwikkelt de website, begeleidt de lancering en blijft ondersteunen met onderhoud en optimalisatie.",
  },
  {
    question: "Moet ik zelf technische kennis hebben?",
    answer:
      "Nee. Vedantix regelt techniek, hosting, livegang, onderhoud en ondersteuning. Jij levert vooral bedrijfsinformatie aan en geeft feedback op de inhoud.",
  },
  {
    question: "Hoe helpt het proces bij betere vindbaarheid?",
    answer:
      "Tijdens strategie en ontwikkeling kijkt Vedantix naar structuur, lokale zoekvragen, gebruiksvriendelijkheid en content. Daardoor krijgt je website een betere basis voor Google en moderne AI-systemen.",
  },
  {
    question: "Wat gebeurt er na livegang?",
    answer:
      "Na livegang blijft Vedantix beschikbaar voor onderhoud, verbeteringen, advies, content en online zichtbaarheid zodat de website met je bedrijf kan meegroeien.",
  },
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
        title="Ons Proces | Van idee naar online groei | Vedantix"
        description="Ontdek hoe Vedantix ondernemers stap voor stap helpt naar meer online zichtbaarheid, vertrouwen en groei."
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
                  Van idee naar online groei
                </div>
                <h1>Van eerste gesprek naar meer online zichtbaarheid</h1>
                <div className="proces-hero-text">
                  <p>Geen ingewikkeld traject.</p>
                  <p>Geen technische rompslomp.</p>
                  <p>
                    Wij begeleiden je stap voor stap naar een professionele online aanwezigheid
                    die vertrouwen uitstraalt, beter gevonden wordt en meer kansen creëert op
                    nieuwe klanten.
                  </p>
                </div>
                <div className="proces-actions" aria-label="Belangrijkste acties">
                  <Link className="proces-btn proces-btn-primary" to="/planning">
                    Plan een kennismaking <ArrowRight size={18} aria-hidden="true" />
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
                <p>Ondernemers denken vaak dat een nieuwe website veel tijd kost.</p>
                <p>In werkelijkheid valt dat meestal mee.</p>
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
                <h2 id="proces-ai-title">Toekomstbestendig voor AI</h2>
                <p>De manier waarop mensen zoeken verandert.</p>
                <p>
                  Wij zorgen ervoor dat jouw website voorbereid is op zowel traditionele
                  zoekmachines als moderne AI-platformen.
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
                    <p>Veel bureaus leveren een website op en gaan door naar de volgende klant.</p>
                    <p>
                      Wij geloven dat een website pas waarde heeft als deze bijdraagt aan de groei
                      van jouw bedrijf.
                    </p>
                    <p>Daarom kijken wij verder dan alleen design.</p>
                    <p>
                      Wij helpen met zichtbaarheid, vertrouwen, gebruiksvriendelijkheid en online
                      groei.
                    </p>
                  </div>
                </div>

                <div className="proces-actions" aria-label="Volgende stap">
                  <Link className="proces-btn proces-btn-primary" to="/prijzen">
                    Bekijk onze pakketten <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="proces-btn proces-btn-secondary" to="/planning">
                    Plan een kennismaking
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
