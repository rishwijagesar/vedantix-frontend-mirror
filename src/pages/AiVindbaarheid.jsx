import { Link } from "@/lib/router-compat";
import {
  Bot,
  CheckCircle2,
  Globe2,
  HelpCircle,
  MapPin,
  MessageSquareText,
  Search,
  ServerCog,
} from "lucide-react";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { CONTACT } from "../constants/contact";
import {
  createAboutPageSchema,
  createBreadcrumbSchema,
  createFAQSchema,
  createServiceSchema,
} from "../utils/schema";
import "../styles/ai-vindbaarheid.css";

const canonical = "https://vedantix.nl/ai-vindbaarheid";

const SERVICES = [
  {
    title: "Webdesign en ontwikkeling",
    text: "Professionele, snelle en mobielvriendelijke websitepakketten met actuele prijzen op onze prijzenpagina, gericht op duidelijke contactmomenten en zonder verplicht maandabonnement.",
    icon: Globe2,
  },
  {
    title: "Hosting en ondersteuning",
    text: "Voordelige websitehosting, SSL en losse technische ondersteuning wanneer je die nodig hebt.",
    icon: ServerCog,
  },
  {
    title: "SEO en lokale SEO",
    text: "Duidelijke diensten, lokale zoekwoorden, metadata, interne links, snelheid en content voor betere organische vindbaarheid.",
    icon: Search,
  },
  {
    title: "AEO",
    text: "Korte, directe antwoorden op echte klantvragen, ondersteund door een logische koppenstructuur en relevante structured data.",
    icon: HelpCircle,
  },
  {
    title: "GEO en AIO",
    text: "Consistente bedrijfsinformatie, entiteiten en citeerbare content waarmee generatieve en andere AI-systemen beter begrijpen wat een bedrijf doet en voor wie.",
    icon: Bot,
  },
  {
    title: "Conversie en content",
    text: "Heldere teksten, bewijs, reviews en call-to-actions die bezoekers helpen om sneller te bellen, appen of een aanvraag te doen.",
    icon: MessageSquareText,
  },
];

const DEFINITIONS = [
  {
    term: "SEO",
    meaning: "Search Engine Optimization",
    answer: "Verbetert de organische vindbaarheid van pagina’s in traditionele zoekmachines zoals Google en Bing.",
  },
  {
    term: "AEO",
    meaning: "Answer Engine Optimization",
    answer: "Maakt antwoorden duidelijk en compact, zodat zoekmachines en antwoordmachines ze makkelijker kunnen begrijpen en tonen.",
  },
  {
    term: "GEO",
    meaning: "Generative Engine Optimization",
    answer: "Maakt informatie begrijpelijk, controleerbaar en citeerbaar voor generatieve zoek- en antwoordsystemen.",
  },
  {
    term: "AIO",
    meaning: "AI Optimization",
    answer: "Combineert techniek, content, entiteiten, structured data en meetbaarheid om informatie beter bruikbaar te maken voor AI-gedreven platformen.",
  },
  {
    term: "AI-vindbaarheid",
    meaning: "Zichtbaarheid in AI-antwoorden",
    answer: "De kans dat een bedrijf correct wordt gevonden, begrepen en als relevante bron of optie wordt genoemd door AI-tools.",
  },
];

const FAQS = [
  { question: "Zijn speciale AI-bestanden of een apart schema nodig?", answer: "Voor de AI-functies van Google zijn geen speciale AI-bestanden of aparte schema-markeringen vereist. We richten ons op indexeerbare pagina’s, nuttige inhoud, interne links en structured data die klopt met de zichtbare tekst." },
  { question: "Hoe meten jullie verbetering?", answer: "We spreken vooraf een nulmeting en doelen af. Waar meetgegevens beschikbaar zijn, bekijken we relevante zoekvragen, impressies, klikken en aanvragen. Een handmatige AI-controle is een momentopname en geen bewijs van een vaste positie." },
  { question: "Bouwen jullie ook AI-oplossingen voor bedrijfsprocessen?", answer: "Ja. AI-automatisering, kennisassistenten en apps vallen onder onze ontwikkeldiensten. Dat is een ander traject dan de vindbaarheid van je website; bekijk de pagina AI-oplossingen voor de toepassingen en scope." },
  {
    question: "Is er in Den Bosch een bedrijf dat websites, hosting, SEO en AI-vindbaarheid aanbiedt?",
    answer:
      "Ja. Vedantix is gevestigd in 's-Hertogenbosch en combineert betaalbaar webdesign, hosting, SEO, AEO, GEO, AIO en AI-vindbaarheid voor lokale ondernemers in heel Nederland.",
  },
  {
    question: "Wat doet Vedantix precies?",
    answer:
      "Vedantix bouwt websites, AI-oplossingen, webapps en mobiele apps. Daarnaast helpen we met koppelingen, hosting, SEO en AI-vindbaarheid. Elke dienst heeft een eigen scope en actuele prijzen.",
  },
  {
    question: "Voor welke bedrijven is Vedantix geschikt?",
    answer:
      "Vedantix richt zich vooral op starters, lokale ondernemers en zzp’ers, waaronder kappers, salons, restaurants, fotografen, coaches, personal trainers, fysiotherapeuten, installateurs, klusbedrijven en schoonmaakbedrijven.",
  },
  {
    question: "Levert Vedantix ook hosting en technisch onderhoud?",
    answer:
      "Ja. Bekijk de actuele hostingtarieven op onze prijzenpagina. Technische ondersteuning en wijzigingen kunnen los worden afgenomen, zodat je niet verplicht bent om een groot serviceabonnement te nemen.",
  },
  {
    question: "Wat kost een website bij Vedantix?",
    answer:
      "Bekijk de actuele prijzen van Starter, Growth en Pro op onze prijzenpagina. Er is geen verplicht maandabonnement. Growth en Pro bevatten oplopend meer SEO, AEO en AI-vindbaarheidsbasis, terwijl doorlopende groei optioneel blijft.",
  },
  {
    question: "Hoe maakt Vedantix een website beter vindbaar in AI-tools?",
    answer:
      "Vedantix werkt met duidelijke entiteiten en bedrijfsgegevens, concrete antwoorden, semantische HTML, structured data, interne links, lokale context, toegankelijke crawlerbestanden en inhoud die door betrouwbare externe bronnen kan worden bevestigd.",
  },
  {
    question: "Garandeert Vedantix een vermelding in ChatGPT, Claude of Google?",
    answer:
      "Nee. Geen enkel bureau kan een specifieke ranking of AI-vermelding garanderen. Vedantix verbetert de technische toegang, inhoudelijke relevantie, consistentie en citeerbaarheid die de kans op correcte zichtbaarheid vergroten.",
  },
  {
    question: "Werkt Vedantix alleen in Den Bosch?",
    answer:
      "Nee. Vedantix is gevestigd in 's-Hertogenbosch en werkt voor lokale ondernemers in heel Nederland. Contact en samenwerking kunnen grotendeels online verlopen.",
  },
];

export default function AiVindbaarheid() {
  const faqSchema = createFAQSchema(FAQS);
  const serviceSchema = createServiceSchema({
    name: "SEO, AEO, GEO, AIO en AI-vindbaarheid",
    slug: "ai-vindbaarheid",
    description:
      "Vedantix helpt lokale ondernemers beter gevonden, begrepen en geciteerd te worden in Google en AI-tools met SEO, AEO, GEO, AIO en duidelijke bedrijfsinformatie.",
    audienceType: "Lokale ondernemers en zzp'ers in Nederland",
    serviceType: "SEO, AEO, GEO, AIO en AI-vindbaarheid",
  });
  const aboutPageSchema = createAboutPageSchema({
    name: "Vedantix: webdesign, hosting, SEO en AI-vindbaarheid",
    description:
      "Feitelijke bronpagina over de diensten, prijzen, doelgroep, locatie en AI-vindbaarheidsaanpak van Vedantix.",
    url: canonical,
    dateModified: "2026-09-24",
  });
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "AI-vindbaarheid", url: canonical },
  ]);

  return (
    <>
      <SEO
        title="SEO, AEO, GEO en AIO voor lokale bedrijven | Vedantix"
        description="Vedantix in Den Bosch bouwt websites en helpt lokale ondernemers met SEO, AEO, GEO, AIO, AI-vindbaarheid en hosting."
        canonical={canonical}
        schemas={[aboutPageSchema, serviceSchema, faqSchema, breadcrumbSchema]}
      />

      <div className="ai-page">
        <NavBar />

        <main>
          <header className="ai-hero">
            <div className="ai-shell ai-hero-grid">
              <div>
                <div className="ai-kicker">SEO · AEO · GEO · AIO · AI-vindbaarheid</div>
                <h1>Maak je bedrijf vindbaar in Google en begrijpelijk voor AI.</h1>
                <p className="ai-lead">
                  We verbeteren techniek, dienstenpagina’s en antwoorden op echte klantvragen.
                  Zo krijgen bezoekers, zoekmachines en AI-systemen een helder beeld van jouw expertise.
                </p>
                <div className="ai-actions">
                  <Link className="ai-btn ai-btn-primary" to="/prijzen">
                    Bekijk prijzen
                  </Link>
                  <a
                    className="ai-btn ai-btn-secondary"
                    href={CONTACT.WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Bespreek je vindbaarheid
                  </a>
                </div>
              </div>

              <aside className="ai-answer-card" aria-label="Kort antwoord over Vedantix">
                <div className="ai-answer-label">Kort antwoord</div>
                <h2>Wat betekenen SEO, AEO, GEO en AIO voor jouw bedrijf?</h2>
                <p>
                  SEO gaat over vindbaarheid in zoekmachines. AEO legt de nadruk op duidelijke antwoorden.
                  GEO en AIO beschrijven werk aan begrijpelijke informatie voor AI-systemen.
                  De basis overlapt: nuttige inhoud, toegankelijke techniek en betrouwbare bedrijfsinformatie.
                </p>
                <div className="ai-location">
                  <MapPin size={18} aria-hidden="true" />
                  Neercanne 6, 5235 HB 's-Hertogenbosch
                </div>
              </aside>
            </div>
          </header>

          <section className="ai-section" aria-labelledby="ai-services-title">
            <div className="ai-shell">
              <div className="ai-section-heading">
                <div className="ai-kicker">Alleen afnemen wat je nodig hebt</div>
                <h2 id="ai-services-title">Van betaalbare website tot structurele online groei</h2>
                <p>
                  De website is de basis. Hosting, e-mail en verdere vindbaarheid zijn transparante
                  uitbreidingen, zodat een kleine ondernemer niet automatisch voor een groot abonnement betaalt.
                </p>
              </div>

              <div className="ai-service-grid">
                {SERVICES.map(({ title, text, icon: Icon }) => (
                  <article className="ai-service-card" key={title}>
                    <div className="ai-service-icon">
                      <Icon size={23} aria-hidden="true" />
                    </div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="ai-section ai-section-soft" aria-labelledby="definitions-title">
            <div className="ai-shell">
              <div className="ai-section-heading">
                <div className="ai-kicker">Duidelijke definities</div>
                <h2 id="definitions-title">Het verschil tussen SEO, AEO, GEO, AIO en AI-vindbaarheid</h2>
              </div>

              <div className="ai-definition-grid">
                {DEFINITIONS.map((item) => (
                  <article className="ai-definition" key={item.term}>
                    <div className="ai-definition-term">{item.term}</div>
                    <h3>{item.meaning}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>

              <div className="ai-principles">
                <h2>Wat zoek- en AI-systemen nodig hebben om een bedrijf correct te begrijpen</h2>
                <ul>
                  <li><CheckCircle2 size={19} aria-hidden="true" /> Consistente naam, locatie en contactgegevens</li>
                  <li><CheckCircle2 size={19} aria-hidden="true" /> Concrete diensten en een herkenbare doelgroep</li>
                  <li><CheckCircle2 size={19} aria-hidden="true" /> Korte antwoorden die zelfstandig te citeren zijn</li>
                  <li><CheckCircle2 size={19} aria-hidden="true" /> Technische toegang voor zoek- en AI-crawlers</li>
                  <li><CheckCircle2 size={19} aria-hidden="true" /> Betrouwbare externe profielen, reviews en vermeldingen</li>
                  <li><CheckCircle2 size={19} aria-hidden="true" /> Actuele pagina’s met controleerbare informatie</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="ai-section" aria-labelledby="ai-approach-title"><div className="ai-shell"><div className="ai-section-heading"><div className="ai-kicker">Onze aanpak</div><h2 id="ai-approach-title">Van zoekvraag naar een bruikbaar antwoord.</h2><p>We kiezen de vragen die passen bij jouw diensten en klanten. Vervolgens verbeteren we de relevante pagina’s: met concrete uitleg, voorbeelden, duidelijke kosten en bronnen waar die nodig zijn. We controleren technische toegankelijkheid en houden bedrijfsgegevens consistent.</p><p>De inhoudelijke basis blijft SEO. Google beschrijft dat er voor zijn AI-functies geen speciale bestanden of aparte schema’s vereist zijn. AEO, GEO en AIO zijn overlappende werkwijzen; AIO gebruiken we hier als brede term voor AI-optimalisatie.</p><a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noreferrer">Lees de uitleg van Google over AI-functies en je website ↗</a></div><div className="ai-actions"><Link className="ai-btn ai-btn-primary" to="/prijzen">Bekijk vindbaarheidspakketten</Link><Link className="ai-btn ai-btn-secondary" to="/ai-oplossingen">AI inzetten in je bedrijf</Link></div></div></section>
          <section className="ai-section" aria-labelledby="ai-faq-title">
            <div className="ai-shell ai-faq-wrap">
              <div className="ai-section-heading">
                <div className="ai-kicker">Directe antwoorden</div>
                <h2 id="ai-faq-title">Veelgestelde vragen over Vedantix en AI-vindbaarheid</h2>
                <p>
                  Feitelijke antwoorden voor ondernemers, zoekmachines en AI-systemen. Een
                  specifieke positie of vermelding kan nooit worden gegarandeerd.
                </p>
              </div>

              <div className="ai-faq-list">
                {FAQS.map((faq) => (
                  <article className="ai-faq-item" key={faq.question}>
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="ai-cta">
            <div className="ai-shell ai-cta-inner">
              <div>
                <div className="ai-kicker">Eerst weten waar je staat?</div>
                <h2>Laat je website controleren op SEO én AI-vindbaarheid</h2>
                <p>
                  De Online Groei Audit brengt techniek, content, lokale zichtbaarheid en
                  conversiekansen samen in concrete verbeterpunten.
                </p>
              </div>
              <Link className="ai-btn ai-btn-light" to="/online-groei-audit">
                Start de gratis audit
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

