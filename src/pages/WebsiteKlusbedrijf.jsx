import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { cities, blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .klus-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .klus-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .klus-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .klus-hero-inner {
    max-width: 760px;
  }

  .klus-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .klus-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .klus-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 680px;
  }

  .klus-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .klus-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .klus-card h2 {
    color: #0f172a;
  }

  .klus-card p {
    color: #475569;
    line-height: 1.8;
  }

  .klus-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .klus-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .klus-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .klus-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .klus-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .klus-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .klus-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .klus-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .klus-secondary-highlight-box {
    margin-top: 18px;
    padding: 16px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .klus-secondary-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .klus-secondary-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .klus-form {
    display: grid;
    gap: 12px;
    max-width: 480px;
  }

  .klus-form-input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .klus-form-button {
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .klus-pill-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .klus-pill-link {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .klus-blog-grid {
    display: grid;
    gap: 14px;
  }

  .klus-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .klus-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .klus-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .klus-bottom-cta {
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

  .klus-bottom-cta-inner {
    max-width: 620px;
  }

  .klus-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .klus-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .klus-bottom-cta-link {
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
    .klus-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .klus-page-shell {
      padding: 96px 16px 48px;
    }

    .klus-hero,
    .klus-card,
    .klus-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .klus-cta-row a {
      width: 100%;
      text-align: center;
    }

    .klus-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .klus-page-shell {
      padding: 90px 14px 40px;
    }

    .klus-hero h1 {
      font-size: 1.9rem !important;
    }

    .klus-card h2 {
      font-size: 1.25rem !important;
    }
  }
`;

export default function WebsiteKlusbedrijf() {
  const canonical = "https://vedantix.nl/website-klusbedrijf";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor klusbedrijven",
    slug: "website-klusbedrijf",
    description:
      "Vedantix maakt professionele, snelle en mobielvriendelijke websites voor klusbedrijven die meer offerteaanvragen willen ontvangen en lokaal beter gevonden willen worden.",
    audienceType: "Klusbedrijven",
    serviceType: "Website development voor klusbedrijven",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Website Klusbedrijf", url: canonical },
  ]);

  const pageTitle = "Website laten maken voor klusbedrijven | Vedantix";
  const pageDescription =
    "Professionele website laten maken voor een klusbedrijf? Vedantix bouwt snelle websites waarmee je beter zichtbaar wordt, vertrouwen opbouwt en meer aanvragen ontvangt.";

  const relatedCities = cities.slice(0, 6);
  const relatedBlogs = blogPosts
    .filter((post) => post.niche === "klusbedrijf")
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

      <div className="klus-page">
        <NavBar />

        <div className="klus-page-shell">
          <section className="klus-hero">
            <div className="klus-hero-inner">
              <p className="klus-eyebrow">Websites voor klusbedrijven</p>

              <h1 className="klus-hero-title">
                Website laten maken voor klusbedrijven
              </h1>

              <p className="klus-hero-text">
                Wil je als klusbedrijf meer opdrachten binnenhalen via Google en
                professioneler overkomen op nieuwe klanten? Dan heb je een
                website nodig die vertrouwen wekt, jouw werkzaamheden helder
                presenteert en bezoekers snel laat aanvragen.
              </p>

              <div className="klus-cta-row">
                <a href="#analyse" className="klus-btn klus-btn-primary">
                  Vraag gratis analyse aan
                </a>

                <a
                  href="https://wa.me/310626219989"
                  target="_blank"
                  rel="noreferrer"
                  className="klus-btn klus-btn-secondary"
                >
                  Stuur direct een WhatsApp
                </a>
              </div>
            </div>
          </section>

          <section className="klus-content-grid">
            <div className="klus-card">
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "14px",
                  fontSize: "1.6rem",
                }}
              >
                Meer offerteaanvragen via een professionele website
              </h2>

              <p>
                Veel mensen zoeken online naar een klusbedrijf, aannemer of
                vakman in de buurt. Op dat moment wil je direct een betrouwbare
                indruk maken. Een goede website laat zien wat je doet, welke
                projecten je hebt uitgevoerd en hoe klanten eenvoudig contact
                met je kunnen opnemen.
              </p>

              <p>
                Vedantix bouwt websites voor klusbedrijven die gericht zijn op
                zichtbaarheid, vertrouwen en conversie. Geen simpele online
                visitekaart, maar een website die helpt om nieuwe aanvragen
                binnen te halen.
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
                <li>Een duidelijke pagina met jouw diensten en werkzaamheden</li>
                <li>Een contactformulier voor offerteaanvragen</li>
                <li>Projecten of afgeronde klussen als referentie</li>
                <li>Mobielvriendelijk design voor bezoekers op smartphone</li>
                <li>Google Maps en contactgegevens</li>
                <li>Snelle laadtijd en sterke basis voor lokale SEO</li>
              </ul>
            </div>

            <div className="klus-card" style={{ alignSelf: "start" }}>
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "1.25rem",
                }}
              >
                Waarom een website belangrijk is voor klusbedrijven
              </h2>

              <p>
                Klanten vergelijken vaak meerdere bedrijven voordat ze contact
                opnemen. Zonder verzorgde website kiezen ze sneller voor een
                concurrent die online betrouwbaarder oogt en duidelijker laat
                zien wat hij doet.
              </p>

              <div className="klus-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Allround klusbedrijven, renovatiespecialisten, timmermannen,
                  montagebedrijven, onderhoudsbedrijven en zelfstandige vakmannen.
                </p>
              </div>

              <div className="klus-secondary-highlight-box">
                <strong>Vanaf</strong>
                <p>
                  Eenmalig vanaf €1.295 of beheerd vanaf €99 per maand plus bouw en inrichting.
                </p>
              </div>
            </div>
          </section>

          <section className="klus-card" style={{ marginTop: "28px" }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "14px",
                fontSize: "1.6rem",
              }}
            >
              Wat wij bouwen voor klusbedrijven
            </h2>

            <p>
              Onze websites voor klusbedrijven zijn ontworpen om werk op te
              leveren. Ze combineren een professionele uitstraling met duidelijke
              informatie, snelle contactmogelijkheden en een sterke basis voor
              lokale zichtbaarheid.
            </p>

            <ul>
              <li>Contactformulier voor nieuwe aanvragen</li>
              <li>Project showcase of afgeronde klussen</li>
              <li>SEO basisoptimalisatie</li>
              <li>Mobielvriendelijk design</li>
              <li>Google Maps integratie</li>
              <li>Snelle laadtijd</li>
              <li>Duidelijke call-to-actions voor bellen of WhatsApp</li>
            </ul>
          </section>

          <section
            id="analyse"
            className="klus-card"
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
              Wil je weten hoe jouw klusbedrijf online meer offerteaanvragen kan
              krijgen? Laat ons kijken naar jouw huidige zichtbaarheid en
              website. Je ontvangt vrijblijvend inzicht in verbeterpunten voor
              uitstraling, vindbaarheid en conversie.
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="klus-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="klus-form-input"
              />

              <input
                type="email"
                name="email"
                placeholder="E-mailadres"
                required
                className="klus-form-input"
              />

              <input
                type="text"
                name="business"
                placeholder="Naam klusbedrijf"
                className="klus-form-input"
              />

              <button type="submit" className="klus-form-button">
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

          <section className="klus-card" style={{ marginTop: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Klusbedrijven per stad
            </h2>

            <p style={{ marginBottom: "18px" }}>
              Zoek je een pagina gericht op jouw regio? Bekijk ook onze lokale
              pagina’s voor klusbedrijven in verschillende steden.
            </p>

            <div className="klus-pill-links">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/klusbedrijf/${city.slug}`}
                  className="klus-pill-link"
                >
                  Klusbedrijf in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="klus-card" style={{ marginTop: "28px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Gerelateerde blogs
            </h2>

            <div className="klus-blog-grid">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="klus-blog-link"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="klus-bottom-cta">
            <div className="klus-bottom-cta-inner">
              <h2 className="klus-bottom-cta-title">
                Liever direct contact?
              </h2>
              <p className="klus-bottom-cta-text">
                Stuur direct een WhatsApp-bericht en bespreek jouw wensen voor
                een website voor je klusbedrijf.
              </p>
            </div>

            <a
              href="https://wa.me/310626219989"
              target="_blank"
              rel="noreferrer"
              className="klus-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
