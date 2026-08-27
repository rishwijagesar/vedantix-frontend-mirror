import { Link, Navigate, useParams } from "@/lib/router-compat";
import NavBar from "../../components/NavBar";
import SEO from "../../components/SEO";
import { createBreadcrumbSchema, createFAQSchema } from "../../utils/schema";
import { blogPosts } from "../../data/seoData";

export default function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const canonical = `https://vedantix.nl/blog/${post.slug}`;

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Blog", url: "https://vedantix.nl/blog" },
    { name: post.title, url: canonical },
  ]);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo?.description || post.intro,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: "nl-NL",
    author: {
      "@type": "Organization",
      name: "Vedantix",
    },
    publisher: {
      "@type": "Organization",
      name: "Vedantix",
      logo: {
        "@type": "ImageObject",
        url: "https://vedantix.nl/vedantix_logo.png",
      },
    },
  };
  const faqSchema = post.faqs?.length ? createFAQSchema(post.faqs) : null;

  const relatedPosts = blogPosts
    .filter((item) => item.slug !== slug && item.niche === post.niche)
    .slice(0, 3);

  return (
    <>
      <SEO
        title={post.seo?.title || `${post.title} | Vedantix`}
        description={post.seo?.description || post.intro}
        canonical={canonical}
        schemas={[breadcrumbSchema, articleSchema, faqSchema].filter(Boolean)}
      />

      <div
        style={{
          background: "#f8fafc",
          minHeight: "100vh",
          color: "#0f172a",
        }}
      >
        <style>{`
          * { box-sizing: border-box; }

          .blogpost-page-shell {
            max-width: 980px;
            margin: 0 auto;
            padding: 110px 20px 60px;
          }

          .blogpost-hero {
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #fff;
            border-radius: 20px;
            padding: 42px 32px;
            margin-top: 24px;
            box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
          }

          .blogpost-article {
            background: #fff;
            border-radius: 18px;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
            margin-top: 28px;
          }

          .blogpost-related {
            background: #fff;
            border-radius: 18px;
            padding: 28px 32px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
            margin-top: 28px;
          }

          .blogpost-related-grid {
            display: grid;
            gap: 14px;
          }

          .blogpost-link-grid,
          .blogpost-faq-grid {
            display: grid;
            gap: 14px;
          }

          .blogpost-related-card {
            display: block;
            padding: 18px;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            text-decoration: none;
            color: #111827;
            background: #fff;
            transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          }

          .blogpost-internal-link,
          .blogpost-faq-card {
            display: block;
            padding: 18px;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            background: #fff;
          }

          .blogpost-internal-link {
            color: #111827;
            text-decoration: none;
            font-weight: 800;
            transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          }

          .blogpost-related-card:hover,
          .blogpost-internal-link:hover {
            transform: translateY(-2px);
            border-color: #dbeafe;
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
          }

          .blogpost-prose h2 {
            margin-top: 28px;
            margin-bottom: 12px;
            font-size: 1.4rem;
            line-height: 1.3;
          }

          .blogpost-prose p {
            color: #4b5563;
            line-height: 1.8;
            margin: 0 0 16px;
            font-size: 1rem;
          }

          @media (max-width: 768px) {
            .blogpost-page-shell {
              padding: 96px 16px 48px;
            }

            .blogpost-hero,
            .blogpost-article,
            .blogpost-related {
              padding: 24px 20px;
              border-radius: 16px;
            }

            .blogpost-hero h1 {
              font-size: 2rem !important;
            }

            .blogpost-prose h2 {
              font-size: 1.2rem;
            }
          }

          @media (max-width: 480px) {
            .blogpost-page-shell {
              padding: 90px 14px 40px;
            }

            .blogpost-hero h1 {
              font-size: 1.75rem !important;
            }
          }
        `}</style>

        <NavBar />

        <div className="blogpost-page-shell">
          <section className="blogpost-hero">
            <div style={{ maxWidth: 760 }}>
              <div
                style={{
                  marginBottom: 18,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                <Link
                  to="/"
                  style={{
                    color: "rgba(255,255,255,0.68)",
                    textDecoration: "none",
                  }}
                >
                  Home
                </Link>
                {" / "}
                <Link
                  to="/blog"
                  style={{
                    color: "rgba(255,255,255,0.68)",
                    textDecoration: "none",
                  }}
                >
                  Blog
                </Link>
                {" / "}
                <span>{post.title}</span>
              </div>

              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#93c5fd",
                }}
              >
                Artikel van Vedantix
              </p>

              <h1
                style={{
                  fontSize: 40,
                  marginBottom: 16,
                  lineHeight: 1.1,
                }}
              >
                {post.title}
              </h1>

              <p
                style={{
                  color: "rgba(255,255,255,0.82)",
                  lineHeight: 1.8,
                  marginBottom: 0,
                  fontSize: 18,
                  maxWidth: 760,
                }}
              >
                {post.intro}
              </p>
            </div>
          </section>

          <article className="blogpost-article">
            <div className="blogpost-prose">
              {post.sections?.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </section>
              ))}
            </div>

            <div style={{ marginTop: 34 }}>
              <Link
                to={post.ctaLink || "/"}
                style={{
                  display: "inline-block",
                  background: "#111827",
                  color: "#fff",
                  padding: "12px 18px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                {post.ctaLabel || "Ga terug naar home →"}
              </Link>
            </div>
          </article>

          {post.internalLinks?.length ? (
            <section className="blogpost-related" aria-labelledby="blogpost-internal-title">
              <h2
                id="blogpost-internal-title"
                style={{ marginTop: 0, marginBottom: 16, fontSize: "1.35rem" }}
              >
                Verder met online groei
              </h2>

              <div className="blogpost-link-grid">
                {post.internalLinks.map((link) => (
                  <Link className="blogpost-internal-link" to={link.path} key={link.path}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {post.faqs?.length ? (
            <section className="blogpost-related" aria-labelledby="blogpost-faq-title">
              <h2
                id="blogpost-faq-title"
                style={{ marginTop: 0, marginBottom: 16, fontSize: "1.35rem" }}
              >
                Veelgestelde vragen
              </h2>

              <div className="blogpost-faq-grid">
                {post.faqs.map((faq) => (
                  <article className="blogpost-faq-card" key={faq.question}>
                    <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: "1rem" }}>
                      {faq.question}
                    </h3>
                    <p style={{ color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
                      {faq.answer}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {relatedPosts.length ? (
            <section className="blogpost-related">
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: "1.35rem" }}>
                Gerelateerde blogs
              </h3>

              <div className="blogpost-related-grid">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/blog/${item.slug}`}
                    className="blogpost-related-card"
                  >
                    <strong style={{ display: "block", marginBottom: 6 }}>
                      {item.title}
                    </strong>
                    <span style={{ color: "#6b7280", lineHeight: 1.6 }}>
                      {item.excerpt ?? item.intro}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
