import { useState } from "react";
import { Link } from "@/lib/router-compat";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";

const FAQS = [
  {
    id: 1,
    question: "Wat kost een website bij Vedantix?",
    answer:
      "Je kunt een website eenmalig laten bouwen vanaf €1.295 of kiezen voor een beheerd abonnement vanaf €99 per maand plus de bouw en inrichting. Je kiest zelf welke vorm het beste bij jouw bedrijf past.",
  },
  {
    id: 2,
    question: "Hoe snel kan mijn website online staan?",
    answer:
      "In veel gevallen kan een website binnen 48 uur live staan. Dat hangt wel af van hoe snel teksten, foto’s, logo’s en feedback worden aangeleverd. Bij uitgebreidere websites of extra wensen kan de oplevering iets langer duren.",
  },
  {
    id: 3,
    question: "Werkt mijn website ook goed op mobiel en tablet?",
    answer:
      "Ja. Alle websites van Vedantix worden responsive gebouwd. Dat betekent dat de website goed werkt op mobiel, tablet en desktop.",
  },
  {
    id: 4,
    question: "Wat zit er in het maandabonnement?",
    answer:
      "Met het abonnement houden wij je website online, veilig en actueel. Je krijgt ook hulp bij vragen en, afhankelijk van het pakket, bij kleine wijzigingen en verbeteringen.",
  },
  {
    id: 5,
    question: "Kan ik later nog iets laten aanpassen aan mijn website?",
    answer:
      "Ja. Je website kan later altijd worden uitgebreid of aangepast. Afhankelijk van je pakket zijn kleine wijzigingen inbegrepen. Grotere uitbreidingen of extra werkzaamheden worden apart geoffreerd.",
  },
  {
    id: 6,
    question: "Zit ik vast aan een lang contract?",
    answer:
      "Een eenmalige website heeft geen abonnement. De beheerde abonnementen zijn na oplevering maandelijks opzegbaar met een opzegtermijn van 30 dagen, tenzij in je voorstel iets anders is afgesproken.",
  },
  {
    id: 7,
    question: "Wat gebeurt er als ik stop met mijn abonnement?",
    answer:
      "Na beëindiging van het abonnement wordt de website offline gehaald na afloop van de opzegtermijn. Neem vooraf contact op als je de mogelijkheden wilt bespreken voor overdracht of overname van onderdelen van de website.",
  },
  {
    id: 8,
    question: "Helpt Vedantix ook met meer klanten krijgen?",
    answer:
      "Vedantix bouwt websites die gericht zijn op duidelijkheid, vertrouwen en conversie. Denk aan een professionele uitstraling, goede mobiele weergave, snelle laadtijd, contactmogelijkheden en een logische opbouw. Dat helpt om bezoekers sneller om te zetten in aanvragen of afspraken.",
  },
  {
    id: 11,
    question: "Hoe word ik beter gevonden in Google?",
    answer:
      "Je wordt beter gevonden met een snelle en duidelijke website, sterke teksten, goede paginatitels en pagina’s die antwoord geven op vragen van klanten. We zorgen ook dat jouw diensten en werkgebied duidelijk naar voren komen.",
  },
  {
    id: 12,
    question: "Wat doet Vedantix?",
    answer:
      "Vedantix helpt lokale ondernemers groeien met websites, SEO, content, online zichtbaarheid, hosting en onderhoud. Het doel is meer vertrouwen, meer aanvragen en minder technische zorgen.",
  },
  {
    id: 13,
    question: "Zijn Vedantix websites voorbereid op AI-zoekmachines?",
    answer:
      "Ja. We leggen duidelijk uit wie je bent, wat je aanbiedt, waar je werkt en welke vragen klanten vaak stellen. Daardoor kunnen zoekmachines en AI-tools beter begrijpen wanneer jouw bedrijf relevant is.",
  },
  {
    id: 9,
    question: "Moet ik zelf technisch zijn om met Vedantix te werken?",
    answer:
      "Nee. Wij leggen alles in gewone taal uit. Bij een abonnement blijven wij je website verzorgen. Kies je een eenmalige website, dan kun je later losse hulp of een vooruitbetaald Website Online-pakket toevoegen.",
  },
  {
    id: 10,
    question: "Hoe kan ik starten met Vedantix?",
    answer:
      "Je kunt starten door contact op te nemen via WhatsApp of het contactformulier. Daarna worden je wensen besproken, ontvang je een voorstel en kan de bouw van je website snel worden gestart.",
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
        title="FAQ | Veelgestelde vragen over websites | Vedantix"
        description="Bekijk de veelgestelde vragen van Vedantix over prijzen, abonnementen, oplevering, wijzigingen, support en het laten maken van een website."
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
              Hier vind je duidelijke antwoorden op vragen over prijzen,
              oplevering, abonnementen, support en het laten maken van een
              website bij Vedantix.
            </p>
          </div>
        </header>

        <main className="faq-content">
          <div className="faq-shell">
            <section className="faq-intro" aria-labelledby="faq-overview-title">
              <h2 id="faq-overview-title">Antwoorden op de belangrijkste vragen</h2>
              <p>
                Twijfel je nog over kosten, snelheid of hoe het traject werkt?
                Hieronder staan de vragen die het vaakst worden gesteld door
                ondernemers die een professionele website willen laten maken.
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
                      <span className="faq-icon" aria-hidden="true">
                        ▼
                      </span>
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
              <h2 id="faq-cta-title">Klaar om je website te laten maken?</h2>
              <p>
                Wil je snel online met een professionele website voor jouw
                bedrijf? Neem contact op en bespreek vrijblijvend wat er
                mogelijk is voor jouw situatie.
              </p>

              <div className="faq-cta-actions">
                <Link className="faq-btn faq-btn-primary" to="/starters">
                  Bekijk pakketten
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
