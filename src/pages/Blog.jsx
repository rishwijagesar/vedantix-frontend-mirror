import { Link } from "@/lib/router-compat";
import NavBar from "../components/NavBar";
import PageHero from "../components/PageHero";
import SEO from "../components/SEO";
import { createBreadcrumbSchema } from "../utils/schema";
import { blogPosts } from "../data/seoData";

const BLOG_STYLES = `
  * { box-sizing: border-box; }

  .blog-page {
    background: #f8fafc;
    min-height: 100vh;
    color: #0f172a;
  }

  .blog-card {
    border: 1px solid #c3d3ea !important;
    border-radius: 18px !important;
    background: linear-gradient(180deg, #fff, #f7faff) !important;
    box-shadow: 0 1px 2px #12203918, 0 10px 28px #12203916 !important;
  }

  .blog-card:hover { border-color: #74adff !important; }

  .blog-page-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: clamp(36px, 5vw, 56px) 20px 60px;
  }

  .blog-hero {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #fff;
    border-radius: 20px;
    padding: 42px 32px;
    margin-top: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  }

  .blog-list {
    display: grid;
    gap: 16px;
    margin-top: 28px;
  }

  .blog-card {
    border: 1px solid #c3d3ea;
    border-radius: 16px;
    padding: 22px;
    background: #fff;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .blog-card:hover {
    transform: translateY(-2px);
    border-color: #dbeafe;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  }

  .blog-card-link {
    display: inline-block;
    color: #111827;
    font-weight: 700;
    text-decoration: none;
  }

  .blog-card-link:hover {
    color: #2563eb;
  }

  @media (max-width: 768px) {
    .blog-page-shell {
      padding: 96px 16px 48px;
    }

    .blog-hero {
      padding: 24px 20px;
      border-radius: 16px;
    }

    .blog-hero h1 {
      font-size: 2rem !important;
    }

    .blog-card {
      padding: 18px;
    }

    .blog-card h2 {
      font-size: 1.25rem !important;
    }
  }

  @media (max-width: 480px) {
    .blog-page-shell {
      padding: 32px 14px 40px;
    }

    .blog-hero h1 {
      font-size: 1.75rem !important;
    }
  }
`;

/** @type {import('react').CSSProperties} */
const CARD_TITLE_STYLE = {
  fontSize: 24,
  marginBottom: 8,
};

/** @type {import('react').CSSProperties} */
const CARD_TEXT_STYLE = {
  color: "#6b7280",
  lineHeight: 1.7,
  marginBottom: 14,
};

export default function Blog() {
  const canonical = "https://vedantix.nl/blog";

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Blog", url: canonical },
  ]);
  const blogCollectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Vedantix blog",
    description:
      "Praktische artikelen over websites, lokale SEO, online zichtbaarheid en groei voor lokale ondernemers.",
    url: canonical,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: blogPosts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://vedantix.nl/blog/${post.slug}`,
        name: post.title,
      })),
    },
    about: {
      "@id": "https://vedantix.nl/#organization",
    },
  };

  return (
    <>
      <SEO
        title="Blog over websites, lokale SEO en meer klanten | Vedantix"
        description="Praktische blogs over websites, lokale SEO en online groei voor kappers, salons, restaurants, fotografen, klusbedrijven en andere lokale ondernemers."
        canonical={canonical}
        schemas={[breadcrumbSchema, blogCollectionSchema]}
      />

      <style>{BLOG_STYLES}</style>

      <div className="blog-page">
        <NavBar />

        <PageHero
          id="blog-title"
          eyebrow="Blog van Vedantix"
          title={<>Websites, vindbaarheid en <span className="vx-grad">online groei</span></>}
          lead="Praktische artikelen over hoe ondernemers meer klanten krijgen via een goede website, betere zichtbaarheid in Google en AI, en slimme software."
        />
        <main className="blog-page-shell">

          <section className="blog-list">
            {blogPosts.map((post) => (
              <article key={post.slug} className="blog-card">
                <h2 style={CARD_TITLE_STYLE}>{post.title}</h2>

                <p style={CARD_TEXT_STYLE}>
                  {post.excerpt ?? post.intro}
                </p>

                <Link to={`/blog/${post.slug}`} className="blog-card-link">
                  Lees artikel →
                </Link>
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}
