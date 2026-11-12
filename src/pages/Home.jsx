import { SOFTWARE_TITLE, SOFTWARE_DESCRIPTION, SOFTWARE_FAQS, SCAN_URL } from "../data/positioning";
import { Suspense, useId, useState } from "react";
import { safeLogoUrl } from "../lib/public-content";
import {
  ArrowRight,
  Clock,
  FileText,
  LifeBuoy,
  MessageCircle,
  Network,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import JotformReviewWidget from "../components/JotformReviewWidget";
import HomeHero from "./HomeHero";
import ClientCasesSection from "../components/home/ClientCasesSection";
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/home.css";
import "../styles/services.css";
import "../styles/home-hero.css";

const BENEFITS = [
 { title: "Minder dubbel werk", text: "Gebruik dezelfde informatie in je werkproces, zonder steeds opnieuw overtypen.", icon: Users },
 { title: "Minder wisselen", text: "Breng taken en informatie samen in een centrale applicatie op maat.", icon: Network },
 { title: "Eenvoudiger onboarding", text: "Geef nieuwe collega’s toegang tot hun taken en instructies binnen de afgesproken scope.", icon: MessageCircle },
 { title: "Meer overzicht", text: "Laat afdelingen samenwerken met actuele informatie en passende rolrechten.", icon: Clock },
];

const ROADMAP = [
 { title: "Bedrijfsscan", icon: Search }, { title: "Voorstel", icon: FileText },
 { title: "Bouwen", icon: Wrench }, { title: "Testen", icon: ShieldCheck },
 { title: "Accepteren", icon: Users }, { title: "Beheren", icon: LifeBuoy }, { title: "Uitbreiden", icon: TrendingUp },
];

const HOME_SERVICES = [
  { title: "Software op maat", href: "/software-op-maat", description: "Breng je werkprocessen samen in één app." },
  { title: "Websites & hosting", href: "/website-laten-maken", description: "Laat je website bouwen en beheren." },
  { title: "Vindbaarheid & marketing", href: "/ai-vindbaarheid", description: "Maak je bedrijf beter vindbaar in Google en AI." },
];

const SCAN_ITEMS = [
  "Controle van één openbare pagina",
  "Signalen voor Google en AI",
  "Zichtbare contactmogelijkheden",
  "Technische basisinstellingen",
  "Verbeterpunten op prioriteit",
  "Downloadbaar PDF-rapport",
];

const HOMEPAGE_FAQS = SOFTWARE_FAQS.filter((_, index) => [0, 1, 2, 3, 7, 9].includes(index));

function IconCard({ title, text, icon: Icon }) {
  return (
    <article className="growth-card">
      <div className="growth-card-icon">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ClientBanner({ clients }) {
  const [paused, setPaused] = useState(false);
  const headingId = useId();
  if (!clients?.length) return null;

  function renderClients() {
    return clients.map(client => {
      const logo = safeLogoUrl(client.logo);
      return (
        <li key={client.id} className="client-banner__client">
          {logo && <img src={logo} alt="" width="40" height="40" loading="lazy" decoding="async" />}
          <span>{client.name}</span>
        </li>
      );
    });
  }

  return (
    <section className="client-banner" aria-labelledby={headingId}>
      <div className="client-banner__header">
        <h2 id={headingId}>Klanten van Vedantix</h2>
        <button type="button" onClick={() => setPaused(value => !value)}>
          {paused ? "Banner afspelen" : "Banner pauzeren"}
        </button>
      </div>
      <div className="client-banner__window">
        <div className="client-banner__track" data-paused={paused}>
          <ul>{renderClients()}</ul>
          <ul aria-hidden="true">{renderClients()}</ul>
        </div>
      </div>
    </section>
  );
}

export default function Home({ initialCases = null }) {
  const meetingUrl = `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
    "Hallo Vedantix, ik wil graag een bedrijfsscan bespreken.",
  )}`;
  const canonical = "https://vedantix.nl/";
  const faqSchema = createFAQSchema(HOMEPAGE_FAQS);
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: canonical },
  ]);

  return (
    <>
      <SEO
        title={SOFTWARE_TITLE}
        description={SOFTWARE_DESCRIPTION}
        canonical={canonical}
        schemas={[faqSchema, breadcrumbSchema]}
      />

      <div className="home-page">
        <NavBar />

        <main>
          <HomeHero>
            <ClientBanner clients={initialCases} />
          </HomeHero>
          <section className="home-services" aria-labelledby="home-services-title">
            <div className="services-wrap">
              <h2 id="home-services-title">Waar we je mee helpen</h2>
              <ul className="home-service-list">
                {HOME_SERVICES.map(({ title, href, description }) => (
                  <li key={href}>
                    <a href={href}>
                      <strong>{title}</strong>
                      <ArrowRight size={18} aria-hidden="true" />
                      <span>{description}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <a className="home-process-link" href="/diensten">
                Bekijk alle diensten <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </section>

          <Suspense fallback={null}>
            <section
              className="home-review-strip"
              aria-label="Reviews van Vedantix"
            >
              <div className="home-review-wrap">
                <div className="home-review-widget">
                  <JotformReviewWidget />
                </div>
              </div>
            </section>
          </Suspense>

          <ClientCasesSection initialCases={initialCases} />

          <Suspense fallback={null}>
            <section className="section-shell">
              <div className="section-wrap">
                <div className="section-header center">
                  <div className="section-label">
                    Wat levert Vedantix jou op?
                  </div>
                  <h2 className="section-h2">
                    Meer ruimte voor het werk dat ertoe doet
                  </h2>
                  <p className="section-p">
                    Een centrale applicatie kan dubbel werk en wisselen tussen
                    tools verminderen. Met duidelijke rollen en bijgehouden
                    instructies binnen de afgesproken dienstverlening.
                  </p>
                </div>

                <div className="growth-benefit-grid">
                  {BENEFITS.map((benefit) => (
                    <IconCard key={benefit.title} {...benefit} />
                  ))}
                </div>

              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section className="section-shell anchor-section" id="how">
              <div className="section-wrap">
                <div className="section-header center">
                  <div className="section-label">Van bedrijfsscan naar software</div>
                  <h2 className="section-h2">
                    Een werkbare eerste stap, daarna gericht uitbreiden
                  </h2>
                  <p className="section-p">
                    We spreken functionaliteit, gebruik, kosten en controles vooraf
                    af. AI helpt bij het bouwen; Vedantix controleert en test.
                  </p>
                </div>

                <div
                  className="growth-roadmap"
                  aria-label="Van bedrijfsscan naar software roadmap"
                >
                  {ROADMAP.map(({ title, icon: Icon }, index) => (
                    <div className="growth-roadmap-step" key={title}>
                      <div className="growth-roadmap-icon">
                        <Icon size={22} aria-hidden="true" />
                      </div>
                      <span>{title}</span>
                      {index < ROADMAP.length - 1 ? (
                        <div className="growth-roadmap-arrow">↓</div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <a className="home-process-link" href="/proces">
                  Bekijk onze werkwijze <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section
              className="section-shell alt anchor-section"
              id="online-groei-audit"
            >
              <div className="section-wrap">
                <div className="lead-box growth-audit-box">
                  <div>
                    <div className="lead-badge">Gratis · vrijblijvend</div>
                    <div className="lead-title">Gratis Online Groei Audit</div>
                    <p className="lead-text">
                      Laat één openbare pagina van je website controleren.
                    </p>
                    <p className="lead-text">
                      Bekijk de gemeten signalen voor vindbaarheid en contact,
                      ontvang verbeterpunten op prioriteit en download je rapport als PDF.
                    </p>
                  </div>

                  <div className="lead-side">
                    <h3>Dit krijg je:</h3>
                    <ul>
                      {SCAN_ITEMS.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <a href="/online-groei-audit" className="btn-wa">
                      Vraag gratis Online Groei Audit aan →
                    </a>
                    <div className="lead-note">
                      Scores alleen voor gemeten onderdelen. Vrijblijvend.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section className="section-shell" aria-labelledby="home-faq-title">
              <div className="section-wrap">
                <div className="section-header center">
                  <div className="section-label">Direct antwoord</div>
                  <h2 className="section-h2" id="home-faq-title">
                    Veelgestelde vragen over software en websites
                  </h2>
                  <p className="section-p">
                    Korte antwoorden op vragen die ondernemers vaak stellen
                    voordat ze software, een website of beheer afspreken.
                  </p>
                </div>

                <div className="faq-grid">
                  {HOMEPAGE_FAQS.map((faq) => (
                    <details className="faq-card" key={faq.question}>
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section id="cta" className="cta-section anchor-section">
              <div className="cta-inner">
                <h2>Klaar om jouw processen samen te brengen?</h2>
                <p>
                  Plan een bedrijfsscan en bespreek waar handwerk, losse tools
                  en abonnementen jouw bedrijf in de weg zitten.
                </p>

                <div className="cta-actions">
                  <a href={SCAN_URL} className="btn-dark">
                    Plan een bedrijfsscan →
                  </a>

                  <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-wa"
                  >
                    Plan een Kennismaking
                  </a>
                </div>

                <div className="cta-phone">
                  Liever direct bellen?
                  <strong>+31 6 26 21 99 89</strong>
                </div>
              </div>
            </section>
          </Suspense>
        </main>
      </div>
    </>
  );
}
