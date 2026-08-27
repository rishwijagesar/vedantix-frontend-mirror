import {
  ArrowRight,
  CheckCircle2,
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
import ClientCasesSection from "../components/home/ClientCasesSection";
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/home.css";
import "../styles/home-hero.css";

const BENEFITS = [
  {
    title: "Meer klanten",
    text: "Word gevonden door mensen die actief zoeken naar jouw diensten.",
    icon: Users,
  },
  {
    title: "Meer vertrouwen",
    text: "Een professionele uitstraling die bezoekers omzet in klanten.",
    icon: ShieldCheck,
  },
  {
    title: "Meer aanvragen",
    text: "Meer telefoontjes, WhatsApp-berichten en offerteaanvragen.",
    icon: MessageCircle,
  },
  {
    title: "Meer tijd",
    text: "Geen gedoe met techniek, updates of hosting.",
    icon: Clock,
  },
];

const PROOF_CARDS = [
  {
    title: "Sneller vertrouwen opbouwen",
    text: "Laat direct zien waarom bezoekers jouw bedrijf serieus kunnen nemen.",
    icon: ShieldCheck,
  },
  {
    title: "Beter gevonden worden in Google",
    text: "Maak diensten, regio en klantvragen duidelijk voor zoekmachines.",
    icon: Search,
  },
  {
    title: "Meer contactmomenten creëren",
    text: "Zet bezoekers sneller om naar telefoontjes, WhatsApp-berichten en aanvragen.",
    icon: MessageCircle,
  },
  {
    title: "Klaar voor moderne AI-zoekmachines",
    text: "Structuur en FAQ-content helpen AI-systemen je bedrijf beter begrijpen.",
    icon: Sparkles,
  },
];

const WEBSITE_ONLY = [
  "Mooie homepage",
  "Online visitekaartje",
  "Weinig bezoekers",
  "Geen SEO strategie",
  "Geen groei",
];

const GROWTH_MODEL = [
  "Professionele website",
  "SEO geoptimaliseerd",
  "Google vindbaarheid",
  "Content strategie",
  "Reviews",
  "Autoriteit",
  "Meer aanvragen",
];

const ROADMAP = [
  { title: "Website", icon: Globe2 },
  { title: "Vindbaarheid", icon: Search },
  { title: "Content", icon: FileText },
  { title: "Reviews", icon: Star },
  { title: "Vertrouwen", icon: ShieldCheck },
  { title: "Aanvragen", icon: MessageCircle },
  { title: "Groei", icon: TrendingUp },
];

const ECOSYSTEM = [
  { label: "Website", icon: Globe2 },
  { label: "Hosting", icon: Zap },
  { label: "Zakelijke E-mail", icon: Mail },
  { label: "SEO", icon: Search },
  { label: "Google Optimalisatie", icon: Target },
  { label: "Reviews", icon: Star },
  { label: "Content", icon: FileText },
  { label: "Onderhoud", icon: Wrench },
  { label: "Support", icon: LifeBuoy },
];

const DIFFERENCES = [
  {
    title: "Focus op groei",
    text: "We kijken eerst naar wat jouw bedrijf nodig heeft om meer zichtbaar, betrouwbaarder en makkelijker benaderbaar te worden.",
    icon: TrendingUp,
  },
  {
    title: "Focus op lokale ondernemers",
    text: "De aanpak is gemaakt voor ondernemers die in hun regio meer klanten willen aantrekken.",
    icon: Users,
  },
  {
    title: "SEO vanaf dag één",
    text: "Vindbaarheid wordt niet later geplakt, maar vanaf de basis meegenomen als groeimiddel.",
    icon: Search,
  },
  {
    title: "Geen standaard templates",
    text: "Je krijgt een uitstraling die past bij jouw bedrijf, doelgroep en vertrouwen dat je wilt opbouwen.",
    icon: Sparkles,
  },
  {
    title: "Persoonlijke samenwerking",
    text: "Je werkt met één aanspreekpunt dat meedenkt over zichtbaarheid, aanvragen en groei.",
    icon: MessageCircle,
  },
  {
    title: "Doorlopende ondersteuning",
    text: "Ook na livegang blijven onderhoud, verbeteringen en nieuwe groeikansen in beeld.",
    icon: LifeBuoy,
  },
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
  "Vindbaarheid",
  "SEO",
  "Snelheid",
  "Mobiele gebruikservaring",
  "Reviews",
  "Conversie",
  "Call-to-actions",
];

const TRANSLATIONS = [
  ["SEO", "Meer zichtbaarheid"],
  ["Hosting", "Minder zorgen"],
  ["PageSpeed", "Minder afhakers"],
  ["Onderhoud", "Meer tijd"],
  ["Responsive website", "Meer klanten via mobiel"],
];

const CTA_META = [
  "Vrijblijvend",
  "Voor lokale ondernemers",
  "Focus op groei",
  "Eén aanspreekpunt",
];

const HOMEPAGE_FAQS = [
  {
    question: "Wat doet Vedantix?",
    answer:
      "Vedantix helpt lokale ondernemers groeien met websites, SEO, content, online zichtbaarheid, hosting en onderhoud. Het doel is meer vertrouwen, meer aanvragen en minder technische zorgen.",
  },
  {
    question: "Hoe helpt Vedantix ondernemers beter gevonden te worden in Google?",
    answer:
      "Vedantix bouwt websites met een duidelijke paginastructuur, lokale zoekwoorden, snelle techniek, goede metadata en content die aansluit op vragen van potentiële klanten.",
  },
  {
    question: "Waarom is een professionele website belangrijk?",
    answer:
      "Een professionele website wekt vertrouwen, maakt duidelijk wat je aanbiedt en verlaagt de drempel om contact op te nemen via telefoon, WhatsApp of een offerteaanvraag.",
  },
  {
    question: "Waarom kiezen ondernemers voor Vedantix?",
    answer:
      "Ondernemers kiezen voor Vedantix omdat website, hosting, onderhoud, SEO en ondersteuning onder één dak worden geregeld met focus op zichtbaarheid en groei.",
  },
  {
    question: "Is Vedantix een bedrijf voor websites, webdesign, hosting en SEO?",
    answer:
      "Ja. Vedantix combineert webdesign, webontwikkeling, managed hosting, SSL, onderhoud, SEO, AEO, GEO en AI-vindbaarheid voor lokale ondernemers en zzp’ers.",
  },
  {
    question: "Werkt Vedantix alleen in Den Bosch?",
    answer:
      "Nee. Vedantix is gevestigd in 's-Hertogenbosch en werkt voor lokale ondernemers in heel Nederland. De samenwerking kan grotendeels online verlopen.",
  },
];

function SectionCta({ title, text, dark = false }) {
  return (
    <div className={`mini-cta ${dark ? "dark" : ""}`}>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="mini-cta-actions">
        <a href="/online-groei-audit" className="btn-lead">
          Gratis Online Groei Audit <ArrowRight size={17} aria-hidden="true" />
        </a>
        <a href={CONTACT.WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-outline">
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

function CompareList({ title, items, variant }) {
  return (
    <article className={`growth-compare-col ${variant}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Home() {
  const meetingUrl = `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(
    "Hallo Vedantix, ik wil graag een kennismaking plannen over online groei."
  )}`;
  const canonical = "https://vedantix.nl/";
  const faqSchema = createFAQSchema(HOMEPAGE_FAQS);
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: canonical },
  ]);

  return (
    <>
      <SEO
        title="Vedantix | Websites die lokale ondernemers helpen groeien"
        description="Vedantix helpt lokale ondernemers met professionele websites, SEO, AI-vriendelijke content en online zichtbaarheid voor meer vertrouwen, meer aanvragen en minder technische zorgen."
        canonical={canonical}
        schemas={[faqSchema, breadcrumbSchema]}
      />

      <div className="home-page">
        <NavBar />

        <main>
          <HomeHero />

          <section className="home-review-strip" aria-label="Reviews van Vedantix">
            <div className="home-review-wrap">
              <div className="home-review-widget">
                <JotformReviewWidget />
              </div>
            </div>
          </section>

          <section className="section-shell">
            <div className="section-wrap">
              <div className="section-header center">
                <div className="section-label">Bewijs dat jouw website werkt</div>
                <h2 className="section-h2">Een website moet bezoekers overtuigen</h2>
                <p className="section-p">
                  Een website moet niet alleen mooi zijn. Hij moet bezoekers overtuigen,
                  vertrouwen opbouwen en kansen creëren op nieuwe klanten.
                </p>
              </div>

              <div className="growth-benefit-grid">
                {PROOF_CARDS.map((proof) => (
                  <IconCard key={proof.title} {...proof} />
                ))}
              </div>

              <SectionCta
                title="Wil je weten of jouw website echt werkt?"
                text="Vraag een gratis Online Groei Audit aan en ontdek waar je meer vertrouwen, zichtbaarheid en aanvragen kunt winnen."
              />
            </div>
          </section>

          <section className="section-shell">
            <div className="section-wrap">
              <div className="section-header center">
                <div className="section-label">Wat levert Vedantix jou op?</div>
                <h2 className="section-h2">Meer resultaat uit je online aanwezigheid</h2>
                <p className="section-p">
                  Vedantix helpt lokale ondernemers groeien door meer zichtbaarheid, meer
                  vertrouwen, meer aanvragen en minder technische zorgen.
                </p>
              </div>

              <div className="growth-benefit-grid">
                {BENEFITS.map((benefit) => (
                  <IconCard key={benefit.title} {...benefit} />
                ))}
              </div>

              <SectionCta
                title="Benieuwd waar jouw grootste online groeikans ligt?"
                text="Laat je website, vindbaarheid en aanvraagflow vrijblijvend bekijken."
              />
            </div>
          </section>

          <section className="section-shell alt">
            <div className="section-wrap">
              <div className="section-header">
                <div className="section-label">Waarom websites vaak stilvallen</div>
                <h2 className="section-h2">Waarom veel websites geen klanten opleveren</h2>
                <p className="section-p">
                  Een website is slechts één onderdeel van online succes. Groei ontstaat pas als
                  zichtbaarheid, vertrouwen en duidelijke contactmomenten samenwerken.
                </p>
              </div>

              <div className="growth-compare-grid">
                <CompareList title="Alleen een website" items={WEBSITE_ONLY} variant="old" />
                <CompareList title="Het Vedantix Groei Model" items={GROWTH_MODEL} variant="new" />
              </div>

              <SectionCta
                title="Maak van je website geen visitekaartje, maar een groeikanaal."
                text="We laten zien welke onderdelen ontbreken om meer aanvragen te krijgen."
              />
            </div>
          </section>

          <section className="section-shell anchor-section" id="how">
            <div className="section-wrap">
              <div className="section-header center">
                <div className="section-label">Het Vedantix Groei Model</div>
                <h2 className="section-h2">Van zichtbaar worden naar aanvragen krijgen</h2>
                <p className="section-p">
                  Een website alleen zorgt zelden voor nieuwe klanten.
                </p>
                <p className="section-p">
                  Online groei ontstaat wanneer techniek, content, snelheid, reviews en vertrouwen
                  samenwerken.
                </p>
                <p className="section-p">
                  Daarom bouwen wij niet alleen websites.
                </p>
                <p className="section-p">
                  Wij bouwen complete online groeiplatformen.
                </p>
              </div>

              <div className="growth-roadmap" aria-label="Het Vedantix Groei Model roadmap">
                {ROADMAP.map(({ title, icon: Icon }, index) => (
                  <div className="growth-roadmap-step" key={title}>
                    <div className="growth-roadmap-icon">
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <span>{title}</span>
                    {index < ROADMAP.length - 1 ? <div className="growth-roadmap-arrow">↓</div> : null}
                  </div>
                ))}
              </div>

              <SectionCta
                title="Wil je weten welke stap jouw bedrijf nu mist?"
                text="De Online Groei Audit maakt snel duidelijk waar aanvragen blijven liggen."
              />
            </div>
          </section>

          <section className="section-shell alt">
            <div className="section-wrap growth-ecosystem-wrap">
              <div className="section-header center">
                <div className="section-label">Alles onder één dak</div>
                <h2 className="section-h2">Eén partij. Eén aanspreekpunt. Minder rompslomp.</h2>
                <p className="section-p">
                  Geen losse leveranciers. Geen technische rompslomp. Alles wat je online nodig
                  hebt komt samen in één groeiplatform.
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
                text="Laat je online basis controleren en ontdek wat slimmer onder één dak kan."
              />
            </div>
          </section>

          <section className="section-shell">
            <div className="section-wrap">
              <div className="section-header center">
                <div className="section-label">Wat maakt Vedantix anders?</div>
                <h2 className="section-h2">Geen standaard webdesigner, maar groeipartner</h2>
                <p className="section-p">
                  We vertalen techniek naar ondernemersvoordeel: zichtbaarheid, vertrouwen,
                  aanvragen en rust.
                </p>
              </div>

              <div className="growth-difference-grid">
                {DIFFERENCES.map((difference) => (
                  <IconCard key={difference.title} {...difference} />
                ))}
              </div>

              <div className="translation-strip" aria-label="Techniek vertaald naar voordeel">
                {TRANSLATIONS.map(([technical, benefit]) => (
                  <div className="translation-item" key={technical}>
                    <span>{technical}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                    <strong>{benefit}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-shell alt" aria-labelledby="ai-readiness-title">
            <div className="section-wrap">
              <div className="section-header center">
                <div className="section-label">AI-readiness</div>
                <h2 className="section-h2" id="ai-readiness-title">
                  Gevonden worden in Google én AI
                </h2>
                <p className="section-p">
                  Steeds meer mensen zoeken via Google, ChatGPT, Gemini en andere AI-platformen.
                </p>
                <p className="section-p">
                  Wij zorgen ervoor dat jouw website niet alleen mooi is, maar ook begrijpelijk
                  is voor moderne zoekmachines en AI-systemen.
                </p>
              </div>

              <div className="growth-difference-grid">
                {AI_READINESS_CARDS.map((card) => (
                  <IconCard key={card.title} {...card} />
                ))}
              </div>

              <p className="section-p" style={{ margin: "24px auto 0", textAlign: "center" }}>
                Lees hoe Vedantix werkt aan{" "}
                <a href="/ai-vindbaarheid">SEO, AEO, GEO en AI-vindbaarheid</a>.
              </p>

              <SectionCta
                title="Vraag een gratis Online Groei Audit aan"
                text="Ontdek hoe jouw website scoort op SEO, AI-zichtbaarheid, Google Business en conversie."
              />
            </div>
          </section>

          <ClientCasesSection />

          <section className="section-shell alt anchor-section" id="online-groei-audit">
            <div className="section-wrap">
              <div className="lead-box growth-audit-box">
                <div>
                  <div className="lead-badge">Gratis · vrijblijvend</div>
                  <div className="lead-title">Gratis Online Groei Audit</div>
                  <p className="lead-text">
                    Ontdek waarom jouw concurrent hoger staat in Google.
                  </p>
                  <p className="lead-text">
                    We bekijken waar jouw bedrijf online zichtbaarheid, vertrouwen en aanvragen
                    laat liggen.
                  </p>
                </div>

                <div className="lead-side">
                  <h3>Wij analyseren:</h3>
                  <ul>
                    {SCAN_ITEMS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a
                    href="/online-groei-audit"
                    className="btn-wa"
                  >
                    Vraag gratis Online Groei Audit aan →
                  </a>
                  <div className="lead-note">Concreet advies. Geen verplichtingen.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="section-shell" aria-labelledby="home-faq-title">
            <div className="section-wrap">
              <div className="section-header center">
                <div className="section-label">Direct antwoord</div>
                <h2 className="section-h2" id="home-faq-title">
                  Veelgestelde vragen over online groei
                </h2>
                <p className="section-p">
                  Korte antwoorden op vragen die ondernemers vaak stellen voordat ze hun
                  online zichtbaarheid willen verbeteren.
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

          <section id="cta" className="cta-section anchor-section">
            <div className="cta-inner">
              <h2>Klaar om online meer klanten aan te trekken?</h2>
              <p>
                Plan een vrijblijvende kennismaking en ontdek waar jouw bedrijf online sneller kan
                groeien.
              </p>

              <div className="cta-actions">
                <a href="/online-groei-audit" className="btn-dark">
                  Gratis Online Groei Audit →
                </a>

                <a href={meetingUrl} target="_blank" rel="noreferrer" className="btn-wa">
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
        </main>

      </div>
    </>
  );
}
