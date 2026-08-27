import { Link, Navigate, useParams } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { createBreadcrumbSchema, createServiceSchema } from "../utils/schema";
import { niches, cities, blogPosts } from "../data/seoData";

const SEO_CITY_STYLES = `
  * { box-sizing: border-box; }

  .seo-city-page {
    max-width: 980px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  .seo-city-breadcrumb {
    margin-bottom: 18px;
    font-size: 14px;
    color: #6b7280;
  }

  .seo-city-breadcrumb a {
    color: #6b7280;
    text-decoration: none;
  }

  .seo-city-title {
    font-size: 42px;
    line-height: 1.1;
    margin-bottom: 18px;
  }

  .seo-city-intro,
  .seo-city-text {
    color: #4b5563;
    line-height: 1.8;
  }

  .seo-city-intro {
    font-size: 18px;
    margin-bottom: 28px;
  }

  .seo-city-text {
    margin-bottom: 16px;
  }

  .seo-city-list {
    padding-left: 22px;
    margin-bottom: 28px;
    line-height: 1.9;
  }

  .seo-city-section-title {
    margin-top: 28px;
    margin-bottom: 12px;
  }

  .seo-city-cta {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px;
    margin-top: 30px;
    margin-bottom: 34px;
  }

  .seo-city-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 420px;
  }

  .seo-city-input {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
  }

  .seo-city-submit {
    background: #111827;
    color: #fff;
    padding: 14px;
    border-radius: 8px;
    font-weight: 700;
    border: none;
    cursor: pointer;
  }

  .seo-city-note {
    font-size: 13px;
    color: #6b7280;
    margin-top: 10px;
  }

  .seo-city-whatsapp-wrap {
    margin-top: 18px;
  }

  .seo-city-whatsapp {
    display: inline-block;
    background: #25d366;
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 700;
    text-decoration: none;
  }

  .seo-city-related-cities {
    margin-top: 38px;
  }

  .seo-city-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .seo-city-chip {
    padding: 10px 14px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #111827;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  .seo-city-related-blogs {
    margin-top: 42px;
  }

  .seo-city-blog-list {
    display: grid;
    gap: 14px;
  }

  .seo-city-blog-card {
    display: block;
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    text-decoration: none;
    color: #111827;
    background: #fff;
  }

  .seo-city-blog-card strong {
    display: block;
    margin-bottom: 6px;
  }

  .seo-city-blog-card span {
    color: #6b7280;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .seo-city-page {
      padding: 28px 16px 40px;
    }

    .seo-city-title {
      font-size: 34px;
    }

    .seo-city-intro {
      font-size: 17px;
    }

    .seo-city-cta {
      padding: 20px;
    }
  }

  @media (max-width: 480px) {
    .seo-city-page {
      padding: 24px 14px 36px;
    }

    .seo-city-title {
      font-size: 28px;
    }
  }
`;

function prettyNicheLabel(key) {
  return niches[key]?.label ?? key;
}

export default function SeoCityPage() {
  const { niche, stad } = useParams();

  const nicheData = niches[niche];
  const cityData = cities.find((city) => city.slug === stad);

  if (!nicheData || !cityData) {
    return <Navigate to="/" replace />;
  }

  const stadNaam = cityData.name;
  const canonical = `https://vedantix.nl/website/${niche}/${stad}`;

  const relatedCities = cities.filter((city) => city.slug !== stad).slice(0, 6);
  const relatedBlogs = blogPosts.filter((post) => post.niche === niche).slice(0, 3);

  const serviceSchema = createServiceSchema({
    name: nicheData.heroTitle(stadNaam),
    slug: `website/${niche}/${stad}`,
    description: nicheData.seo.description(stadNaam),
    audienceType: prettyNicheLabel(niche),
    serviceType: `Website development voor ${prettyNicheLabel(niche)} in ${stadNaam}`,
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: prettyNicheLabel(niche), url: `https://vedantix.nl/website-${niche}` },
    { name: stadNaam, url: canonical },
  ]);

  return (
    <>
      <SEO
        title={nicheData.seo.title(stadNaam)}
        description={nicheData.seo.description(stadNaam)}
        canonical={canonical}
        schemas={[serviceSchema, breadcrumbSchema]}
      />

      <style>{SEO_CITY_STYLES}</style>

      <div className="seo-city-page">
        <NavBar />

        <main>
          <nav aria-label="Breadcrumb" className="seo-city-breadcrumb">
            <Link to="/">Home</Link>
            {" / "}
            <Link to={`/website-${niche}`}>{prettyNicheLabel(niche)}</Link>
            {" / "}
            <span>{stadNaam}</span>
          </nav>

          <h1 className="seo-city-title">{nicheData.heroTitle(stadNaam)}</h1>

          <p className="seo-city-intro">{nicheData.intro(stadNaam)}</p>

          <h2 className="seo-city-section-title">{nicheData.section1Title(stadNaam)}</h2>
          <p className="seo-city-text">{nicheData.section1Text(stadNaam)}</p>

          <ul className="seo-city-list">
            {nicheData.bullets1(stadNaam).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className="seo-city-section-title">{nicheData.section2Title(stadNaam)}</h2>
          <p className="seo-city-text">{nicheData.section2Text(stadNaam)}</p>

          <ul className="seo-city-list">
            {nicheData.bullets2(stadNaam).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className="seo-city-section-title">{nicheData.section3Title(stadNaam)}</h2>
          <p className="seo-city-text" style={{ marginBottom: 28 }}>
            {nicheData.section3Text(stadNaam)}
          </p>

          <section className="seo-city-cta">
            <h2 style={{ marginBottom: 12 }}>{nicheData.ctaTitle(stadNaam)}</h2>
            <p className="seo-city-text" style={{ marginBottom: 18 }}>
              {nicheData.ctaText(stadNaam)}
            </p>

            <form
              action="https://formspree.io/f/mqeyjgna"
              method="POST"
              className="seo-city-form"
            >
              <input
                type="text"
                name="name"
                placeholder="Naam"
                required
                className="seo-city-input"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="seo-city-input"
              />
              <input
                type="text"
                name="business"
                placeholder={nicheData.businessPlaceholder(stadNaam)}
                className="seo-city-input"
              />
              <button type="submit" className="seo-city-submit">
                Gratis analyse aanvragen →
              </button>
            </form>

            <p className="seo-city-note">Reactie binnen 24 uur • 100% gratis</p>

            <div className="seo-city-whatsapp-wrap">
              <a
                href="https://wa.me/310626219989"
                target="_blank"
                rel="noreferrer"
                className="seo-city-whatsapp"
              >
                Of stuur direct een WhatsApp →
              </a>
            </div>
          </section>

          <section className="seo-city-related-cities">
            <h3 style={{ marginBottom: 16 }}>Gerelateerde steden</h3>
            <div className="seo-city-chip-list">
              {relatedCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/website/${niche}/${city.slug}`}
                  className="seo-city-chip"
                >
                  {prettyNicheLabel(niche)} in {city.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="seo-city-related-blogs">
            <h3 style={{ marginBottom: 16 }}>Gerelateerde blogs</h3>
            <div className="seo-city-blog-list">
              {relatedBlogs.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="seo-city-blog-card"
                >
                  <strong>{post.title}</strong>
                  <span>{post.intro}</span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}