import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, Navigate, useParams } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { industries, localSeoCities, blogPosts } from "../data/seoData";
import {
  createBreadcrumbSchema,
  createFAQSchema,
  createServiceSchema,
} from "../utils/schema";

const INDUSTRY_STYLES = `
  * { box-sizing: border-box; }

  .industry-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #edf4fb 100%);
    color: #0f172a;
  }

  .industry-shell {
    width: min(1140px, calc(100% - 32px));
    margin: 0 auto;
    padding: 116px 0 76px;
  }

  .industry-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 18px;
    color: #64748b;
    font-size: 0.88rem;
  }

  .industry-breadcrumb a {
    color: #475569;
    text-decoration: none;
  }

  .industry-breadcrumb a:hover {
    color: #1d4ed8;
  }

  .industry-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
    gap: 26px;
    align-items: stretch;
  }

  .industry-panel {
    background: rgba(255,255,255,0.94);
    border: 1px solid #c3d3ea;
    border-radius: 22px;
    box-shadow: 0 22px 52px rgba(15,23,42,0.08);
    padding: 34px;
  }

  .industry-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 18px;
  }

  .industry-hero h1 {
    font-size: clamp(2.35rem, 4.7vw, 4.55rem);
    line-height: 0.98;
    letter-spacing: -0.045em;
    margin: 0 0 18px;
  }

  .industry-lead {
    color: #475569;
    line-height: 1.75;
    font-size: 1.07rem;
    margin: 0 0 24px;
    max-width: 700px;
  }

  .industry-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .industry-primary,
  .industry-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 18px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 850;
    font-size: 0.92rem;
  }

  .industry-primary {
    background: #0f172a;
    color: #fff;
    box-shadow: 0 16px 32px rgba(15,23,42,0.14);
  }

  .industry-secondary {
    background: #fff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
  }

  .industry-proof {
    background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 100%);
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  .industry-proof::after {
    content: "";
    position: absolute;
    width: 240px;
    height: 240px;
    right: -90px;
    bottom: -100px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(96,165,250,0.35), transparent 68%);
  }

  .industry-proof h2 {
    color: #fff;
    margin: 0 0 14px;
    font-size: 1.8rem;
    line-height: 1.1;
  }

  .industry-proof p {
    color: rgba(255,255,255,0.76);
    line-height: 1.75;
    position: relative;
    z-index: 1;
  }

  .industry-service-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 22px;
    position: relative;
    z-index: 1;
  }

  .industry-service-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 12px;
    padding: 11px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.13);
    color: rgba(255,255,255,0.9);
    font-weight: 750;
    font-size: 0.9rem;
  }

  .industry-section {
    margin-top: 30px;
  }

  .industry-section-header {
    max-width: 760px;
    margin-bottom: 20px;
  }

  .industry-section-header.center {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  .industry-label {
    color: #2563eb;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .industry-section h2 {
    font-size: clamp(1.85rem, 3.5vw, 3rem);
    line-height: 1.04;
    letter-spacing: -0.035em;
    margin: 0 0 12px;
  }

  .industry-section p {
    color: #64748b;
    line-height: 1.75;
    margin: 0;
  }

  .industry-card-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .industry-card {
    background: #fff;
    border: 1px solid #c3d3ea;
    border-radius: 18px;
    padding: 22px;
    box-shadow: 0 16px 34px rgba(15,23,42,0.05);
  }

  .industry-card-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #2563eb;
    background: #eff6ff;
    margin-bottom: 14px;
  }

  .industry-card h3 {
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .industry-compare {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .industry-list {
    list-style: none;
    padding: 0;
    margin: 20px 0 0;
    display: grid;
    gap: 12px;
  }

  .industry-list li {
    display: grid;
    grid-template-columns: 22px 1fr;
    gap: 10px;
    color: #334155;
    line-height: 1.55;
  }

  .industry-list svg {
    color: #10b981;
    margin-top: 2px;
  }

  .industry-city-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .industry-city-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #c3d3ea;
    color: #0f172a;
    text-decoration: none;
    padding: 10px 14px;
    font-weight: 800;
    box-shadow: 0 10px 22px rgba(15,23,42,0.04);
  }

  .industry-faq-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .industry-faq {
    background: #fff;
    border: 1px solid #c3d3ea;
    border-radius: 16px;
    padding: 20px;
  }

  .industry-faq h3 {
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .industry-related {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .industry-related a {
    display: block;
    text-decoration: none;
    color: #0f172a;
    background: #fff;
    border: 1px solid #c3d3ea;
    border-radius: 16px;
    padding: 18px;
  }

  .industry-bottom {
    text-align: center;
    background: linear-gradient(135deg, #0f172a, #1e3a8a);
    color: #fff;
  }

  .industry-bottom p {
    color: rgba(255,255,255,0.74);
    max-width: 680px;
    margin: 0 auto 22px;
  }

  @media (max-width: 920px) {
    .industry-hero,
    .industry-compare {
      grid-template-columns: 1fr;
    }

    .industry-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .industry-related {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .industry-shell {
      width: min(100% - 24px, 1140px);
      padding: 98px 0 54px;
    }

    .industry-panel {
      padding: 24px 20px;
      border-radius: 18px;
    }

    .industry-card-grid,
    .industry-faq-grid,
    .industry-service-list {
      grid-template-columns: 1fr;
    }

    .industry-actions {
      flex-direction: column;
    }
  }
`;

const OUTCOME_ICONS = [ShieldCheck, Search, MessageCircle, Sparkles];

function cityForSlug(slug) {
  return slug ? localSeoCities.find((city) => city.slug === slug) : null;
}

export default function IndustryPage() {
  const { branche, stad } = useParams();
  const industry = industries[branche];
  const city = cityForSlug(stad);

  if (!industry || (stad && !city)) {
    return <Navigate to="/voorwie" replace />;
  }

  const isCityPage = Boolean(city);
  const path = isCityPage ? `/website/${industry.key}/${city.slug}` : industry.path;
  const canonical = `https://vedantix.nl${path}`;
  const title = isCityPage ? industry.cityHeroTitle(city.name) : industry.heroTitle;
  const description = isCityPage ? industry.cityHeroText(city.name) : industry.heroText;
  const seoTitle = isCityPage ? industry.cityMetaTitle(city.name) : industry.metaTitle;
  const seoDescription = isCityPage
    ? industry.cityMetaDescription(city.name)
    : industry.metaDescription;

  const relatedBlogs = blogPosts
    .filter((post) => ["website", "seo", "groei", "ai", industry.key].includes(post.niche))
    .slice(0, 3);

  const serviceSchema = createServiceSchema({
    name: title,
    slug: path.replace(/^\//, ""),
    description: seoDescription,
    audienceType: industry.label,
    serviceType: `Website, SEO en online groei voor ${industry.label}`,
    areaServed: city?.name || "Nederland",
  });
  const faqSchema = createFAQSchema(industry.faqs);
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Branches", url: "https://vedantix.nl/voorwie" },
    { name: industry.label, url: `https://vedantix.nl${industry.path}` },
    ...(isCityPage ? [{ name: city.name, url: canonical }] : []),
  ]);

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        schemas={[serviceSchema, faqSchema, breadcrumbSchema]}
      />

      <style>{INDUSTRY_STYLES}</style>

      <div className="industry-page">
        <NavBar />

        <main className="industry-shell">
          <nav className="industry-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/voorwie">Branches</Link>
            <span>/</span>
            {isCityPage ? (
              <>
                <Link to={industry.path}>{industry.label}</Link>
                <span>/</span>
                <span>{city.name}</span>
              </>
            ) : (
              <span>{industry.label}</span>
            )}
          </nav>

          <section className="industry-hero" aria-labelledby="industry-title">
            <div className="industry-panel">
              <div className="industry-kicker">
                <Globe2 size={16} aria-hidden="true" />
                {industry.badge}
              </div>
              <h1 id="industry-title">{title}</h1>
              <p className="industry-lead">{description}</p>
              <div className="industry-actions">
                <a href="/online-groei-audit" className="industry-primary">
                  Gratis Online Groei Audit
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
                <Link to="/contact" className="industry-secondary">
                  Plan een kennismaking
                </Link>
              </div>
            </div>

            <aside className="industry-panel industry-proof">
              <div className="industry-label">Waarom dit werkt</div>
              <h2>Online gekozen worden begint met vertrouwen</h2>
              <p>{industry.customerNeed}</p>
              <div className="industry-service-list">
                {industry.services.map((service) => (
                  <div className="industry-service-pill" key={service}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </aside>
          </section>

          <section className="industry-section" aria-labelledby="industry-outcomes-title">
            <div className="industry-section-header center">
              <div className="industry-label">Wat levert dit op?</div>
              <h2 id="industry-outcomes-title">Meer dan een online visitekaartje</h2>
              <p>
                Een goede website helpt bezoekers sneller begrijpen, vertrouwen en contact opnemen.
              </p>
            </div>

            <div className="industry-card-grid">
              {industry.outcomes.map((outcome, index) => {
                const Icon = OUTCOME_ICONS[index] || CheckCircle2;
                return (
                  <article className="industry-card" key={outcome}>
                    <div className="industry-card-icon">
                      <Icon size={23} aria-hidden="true" />
                    </div>
                    <h3>{outcome}</h3>
                    <p>
                      We vertalen dit voordeel naar duidelijke content, sterke structuur en
                      laagdrempelige contactmomenten.
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="industry-section industry-compare">
            <div className="industry-panel">
              <div className="industry-label">De klantvraag</div>
              <h2>Waarom alleen online staan niet genoeg is</h2>
              <p>{industry.customerNeed}</p>
              <ul className="industry-list">
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Bezoekers willen snel zien of jouw bedrijf past bij hun vraag.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Google moet duidelijk begrijpen welke diensten je aanbiedt.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Contact opnemen moet logisch, zichtbaar en laagdrempelig zijn.</span>
                </li>
              </ul>
            </div>

            <div className="industry-panel">
              <div className="industry-label">De Vedantix aanpak</div>
              <h2>Gebouwd voor vertrouwen, vindbaarheid en aanvragen</h2>
              <p>{industry.proof}</p>
              <ul className="industry-list">
                {industry.services.map((service) => (
                  <li key={service}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="industry-section" aria-labelledby="industry-cities-title">
            <div className="industry-section-header">
              <div className="industry-label">Lokale vindbaarheid</div>
              <h2 id="industry-cities-title">
                {isCityPage
                  ? `Ook zichtbaar in omliggende steden`
                  : `Website voor ${industry.label} per regio`}
              </h2>
              <p>
                Lokale ondernemers worden vaker gevonden wanneer diensten, locatie en
                contactmomenten duidelijk samenkomen.
              </p>
            </div>

            <div className="industry-city-grid">
              {localSeoCities.map((item) => (
                <Link
                  key={item.slug}
                  to={`/website/${industry.key}/${item.slug}`}
                  className="industry-city-link"
                >
                  <MapPin size={16} aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="industry-section" aria-labelledby="industry-faq-title">
            <div className="industry-section-header center">
              <div className="industry-label">Veelgestelde vragen</div>
              <h2 id="industry-faq-title">Vragen van ondernemers</h2>
            </div>
            <div className="industry-faq-grid">
              {industry.faqs.map((faq) => (
                <article className="industry-faq" key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="industry-section" aria-labelledby="industry-reading-title">
            <div className="industry-section-header">
              <div className="industry-label">Verder lezen</div>
              <h2 id="industry-reading-title">Meer over online groei</h2>
            </div>
            <div className="industry-related">
              {relatedBlogs.map((post) => (
                <Link to={`/blog/${post.slug}`} key={post.slug}>
                  <strong>{post.title}</strong>
                  <p style={{ marginTop: 8 }}>{post.excerpt || post.intro}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="industry-section industry-panel industry-bottom">
            <Search size={34} aria-hidden="true" />
            <h2>Ontdek hoe jouw website meer aanvragen kan opleveren</h2>
            <p>
              Laat Vedantix vrijblijvend kijken naar vindbaarheid, vertrouwen, snelheid,
              reviews en call-to-actions.
            </p>
            <a href="/online-groei-audit" className="industry-primary">
              Vraag een gratis Online Groei Audit aan
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </section>
        </main>
      </div>
    </>
  );
}
