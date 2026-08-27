import { Link } from "@/lib/router-compat";
import NavBar from "./NavBar";
import SEO from "./SEO";

const LEGAL_STYLES = `
  .legal-page {
    min-height: 100vh;
    background: #f4f7fb;
    color: #0f172a;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .legal-hero {
    background: #0a1628;
    color: #fff;
    padding: 104px 18px 36px;
  }

  .legal-hero__inner,
  .legal-main {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .legal-eyebrow {
    color: #8fd5ff;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  .legal-hero h1 {
    font-size: clamp(2rem, 9vw, 4rem);
    line-height: 0.98;
    letter-spacing: 0;
    margin: 0;
    max-width: 820px;
  }

  .legal-hero p {
    color: rgba(255,255,255,0.74);
    font-size: 1rem;
    line-height: 1.7;
    margin: 16px 0 0;
    max-width: 720px;
  }

  .legal-main {
    display: grid;
    gap: 18px;
    padding: 18px;
  }

  .legal-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .legal-pill {
    background: #fff;
    border: 1px solid #d8e3f2;
    border-radius: 999px;
    color: #52657f;
    display: inline-flex;
    font-size: 0.84rem;
    font-weight: 800;
    padding: 9px 12px;
  }

  .legal-grid {
    display: grid;
    gap: 18px;
  }

  .legal-toc,
  .legal-card,
  .legal-contact {
    background: #fff;
    border: 1px solid #d8e3f2;
    border-radius: 14px;
    box-shadow: 0 16px 45px rgba(15,23,42,0.06);
  }

  .legal-toc {
    padding: 18px;
  }

  .legal-toc h2 {
    font-size: 0.86rem;
    letter-spacing: 0.08em;
    margin: 0 0 12px;
    text-transform: uppercase;
  }

  .legal-toc ol {
    display: grid;
    gap: 8px;
    list-style-position: inside;
    margin: 0;
    padding: 0;
  }

  .legal-toc a {
    color: #174ea6;
    font-size: 0.94rem;
    font-weight: 800;
    text-decoration: none;
  }

  .legal-toc a:hover,
  .legal-contact a:hover,
  .legal-card a:hover {
    text-decoration: underline;
  }

  .legal-sections {
    display: grid;
    gap: 14px;
  }

  .legal-card {
    padding: 20px;
  }

  .legal-card h2 {
    font-size: clamp(1.18rem, 5vw, 1.55rem);
    letter-spacing: 0;
    line-height: 1.2;
    margin: 0 0 10px;
  }

  .legal-card p,
  .legal-card li,
  .legal-contact p {
    color: #334155;
    font-size: 0.98rem;
    line-height: 1.72;
  }

  .legal-card p {
    margin: 0 0 12px;
  }

  .legal-card ul,
  .legal-card ol {
    margin: 0;
    padding-left: 20px;
  }

  .legal-card li + li {
    margin-top: 7px;
  }

  .legal-card strong {
    color: #0f172a;
  }

  .legal-contact {
    display: grid;
    gap: 10px;
    padding: 20px;
  }

  .legal-contact h2 {
    font-size: 1.2rem;
    margin: 0;
  }

  .legal-contact a,
  .legal-card a {
    color: #174ea6;
    font-weight: 900;
    text-decoration: none;
  }

  .legal-related {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .legal-related a {
    background: #eef6ff;
    border: 1px solid #bcd9ff;
    border-radius: 999px;
    color: #0b57d0;
    font-size: 0.9rem;
    font-weight: 900;
    padding: 9px 12px;
    text-decoration: none;
  }

  @media (min-width: 900px) {
    .legal-hero {
      padding: 124px 32px 54px;
    }

    .legal-main {
      padding: 28px 32px 56px;
    }

    .legal-grid {
      align-items: start;
      grid-template-columns: 280px minmax(0, 1fr);
    }

    .legal-toc {
      position: sticky;
      top: 96px;
    }

    .legal-card,
    .legal-contact,
    .legal-toc {
      border-radius: 16px;
      padding: 26px;
    }
  }
`;

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LegalPageLayout({
  title,
  eyebrow = "Legal",
  intro,
  description,
  canonical,
  updatedAt,
  schemas = [],
  sections,
  contactLabel = "Contact",
  children,
}) {
  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        schemas={schemas}
      />
      <style>{LEGAL_STYLES}</style>
      <div className="legal-page">
        <NavBar />

        <header className="legal-hero">
          <div className="legal-hero__inner">
            <div className="legal-eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
        </header>

        <main className="legal-main">
          <div className="legal-meta" aria-label="Paginagegevens">
            <span className="legal-pill">Publiek toegankelijk</span>
            <span className="legal-pill">Laatst bijgewerkt: {updatedAt}</span>
            <span className="legal-pill">Vedantix</span>
          </div>

          <div className="legal-grid">
            <aside className="legal-toc" aria-label="Inhoudsopgave">
              <h2>Inhoud</h2>
              <ol>
                {sections.map((section) => (
                  <li key={section.title}>
                    <a href={`#${section.id || slugify(section.title)}`}>
                      {section.shortTitle || section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="legal-sections">
              {sections.map((section) => {
                const id = section.id || slugify(section.title);
                return (
                  <section className="legal-card" id={id} key={id}>
                    <h2>{section.title}</h2>
                    {section.content}
                  </section>
                );
              })}

              <section className="legal-contact" aria-labelledby="legal-contact-title">
                <h2 id="legal-contact-title">{contactLabel}</h2>
                {children}
                <div className="legal-related" aria-label="Gerelateerde juridische pagina's">
                  <Link to="/privacy">Privacybeleid</Link>
                  <Link to="/terms">Algemene voorwaarden</Link>
                  <Link to="/data-deletion">Gegevensverwijdering</Link>
                </div>
              </section>
            </div>
          </div>
        </main>

      </div>
    </>
  );
}
