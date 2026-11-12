import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { localSeoCities, blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .restaurant-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .restaurant-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .restaurant-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .restaurant-hero-inner {
    max-width: 720px;
  }

  .restaurant-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .restaurant-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .restaurant-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 640px;
  }

  .restaurant-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .restaurant-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .restaurant-card h2 {
    color: #0f172a;
  }

  .restaurant-card p {
    color: #475569;
    line-height: 1.8;
  }

  .restaurant-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .restaurant-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .restaurant-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .restaurant-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .restaurant-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .restaurant-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .restaurant-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .restaurant-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .restaurant-form {
    display: grid;
    gap: 12px;
    max-width: 480px;
  }

  .restaurant-form-input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .restaurant-form-button {
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .restaurant-pill-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .restaurant-pill-link {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .restaurant-blog-grid {
    display: grid;
    gap: 14px;
  }

  .restaurant-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #c3d3ea;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .restaurant-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .restaurant-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .restaurant-bottom-cta {
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

  .restaurant-bottom-cta-inner {
    max-width: 620px;
  }

  .restaurant-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .restaurant-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .restaurant-bottom-cta-link {
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
    .restaurant-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .restaurant-page-shell {
      padding: 96px 16px 48px;
    }

    .restaurant-hero,
    .restaurant-card,
    .restaurant-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .restaurant-cta-row a {
      width: 100%;
      text-align: center;
    }

    .restaurant-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .restaurant-page-shell {
      padding: 90px 14px 40px;
    }

    .restaurant-hero h1 {
      font-size: 1.9rem !important;
    }

    .restaurant-card h2 {
      font-size: 1.25rem !important;
    }
  }
`;

export default function WebsiteRestaurant() {
  const canonical = "https://vedantix.nl/website/restaurant";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor restaurants",
    slug: "website-restaurant",
    description:
      "Vedantix maakt snelle en professionele websites voor restaurants met duidelijke menukaarten, contactinformatie en een sterke lokale uitstraling.",
    audienceType: "Restaurants",
    serviceType: "Website development voor restaurants",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Website Restaurant", url: canonical },
  ]);

  const relatedCities = localSeoCities;
  const relatedBlogs = blogPosts
    .filter((post) => post.niche === "restaurant")
    .slice(0, 3);

  return (
    <>
      <SEO
        title="Website laten maken voor restaurants | Vedantix"
        description="Professionele website laten maken voor restaurants? Vedantix bouwt snelle websites met menukaart, contactinformatie en sterke lokale zichtbaarheid."
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="restaurant-page">
        <NavBar />

        <div className="restaurant-page-shell">
          <section className="restaurant-hero">
            <div className="restaurant-hero-inner">
              <p className="restaurant-eyebrow">Websites voor restaurants</p>

              <h1 className="restaurant-hero-title">
                Website laten maken voor restaurants
              </h1>

              <p className="restaurant-hero-text">
                Wil je meer reserveringen en beter zichtbaar zijn in Google?
                Dan is een professionele restaurantwebsite essentieel. Gasten
                zoeken online naar menukaarten, openingstijden en
                contactinformatie voordat ze een keuze maken.
              </p>

              <div className="restaurant-cta-row">
                <a href="#analyse" className="restaurant-btn restaurant-btn-primary">
                  Vraag gratis analyse aan
                </a>

                <a
                  href="https://wa.me/31626219989"
                  target="_blank"
                  rel="noreferrer"
                  className="restaurant-btn restaurant-btn-secondary"
                >
                  Stuur direct een WhatsApp
                </a>
              </div>
            </div>
          </section>

          <section className="restaurant-content-grid">
            <div className="restaurant-card">
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "14px",
                  fontSize: "1.6rem",
                }}
              >
                Meer reserveringen via jouw website
              </h2>

              <p>
                Een sterke restaurantwebsite laat direct jouw sfeer, gerechten
                en praktische informatie zien. Dat helpt bezoekers sneller
                beslissen om contact op te nemen of een tafel te reserveren.
              </p>

              <p>
                Vedantix bouwt websites voor restaurants die gericht zijn op
                uitstraling, gebruiksgemak en lokale vindbaarheid. Geen losse
                pagina zonder richting, maar een website die vertrouwen opbouwt
                en gasten helpt om snel te reserveren of contact op te nemen.
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
                <li>Duidelijke menukaart of aanbod</li>
                <li>Openingstijden en locatie</li>
                <li>Contactformulier of reserveringsmogelijkheid</li>
                <li>Mobielvriendelijk design</li>
                <li>Supersnelle laadtijd</li>
                <li>Google Maps en WhatsApp integratie</li>
              </ul>
            </div>

            <div className="restaurant-card" style={{ alignSelf: "start" }}>
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "1.25rem",
                }}
              >
                Waarom een website belangrijk is voor restaurants
              </h2>

              <p>
                Veel potentiële gasten bekijken eerst online of jouw restaurant
                bij hen past. Zonder verzorgde website mis je kansen om
                vertrouwen te wekken en reserveringen binnen te halen.
              </p>

              <div className="restaurant-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Restaurants, bistro’s, eetcafés, lunchrooms, grillrooms,
                  bezorgrestaurants en lokale horecaondernemers.
                </p>
              </div>
            </div>
          </section>

          <section
            id="analyse"
            className="restaurant-card"
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
              Vraag gratis website analyse aan
            </h2>

            <p
              style={{
                maxWidth: 720,
                marginBottom: "24px",
              }}
            >
              Benieuwd hoe jouw restaurant online sterker kan presteren? Vraag
              een gratis analyse aan en ontdek waar kansen liggen op het gebied
              van uitstraling, vindbaarheid en reserveringen.
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="restaurant-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="restaurant-form-input"
              />

              <input
                type="email"
                name="email"
                placeholder="E-mailadres"
                required
                className="restaurant-form-input"
              />

              <input
                type="text"
                name="business"
                placeholder="Naam van je restaurant"
                className="restaurant-form-input"
              />

              <button type="submit" className="restaurant-form-button">
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

          <section className="restaurant-card" style={{ marginTop: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Restaurants per stad
            </h2>

            <p style={{ marginBottom: "18px" }}>
              Zoek je een pagina gericht op jouw regio? Bekijk ook onze lokale
              pagina’s voor restaurants in verschillende steden.
            </p>

            <div className="restaurant-pill-links">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/restaurant/${city.slug}`}
                  className="restaurant-pill-link"
                >
                  Restaurant in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="restaurant-card" style={{ marginTop: "28px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Gerelateerde blogs
            </h2>

            <div className="restaurant-blog-grid">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="restaurant-blog-link"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="restaurant-bottom-cta">
            <div className="restaurant-bottom-cta-inner">
              <h2 className="restaurant-bottom-cta-title">
                Liever direct contact?
              </h2>
              <p className="restaurant-bottom-cta-text">
                Stuur direct een WhatsApp-bericht en bespreek jouw wensen voor
                een restaurantwebsite.
              </p>
            </div>

            <a
              href="https://wa.me/31626219989"
              target="_blank"
              rel="noreferrer"
              className="restaurant-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
