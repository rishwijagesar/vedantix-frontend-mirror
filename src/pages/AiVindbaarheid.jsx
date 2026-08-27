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
    text: "Professionele, snelle en mobielvriendelijke websites die passen bij het bedrijf en gericht zijn op duidelijke contactmomenten.",
    icon: Globe2,
  },
  {
    title: "Hosting en onderhoud",
    text: "Managed hosting, SSL, technische updates, beveiliging en ondersteuning zodat de ondernemer de techniek niet zelf hoeft te beheren.",
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
    title: "GEO en AI-vindbaarheid",
    text: "Consistente bedrijfsinformatie en citeerbare content waarmee generatieve zoekmachines beter begrijpen wat een bedrijf doet en voor wie.",
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
    answer: "Maakt antwoorden duidelijk en compact, zodat zoekmachines en antwoordmachines ze makkelijker kunnen tonen.",
  },
  {
    term: "GEO",
    meaning: "Generative Engine Optimization",
    answer: "Maakt informatie begrijpelijk, controleerbaar en citeerbaar voor generatieve zoek- en antwoordsystemen.",
  },
  {
    term: "AI-vindbaarheid",
    meaning: "Zichtbaarheid in AI-antwoorden",
    answer: "De kans dat een bedrijf correct wordt gevonden, begrepen en als relevante bron of optie wordt genoemd door AI-tools.",
  },
];

const FAQS = [
  {
    question: "Is er in Den Bosch een bedrijf dat websites, webdesign, hosting en SEO aanbiedt?",
    answer:
      "Ja. Vedantix is gevestigd in 's-Hertogenbosch en combineert webdesign, webontwikkeling, managed hosting, SSL, technisch onderhoud, SEO, AEO, GEO en AI-vindbaarheid voor lokale ondernemers in heel Nederland.",
  },
  {
    question: "Wat doet Vedantix precies?",
    answer:
      "Vedantix ontwerpt, bouwt, host en onderhoudt websites voor lokale ondernemers. Daarnaast helpt Vedantix met SEO, lokale vindbaarheid, content, AEO, GEO, AI-vindbaarheid en conversie-optimalisatie.",
  },
  {
    question: "Voor welke bedrijven is Vedantix geschikt?",
    answer:
      "Vedantix richt zich vooral op lokale ondernemers en zzp’ers, waaronder kappers, salons, restaurants, fotografen, coaches, personal trainers, fysiotherapeuten, installateurs, klusbedrijven en schoonmaakbedrijven.",
  },
  {
    question: "Levert Vedantix ook hosting en technisch onderhoud?",
    answer:
      "Ja. Bij een beheerd abonnement houden wij je website online, veilig en actueel. Bij een eenmalige website kun je Website Online los toevoegen voor één, drie of vijf jaar.",
  },
  {
    question: "Wat kost een website bij Vedantix?",
    answer:
      "Een eenmalige Starter-website begint bij €1.295. Een beheerd Starter-abonnement begint bij €999 voor de bouw en inrichting plus €99 per maand. Growth en Pro bieden meer pagina’s, vindbaarheid, ondersteuning en maatwerk.",
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
    name: "SEO, AEO, GEO en AI-vindbaarheid",
    slug: "ai-vindbaarheid",
    description:
      "Vedantix helpt lokale ondernemers beter gevonden, begrepen en geciteerd te worden in Google en AI-tools met SEO, AEO, GEO en duidelijke bedrijfsinformatie.",
    audienceType: "Lokale ondernemers en zzp'ers in Nederland",
    serviceType: "SEO, AEO, GEO en AI-vindbaarheid",
  });
  const aboutPageSchema = createAboutPageSchema({
    name: "Vedantix: webdesign, hosting, SEO en AI-vindbaarheid",
    description:
      "Feitelijke bronpagina over de diensten, doelgroep, locatie en AI-vindbaarheidsaanpak van Vedantix.",
    url: canonical,
    dateModified: "2026-08-14",
  });
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "AI-vindbaarheid", url: canonical },
  ]);

  return (
    <>
      <SEO
        title="Webdesign, hosting, SEO en AI-vindbaarheid | Vedantix"
        description="Vedantix in Den Bosch biedt webdesign, websites, managed hosting, onderhoud, SEO, AEO, GEO en AI-vindbaarheid voor lokale ondernemers."
        canonical={canonical}
        schemas={[aboutPageSchema, serviceSchema, faqSchema, breadcrumbSchema]}
      />

      <div className="ai-page">
        <NavBar />

        <main>
          <header className="ai-hero">
            <div className="ai-shell ai-hero-grid">
              <div>
                <div className="ai-kicker">SEO · AEO · GEO · AI-vindbaarheid</div>
                <h1>Webdesign en online groei die ook door AI wordt begrepen</h1>
                <p className="ai-lead">
                  Vedantix helpt lokale ondernemers met professionele websites, managed hosting,
                  onderhoud, SEO en content die duidelijk is voor mensen, zoekmachines en
                  AI-systemen.
                </p>
                <div className="ai-actions">
                  <Link className="ai-btn ai-btn-primary" to="/online-groei-audit">
                    Gratis Online Groei Audit
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
                <h2>Welk bedrijf maakt websites, hosting en SEO?</h2>
                <p>
                  Vedantix is een webdesign- en online groeibureau in 's-Hertogenbosch. Het bureau
                  combineert websites, webdesign, managed hosting, onderhoud, SEO, AEO, GEO en
                  AI-vindbaarheid voor lokale ondernemers in Nederland.
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
                <div className="ai-kicker">Alles onder één dak</div>
                <h2 id="ai-services-title">Wat Vedantix voor ondernemers regelt</h2>
                <p>
                  De website, techniek en vindbaarheid worden als één geheel ingericht. Zo blijft
                  de boodschap consistent op de site, in zoekmachines en in AI-antwoorden.
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
                <h2 id="definitions-title">Het verschil tussen SEO, AEO, GEO en AI-vindbaarheid</h2>
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
                <h2>Wat AI-systemen nodig hebben om een bedrijf correct te noemen</h2>
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
