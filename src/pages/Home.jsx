import { Suspense } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  FileText,
  LayoutDashboard,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Search,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { SOFTWARE_TITLE, SOFTWARE_DESCRIPTION, SOFTWARE_FAQS, SCAN_URL } from "../data/positioning";
import { buildClientStrip, CLIENT_PHOTOS, COMMITMENTS, PAIN_POINTS } from "../data/proof";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import CatalogPrice from "../components/CatalogPrice";
import JotformReviewWidget from "../components/JotformReviewWidget";
import Hero from "../components/home/Hero";
import AppMock from "../components/home/AppMock";
import ClientStrip from "../components/home/ClientStrip";
import ClientCasesSection from "../components/home/ClientCasesSection";
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/vx-home.css";

const HOMEPAGE_FAQS = SOFTWARE_FAQS.filter((_, index) => [0, 1, 2, 3, 4, 8, 9].includes(index));

const PAIN_ICONS = [Users, FileText, CreditCard, Wrench];

const PROCESS = [
  { title: "Bedrijfsscan", text: "We lopen samen met jouw team door processen, tools, abonnementen en handwerk. Zo zien we waar tijd weglekt.", icon: Search },
  { title: "Voorstel met vaste prijs", text: "Je krijgt een afgebakend voorstel met fases, opstartkosten en een vast maandbedrag. Geen verrassingen achteraf.", icon: FileText },
  { title: "Bouwen en accepteren", text: "We bouwen in fases en testen echte situaties, rollen en foutgevallen. Jouw team akkoord, dan pas live.", icon: LayoutDashboard },
  { title: "Beheren en uitbreiden", text: "Onderhoud, support en nieuwe functies volgen vaste afspraken. Overdracht en export leggen we vooraf vast.", icon: ShieldCheck },
];

const OWN_SOFTWARE = [
  { title: "Klanten en leads", text: "Aanvragen en contactmomenten op één plek, met een duidelijke volgende stap.", icon: Users },
  { title: "Offertes en contracten", text: "Offertes maken en contracten laten ondertekenen, vanuit dezelfde gegevens.", icon: FileText },
  { title: "Facturen en betalingen", text: "Facturen versturen en betalingen volgen met online betaallinks.", icon: Receipt },
  { title: "Beheer en monitoring", text: "Zicht op de technische gezondheid van websites en systemen.", icon: ShieldCheck },
];

const SCAN_ITEMS = [
  "Controle van één openbare pagina",
  "Signalen voor Google en AI",
  "Zichtbare contactmogelijkheden",
  "Technische basisinstellingen",
  "Verbeterpunten op prioriteit",
  "Downloadbaar PDF-rapport",
];

export default function Home({ initialCases = null }) {
  const canonical = "https://vedantix.nl/";
  const faqSchema = createFAQSchema(HOMEPAGE_FAQS);
  const breadcrumbSchema = createBreadcrumbSchema([{ name: "Home", url: canonical }]);
  const whatsappUrl = `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent("Hallo Vedantix, ik wil graag een bedrijfsscan bespreken.")}`;

  return (
    <>
      <SEO title={SOFTWARE_TITLE} description={SOFTWARE_DESCRIPTION} canonical={canonical} schemas={[faqSchema, breadcrumbSchema]} />

      <div className="vx-page home-page">
        <NavBar />

        <main>
          <Hero />

          {/* Bewijs 1: klanten */}
          <section className="vx-section vx-section--tight vx-proofbar" aria-labelledby="vx-clients-title">
            <div className="vx-container">
              <h2 id="vx-clients-title" className="vx-proofbar__title">{buildClientStrip(initialCases).some((tile) => tile.sector) ? "Onze klanten en de branches waarvoor we bouwen" : "Ondernemers die met Vedantix werken"}</h2>
              <ClientStrip clients={initialCases} />
            </div>
          </section>

          {/* Doelgroep en probleem */}
          <section className="vx-section vx-section--soft" aria-labelledby="vx-pain-title">
            <div className="vx-container">
              <div className="vx-head">
                <p className="vx-eyebrow">Voor wie</p>
                <h2 id="vx-pain-title" className="vx-h2">Gebouwd voor mkb-bedrijven die uit Excel en losse tools groeien</h2>
                <p className="vx-lead">Herken je een of meer van deze situaties? Dan kost je huidige manier van werken je elke week uren.</p>
              </div>
              <div className="vx-grid vx-grid--4">
                {PAIN_POINTS.map((item, index) => {
                  const Icon = PAIN_ICONS[index];
                  return (
                    <article key={item.title} className="vx-card vx-card--hover">
                      <div className="vx-icon"><Icon aria-hidden="true" /></div>
                      <h3 className="vx-h3">{item.title}</h3>
                      <p className="vx-card__text">{item.text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Oplossing: voor en na */}
          <section className="vx-section" aria-labelledby="vx-solution-title">
            <div className="vx-container vx-split">
              <div>
                <p className="vx-eyebrow">De oplossing</p>
                <h2 id="vx-solution-title" className="vx-h2">Eén werkplek rond jouw processen</h2>
                <p className="vx-lead">
                  We bouwen een webapp waarin je team werkt met de rechten die bij de rol passen.
                  Bestaande tools kunnen blijven waar ze waarde toevoegen.
                </p>
                <ul className="vx-checks">
                  <li><Check aria-hidden="true" />Minder overtypen en minder wisselen tussen tools</li>
                  <li><Check aria-hidden="true" />Nieuwe collega’s werken sneller zelfstandig</li>
                  <li><Check aria-hidden="true" />Actueel overzicht voor eigenaar en team</li>
                </ul>
                <a className="vx-btn vx-btn--dark" href={SCAN_URL}>Bespreek jouw situatie <ArrowRight aria-hidden="true" /></a>
              </div>
              <div className="vx-compare" aria-label="Voor en na">
                <div className="vx-compare__col">
                  <h3 className="vx-compare__title">Nu</h3>
                  <ul className="vx-compare__chips">
                    {["Excel", "Mail", "Boekhoudpakket", "Planningstool", "Notities", "WhatsApp"].map((tool) => <li key={tool}>{tool}</li>)}
                  </ul>
                </div>
                <div className="vx-compare__arrow" aria-hidden="true"><ArrowRight /></div>
                <div className="vx-compare__col vx-compare__col--after">
                  <h3 className="vx-compare__title">Straks</h3>
                  <p className="vx-compare__one"><LayoutDashboard aria-hidden="true" /> Eén app op maat</p>
                  <p className="vx-compare__sub">Met rollen, rechten en instructies</p>
                </div>
              </div>
            </div>
          </section>

          {/* Zo ziet het eruit + tevreden klanten (alleen echte foto's uit CLIENT_PHOTOS) */}
          <section className="vx-section vx-section--soft" aria-labelledby="vx-day-title">
            <div className="vx-container vx-split vx-split--app">
              <div>
                <p className="vx-eyebrow">In de praktijk</p>
                <h2 id="vx-day-title" className="vx-h2">Van aanvraag tot betaalde factuur, op één scherm</h2>
                <p className="vx-lead">Je team ziet direct waar elke klant staat. Geen zoeken in mailtjes en spreadsheets meer.</p>
                <ul className="vx-checks">
                  <li><Check aria-hidden="true" />Elke aanvraag krijgt een vaste route</li>
                  <li><Check aria-hidden="true" />Offertes en facturen komen uit dezelfde gegevens</li>
                  <li><Check aria-hidden="true" />Eigenaar ziet in één blik wat openstaat</li>
                </ul>
              </div>
              <AppMock />
            </div>
            {CLIENT_PHOTOS.length > 0 ? (
              <div className="vx-container vx-happy">
                <h3 className="vx-h3 vx-happy__title">Tevreden ondernemers</h3>
                <ul className="vx-happy__list">
                  {CLIENT_PHOTOS.map((person) => (
                    <li key={person.id} className="vx-happy__card">
                      <img src={person.src} alt={`${person.name}, ${person.company}`} width="320" height="320" loading="lazy" decoding="async" />
                      <p><strong>{person.name}</strong><span>{person.company}</span></p>
                      {person.quote ? <blockquote>{person.quote}</blockquote> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Bewijs 2: eigen software + cases + review */}
          <section className="vx-section" aria-labelledby="vx-own-title">
            <div className="vx-container">
              <div className="vx-head">
                <p className="vx-eyebrow">Bewijs</p>
                <h2 id="vx-own-title" className="vx-h2">Wij bouwen ook onze eigen bedrijfssoftware</h2>
                <p className="vx-lead">
                  Het Vedantix Control Center bundelt klanten, offertes, contracten, facturen, betalingen en monitoring.
                  Zo ervaren we zelf wat goede bedrijfssoftware vraagt.
                </p>
              </div>
              <div className="vx-grid vx-grid--4">
                {OWN_SOFTWARE.map(({ title, text, icon: Icon }) => (
                  <article key={title} className="vx-card vx-card--hover">
                    <div className="vx-icon"><Icon aria-hidden="true" /></div>
                    <h3 className="vx-h3">{title}</h3>
                    <p className="vx-card__text">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="vx-section vx-section--soft vx-cases" aria-label="Klantcases en reviews">
            <div className="vx-container">
              <ClientCasesSection initialCases={initialCases} />
              <Suspense fallback={null}>
                <div className="vx-reviews">
                  <JotformReviewWidget />
                </div>
              </Suspense>
            </div>
          </section>

          {/* Werkwijze */}
          <section id="how" className="vx-section vx-section--dark anchor-section" aria-labelledby="vx-process-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Werkwijze</p>
                <h2 id="vx-process-title" className="vx-h2">Van eerste gesprek tot werkende software</h2>
                <p className="vx-lead">Een werkbare eerste stap, daarna gericht uitbreiden. Functionaliteit, kosten en controles spreken we vooraf af.</p>
              </div>
              <ol className="vx-process">
                {PROCESS.map(({ title, text, icon: Icon }, index) => (
                  <li key={title} className="vx-process__step">
                    <span className="vx-process__num" aria-hidden="true">{index + 1}</span>
                    <div className="vx-process__icon"><Icon aria-hidden="true" /></div>
                    <h3 className="vx-h3">{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Afspraken */}
          <section className="vx-section" aria-labelledby="vx-commit-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Wat je van ons mag verwachten</p>
                <h2 id="vx-commit-title" className="vx-h2">Heldere afspraken, geen kleine lettertjes</h2>
              </div>
              <div className="vx-grid vx-grid--4">
                {COMMITMENTS.map((item) => (
                  <article key={item.title} className="vx-card">
                    <div className="vx-icon"><Check aria-hidden="true" /></div>
                    <h3 className="vx-h3">{item.title}</h3>
                    <p className="vx-card__text">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Twee paden en prijs */}
          <section className="vx-section vx-section--soft" aria-labelledby="vx-paths-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Wat past bij jou?</p>
                <h2 id="vx-paths-title" className="vx-h2">Software op maat of een snelle, sterke website</h2>
              </div>
              <div className="vx-paths">
                <article className="vx-card vx-path vx-path--main">
                  <span className="vx-path__tag">Voor mkb-bedrijven</span>
                  <h3 className="vx-h2 vx-path__title">Software op maat</h3>
                  <p className="vx-path__price">Offerte na bedrijfsscan</p>
                  <p className="vx-card__text">Eenmalige opstartkosten en een vast maandbedrag voor afgesproken functionaliteit, hosting, onderhoud en support.</p>
                  <ul className="vx-checks">
                    <li><Check aria-hidden="true" />Gefaseerd bouwen en accepteren</li>
                    <li><Check aria-hidden="true" />Rollen en rechten per medewerker</li>
                    <li><Check aria-hidden="true" />Koppelingen met bestaande tools</li>
                  </ul>
                  <a className="vx-btn vx-btn--dark vx-btn--block" href={SCAN_URL}>Plan een bedrijfsscan <ArrowRight aria-hidden="true" /></a>
                </article>
                <article className="vx-card vx-path">
                  <span className="vx-path__tag vx-path__tag--soft">Voor zelfstandigen en starters</span>
                  <h3 className="vx-h2 vx-path__title">Website laten maken</h3>
                  <p className="vx-path__price">Starter: <CatalogPrice code="STARTER" /></p>
                  <p className="vx-card__text">Vaste prijzen per pakket en geen verplicht maandabonnement. Hosting en onderhoud kies je zelf erbij.</p>
                  <ul className="vx-checks">
                    <li><Check aria-hidden="true" />Pakketten Starter, Growth en Pro</li>
                    <li><Check aria-hidden="true" />Gericht op lokale vindbaarheid</li>
                    <li><Check aria-hidden="true" />Prijzen inclusief en exclusief btw</li>
                  </ul>
                  <a className="vx-btn vx-btn--outline vx-btn--block" href="/prijzen">Bekijk alle prijzen <ArrowRight aria-hidden="true" /></a>
                </article>
              </div>
            </div>
          </section>

          {/* Over de bouwer */}
          <section className="vx-section" aria-labelledby="vx-founder-title">
            <div className="vx-container vx-founder">
              <figure className="vx-founder__photo">
                <img src="/images/founder.jpeg" alt="Rishwi, oprichter van Vedantix" width="400" height="400" loading="lazy" decoding="async" />
              </figure>
              <div>
                <p className="vx-eyebrow">Over de bouwer</p>
                <h2 id="vx-founder-title" className="vx-h2">Je praat altijd met degene die bouwt</h2>
                <p className="vx-lead">
                  Ik ben Rishwi, oprichter van Vedantix. Van het eerste gesprek tot het beheer houd je direct contact met mij.
                  Geen accountmanagers ertussen: wat we afspreken, bouw ik.
                </p>
                <div className="vx-founder__actions">
                  <a className="vx-btn vx-btn--dark" href="/over-ons">Lees meer over Vedantix</a>
                  <a className="vx-btn vx-btn--outline" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />Stuur een WhatsApp</a>
                </div>
              </div>
            </div>
          </section>

          {/* Leadmagneet */}
          <section id="online-groei-audit" className="vx-section vx-section--soft anchor-section" aria-labelledby="vx-audit-title">
            <div className="vx-container">
              <div className="vx-audit">
                <div>
                  <p className="vx-eyebrow">Gratis · vrijblijvend</p>
                  <h2 id="vx-audit-title" className="vx-h2">Gratis Online Groei Audit voor je website</h2>
                  <p className="vx-lead">Laat één openbare pagina controleren op signalen voor vindbaarheid in Google en AI, en op zichtbare contactmogelijkheden.</p>
                  <a className="vx-btn vx-btn--dark" href="/online-groei-audit">Start de gratis audit <ArrowRight aria-hidden="true" /></a>
                </div>
                <ul className="vx-audit__list" aria-label="Dit krijg je">
                  {SCAN_ITEMS.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="vx-section" aria-labelledby="home-faq-title">
            <div className="vx-container">
              <div className="vx-head vx-head--center">
                <p className="vx-eyebrow">Direct antwoord</p>
                <h2 id="home-faq-title" className="vx-h2">Veelgestelde vragen</h2>
              </div>
              <div className="vx-faq">
                {HOMEPAGE_FAQS.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
              <p className="vx-faq__more"><a className="vx-link" href="/faq">Alle vragen bekijken <ArrowRight aria-hidden="true" /></a></p>
            </div>
          </section>

          {/* Slot-CTA */}
          <section id="cta" className="vx-final anchor-section" aria-labelledby="vx-final-title">
            <div className="vx-container vx-final__inner">
              <h2 id="vx-final-title" className="vx-h2">Klaar om dubbel werk te schrappen?</h2>
              <p className="vx-lead">Plan een bedrijfsscan en ontdek waar handwerk, losse tools en abonnementen jouw bedrijf in de weg zitten.</p>
              <div className="vx-final__actions">
                <a className="vx-btn vx-btn--primary" href={SCAN_URL}>Plan een bedrijfsscan <ArrowRight aria-hidden="true" /></a>
                <a className="vx-btn vx-btn--ghost" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />WhatsApp ons</a>
              </div>
              <p className="vx-final__contact">
                <a href={`tel:${CONTACT.PHONE_HREF}`}><Phone aria-hidden="true" /> {CONTACT.PHONE_DISPLAY}</a>
                <a href={`mailto:${CONTACT.EMAIL}`}>{CONTACT.EMAIL}</a>
                <span><Lock aria-hidden="true" /> Je gegevens gebruiken we alleen om je vraag te beantwoorden.</span>
              </p>
            </div>
          </section>
        </main>

        <div className="vx-sticky">
          <a className="vx-btn vx-btn--primary" href={SCAN_URL}>Plan een bedrijfsscan</a>
          <a className="vx-btn vx-btn--ghost" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Stuur een WhatsApp-bericht"><MessageCircle aria-hidden="true" /></a>
        </div>
      </div>
    </>
  );
}
