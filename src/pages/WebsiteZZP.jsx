import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createServiceSchema, createBreadcrumbSchema } from "../utils/schema";
import { blogPosts } from "../data/seoData";

const PAGE_STYLES = `
  * { box-sizing: border-box; }

  .zzp-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .zzp-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 110px 20px 60px;
  }

  .zzp-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .zzp-hero-inner {
    max-width: 720px;
  }

  .zzp-eyebrow {
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #93c5fd;
  }

  .zzp-hero-title {
    margin: 0 0 18px;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .zzp-hero-text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255,255,255,0.82);
    max-width: 640px;
  }

  .zzp-content-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.9fr;
    gap: 28px;
    margin-top: 32px;
  }

  .zzp-card {
    background: #fff;
    border-radius: 18px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .zzp-card h2 {
    color: #0f172a;
  }

  .zzp-card p {
    color: #475569;
    line-height: 1.8;
  }

  .zzp-card ul {
    padding-left: 20px;
    color: #334155;
    line-height: 1.9;
    margin-bottom: 0;
  }

  .zzp-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .zzp-btn {
    display: inline-block;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .zzp-btn-primary {
    background: #2563eb;
    color: #fff;
  }

  .zzp-btn-secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
  }

  .zzp-highlight-box {
    margin-top: 20px;
    padding: 16px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .zzp-highlight-box strong {
    display: block;
    margin-bottom: 8px;
  }

  .zzp-highlight-box p {
    margin: 0;
    color: #334155;
    line-height: 1.7;
  }

  .zzp-blog-grid {
    display: grid;
    gap: 14px;
  }

  .zzp-blog-link {
    display: block;
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .zzp-blog-link strong {
    display: block;
    margin-bottom: 6px;
  }

  .zzp-blog-link span {
    color: #6b7280;
    line-height: 1.6;
  }

  .zzp-bottom-cta {
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

  .zzp-bottom-cta-inner {
    max-width: 620px;
  }

  .zzp-bottom-cta-title {
    margin: 0 0 10px;
    font-size: 1.4rem;
  }

  .zzp-bottom-cta-text {
    margin: 0;
    color: rgba(255,255,255,0.9);
    line-height: 1.7;
  }

  .zzp-bottom-cta-link {
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
    .zzp-content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .zzp-page-shell {
      padding: 96px 16px 48px;
    }

    .zzp-hero,
    .zzp-card,
    .zzp-bottom-cta {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .zzp-cta-row a,
    .zzp-bottom-cta a {
      width: 100%;
      text-align: center;
    }
  }
`;

export default function WebsiteZZP() {
  const canonical = "https://vedantix.nl/website-zzp";

  const serviceSchema = createServiceSchema({
    name: "Website laten maken voor zzp'ers",
    slug: "website-zzp",
    description:
      "Vedantix maakt professionele websites voor zzp'ers die meer vertrouwen willen uitstralen en makkelijker nieuwe klanten willen aantrekken.",
    audienceType: "ZZP'ers",
    serviceType: "Website development voor zzp'ers",
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Website ZZP", url: canonical },
  ]);

  const relatedBlogs = blogPosts.filter((post) => post.niche === "zzp").slice(0, 3);

  return (
    <>
      <SEO
        title="Website laten maken voor zzp'ers | Vedantix"
        description="Professionele website laten maken voor zzp'ers? Vedantix bouwt websites die vertrouwen geven en helpen om meer klanten aan te trekken."
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{PAGE_STYLES}</style>

      <div className="zzp-page">
        <NavBar />

        <div className="zzp-page-shell">
          <section className="zzp-hero">
            <div className="zzp-hero-inner">
              <p className="zzp-eyebrow">Websites voor zzp'ers</p>

              <h1 className="zzp-hero-title">
                Website laten maken voor zzp'ers
              </h1>

              <p className="zzp-hero-text">
                Als zzp’er is je website vaak je eerste indruk. Klanten willen
                snel zien wat je doet, waarom jij betrouwbaar bent en hoe ze je
                kunnen bereiken. Zonder sterke website laat je onnodig kansen liggen.
              </p>

              <div className="zzp-cta-row">
                <a href="https://wa.me/31626219989" target="_blank" rel="noreferrer" className="zzp-btn zzp-btn-primary">
                  Plan gratis kennismaking
                </a>

                <a href="/" className="zzp-btn zzp-btn-secondary">
                  Terug naar home
                </a>
              </div>

            </div>
          </section>

          <section className="zzp-content-grid">
            <div className="zzp-card">
              <h2 style={{ marginTop: 0, marginBottom: "14px", fontSize: "1.6rem" }}>
                Meer vertrouwen en meer leads via je website
              </h2>

              <p>
                Voor veel zzp’ers is een website niet alleen een online visitekaartje,
                maar een manier om professioneler over te komen en sneller nieuwe klanten aan te trekken.
              </p>

              <p>
                Vedantix bouwt websites voor zzp’ers die gericht zijn op duidelijkheid,
                vertrouwen en actie. Bezoekers moeten direct begrijpen wat je doet en hoe ze je kunnen inschakelen.
              </p>

              <h2 style={{ marginTop: "30px", marginBottom: "14px", fontSize: "1.35rem" }}>
                Wat jouw website minimaal moet kunnen
              </h2>

              <ul>
                <li>Duidelijk aanbod of dienstenoverzicht</li>
                <li>Sterke eerste indruk en professionele uitstraling</li>
                <li>Contact via WhatsApp, bellen of formulier</li>
                <li>Mobielvriendelijk design</li>
                <li>Snelle laadtijd</li>
                <li>Structuur die gericht is op leads en aanvragen</li>
              </ul>
            </div>

            <div className="zzp-card" style={{ alignSelf: "start" }}>
              <h2 style={{ marginTop: 0, marginBottom: "12px", fontSize: "1.25rem" }}>
                Waarom dit belangrijk is voor zzp’ers
              </h2>

              <p>
                Veel zelfstandigen zijn afhankelijk van via-via, netwerk of losse social media kanalen.
                Een goede website zorgt voor meer rust, meer vertrouwen en een sterkere online basis.
              </p>

              <div className="zzp-highlight-box">
                <strong>Geschikt voor onder andere:</strong>
                <p>
                  Coaches, consultants, marketeers, developers, creatieven, administratieve dienstverleners
                  en andere zelfstandigen die professioneler zichtbaar willen zijn.
                </p>
              </div>
            </div>
          </section>

          {relatedBlogs.length > 0 && (
            <section className="zzp-card" style={{ marginTop: "28px" }}>
              <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.35rem" }}>
                Gerelateerde blogs
              </h2>

              <div className="zzp-blog-grid">
                {relatedBlogs.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="zzp-blog-link"
                  >
                    <strong>{post.title}</strong>
                    <span>{post.intro}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="zzp-bottom-cta">
            <div className="zzp-bottom-cta-inner">
              <h2 className="zzp-bottom-cta-title">
                Klaar om professioneler zichtbaar te worden?
              </h2>
              <p className="zzp-bottom-cta-text">
                Plan een vrijblijvende kennismaking en ontdek welk pakket het beste past bij jouw bedrijf.
              </p>
            </div>

            <a
              href="https://wa.me/31626219989"
              target="_blank"
              rel="noreferrer"
              className="zzp-bottom-cta-link"
            >
              WhatsApp Vedantix →
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
