import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { cities, blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .salon-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .salon-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .salon-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .salon-hero-inner {
    max-width: 760px;
  }

  .salon-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .salon-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .salon-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 680px;
  }

  .salon-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .salon-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .salon-card h2 {
    color: #0f172a;
  }

  .salon-card p {
    color: #475569;
    line-height: 1.8;
  }

  .salon-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .salon-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .salon-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .salon-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .salon-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .salon-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .salon-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .salon-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .salon-secondary-highlight-box {
    margin-top: 18px;
    padding: 16px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .salon-secondary-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .salon-secondary-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .salon-form {
    display: grid;
    gap: 12px;
    max-width: 480px;
  }

  .salon-form-input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .salon-form-button {
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .salon-pill-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .salon-pill-link {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .salon-blog-grid {
    display: grid;
    gap: 14px;
  }

  .salon-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .salon-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .salon-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .salon-bottom-cta {
    margin-top: 28px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    border-radius: 18px;
    padding: 28px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .salon-bottom-cta-inner {
    max-width: 620px;
  }

  .salon-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .salon-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .salon-bottom-cta-link {
    display: inline-block;
    background: #fff;
    color: #15803d;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .salon-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .salon-page-shell {
      padding: 96px 16px 48px;
    }

    .salon-hero,
    .salon-card,
    .salon-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .salon-cta-row a {
      width: 100%;
      text-align: center;
    }

    .salon-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .salon-page-shell {
      padding: 90px 14px 40px;
    }

    .salon-hero h1 {
      font-size: 1.9rem !important;
    }

    .salon-card h2 {
      font-size: 1.25rem !important;
    }
  }
`;

export default function WebsiteSalon() {
  const canonical = "https://vedantix.nl/website-salon";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor salons",
    slug: "website-salon",
    description:
      "Vedantix maakt professionele, snelle en mobielvriendelijke websites voor salons die meer boekingen willen ontvangen en online meer vertrouwen willen opbouwen.",
    audienceType: "Salons",
    serviceType: "Website development voor salons",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Website Salon", url: canonical },
  ]);

  const pageTitle = "Website laten maken voor salons | Vedantix";
  const pageDescription =
    "Professionele website laten maken voor een salon? Vedantix bouwt snelle websites waarmee je meer boekingen ontvangt, vertrouwen opbouwt en beter zichtbaar wordt.";

  const relatedCities = cities.slice(0, 6);
  const relatedBlogs = blogPosts
    .filter((post) => post.niche === "salon")
    .slice(0, 3);

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="salon-page">
        <NavBar />

        <div className="salon-page-shell">
          <section className="salon-hero">
            <div className="salon-hero-inner">
              <p className="salon-eyebrow">Websites voor salons</p>

              <h1 className="salon-hero-title">
                Website laten maken voor salons
              </h1>

              <p className="salon-hero-text">
                Wil je meer boekingen voor jouw schoonheidssalon, nagelstudio of
                beautysalon? Dan heb je een website nodig die vertrouwen
                uitstraalt, jouw behandelingen duidelijk presenteert en bezoekers
                eenvoudig laat contact opnemen of een afspraak aanvragen.
              </p>

              <div className="salon-cta-row">
                <a href="#analyse" className="salon-btn salon-btn-primary">
                  Vraag gratis analyse aan
                </a>

                <a
                  href="https://wa.me/310626219989"
                  target="_blank"
                  rel="noreferrer"
                  className="salon-btn salon-btn-secondary"
                >
                  Stuur direct een WhatsApp
                </a>
              </div>
            </div>
          </section>

          <section className="salon-content-grid">
            <div className="salon-card">
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "14px",
                  fontSize: "1.6rem",
                }}
              >
                Meer boekingen via een professionele salonwebsite
              </h2>

              <p>
                Veel klanten zoeken online naar een salon in de buurt voordat ze
                een afspraak maken. Op dat moment wil je direct een verzorgde en
                professionele indruk maken. Een goede website laat zien welke
                behandelingen je aanbiedt, wat jouw stijl is en hoe eenvoudig
                klanten een afspraak kunnen aanvragen.
              </p>

              <p>
                Vedantix bouwt websites voor salons die gericht zijn op
                uitstraling, gebruiksgemak en conversie. Zo krijgt jouw salon
                een website die niet alleen mooi oogt, maar ook helpt om meer
                aanvragen en boekingen binnen te halen.
              </p>

              <h2
                style={{
                  marginTop: "30px",
                  marginBottom: "14px",
                  fontSize: "1.35rem",
                }}
              >
                Wat jouw website minimaal moet bevatten
              </h2>

              <ul>
                <li>Een overzichtelijke pagina met behandelingen en tarieven</li>
                <li>Een duidelijke boekingsknop of afspraakverzoek</li>
                <li>Mobielvriendelijk design voor bezoekers op smartphone</li>
                <li>WhatsApp integratie voor snel contact</li>
                <li>Google Maps en contactgegevens</li>
                <li>Snelle laadtijd en sterke basis voor lokale vindbaarheid</li>
              </ul>
            </div>

            <div className="salon-card" style={{ alignSelf: "start" }}>
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "1.25rem",
                }}
              >
                Waarom een website belangrijk is voor salons
              </h2>

              <p>
                Klanten vergelijken vaak meerdere salons voordat ze kiezen.
                Zonder professionele website kiezen ze sneller voor een
                concurrent die online verzorgder oogt en makkelijker te vinden
                is.
              </p>

              <div className="salon-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Schoonheidssalons, nagelstudio’s, beautysalons, brow bars,
                  lash salons en huidverzorgingsstudio’s.
                </p>
              </div>

              <div className="salon-secondary-highlight-box">
                <strong>Vanaf</strong>
                <p>
                  Eenmalig vanaf €399. Geen verplicht maandabonnement. Hosting vanaf €30 per jaar en zakelijke e-mail vanaf €30 per jaar per mailbox.
                </p>
              </div>
            </div>
          </section>

          <section className="salon-card" style={{ marginTop: "28px" }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "14px",
                fontSize: "1.6rem",
              }}
            >
              Wat wij bouwen voor salons
            </h2>

            <p>
              Onze websites voor salons zijn ontworpen om meer afspraken op te
              leveren. Ze combineren een verzorgde uitstraling met duidelijke
              informatie, snelle contactmogelijkheden en een prettige ervaring
              op mobiel en desktop.
            </p>

            <ul>
              <li>Mobielvriendelijke website</li>
              <li>Boekingsknop of afspraakverzoek</li>
              <li>WhatsApp integratie</li>
              <li>Google Maps integratie</li>
              <li>Snelle laadtijd</li>
              <li>Duidelijke call-to-actions voor contact en afspraken</li>
            </ul>
          </section>

          <section
            id="analyse"
            className="salon-card"
            style={{
              scrollMarginTop: "100px",
              marginTop: "28px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "12px",
                fontSize: "1.6rem",
              }}
            >
              Vraag gratis een website analyse aan
            </h2>

            <p
              style={{
                maxWidth: 720,
                marginBottom: "24px",
              }}
            >
              Wil je weten hoe jouw salon online meer boekingen kan krijgen?
              Laat ons kijken naar jouw huidige website of online zichtbaarheid.
              Je ontvangt vrijblijvend inzicht in verbeterpunten voor
              uitstraling, vindbaarheid en conversie.
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="salon-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="salon-form-input"
              />

              <input
                type="email"
                name="email"
                placeholder="E-mailadres"
                required
                className="salon-form-input"
              />

              <input
                type="text"
                name="business"
                placeholder="Naam salon"
                className="salon-form-input"
              />

              <button type="submit" className="salon-form-button">
                Gratis analyse aanvragen →
              </button>
            </form>

            <p
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                marginTop: "12px",
                marginBottom: 0,
              }}
            >
              Reactie binnen 24 uur • Vrijblijvend • 100% gratis
            </p>
          </section>

          <section className="salon-card" style={{ marginTop: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Salons per stad
            </h2>

            <p style={{ marginBottom: "18px" }}>
              Zoek je een pagina gericht op jouw regio? Bekijk ook onze lokale
              pagina’s voor salons in verschillende steden.
            </p>

            <div className="salon-pill-links">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/salon/${city.slug}`}
                  className="salon-pill-link"
                >
                  Salon in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="salon-card" style={{ marginTop: "28px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Gerelateerde blogs
            </h2>

            <div className="salon-blog-grid">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="salon-blog-link"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="salon-bottom-cta">
            <div className="salon-bottom-cta-inner">
              <h2 className="salon-bottom-cta-title">
                Liever direct contact?
              </h2>
              <p className="salon-bottom-cta-text">
                Stuur direct een WhatsApp-bericht en bespreek jouw wensen voor
                een website voor je salon.
              </p>
            </div>

            <a
              href="https://wa.me/310626219989"
              target="_blank"
              rel="noreferrer"
              className="salon-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
