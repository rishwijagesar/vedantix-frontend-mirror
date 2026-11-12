import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { localSeoCities, blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .clean-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .clean-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .clean-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .clean-hero-inner {
    max-width: 720px;
  }

  .clean-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .clean-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .clean-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 640px;
  }

  .clean-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .clean-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .clean-card h2 {
    color: #0f172a;
  }

  .clean-card p {
    color: #475569;
    line-height: 1.8;
  }

  .clean-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .clean-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .clean-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .clean-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .clean-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .clean-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .clean-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .clean-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .clean-form {
    display: grid;
    gap: 12px;
    max-width: 480px;
  }

  .clean-form-input {
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.95rem;
  }

  .clean-form-button {
    background: #111827;
    color: #fff;
    padding: 14px 18px;
    border-radius: 10px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .clean-pill-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .clean-pill-link {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .clean-blog-grid {
    display: grid;
    gap: 14px;
  }

  .clean-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .clean-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .clean-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .clean-bottom-cta {
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

  .clean-bottom-cta-inner {
    max-width: 620px;
  }

  .clean-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .clean-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .clean-bottom-cta-link {
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
    .clean-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .clean-page-shell {
      padding: 96px 16px 48px;
    }

    .clean-hero,
    .clean-card,
    .clean-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .clean-cta-row a {
      width: 100%;
      text-align: center;
    }

    .clean-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .clean-page-shell {
      padding: 90px 14px 40px;
    }

    .clean-hero h1 {
      font-size: 1.9rem !important;
    }

    .clean-card h2 {
      font-size: 1.25rem !important;
    }
  }
`;

export default function WebsiteSchoonmaakbedrijf() {
  const canonical = "https://vedantix.nl/website/schoonmaakbedrijf";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor schoonmaakbedrijven",
    slug: "website-schoonmaakbedrijf",
    description:
      "Vedantix maakt professionele websites voor schoonmaakbedrijven die meer aanvragen willen ontvangen en online vertrouwen willen opbouwen.",
    audienceType: "Schoonmaakbedrijven",
    serviceType: "Website development voor schoonmaakbedrijven",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    {
      name: "Website Schoonmaakbedrijf",
      url: canonical,
    },
  ]);

  const relatedCities = localSeoCities;
  const relatedBlogs = blogPosts
    .filter((post) => post.niche === "schoonmaakbedrijf")
    .slice(0, 3);

  return (
    <>
      <SEO
        title="Website laten maken voor schoonmaakbedrijven | Vedantix"
        description="Professionele website laten maken voor een schoonmaakbedrijf? Vedantix bouwt snelle websites die zorgen voor meer vertrouwen en meer aanvragen."
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="clean-page">
        <NavBar />

        <div className="clean-page-shell">
          <section className="clean-hero">
            <div className="clean-hero-inner">
              <p className="clean-eyebrow">Websites voor schoonmaakbedrijven</p>

              <h1 className="clean-hero-title">
                Website laten maken voor schoonmaakbedrijven
              </h1>

              <p className="clean-hero-text">
                Wil je als schoonmaakbedrijf meer aanvragen ontvangen en
                professioneler overkomen? Dan is een sterke website onmisbaar.
                Veel klanten zoeken online naar een betrouwbaar
                schoonmaakbedrijf voordat ze contact opnemen.
              </p>

              <div className="clean-cta-row">
                <a href="#analyse" className="clean-btn clean-btn-primary">
                  Vraag gratis analyse aan
                </a>

                <a
                  href="https://wa.me/31626219989"
                  target="_blank"
                  rel="noreferrer"
                  className="clean-btn clean-btn-secondary"
                >
                  Stuur direct een WhatsApp
                </a>
              </div>
            </div>
          </section>

          <section className="clean-content-grid">
            <div className="clean-card">
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "14px",
                  fontSize: "1.6rem",
                }}
              >
                Meer aanvragen via een professionele website
              </h2>

              <p>
                Een goede website maakt direct duidelijk welke
                schoonmaakdiensten je aanbiedt, voor welke klanten je werkt en
                hoe eenvoudig contact kan worden opgenomen. Zo verlaag je de
                drempel voor nieuwe aanvragen.
              </p>

              <p>
                Vedantix bouwt websites voor schoonmaakbedrijven die gericht
                zijn op vertrouwen, duidelijkheid en conversie. Niet alleen een
                nette uitstraling, maar ook een website die helpt om meer
                offerteaanvragen binnen te halen.
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
                <li>Duidelijk overzicht van jouw schoonmaakdiensten</li>
                <li>Professionele uitstraling en vertrouwen</li>
                <li>Contactformulier voor aanvragen</li>
                <li>Mobielvriendelijk design</li>
                <li>Supersnelle laadtijd</li>
                <li>Google Maps, contactgegevens en WhatsApp integratie</li>
              </ul>
            </div>

            <div className="clean-card" style={{ alignSelf: "start" }}>
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "1.25rem",
                }}
              >
                Waarom een website belangrijk is voor schoonmaakbedrijven
              </h2>

              <p>
                Klanten willen snel weten wat je doet, in welke regio je werkt
                en hoe ze je kunnen bereiken. Een verzorgde website helpt je
                betrouwbaarder en professioneler over te komen dan alleen een
                telefoonnummer of social media pagina.
              </p>

              <div className="clean-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Interieurreiniging, kantoorreiniging, glasbewassing,
                  opleverschoonmaak, specialistische reiniging en lokale
                  schoonmaakdiensten.
                </p>
              </div>
            </div>
          </section>

          <section
            id="analyse"
            className="clean-card"
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
              Wil je weten hoe jouw schoonmaakbedrijf online meer klanten kan
              aantrekken? Vraag een gratis analyse aan en ontvang gericht
              advies over zichtbaarheid, uitstraling en conversie.
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="clean-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="clean-form-input"
              />

              <input
                type="email"
                name="email"
                placeholder="E-mailadres"
                required
                className="clean-form-input"
              />

              <input
                type="text"
                name="business"
                placeholder="Bedrijfsnaam of type schoonmaak"
                className="clean-form-input"
              />

              <button type="submit" className="clean-form-button">
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

          <section className="clean-card" style={{ marginTop: "32px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Schoonmaakbedrijven per stad
            </h2>

            <p style={{ marginBottom: "18px" }}>
              Zoek je een pagina gericht op jouw regio? Bekijk ook onze lokale
              pagina’s voor schoonmaakbedrijven in verschillende steden.
            </p>

            <div className="clean-pill-links">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/schoonmaakbedrijf/${city.slug}`}
                  className="clean-pill-link"
                >
                  Schoonmaakbedrijf in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="clean-card" style={{ marginTop: "28px" }}>
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
              Gerelateerde blogs
            </h2>

            <div className="clean-blog-grid">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="clean-blog-link"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="clean-bottom-cta">
            <div className="clean-bottom-cta-inner">
              <h2 className="clean-bottom-cta-title">
                Liever direct contact?
              </h2>
              <p className="clean-bottom-cta-text">
                Stuur direct een WhatsApp-bericht en bespreek jouw wensen voor
                een website voor je schoonmaakbedrijf.
              </p>
            </div>

            <a
              href="https://wa.me/31626219989"
              target="_blank"
              rel="noreferrer"
              className="clean-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
