import { Link } from "@/lib/router-compat";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  HeartPulse,
  LifeBuoy,
  LineChart,
  MessageCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Utensils,
  Wrench,
  XCircle,
} from "lucide-react";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";

const PAGE_STYLES = `
  .voorwie-page {
    min-height: 100vh;
    background: #f4f7fb;
    color: #0f172a;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .voorwie-page a {
    text-decoration: none;
  }

  .voorwie-shell {
    width: min(1160px, calc(100% - 32px));
    margin: 0 auto;
  }

  .voorwie-hero {
    padding: 118px 0 76px;
    background:
      radial-gradient(circle at 82% 20%, rgba(96, 165, 250, .21), transparent 34%),
      radial-gradient(circle at 12% 74%, rgba(34, 197, 94, .13), transparent 30%),
      linear-gradient(150deg, #061023 0%, #0c1a33 55%, #0d2746 100%);
    color: #fff;
  }

  .voorwie-hero-grid {
    display: grid;
    gap: 32px;
    align-items: center;
  }

  .voorwie-kicker,
  .voorwie-label {
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

  .voorwie-kicker {
    margin-bottom: 18px;
    padding: 8px 13px;
    border: 1px solid rgba(255, 255, 255, .13);
    border-radius: 999px;
    background: rgba(255, 255, 255, .07);
    color: rgba(255, 255, 255, .88);
  }

  .voorwie-hero h1 {
    max-width: 780px;
    margin: 0;
    color: #fff;
    font-size: clamp(2.55rem, 10vw, 5rem);
    font-weight: 950;
    line-height: .98;
    letter-spacing: 0;
  }

  .voorwie-hero-text {
    display: grid;
    gap: 10px;
    max-width: 660px;
    margin: 22px 0 0;
  }

  .voorwie-hero-text p,
  .voorwie-section-heading p,
  .voorwie-closing-copy p {
    margin: 0;
    color: #64748b;
    font-size: .98rem;
    line-height: 1.7;
  }

  .voorwie-hero-text p {
    color: rgba(255, 255, 255, .76);
    font-size: clamp(1rem, 2.4vw, 1.14rem);
  }

  .voorwie-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
  }

  .voorwie-btn {
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

  .voorwie-btn:hover {
    transform: translateY(-1px);
  }

  .voorwie-btn-primary {
    background: #fff;
    color: #0f172a;
    box-shadow: 0 18px 42px rgba(0, 0, 0, .2);
  }

  .voorwie-btn-secondary {
    border-color: rgba(255, 255, 255, .16);
    background: rgba(255, 255, 255, .07);
    color: #fff;
  }

  .voorwie-section .voorwie-btn-primary,
  .voorwie-closing .voorwie-btn-primary {
    background: #0f172a;
    color: #fff;
  }

  .voorwie-section .voorwie-btn-secondary,
  .voorwie-closing .voorwie-btn-secondary {
    border-color: #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .voorwie-hero-visual {
    position: relative;
    min-height: 340px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .13);
    border-radius: 8px;
    background: linear-gradient(165deg, rgba(255, 255, 255, .12), rgba(255, 255, 255, .06));
    box-shadow: 0 24px 70px rgba(0, 0, 0, .24);
  }

  .voorwie-visual-core {
    position: absolute;
    inset: 50% auto auto 50%;
    display: grid;
    width: 150px;
    height: 150px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, .18);
    border-radius: 999px;
    background: linear-gradient(135deg, #2563eb, #22c55e);
    color: #fff;
    transform: translate(-50%, -50%);
    box-shadow: 0 22px 60px rgba(37, 99, 235, .3);
  }

  .voorwie-visual-core strong {
    display: block;
    font-size: 1.08rem;
    font-weight: 950;
    letter-spacing: 0;
  }

  .voorwie-orbit {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, .13);
    border-radius: 8px;
    background: rgba(255, 255, 255, .08);
    color: rgba(255, 255, 255, .9);
    font-size: .8rem;
    font-weight: 850;
  }

  .voorwie-orbit svg {
    color: #93c5fd;
  }

  .voorwie-orbit:nth-child(2) { top: 34px; left: 30px; }
  .voorwie-orbit:nth-child(3) { top: 64px; right: 26px; }
  .voorwie-orbit:nth-child(4) { right: 40px; bottom: 52px; }
  .voorwie-orbit:nth-child(5) { bottom: 42px; left: 34px; }

  .voorwie-section {
    padding: 76px 0;
    background: #fff;
  }

  .voorwie-section-muted {
    background: #f4f7fb;
  }

  .voorwie-section-dark {
    background: #071225;
    color: #fff;
  }

  .voorwie-section-heading {
    max-width: 760px;
    margin-bottom: 28px;
  }

  .voorwie-section-heading.center {
    margin-right: auto;
    margin-left: auto;
    text-align: center;
  }

  .voorwie-section-heading h2,
  .voorwie-closing h2 {
    margin: 8px 0 0;
    color: #0f172a;
    font-size: clamp(1.9rem, 7vw, 3.2rem);
    font-weight: 950;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .voorwie-section-heading p {
    max-width: 680px;
    margin-top: 12px;
  }

  .voorwie-section-heading.center p {
    margin-right: auto;
    margin-left: auto;
  }

  .voorwie-section-dark .voorwie-section-heading h2,
  .voorwie-section-dark .voorwie-label {
    color: #fff;
  }

  .voorwie-section-dark .voorwie-section-heading p {
    color: rgba(255, 255, 255, .72);
  }

  .voorwie-card-grid,
  .voorwie-category-grid,
  .voorwie-benefit-grid,
  .voorwie-match-grid,
  .voorwie-faq-grid {
    display: grid;
    gap: 16px;
  }

  .voorwie-card,
  .voorwie-category-card,
  .voorwie-benefit-card,
  .voorwie-match-card,
  .voorwie-faq-card,
  .voorwie-closing-card {
    border: 1px solid #dbe4f0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 18px 45px rgba(15, 23, 42, .065);
  }

  .voorwie-card,
  .voorwie-category-card,
  .voorwie-benefit-card,
  .voorwie-match-card,
  .voorwie-faq-card {
    padding: 24px;
  }

  .voorwie-icon {
    display: grid;
    width: 58px;
    height: 58px;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 8px;
    background: #eff6ff;
    color: #2563eb;
  }

  .voorwie-card h3,
  .voorwie-category-card h3,
  .voorwie-benefit-card h3,
  .voorwie-match-card h3,
  .voorwie-faq-card h3 {
    margin: 0 0 9px;
    color: #0f172a;
    font-size: 1.14rem;
    font-weight: 950;
    letter-spacing: 0;
  }

  .voorwie-card p,
  .voorwie-category-card p,
  .voorwie-benefit-card p,
  .voorwie-faq-card p {
    margin: 0;
    color: #64748b;
    font-size: .95rem;
    line-height: 1.7;
  }

  .voorwie-category-list,
  .voorwie-match-list {
    display: grid;
    gap: 9px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .voorwie-category-list li,
  .voorwie-match-list li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    color: #334155;
    font-size: .94rem;
    font-weight: 760;
    line-height: 1.45;
  }

  .voorwie-category-result {
    margin-top: 18px;
    padding: 13px;
    border-radius: 8px;
    background: #ecfdf5;
    color: #047857;
    font-size: .88rem;
    font-weight: 850;
    line-height: 1.5;
  }

  .voorwie-category-card svg,
  .voorwie-match-list svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: #16a34a;
  }

  .voorwie-match-card.bad {
    border-color: rgba(220, 38, 38, .24);
  }

  .voorwie-match-card.good {
    border-color: rgba(34, 197, 94, .32);
  }

  .voorwie-match-card.bad .voorwie-match-list svg {
    color: #dc2626;
  }

  .voorwie-closing {
    padding: 78px 0;
    background: #f4f7fb;
  }

  .voorwie-closing-card {
    display: grid;
    gap: 24px;
    padding: 30px;
  }

  .voorwie-closing-copy {
    display: grid;
    gap: 12px;
  }

  .voorwie-closing .voorwie-actions {
    margin-top: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .voorwie-card,
    .voorwie-category-card,
    .voorwie-benefit-card,
    .voorwie-match-card,
    .voorwie-closing-card,
    .voorwie-hero-visual {
      animation: voorwie-reveal .6s ease both;
    }
  }

  @keyframes voorwie-reveal {
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
    .voorwie-hero-grid {
      grid-template-columns: minmax(0, 1.05fr) minmax(320px, .7fr);
    }

    .voorwie-card-grid,
    .voorwie-benefit-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .voorwie-category-grid,
    .voorwie-match-grid,
    .voorwie-faq-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .voorwie-closing-card {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
  }

  @media (min-width: 1040px) {
    .voorwie-card-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .voorwie-benefit-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .voorwie-benefit-card {
      padding: 22px;
    }

    .voorwie-benefit-card .voorwie-icon {
      width: 52px;
      height: 52px;
    }
  }

  @media (max-width: 620px) {
    .voorwie-hero {
      padding: 104px 0 58px;
    }

    .voorwie-actions,
    .voorwie-closing .voorwie-actions {
      flex-direction: column;
    }

    .voorwie-btn {
      width: 100%;
    }

    .voorwie-hero-visual {
      min-height: 430px;
    }

    .voorwie-orbit {
      right: auto !important;
      left: 18px !important;
      width: calc(100% - 36px);
    }

    .voorwie-orbit:nth-child(2) { top: 28px; }
    .voorwie-orbit:nth-child(3) { top: 88px; }
    .voorwie-orbit:nth-child(4) { bottom: 88px; }
    .voorwie-orbit:nth-child(5) { bottom: 28px; }
  }
`;

const challenges = [
  {
    title: "Mijn website levert weinig op",
    text: "Je website staat online, maar levert nauwelijks aanvragen of contactmomenten op. Wij helpen je om bezoekers om te zetten in klanten.",
    icon: AlertTriangle,
  },
  {
    title: "Ik ben afhankelijk van social media",
    text: "Wanneer je stopt met posten, stopt ook je zichtbaarheid. Een sterke website blijft dag en nacht voor je werken.",
    icon: Smartphone,
  },
  {
    title: "Mijn concurrent staat hoger in Google",
    text: "Potentiële klanten zoeken naar jouw diensten, maar vinden eerst je concurrent. Wij helpen je om beter zichtbaar te worden.",
    icon: Search,
  },
  {
    title: "Ik wil professioneler overkomen",
    text: "Een sterke eerste indruk zorgt voor meer vertrouwen en meer kansen op nieuwe klanten.",
    icon: ShieldCheck,
  },
  {
    title: "Ik heb geen tijd voor techniek",
    text: "Hosting, onderhoud, updates en e-mail kosten tijd die je liever in je bedrijf stopt.",
    icon: Clock3,
  },
  {
    title: "Ik wil groeien",
    text: "Je zoekt niet alleen een website, maar een partner die meedenkt over online zichtbaarheid en groei.",
    icon: LineChart,
  },
];

const categories = [
  {
    title: "Gezondheid & Coaching",
    examples: ["Personal trainers", "Coaches", "Masseurs", "Fysiotherapeuten"],
    result: "Meer afspraken en meer zichtbaarheid in jouw regio.",
    icon: HeartPulse,
  },
  {
    title: "Bouw & Techniek",
    examples: ["Schilders", "Installateurs", "Dakdekkers", "Hoveniers"],
    result: "Meer offerteaanvragen via jouw website.",
    icon: Wrench,
  },
  {
    title: "Horeca & Gastvrijheid",
    examples: ["Restaurants", "Lunchrooms", "Cafés"],
    result: "Meer reserveringen en een sterkere online aanwezigheid.",
    icon: Utensils,
  },
  {
    title: "Zakelijke Dienstverlening",
    examples: ["Consultants", "Boekhouders", "Adviseurs"],
    result: "Meer vertrouwen en kwalitatieve leads.",
    icon: BriefcaseBusiness,
  },
];

const benefits = [
  {
    title: "Meer zichtbaarheid",
    text: "Word beter gevonden door potentiële klanten die actief zoeken naar jouw diensten.",
    icon: Eye,
  },
  {
    title: "Meer vertrouwen",
    text: "Een professionele uitstraling zorgt ervoor dat bezoekers sneller contact opnemen.",
    icon: ShieldCheck,
  },
  {
    title: "Meer aanvragen",
    text: "Meer kansen op telefoontjes, WhatsApp-berichten en offerteaanvragen.",
    icon: MessageCircle,
  },
  {
    title: "Meer tijd",
    text: "Wij regelen techniek, hosting en onderhoud zodat jij kunt ondernemen.",
    icon: Clock3,
  },
  {
    title: "Minder zorgen",
    text: "Alles onder één dak. Eén aanspreekpunt voor jouw online aanwezigheid.",
    icon: LifeBuoy,
  },
];

const notMatch = [
  "Je zoekt alleen de goedkoopste website.",
  "Je wilt geen tijd investeren in je online aanwezigheid.",
  "Je ziet een website alleen als visitekaartje.",
  "Je wilt geen groei realiseren via online kanalen.",
];

const goodMatch = [
  "Je wilt beter gevonden worden.",
  "Je wilt professioneler overkomen.",
  "Je wilt meer uit je website halen.",
  "Je zoekt een partij die met je meedenkt.",
  "Je wilt een website die meegroeit met je bedrijf.",
];

const VOORWIE_FAQS = [
  {
    question: "Voor wie is Vedantix bedoeld?",
    answer:
      "Vedantix is bedoeld voor lokale ondernemers die professioneler zichtbaar willen worden, beter gevonden willen worden en meer aanvragen uit hun online aanwezigheid willen halen.",
  },
  {
    question: "Waarom is Vedantix geschikt voor lokale ondernemers?",
    answer:
      "Vedantix combineert website, lokale vindbaarheid, content, hosting en onderhoud onder één dak. Daardoor krijgen ondernemers één aanspreekpunt en minder technische zorgen.",
  },
  {
    question: "Helpt Vedantix ook als ik al een website heb?",
    answer:
      "Ja. Als je bestaande website weinig oplevert, kijkt Vedantix naar uitstraling, structuur, vindbaarheid, snelheid, call-to-actions en vertrouwen.",
  },
  {
    question: "Hoe bereidt Vedantix websites voor op AI-zoekmachines?",
    answer:
      "Vedantix gebruikt duidelijke pagina-opbouw, concrete antwoorden, lokale context en gestructureerde data zodat zoekmachines en AI-systemen je bedrijf beter kunnen interpreteren.",
  },
];

function IconCard({ title, text, icon: Icon, className = "" }) {
  return (
    <article className={`voorwie-card ${className}`}>
      <span className="voorwie-icon">
        <Icon size={30} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function MatchList({ items, type }) {
  const Icon = type === "bad" ? XCircle : CheckCircle2;

  return (
    <ul className="voorwie-match-list">
      {items.map((item) => (
        <li key={item}>
          <Icon size={18} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function VoorWie() {
  const canonical = "https://vedantix.nl/voorwie";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Voor wie", url: canonical },
  ]);
  const faqSchema = createFAQSchema(VOORWIE_FAQS);

  return (
    <>
      <SEO
        title="Voor wie is Vedantix? | Websites voor ondernemers die willen groeien"
        description="Ontdek of Vedantix bij jouw bedrijf past. Voor ondernemers die meer zichtbaarheid, meer vertrouwen en meer aanvragen uit hun online aanwezigheid willen halen."
        canonical={canonical}
        schemas={[breadcrumbSchema, faqSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="voorwie-page">
        <NavBar />

        <main>
          <section className="voorwie-hero">
            <div className="voorwie-shell voorwie-hero-grid">
              <div>
                <div className="voorwie-kicker">
                  <Sparkles size={16} aria-hidden="true" />
                  Voor ondernemers die willen groeien
                </div>
                <h1>Voor ondernemers die online willen groeien</h1>
                <div className="voorwie-hero-text">
                  <p>Je website moet meer doen dan alleen bestaan.</p>
                  <p>
                    Hij moet vertrouwen wekken, beter gevonden worden en bijdragen aan de groei
                    van jouw bedrijf.
                  </p>
                  <p>Daar helpen wij bij.</p>
                </div>
                <div className="voorwie-actions" aria-label="Belangrijkste acties">
                  <Link className="voorwie-btn voorwie-btn-primary" to="/prijzen">
                    Bekijk onze pakketten <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="voorwie-btn voorwie-btn-secondary" to="/planning">
                    Plan een kennismaking
                  </Link>
                </div>
              </div>

              <aside className="voorwie-hero-visual" aria-label="Groei, zichtbaarheid en online succes">
                <div className="voorwie-visual-core">
                  <strong>Vedantix</strong>
                </div>
                <div className="voorwie-orbit">
                  <Search size={18} aria-hidden="true" />
                  Zichtbaarheid
                </div>
                <div className="voorwie-orbit">
                  <ShieldCheck size={18} aria-hidden="true" />
                  Vertrouwen
                </div>
                <div className="voorwie-orbit">
                  <MessageCircle size={18} aria-hidden="true" />
                  Aanvragen
                </div>
                <div className="voorwie-orbit">
                  <TrendingUp size={18} aria-hidden="true" />
                  Groei
                </div>
              </aside>
            </div>
          </section>

          <section className="voorwie-section" aria-labelledby="situaties-title">
            <div className="voorwie-shell">
              <div className="voorwie-section-heading center">
                <p className="voorwie-label">Herkenbare situaties</p>
                <h2 id="situaties-title">Herken jij jezelf hierin?</h2>
                <p>Veel ondernemers lopen tegen dezelfde uitdagingen aan.</p>
              </div>

              <div className="voorwie-card-grid">
                {challenges.map((item) => (
                  <IconCard key={item.title} {...item} />
                ))}
              </div>
            </div>
          </section>

          <section className="voorwie-section voorwie-section-muted" aria-labelledby="ondernemers-title">
            <div className="voorwie-shell">
              <div className="voorwie-section-heading">
                <p className="voorwie-label">Lokale ondernemers</p>
                <h2 id="ondernemers-title">Voor welke ondernemers werken wij?</h2>
                <p>Wij werken vooral met lokale ondernemers en dienstverleners.</p>
              </div>

              <div className="voorwie-category-grid">
                {categories.map(({ title, examples, result, icon: Icon }) => (
                  <article className="voorwie-category-card" key={title}>
                    <span className="voorwie-icon">
                      <Icon size={30} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <ul className="voorwie-category-list">
                      {examples.map((example) => (
                        <li key={example}>
                          <CheckCircle2 size={17} aria-hidden="true" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="voorwie-category-result">{result}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="voorwie-section" aria-labelledby="waarde-title">
            <div className="voorwie-shell">
              <div className="voorwie-section-heading center">
                <p className="voorwie-label">Ondernemerswaarde</p>
                <h2 id="waarde-title">Wat levert Vedantix jou op?</h2>
              </div>

              <div className="voorwie-benefit-grid">
                {benefits.map(({ title, text, icon: Icon }) => (
                  <article className="voorwie-benefit-card" key={title}>
                    <span className="voorwie-icon">
                      <Icon size={28} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="voorwie-section voorwie-section-muted" aria-labelledby="match-title">
            <div className="voorwie-shell">
              <div className="voorwie-section-heading">
                <p className="voorwie-label">Eerlijke verwachtingen</p>
                <h2 id="match-title">Wanneer past Vedantix niet bij je?</h2>
                <p>Wij geloven in eerlijke verwachtingen.</p>
              </div>

              <div className="voorwie-match-grid">
                <article className="voorwie-match-card bad">
                  <h3>Waarschijnlijk geen goede match</h3>
                  <MatchList items={notMatch} type="bad" />
                </article>

                <article className="voorwie-match-card good">
                  <h3>Goede match</h3>
                  <MatchList items={goodMatch} type="good" />
                </article>
              </div>
            </div>
          </section>

          <section className="voorwie-section" aria-labelledby="voorwie-ai-title">
            <div className="voorwie-shell">
              <div className="voorwie-section-heading center">
                <p className="voorwie-label">AI-readiness</p>
                <h2 id="voorwie-ai-title">Toekomstbestendig voor AI</h2>
                <p>De manier waarop mensen zoeken verandert.</p>
                <p>
                  Wij zorgen ervoor dat jouw website voorbereid is op zowel traditionele
                  zoekmachines als moderne AI-platformen.
                </p>
              </div>

              <div className="voorwie-faq-grid">
                {VOORWIE_FAQS.map((faq) => (
                  <article className="voorwie-faq-card" key={faq.question}>
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="voorwie-closing" aria-labelledby="closing-title">
            <div className="voorwie-shell">
              <div className="voorwie-closing-card">
                <div>
                  <p className="voorwie-label">Waar het echt om gaat</p>
                  <h2 id="closing-title">Je hebt geen website nodig. Je hebt klanten nodig.</h2>
                  <div className="voorwie-closing-copy">
                    <p>Een website is slechts een middel.</p>
                    <p>
                      Het echte doel is meer zichtbaarheid, meer vertrouwen en meer kansen op
                      nieuwe klanten.
                    </p>
                    <p>Daarom kijken wij verder dan design alleen.</p>
                    <p>
                      Wij combineren websites, SEO, content, gebruiksvriendelijkheid en online
                      zichtbaarheid tot één complete oplossing.
                    </p>
                  </div>
                </div>

                <div className="voorwie-actions" aria-label="Volgende stap">
                  <Link className="voorwie-btn voorwie-btn-primary" to="/prijzen">
                    Bekijk onze pakketten <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link className="voorwie-btn voorwie-btn-secondary" to="/online-groei-audit">
                    Vraag een gratis Online Groei Audit aan
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
