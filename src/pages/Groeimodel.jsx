import { Link } from "@/lib/router-compat";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Globe2,
  HeartHandshake,
  LifeBuoy,
  Mail,
  MessageCircle,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { createBreadcrumbSchema, createFAQSchema, createServiceSchema } from "../utils/schema";
import "../styles/groeimodel.css";

const canonical = "https://vedantix.nl/groeimodel";

const benefitCards = [
  {
    title: "Meer zichtbaarheid",
    text: "Word beter gevonden door mensen die actief zoeken naar jouw diensten.",
    icon: Eye,
  },
  {
    title: "Meer vertrouwen",
    text: "Een professionele uitstraling die bezoekers overtuigt.",
    icon: ShieldCheck,
  },
  {
    title: "Meer aanvragen",
    text: "Meer kansen op telefoontjes, WhatsApp-berichten en offerteaanvragen.",
    icon: MessageCircle,
  },
  {
    title: "Meer tijd",
    text: "Geen gedoe met techniek, onderhoud of hosting.",
    icon: Clock,
  },
  {
    title: "Meer rust",
    text: "Alles onder één dak geregeld.",
    icon: HeartHandshake,
  },
  {
    title: "Meer groeimogelijkheden",
    text: "Een website die meegroeit met jouw bedrijf.",
    icon: TrendingUp,
  },
];

const websiteOnly = [
  "Online visitekaartje",
  "Weinig bezoekers",
  "Geen strategie",
  "Weinig groei",
];

const vedantixWay = [
  "Website",
  "SEO",
  "Content",
  "Reviews",
  "Google zichtbaarheid",
  "Onderhoud",
  "Groei",
];

const approachSteps = [
  {
    title: "Website",
    text: "We zorgen voor een professionele basis die direct vertrouwen wekt bij bezoekers.",
    icon: Globe2,
  },
  {
    title: "Vindbaarheid",
    text: "Je bedrijf wordt beter zichtbaar voor mensen die in jouw regio zoeken.",
    icon: Search,
  },
  {
    title: "Vertrouwen",
    text: "We versterken je uitstraling met duidelijke inhoud, bewijs en klantgerichte opbouw.",
    icon: ShieldCheck,
  },
  {
    title: "Aanvragen",
    text: "Bezoekers krijgen duidelijke routes naar bellen, WhatsApp en offerteaanvragen.",
    icon: MessageCircle,
  },
  {
    title: "Groei",
    text: "Je online aanwezigheid blijft meegroeien met je bedrijf en doelen.",
    icon: TrendingUp,
  },
];

const ecosystemItems = [
  { label: "Website", icon: Globe2 },
  { label: "Hosting", icon: Zap },
  { label: "Zakelijke e-mail", icon: Mail },
  { label: "SEO", icon: Search },
  { label: "Content", icon: Sparkles },
  { label: "Reviews", icon: Star },
  { label: "Onderhoud", icon: Wrench },
  { label: "Support", icon: LifeBuoy },
];

const groeimodelFaqs = [
  {
    question: "Waarom is alleen een website niet genoeg?",
    answer:
      "Een website zorgt pas voor groei wanneer uitstraling, vindbaarheid, content, reviews, snelheid en duidelijke contactmomenten samenwerken.",
  },
  {
    question: "Voor wie is Vedantix bedoeld?",
    answer:
      "Vedantix is bedoeld voor lokale ondernemers die professioneel zichtbaar willen zijn, meer vertrouwen willen opbouwen en meer aanvragen uit hun online aanwezigheid willen halen.",
  },
  {
    question: "Wat doet Vedantix na oplevering?",
    answer:
      "Vedantix blijft helpen met hosting, onderhoud, optimalisatie, vindbaarheid, content en verbeteringen zodat je website waarde blijft toevoegen.",
  },
  {
    question: "Helpt Vedantix ook met Google en AI-vindbaarheid?",
    answer:
      "Ja. Vedantix maakt websites en content begrijpelijker voor Google, lokale zoekopdrachten en moderne AI-platformen zoals ChatGPT en Gemini.",
  },
];

const serviceSchema = createServiceSchema({
  name: "Waarom ondernemers voor Vedantix kiezen",
  slug: "groeimodel",
  description:
    "Ontdek waarom lokale ondernemers voor Vedantix kiezen: meer zichtbaarheid, meer vertrouwen, meer aanvragen en minder technische zorgen.",
  audienceType: "Lokale ondernemers",
  serviceType: "Online groeipartner",
});

const breadcrumbSchema = createBreadcrumbSchema([
  { name: "Home", url: "https://vedantix.nl/" },
  { name: "Waarom ondernemers voor Vedantix kiezen", url: canonical },
]);

const faqSchema = createFAQSchema(groeimodelFaqs);

function ComparisonList({ items, type }) {
  const Icon = type === "bad" ? XCircle : CheckCircle2;

  return (
    <ul className="groei-compare-list">
      {items.map((item) => (
        <li key={item}>
          <Icon size={18} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Groeimodel() {
  return (
    <>
      <SEO
        title="Waarom ondernemers voor Vedantix kiezen"
        description="Vedantix helpt lokale ondernemers met meer zichtbaarheid, vertrouwen, aanvragen en minder gedoe dan een standaard webdesigner."
        canonical={canonical}
        schemas={[serviceSchema, faqSchema, breadcrumbSchema]}
      />

      <div className="groei-page">
        <NavBar />

        <main>
          <section className="groei-hero">
            <div className="groei-shell groei-hero-grid">
              <div className="groei-hero-copy">
                <div className="groei-kicker">
                  <Sparkles size={16} aria-hidden="true" />
                  Waarom ondernemers voor Vedantix kiezen
                </div>
                <h1>Meer dan alleen een website</h1>
                <p>
                  Veel webdesigners leveren een website op en verdwijnen daarna.
                </p>
                <p>
                  Bij Vedantix kijken we verder.
                </p>
                <p>
                  Wij helpen lokale ondernemers met een complete online aanwezigheid die
                  vertrouwen uitstraalt, beter gevonden wordt en meer kansen creëert op nieuwe
                  klanten.
                </p>
                <Link className="groei-btn groei-btn-primary" to="/planning">
                  Plan een kennismaking <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>

              <aside className="groei-hero-panel" aria-label="Vedantix voordelen">
                <div className="groei-panel-logo">V</div>
                <h2>Groei als uitgangspunt</h2>
                <p>Niet alleen live gaan. Beter zichtbaar worden, meer vertrouwen opbouwen en meer aanvragen krijgen.</p>
                <div className="groei-panel-points">
                  <span>Meer zichtbaarheid</span>
                  <span>Meer vertrouwen</span>
                  <span>Minder gedoe</span>
                </div>
              </aside>
            </div>
          </section>

          <section className="groei-section" aria-labelledby="benefits-title">
            <div className="groei-shell">
              <div className="groei-section-heading center">
                <p className="groei-label">Ondernemersvoordelen</p>
                <h2 id="benefits-title">Wat levert Vedantix jou op?</h2>
              </div>

              <div className="groei-benefit-grid">
                {benefitCards.map(({ title, text, icon: Icon }) => (
                  <article className="groei-benefit-card" key={title}>
                    <span className="groei-benefit-icon">
                      <Icon size={30} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="groei-section groei-section-muted" aria-labelledby="compare-title">
            <div className="groei-shell">
              <div className="groei-section-heading">
                <p className="groei-label">Waarom dit anders is</p>
                <h2 id="compare-title">Waarom een website alleen niet genoeg is</h2>
              </div>

              <div className="groei-compare-grid">
                <article className="groei-compare-card bad">
                  <h3>Alleen een website</h3>
                  <ComparisonList items={websiteOnly} type="bad" />
                </article>

                <article className="groei-compare-card good">
                  <h3>Vedantix</h3>
                  <ComparisonList items={vedantixWay} type="good" />
                </article>
              </div>
            </div>
          </section>

          <section className="groei-section" aria-labelledby="approach-title">
            <div className="groei-shell">
              <div className="groei-section-heading center">
                <p className="groei-label">Onze aanpak</p>
                <h2 id="approach-title">Onze aanpak</h2>
              </div>

              <div className="groei-roadmap">
                {approachSteps.map(({ title, text, icon: Icon }, index) => (
                  <article className="groei-roadmap-step" key={title}>
                    <span className="groei-step-icon">
                      <Icon size={28} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    {index < approachSteps.length - 1 ? (
                      <ArrowDown className="groei-step-arrow" size={24} aria-hidden="true" />
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="groei-section groei-section-dark" aria-labelledby="roof-title">
            <div className="groei-shell">
              <div className="groei-section-heading center">
                <p className="groei-label">Eén aanspreekpunt</p>
                <h2 id="roof-title">Alles onder één dak</h2>
              </div>

              <div className="groei-ecosystem">
                <div className="groei-ecosystem-center">
                  <Network size={36} aria-hidden="true" />
                  <strong>Vedantix</strong>
                </div>

                <div className="groei-ecosystem-items">
                  {ecosystemItems.map(({ label, icon: Icon }) => (
                    <div className="groei-ecosystem-item" key={label}>
                      <Icon size={24} aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="groei-roof-copy">
                <p>Eén aanspreekpunt.</p>
                <p>Geen losse leveranciers.</p>
                <p>Geen technisch gedoe.</p>
              </div>
            </div>
          </section>

          <section className="groei-final-section" aria-labelledby="final-title">
            <div className="groei-shell">
              <div className="groei-faq-block" aria-labelledby="groei-faq-title">
                <div className="groei-section-heading center">
                  <p className="groei-label">Veelgestelde vragen</p>
                  <h2 id="groei-faq-title">Waarom kiezen ondernemers voor Vedantix?</h2>
                </div>

                <div className="groei-faq-grid">
                  {groeimodelFaqs.map((faq) => (
                    <article className="groei-faq-card" key={faq.question}>
                      <h3>{faq.question}</h3>
                      <p>{faq.answer}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="groei-final-card">
                <p className="groei-label">Voor ondernemers die willen groeien</p>
                <h2 id="final-title">Voor ondernemers die willen groeien</h2>
                <p>
                  Of je nu net begint of al jaren onderneemt.
                </p>
                <p>
                  Wij helpen je om online professioneler zichtbaar te worden en meer uit je
                  website te halen.
                </p>
                <Link className="groei-btn groei-btn-primary" to="/prijzen">
                  Bekijk onze pakketten <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        </main>

      </div>
    </>
  );
}
