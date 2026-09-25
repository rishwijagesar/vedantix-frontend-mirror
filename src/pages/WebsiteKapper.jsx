import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { localSeoCities, blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .kapper-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .kapper-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .kapper-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .kapper-hero-inner {
    max-width: 720px;
  }

  .kapper-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .kapper-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .kapper-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 640px;
  }

  .kapper-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .kapper-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .kapper-card h2 {
    color: #0f172a;
  }

  .kapper-card p {
    color: #475569;
    line-height: 1.8;
  }

  .kapper-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .kapper-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .kapper-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .kapper-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .kapper-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .kapper-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .kapper-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .kapper-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .kapper-form {
    display: grid;
    gap: 12px;
    max-width: 480px;
  }

  .kapper-form-input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .kapper-form-button {
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .kapper-pill-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .kapper-pill-link {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .kapper-blog-grid {
    display: grid;
    gap: 14px;
  }

  .kapper-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .kapper-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .kapper-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .kapper-bottom-cta {
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

  .kapper-bottom-cta-inner {
    max-width: 620px;
  }

  .kapper-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .kapper-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .kapper-bottom-cta-link {
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
    .kapper-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .kapper-page-shell {
      padding: 96px 16px 48px;
    }

    .kapper-hero,
    .kapper-card,
    .kapper-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .kapper-cta-row a {
      width: 100%;
      text-align: center;
    }

    .kapper-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .kapper-page-shell {
      padding: 90px 14px 40px;
    }

    .kapper-hero h1 {
      font-size: 1.9rem !important;
    }

    .kapper-card h2 {
      font-size: 1.25rem !important;
    }
  }
`;

export default function WebsiteKapper() {
  const canonical = "https://vedantix.nl/website-kapper";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor kappers",
    slug: "website-kapper",
    description:
      "Vedantix maakt professionele, snelle en mobielvriendelijke websites voor kappers die lokaal beter gevonden willen worden en meer afspraken willen ontvangen.",
    audienceType: "Kappers",
    serviceType: "Website development voor kappers",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Website Kapper", url: canonical },
  ]);

  const relatedCities = localSeoCities;
  const relatedBlogs = blogPosts.filter((post) => post.niche === "kapper").slice(0, 3);

  return (
    <>
      <SEO
        title="Website laten maken voor kappers | Vedantix"
        description="Professionele website laten maken voor kappers? Vedantix bouwt snelle websites waarmee je lokaal beter gevonden wordt en meer afspraken krijgt."
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="kapper-page">
        <NavBar />

        <div className="kapper-page-shell">
          <section className="kapper-hero">
            <div className="kapper-hero-inner">
              <p className="kapper-eyebrow">Websites voor kappers</p>

              <h1 className="kapper-hero-title">
                Website laten maken voor kappers
              </h1>

              <p className="kapper-hero-text">
                Wil je als kapper meer afspraken via Google en je website
                ontvangen? Dan is een professionele website onmisbaar. Veel
                mensen zoeken online naar een kapper in de buurt. Zonder sterke
                website loop je klanten mis.
              </p>

              <div className="kapper-cta-row">
                <a href="#analyse" className="kapper-btn kapper-btn-primary">
                  Vraag gratis analyse aan
                </a>

                <a
                  href="https://wa.me/310626219989"
                  target="_blank"
                  rel="noreferrer"
                  className="kapper-btn kapper-btn-secondary"
                >
                  Stuur direct een WhatsApp
                </a>
              </div>
            </div>
          </section>

          <section className="kapper-content-grid">
            <div className="kapper-card">
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "14px",
                  fontSize: "1.6rem",
                }}
              >
                Meer afspraken via een professionele website
              </h2>

              <p>
                Een goede kapperswebsite laat direct zien wie je bent, welke
                behandelingen je aanbiedt en hoe klanten eenvoudig een afspraak
                kunnen maken. Zo straal je vertrouwen uit en verhoog je de kans
                op nieuwe boekingen.
              </p>

              <p>
                Vedantix bouwt websites voor kappers die gericht zijn op lokale
                vindbaarheid, snelheid en conversie. Bezoekers moeten niet
                twijfelen, maar direct zien dat jouw salon professioneel is en
                makkelijk bereikbaar.
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
                <li>Duidelijke behandelingen en tarieven</li>
                <li>Afspraakmogelijkheden of een contactformulier</li>
                <li>Mobielvriendelijk design</li>
                <li>Snelle laadtijd</li>
                <li>WhatsApp integratie</li>
                <li>Een professionele uitstraling die vertrouwen geeft</li>
              </ul>
            </div>

            <div className="kapper-card" style={{ alignSelf: "start" }}>
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "1.25rem",
                }}
              >
                Waarom een website belangrijk is voor kappers
              </h2>

              <p>
                Klanten vergelijken vaak meerdere salons voordat ze kiezen. Een
                verzorgde website helpt om professioneler over te komen en
                sneller vertrouwen op te bouwen dan alleen een social media
                profiel.
              </p>

              <div className="kapper-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Barbershops, herensalons, damessalons, allround kapsalons,
                  thuiskappers en gespecialiseerde haarstudio’s.
                </p>
              </div>
            </div>
          </section>

          <section
            id="analyse"
            className="kapper-card"
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
              Benieuwd hoe jouw salon online meer zichtbaar kan worden? Vraag
              een gratis analyse aan en ontdek wat er beter kan op het gebied
              van uitstraling, vindbaarheid en conversie.
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="kapper-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="kapper-form-input"
              />

              <input
                type="email"
                name="email"
                placeholder="E-mailadres"
                required
                className="kapper-form-input"
              />

              <input
                type="text"
                name="business"
                placeholder="Naam van je salon"
                className="kapper-form-input"
              />

              <button type="submit" className="kapper-form-button">
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

          <section className="kapper-card" style={{ marginTop: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Kappers per stad
            </h2>

            <p style={{ marginBottom: "18px" }}>
              Zoek je een pagina gericht op jouw regio? Bekijk ook onze lokale
              pagina’s voor kappers in verschillende steden.
            </p>

            <div className="kapper-pill-links">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/kapper/${city.slug}`}
                  className="kapper-pill-link"
                >
                  Kapper in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="kapper-card" style={{ marginTop: "28px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Gerelateerde blogs
            </h2>

            <div className="kapper-blog-grid">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="kapper-blog-link"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="kapper-bottom-cta">
            <div className="kapper-bottom-cta-inner">
              <h2 className="kapper-bottom-cta-title">
                Liever direct contact?
              </h2>
              <p className="kapper-bottom-cta-text">
                Stuur direct een WhatsApp-bericht en bespreek jouw wensen voor
                een kapperswebsite.
              </p>
            </div>

            <a
              href="https://wa.me/310626219989"
              target="_blank"
              rel="noreferrer"
              className="kapper-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
