import { useState } from "react";
import { Link } from "@/lib/router-compat";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";

const FAQS = [
  { id: 20, question: "Bouwt Vedantix ook AI-oplossingen en apps?", answer: "Ja. Naast websites bouwen we AI-automatiseringen, webapps, klantportalen, mobiele apps en koppelingen. Op onze dienstenpagina vind je toepassingen en scope; actuele tarieven staan op de prijzenpagina." },
  { id: 21, question: "Zijn gebruikskosten van AI en apps inbegrepen?", answer: "De bouwprijs staat los van kosten voor hosting, modellen, API’s, softwarelicenties en appstoreaccounts. We specificeren verwachte externe en terugkerende kosten vooraf in de offerte." },
  {
    id: 1,
    question: "Wat kost een website bij Vedantix?",
    answer:
      "De actuele prijzen van Starter, Growth en Pro vind je op onze prijzenpagina. Er is geen verplicht maandabonnement. Hosting, zakelijke e-mail en groeidiensten kies je los wanneer je ze nodig hebt.",
  },
  {
    id: 2,
    question: "Hoe snel kan mijn website online staan?",
    answer:
      "We spreken na de intake een planning af op basis van omvang, content en feedback. Voor apps en AI-oplossingen plannen we ook tijd voor ontwerp, testen en overdracht.",
  },
  {
    id: 3,
    question: "Werkt mijn website ook goed op mobiel en tablet?",
    answer:
      "Ja. Alle websites van Vedantix worden responsive gebouwd. Dat betekent dat de website goed werkt op mobiel, tablet en desktop.",
  },
  {
    id: 4,
    question: "Moet ik een maandabonnement afsluiten?",
    answer:
      "Nee. De website betaal je eenmalig en er is geen verplicht maandabonnement. Het actuele hostingtarief staat op de prijzenpagina. Wil je dat Vedantix structureel aan SEO, lokale vindbaarheid of AI-vindbaarheid werkt, dan kun je optioneel een groeipakket kiezen.",
  },
  {
    id: 5,
    question: "Kan ik later nog iets laten aanpassen aan mijn website?",
    answer:
      "Ja. Je website kan later altijd worden uitgebreid of aangepast. Kleine en grotere uitbreidingen kunnen los worden aangevraagd, zoals extra pagina’s, teksten, afsprakenfunctionaliteit, SEO of AI-vindbaarheid.",
  },
  {
    id: 6,
    question: "Wat kost hosting bij Vedantix?",
    answer:
      "Het actuele tarief voor hosting staat op onze prijzenpagina. Een domeinnaam, zakelijke mailboxen en uitzonderlijk zwaar gebruik kunnen apart worden berekend wanneer dat van toepassing is.",
  },
  {
    id: 7,
    question: "Wat kost een zakelijk e-mailadres?",
    answer:
      "Het actuele tarief per zakelijke mailbox staat op de prijzenpagina. Zo kun je bijvoorbeeld werken met info@jouwbedrijf.nl of afspraken@jouwbedrijf.nl.",
  },
  {
    id: 8,
    question: "Helpt Vedantix ook met meer klanten krijgen?",
    answer:
      "Vedantix bouwt websites die gericht zijn op duidelijkheid, vertrouwen en conversie. Daarnaast kun je kiezen voor doorlopende groeidiensten voor Google, lokale vindbaarheid en AI-platformen. Dat vergroot de kans dat relevante bezoekers je bedrijf vinden en contact opnemen.",
  },
  {
    id: 11,
    question: "Wat is het verschil tussen SEO, AEO, GEO en AIO?",
    answer:
      "SEO richt zich op vindbaarheid in zoekmachines zoals Google. AEO helpt antwoordmachines duidelijke antwoorden uit je website te halen. GEO richt zich op generatieve zoek- en antwoordplatformen. AIO is een bredere optimalisatielaag voor AI-systemen waarin techniek, content, entiteiten en structuur samenkomen.",
  },
  {
    id: 12,
    question: "Wat doet Vedantix?",
    answer:
      "Vedantix helpt starters, zzp’ers en kleine bedrijven met betaalbare professionele websites, hosting, zakelijke e-mail, SEO, AEO, GEO/AIO, content en online groei. Je neemt alleen af wat je nodig hebt.",
  },
  {
    id: 13,
    question: "Zijn Vedantix websites voorbereid op AI-zoekmachines?",
    answer:
      "Iedere website krijgt een technisch duidelijke basis. Bij Growth en vooral Pro voegen we meer antwoordgerichte structuur, structured data en AI-leesbare content toe. Voor uitgebreidere of doorlopende AEO, GEO en AIO kun je een losse uitbreiding of groeipakket kiezen.",
  },
  {
    id: 14,
    question: "Kan Vedantix garanderen dat ik bovenaan Google of in ChatGPT kom?",
    answer:
      "Nee. Geen betrouwbare partij kan een specifieke Google-positie of vermelding door een AI-platform garanderen. Vedantix kan wel techniek, inhoud, structuur, lokale signalen en meetbaarheid verbeteren zodat zoekmachines en AI-systemen je bedrijf beter kunnen begrijpen en beoordelen.",
  },
  {
    id: 9,
    question: "Moet ik zelf technisch zijn om met Vedantix te werken?",
    answer:
      "Nee. Wij leggen alles in gewone taal uit. Hosting en technische uitbreidingen kunnen door Vedantix worden geregeld, terwijl je zelf bepaalt hoeveel beheer en groei je wilt uitbesteden.",
  },
  {
    id: 10,
    question: "Hoe kan ik starten met Vedantix?",
    answer:
      "Je kunt starten door contact op te nemen via WhatsApp of het contactformulier. Daarna bespreken we je wensen, adviseren we welk websitepakket past en spreken we eventuele hosting of vindbaarheidsdiensten vooraf duidelijk af.",
  },
];

const FAQ_STYLES = `
  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background: #f7f9fc;
  }

  .faq-page {
    min-height: 100vh;
    background: #f7f9fc;
    color: #111827;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .faq-page a {
    text-decoration: none;
  }

  .faq-shell {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .faq-hero {
    background: linear-gradient(135deg, #0a1628, #0d2146);
    padding: 110px 0 56px;
  }

  .faq-back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 28px;
    color: rgba(255,255,255,0.72);
    font-size: 0.92rem;
    transition: color 0.2s ease;
  }

  .faq-back-link:hover {
    color: #ffffff;
  }

  .faq-title {
    margin: 0 0 14px;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.08;
    letter-spacing: -0.03em;
    font-weight: 900;
    color: #ffffff;
  }

  .faq-subtitle {
    margin: 0;
    max-width: 620px;
    color: rgba(255,255,255,0.78);
    font-size: 1rem;
    line-height: 1.7;
  }

  .faq-content {
    padding: 48px 0 24px;
  }

  .faq-intro {
    margin-bottom: 28px;
  }

  .faq-intro h2 {
    margin: 0 0 10px;
    font-size: 1.4rem;
    line-height: 1.2;
    font-weight: 800;
    color: #0f172a;
  }

  .faq-intro p {
    margin: 0;
    color: #4b5563;
    line-height: 1.75;
  }

  .faq-list {
    display: grid;
    gap: 14px;
    margin-bottom: 48px;
  }

  .faq-item {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  .faq-item:hover {
    border-color: #bfdbfe;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  .faq-trigger {
    width: 100%;
    border: 0;
    background: #ffffff;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    text-align: left;
  }

  .faq-trigger:focus-visible {
    outline: 3px solid #93c5fd;
    outline-offset: -3px;
  }

  .faq-question {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.5;
    color: #111827;
    flex: 1;
  }

  .faq-icon {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.95rem;
    font-weight: 800;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .faq-item.open .faq-icon {
    transform: rotate(180deg);
    background: #dbeafe;
  }

  .faq-panel {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.28s ease;
  }

  .faq-item.open .faq-panel {
    grid-template-rows: 1fr;
  }

  .faq-panel-inner {
    overflow: hidden;
  }

  .faq-answer {
    padding: 0 22px 20px;
    border-top: 1px solid #f1f5f9;
    color: #374151;
    line-height: 1.8;
    font-size: 0.97rem;
  }

  .faq-answer p {
    margin: 0;
  }

  .faq-cta {
    background: linear-gradient(135deg, #0a1628, #0d2146);
    color: #ffffff;
    border-radius: 20px;
    padding: 36px 28px;
    text-align: center;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
  }

  .faq-cta h2 {
    margin: 0 0 12px;
    font-size: 1.6rem;
    line-height: 1.15;
    font-weight: 800;
    color: #ffffff;
  }

  .faq-cta p {
    max-width: 560px;
    margin: 0 auto 24px;
    color: rgba(255,255,255,0.82);
    line-height: 1.75;
  }

  .faq-cta-actions {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .faq-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 190px;
    padding: 14px 24px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.95rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  .faq-btn:hover {
    transform: translateY(-1px);
  }

  .faq-btn-primary {
    background: #1d4ed8;
    color: #ffffff;
    box-shadow: 0 10px 20px rgba(29, 78, 216, 0.25);
  }

  .faq-btn-primary:hover {
    background: #2563eb;
  }

  .faq-btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 2px solid rgba(255,255,255,0.9);
  }

  .faq-btn-secondary:hover {
    background: #ffffff;
    color: #0a1628;
  }

  @media (max-width: 768px) {
    .faq-hero {
      padding: 96px 0 42px;
    }

    .faq-content {
      padding-top: 36px;
    }

    .faq-trigger {
      padding: 16px 16px;
    }

    .faq-answer {
      padding: 0 16px 16px;
      font-size: 0.94rem;
    }

    .faq-cta {
      padding: 28px 18px;
    }

    .faq-cta h2 {
      font-size: 1.35rem;
    }

    .faq-btn {
      width: 100%;
      min-width: 0;
    }
  }
`;

export default function FAQ() {
  const [openId, setOpenId] = useState(1);

  const canonical = "https://vedantix.nl/faq";
  const faqSchema = createFAQSchema(FAQS);
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "FAQ", url: canonical },
  ]);

  return (
    <>
      <SEO
        title="FAQ | Websites, AI-oplossingen, apps en prijzen | Vedantix"
        description="Antwoorden over websites, AI-oplossingen, apps, prijzen, hosting, SEO en AI-vindbaarheid bij Vedantix."
        canonical={canonical}
        schemas={[faqSchema, breadcrumbSchema]}
      />

      <style>{FAQ_STYLES}</style>

      <div className="faq-page">
        <NavBar />

        <header className="faq-hero">
          <div className="faq-shell">
            <Link className="faq-back-link" to="/">
              ← Terug naar Vedantix
            </Link>

            <h1 className="faq-title">Veelgestelde vragen</h1>
            <p className="faq-subtitle">
              Duidelijke antwoorden over websiteprijzen, hosting, zakelijke e-mail,
              SEO, AEO, GEO/AIO, oplevering en ondersteuning bij Vedantix.
            </p>
          </div>
        </header>

        <main className="faq-content">
          <div className="faq-shell">
            <section className="faq-intro" aria-labelledby="faq-overview-title">
              <h2 id="faq-overview-title">Antwoorden op de belangrijkste vragen</h2>
              <p>
                Hieronder staan de vragen die het vaakst worden gesteld door ondernemers
                die betaalbaar professioneel online willen en zelf willen bepalen hoeveel
                hosting, ondersteuning en online groei ze afnemen.
              </p>
            </section>

            <section className="faq-list" aria-label="Veelgestelde vragen">
              {FAQS.map((faq) => {
                const isOpen = openId === faq.id;
                const buttonId = `faq-button-${faq.id}`;
                const panelId = `faq-panel-${faq.id}`;

                return (
                  <article
                    key={faq.id}
                    className={`faq-item ${isOpen ? "open" : ""}`}
                  >
                    <button
                      id={buttonId}
                      className="faq-trigger"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                    >
                      <span className="faq-question">{faq.question}</span>
                      <span className="faq-icon" aria-hidden="true">▼</span>
                    </button>

                    <div
                      id={panelId}
                      className="faq-panel"
                      role="region"
                      aria-labelledby={buttonId}
                    >
                      <div className="faq-panel-inner">
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="faq-cta" aria-labelledby="faq-cta-title">
              <h2 id="faq-cta-title">Klaar om je idee te bespreken?</h2>
              <p>
                Start met een professioneel websitepakket en voeg hosting of online
                groei alleen toe wanneer jouw bedrijf dat nodig heeft.
              </p>

              <div className="faq-cta-actions">
                <Link className="faq-btn faq-btn-primary" to="/prijzen">
                  Bekijk prijzen
                </Link>
                <a
                  className="faq-btn faq-btn-secondary"
                  href="https://wa.me/310626219989?text=Hallo%20Vedantix%2C%20ik%20ben%20geinteresseerd%20in%20een%20website."
                  target="_blank"
                  rel="noreferrer"
                >
                  Plan een gesprek
                </a>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

