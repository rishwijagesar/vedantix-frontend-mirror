import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { localSeoCities, blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .fotograaf-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .fotograaf-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .fotograaf-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .fotograaf-hero-inner {
    max-width: 720px;
  }

  .fotograaf-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .fotograaf-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .fotograaf-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 640px;
  }

  .fotograaf-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .fotograaf-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .fotograaf-card h2 {
    color: #0f172a;
  }

  .fotograaf-card p {
    color: #475569;
    line-height: 1.8;
  }

  .fotograaf-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .fotograaf-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .fotograaf-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .fotograaf-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .fotograaf-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .fotograaf-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .fotograaf-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .fotograaf-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .fotograaf-form {
    display: grid;
    gap: 12px;
    max-width: 480px;
  }

  .fotograaf-form-input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .fotograaf-form-button {
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .fotograaf-pill-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .fotograaf-pill-link {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .fotograaf-blog-grid {
    display: grid;
    gap: 14px;
  }

  .fotograaf-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #c3d3ea;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .fotograaf-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .fotograaf-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .fotograaf-bottom-cta {
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

  .fotograaf-bottom-cta-inner {
    max-width: 620px;
  }

  .fotograaf-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .fotograaf-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .fotograaf-bottom-cta-link {
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
    .fotograaf-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .fotograaf-page-shell {
      padding: 96px 16px 48px;
    }

    .fotograaf-hero,
    .fotograaf-card,
    .fotograaf-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .fotograaf-cta-row a {
      width: 100%;
      text-align: center;
    }

    .fotograaf-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .fotograaf-page-shell {
      padding: 90px 14px 40px;
    }

    .fotograaf-hero h1 {
      font-size: 1.9rem !important;
    }

    .fotograaf-card h2 {
      font-size: 1.25rem !important;
    }
  }
`;

export default function WebsiteFotograaf() {
  const canonical = "https://vedantix.nl/website/fotograaf";

  const pageTitle = "Website laten maken voor fotografen | Vedantix";
  const pageDescription =
    "Professionele website laten maken voor fotografen? Vedantix bouwt snelle portfolio websites waarmee je meer zichtbaarheid, vertrouwen en aanvragen krijgt.";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor fotografen",
    slug: "website-fotograaf",
    description:
      "Vedantix maakt professionele, snelle en mobielvriendelijke websites voor fotografen die meer boekingen willen ontvangen via hun portfolio en online zichtbaarheid.",
    audienceType: "Fotografen",
    serviceType: "Website development voor fotografen",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Website Fotograaf", url: canonical },
  ]);

  const relatedCities = localSeoCities;
  const relatedBlogs = blogPosts.filter((post) => post.niche === "fotograaf").slice(0, 3);

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="fotograaf-page">
        <NavBar />

        <div className="fotograaf-page-shell">
          <section className="fotograaf-hero">
            <div className="fotograaf-hero-inner">
              <p className="fotograaf-eyebrow">Websites voor fotografen</p>

              <h1 className="fotograaf-hero-title">
                Website laten maken voor fotografen
              </h1>

              <p className="fotograaf-hero-text">
                Wil je meer shoots boeken en professioneler overkomen als
                fotograaf? Dan heb je een website nodig die jouw portfolio sterk
                presenteert, vertrouwen opbouwt en bezoekers overtuigt om
                contact op te nemen.
              </p>

              <div className="fotograaf-cta-row">
                <a href="#analyse" className="fotograaf-btn fotograaf-btn-primary">
                  Vraag gratis analyse aan
                </a>

                <a
                  href="https://wa.me/31626219989"
                  target="_blank"
                  rel="noreferrer"
                  className="fotograaf-btn fotograaf-btn-secondary"
                >
                  Stuur direct een WhatsApp
                </a>
              </div>
            </div>
          </section>

          <section className="fotograaf-content-grid">
            <div className="fotograaf-card">
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "14px",
                  fontSize: "1.6rem",
                }}
              >
                Meer klanten via een sterke portfolio website
              </h2>

              <p>
                Veel mensen zoeken online naar een fotograaf voor een bruiloft,
                portretshoot, zakelijke reportage of evenement. Op dat moment
                wil je direct professioneel overkomen. Een goede website laat
                niet alleen je werk zien, maar maakt ook duidelijk waarom iemand
                voor jou moet kiezen.
              </p>

              <p>
                Vedantix bouwt websites voor fotografen die gericht zijn op
                presentatie, snelheid en conversie. Jouw beelden krijgen de
                ruimte, terwijl de website bezoekers helpt om snel contact op te
                nemen of een aanvraag te doen.
              </p>

              <h2
                style={{
                  marginTop: "30px",
                  marginBottom: "14px",
                  fontSize: "1.35rem",
                }}
              >
                Wat jouw website minimaal moet kunnen
              </h2>

              <ul>
                <li>Een professionele portfolio pagina met jouw beste werk</li>
                <li>Een duidelijke dienstenpagina per type fotografie</li>
                <li>Een contactformulier voor nieuwe aanvragen</li>
                <li>Mobielvriendelijk design voor bezoekers op smartphone</li>
                <li>Snelle laadtijd voor betere gebruikservaring</li>
                <li>WhatsApp integratie voor laagdrempelig contact</li>
              </ul>
            </div>

            <div className="fotograaf-card" style={{ alignSelf: "start" }}>
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "1.25rem",
                }}
              >
                Waarom fotografen een website nodig hebben
              </h2>

              <p>
                Social media is nuttig, maar meestal niet genoeg. Een eigen
                website geeft meer vertrouwen, betere vindbaarheid in Google en
                een centrale plek waar klanten jouw stijl, werkwijze en
                contactinformatie direct kunnen vinden.
              </p>

              <div className="fotograaf-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Bruiloftsfotografen, portretfotografen, familiefotografen,
                  vastgoedfotografen, eventfotografen en zakelijke fotografen.
                </p>
              </div>
            </div>
          </section>

          <section
            id="analyse"
            className="fotograaf-card"
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
              Wil je weten hoe jouw fotografiebedrijf online sterker kan
              presteren? Laat ons kijken naar jouw huidige situatie. Je ontvangt
              vrijblijvend inzicht in verbeterpunten voor zichtbaarheid,
              uitstraling en conversie.
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="fotograaf-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="fotograaf-form-input"
              />

              <input
                type="email"
                name="email"
                placeholder="E-mailadres"
                required
                className="fotograaf-form-input"
              />

              <input
                type="text"
                name="business"
                placeholder="Type fotografie (bijv. bruiloft, portret, events)"
                className="fotograaf-form-input"
              />

              <button type="submit" className="fotograaf-form-button">
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

          <section className="fotograaf-card" style={{ marginTop: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Fotografen per stad
            </h2>

            <p style={{ marginBottom: "18px" }}>
              Zoek je een pagina gericht op jouw regio? Bekijk ook onze lokale
              pagina’s voor fotografen in verschillende steden.
            </p>

            <div className="fotograaf-pill-links">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/fotograaf/${city.slug}`}
                  className="fotograaf-pill-link"
                >
                  Fotograaf in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="fotograaf-card" style={{ marginTop: "28px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Gerelateerde blogs
            </h2>

            <div className="fotograaf-blog-grid">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="fotograaf-blog-link"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="fotograaf-bottom-cta">
            <div className="fotograaf-bottom-cta-inner">
              <h2 className="fotograaf-bottom-cta-title">
                Liever direct contact?
              </h2>
              <p className="fotograaf-bottom-cta-text">
                Stuur direct een WhatsApp-bericht en bespreek jouw wensen voor
                een fotografie website.
              </p>
            </div>

            <a
              href="https://wa.me/31626219989"
              target="_blank"
              rel="noreferrer"
              className="fotograaf-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
