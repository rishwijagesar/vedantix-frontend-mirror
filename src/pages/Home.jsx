import { SOFTWARE_TITLE, SOFTWARE_DESCRIPTION, SOFTWARE_FAQS, SCAN_URL } from "../data/positioning";
import { Suspense } from "react";
import {
  ArrowRight,
  Clock,
  FileText,
  Globe2,
  LifeBuoy,
  Mail,
  MessageCircle,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import JotformReviewWidget from "../components/JotformReviewWidget";
import HomeHero from "./HomeHero";
import ServiceCards from "../components/ServiceCards";
import ClientCasesSection from "../components/home/ClientCasesSection";
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/home.css";
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

const ECOSYSTEM = [
 { label: "Sales", icon: Users }, { label: "Planning", icon: Clock }, { label: "Marketing", icon: Target },
 { label: "Finance", icon: FileText }, { label: "HR", icon: Users }, { label: "IT", icon: Wrench },
 { label: "Rolrechten", icon: ShieldCheck }, { label: "Instructies", icon: FileText }, { label: "Support", icon: LifeBuoy },
];

const DIFFERENCES = [
 { title: "Jouw processen eerst", text: "We brengen je huidige werkwijze, tools, abonnementen en handwerk in kaart.", icon: Search },
 { title: "Voor mkb en zelfstandigen", text: "Geen vaste niche: we beoordelen wat jouw bedrijf nodig heeft, vanuit Den Bosch voor heel Nederland.", icon: Users },
 { title: "AI als hulpmiddel", text: "Snel ontwikkelen met AI, met professionele controle en tests door Vedantix.", icon: Sparkles },
 { title: "Acceptatie voor livegang", text: "Jouw team beoordeelt de afgesproken functionaliteit voordat een fase live gaat.", icon: ShieldCheck },
 { title: "Persoonlijk contact", text: "Je hebt direct contact met Vedantix; contactmomenten en support leggen we vooraf vast.", icon: MessageCircle },
 { title: "Heldere beheerafspraken", text: "Gebruik, onderhoud, wijzigingen, uitbreiding en export krijgen een concrete plek in de offerte.", icon: LifeBuoy },
];

const AI_READINESS_CARDS = [
  {
    title: "SEO",
    text: "Beter gevonden worden in Google.",
    icon: Search,
  },
  {
    title: "AI-vriendelijke websites",
    text: "Klaar voor ChatGPT, Gemini en andere AI-platformen.",
    icon: Sparkles,
  },
  {
    title: "Google Business",
    text: "Meer lokale zichtbaarheid.",
    icon: Target,
  },
  {
    title: "Conversie",
    text: "Meer kansen op aanvragen.",
    icon: TrendingUp,
  },
];

const SCAN_ITEMS = [
  "Controle van één openbare pagina",
  "Signalen voor Google en AI",
  "Zichtbare contactmogelijkheden",
  "Technische basisinstellingen",
  "Verbeterpunten op prioriteit",
  "Downloadbaar PDF-rapport",
];

const CTA_META = ["Alle sectoren", "Processen centraal", "Gefaseerde aanpak", "Heldere afspraken"];

const HOMEPAGE_FAQS = SOFTWARE_FAQS.filter((_, index) => [0, 1, 2, 3, 7, 9].includes(index));

function SectionCta({ title, text, dark = false, website = false }) {
  return (
    <div className={`mini-cta ${dark ? "dark" : ""}`}>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="mini-cta-actions">
        <a href={website ? "/online-groei-audit" : SCAN_URL} className="btn-lead">
          {website ? "Gratis Online Groei Audit" : "Plan een bedrijfsscan"} <ArrowRight size={17} aria-hidden="true" />
        </a>
        <a
          href={CONTACT.WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-outline"
        >
          Plan een kennismaking
        </a>
      </div>
    </div>
  );
}

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
          <HomeHero />
          <section className="home-services" aria-labelledby="home-services-title"><div className="services-wrap"><span className="services-kicker">Software · Websites · Hosting</span><h2 id="home-services-title">Jouw bedrijf centraal. Niet je losse tools.</h2><p>Van bedrijfssoftware op maat tot een sterke website: we bouwen vanuit jouw werkprocessen. Websites, hosting, e-mail en vindbaarheid blijven beschikbaar met hun bestaande prijzen en funnels.</p><ServiceCards /></div></section>

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

                <SectionCta
                  title="Waar verlies je nu tijd aan handwerk?"
                  text="Een bedrijfsscan brengt processen, tools, abonnementen en kansen in kaart. Daarna volgt een concreet voorstel."
                />
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

                <SectionCta
                  title="Wil je weten welke stap jouw bedrijf nu mist?"
                  text="We bepalen met jouw team de prioriteiten, opstartkosten, het vaste maandbedrag en de fases."
                />
              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section className="section-shell alt">
              <div className="section-wrap growth-ecosystem-wrap">
                <div className="section-header center">
                  <div className="section-label">Alles onder één dak</div>
                  <h2 className="section-h2">
                    Eén partij. Eén aanspreekpunt. Minder rompslomp.
                  </h2>
                  <p className="section-p">
                    Sales, planning, marketing, finance, HR en IT kunnen samenwerken
                    in één webapp met rolrechten. Je hoeft je bedrijf niet rond
                    losse tools te organiseren.
                  </p>
                </div>

                <div className="growth-ecosystem">
                  <div className="growth-ecosystem-center">
                    <Network size={34} aria-hidden="true" />
                    <strong>Vedantix</strong>
                  </div>
                  <div className="growth-ecosystem-items">
                    {ECOSYSTEM.map(({ label, icon: Icon }) => (
                      <div className="growth-ecosystem-item" key={label}>
                        <Icon size={21} aria-hidden="true" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <SectionCta
                  title="Meer overzicht, minder losse lijntjes."
                  text="Bestaande tools kunnen blijven waar ze waarde toevoegen. Hun externe abonnementskosten kunnen dan ook blijven gelden."
                />
              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section className="section-shell">
              <div className="section-wrap">
                <div className="section-header center">
                  <div className="section-label">
                    Wat maakt Vedantix anders?
                  </div>
                  <h2 className="section-h2">
                    Praktisch bouwen, zorgvuldig controleren
                  </h2>
                  <p className="section-p">
                    We maken afspraken over inbegrepen gebruik, wijzigingen,
                    uitbreiding, beheer en dataverwerking. Geen onbeperkte beloftes.
                  </p>
                </div>

                <div className="growth-difference-grid">
                  {DIFFERENCES.map((difference) => (
                    <IconCard key={difference.title} {...difference} />
                  ))}
                </div>

              </div>
            </section>
          </Suspense>

          <Suspense fallback={null}>
            <section
              className="section-shell alt"
              aria-labelledby="ai-readiness-title"
            >
              <div className="section-wrap">
                <div className="section-header center">
                  <div className="section-label">AI-readiness</div>
                  <h2 className="section-h2" id="ai-readiness-title">
                    Gevonden worden in Google én AI
                  </h2>
                  <p className="section-p">
                    Steeds meer mensen zoeken via Google, ChatGPT, Gemini en
                    andere AI-platformen.
                  </p>
                  <p className="section-p">
                    Naast software bouwen we websites en verbeteren we
                    zoek- en AI-vindbaarheid. Duidelijke inhoud helpt systemen
                    je bedrijf begrijpen; een vermelding is niet gegarandeerd.
                  </p>
                </div>

                <div className="growth-difference-grid">
                  {AI_READINESS_CARDS.map((card) => (
                    <IconCard key={card.title} {...card} />
                  ))}
                </div>

                <p
                  className="section-p"
                  style={{ margin: "24px auto 0", textAlign: "center" }}
                >
                  Lees hoe Vedantix werkt aan{" "}
                  <a href="/ai-vindbaarheid">
                    SEO, AEO, GEO en AI-vindbaarheid
                  </a>
                  .
                </p>

                <SectionCta
                  website
                  title="Vraag een gratis Online Groei Audit aan"
                  text="Bekijk of de teksten en structuur van de opgegeven pagina zoekmachines en AI helpen je bedrijf te begrijpen."
                />
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
                    <article className="faq-card" key={faq.question}>
                      <h3>{faq.question}</h3>
                      <p>{faq.answer}</p>
                    </article>
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

                <div className="cta-meta">
                  {CTA_META.map((item) => (
                    <div key={item} className="cta-meta-item">
                      <span style={{ color: "#22c55e" }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
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
