import { useState } from "react";

const PROJECTS = [
  {
    id: 1,
    title: "Kapperszaak De Schaar",
    category: "Horeca & Lifestyle",
    type: "Business",
    color: "#d97706",
    bg: "linear-gradient(135deg,#78350f,#d97706)",
    description: "Stijlvolle website met online afsprakensysteem en galerij voor een moderne kapperszaak in Amsterdam.",
    tags: ["Afsprakensysteem", "Galerij", "Mobielvriendelijk"],
    url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80",
    deliveredIn: "36 uur",
  },
  {
    id: 2,
    title: "Restaurant La Bella",
    category: "Horeca & Lifestyle",
    type: "Premium",
    color: "#dc2626",
    bg: "linear-gradient(135deg,#7f1d1d,#dc2626)",
    description: "Elegante restaurantwebsite met digitaal menu, reserveringssysteem en sfeervolle fotografie.",
    tags: ["Reserveringen", "Digitaal menu", "Google Maps"],
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    deliveredIn: "48 uur",
  },
  {
    id: 3,
    title: "FotoStudio Meijer",
    category: "Creatief & Portfolio",
    type: "Premium",
    color: "#7c3aed",
    bg: "linear-gradient(135deg,#1e1b4b,#7c3aed)",
    description: "Professioneel portfolio voor een fotografe met lightbox galerij, boekingssysteem en tarieven.",
    tags: ["Portfolio", "Lightbox", "Online boeken"],
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80",
    deliveredIn: "48 uur",
  },
  {
    id: 4,
    title: "Bouw & Verbouw Janssen",
    category: "Zakelijk & B2B",
    type: "Business",
    color: "#0369a1",
    bg: "linear-gradient(135deg,#0c4a6e,#0369a1)",
    description: "Zakelijke website voor een aannemer met projectenpagina, offerte formulier en certificaten.",
    tags: ["Offerteformulier", "Projecten", "Reviews"],
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    deliveredIn: "44 uur",
  },
  {
    id: 5,
    title: "Yoga by Laura",
    category: "Fitness & Gezondheid",
    type: "Starter",
    color: "#10b981",
    bg: "linear-gradient(135deg,#064e3b,#10b981)",
    description: "Frisse one-pager voor een yogadocente met lesrooster, aanmeldformulier en testimonials.",
    tags: ["Lesrooster", "Aanmelden", "Testimonials"],
    url: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&q=80",
    deliveredIn: "24 uur",
  },
  {
    id: 6,
    title: "Schoonheidssalon Glow",
    category: "Schoonheid & Wellness",
    type: "Business",
    color: "#db2777",
    bg: "linear-gradient(135deg,#831843,#db2777)",
    description: "Elegante salonwebsite met behandelingenlijst, online boeking en before/after galerij.",
    tags: ["Online boeking", "Behandelingen", "Galerij"],
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
    deliveredIn: "36 uur",
  },
];

const CATEGORIES = ["Alle", "Horeca & Lifestyle", "Creatief & Portfolio", "Zakelijk & B2B", "Fitness & Gezondheid", "Schoonheid & Wellness"];

const TYPE_COLORS = {
  Starter: "#6b7280",
  Business: "#1a73e8",
  Premium: "#8b5cf6",
};

export default function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = activeCategory === "Alle"
    ? PROJECTS
    : PROJECTS.filter(p => p.category === activeCategory);

  return (
    <section id="portfolio" style={{ padding: "90px 5%", background: "#f7f9fc" }}>
      <style>{`
        .pf-card{background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;transition:all 0.25s;cursor:pointer}
        .pf-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,0.12);border-color:transparent}
        .pf-img{width:100%;height:210px;object-fit:cover;display:block;transition:transform 0.4s}
        .pf-card:hover .pf-img{transform:scale(1.04)}
        .pf-img-wrap{overflow:hidden;position:relative}
        .pf-overlay{position:absolute;inset:0;background:rgba(10,22,40,0);transition:background 0.25s;display:flex;align-items:center;justify-content:center}
        .pf-card:hover .pf-overlay{background:rgba(10,22,40,0.35)}
        .pf-view-btn{background:#fff;color:#0a1628;padding:9px 22px;border-radius:100px;font-weight:700;font-size:0.82rem;opacity:0;transform:translateY(8px);transition:all 0.2s;text-decoration:none;border:none;cursor:pointer}
        .pf-card:hover .pf-view-btn{opacity:1;transform:translateY(0)}
        .pf-cat-btn{padding:8px 20px;border-radius:100px;font-weight:600;font-size:0.84rem;cursor:pointer;border:2px solid #e5e7eb;background:#fff;color:#475569;transition:all 0.15s;white-space:nowrap}
        .pf-cat-btn.active{background:#0a1628;color:#fff;border-color:#0a1628}
        .pf-cat-btn:hover:not(.active){border-color:#0a1628;color:#0a1628}
        @media(max-width:768px){
          .pf-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr)) !important}
          .pf-cats{flex-wrap:wrap !important}
        }
        @media(max-width:480px){
          .pf-grid{grid-template-columns:1fr !important}
          .pf-cats{gap:6px !important}
          .pf-cat-btn{font-size:0.78rem !important;padding:6px 14px !important}
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <span style={{ display: "inline-block", background: "rgba(26,115,232,0.1)", color: "#1a73e8", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", padding: "4px 12px", borderRadius: "100px", marginBottom: 14 }}>
          Ons werk
        </span>
        <h2 style={{ fontSize: "2.1rem", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
          Websites die we hebben gebouwd
        </h2>
        <p style={{ color: "#6b7280", fontSize: "1rem", maxWidth: 520, margin: "0 auto" }}>
          Van eenvoudige one-pagers tot uitgebreide meertalige websites — bekijk een selectie van onze recente projecten.
        </p>
      </div>

      {/* Category filters */}
      <div className="pf-cats" style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 40, overflowX: "auto", paddingBottom: 4 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`pf-cat-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div
        className="pf-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24, maxWidth: 1100, margin: "0 auto" }}
      >
        {filtered.map(project => (
          <div
            key={project.id}
            className="pf-card"
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Image */}
            <div className="pf-img-wrap">
              <img src={project.url} alt={project.title} className="pf-img" />
              <div className="pf-overlay">
                <button className="pf-view-btn">Bekijk project →</button>
              </div>
              {/* Package badge */}
              <div style={{
                position: "absolute", top: 12, left: 12,
                background: TYPE_COLORS[project.type],
                color: "#fff", padding: "3px 11px", borderRadius: 100,
                fontSize: "0.72rem", fontWeight: 800
              }}>
                {project.type}
              </div>
              {/* Delivery time */}
              <div style={{
                position: "absolute", top: 12, right: 12,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                padding: "3px 10px", borderRadius: 100,
                fontSize: "0.7rem", fontWeight: 700, backdropFilter: "blur(4px)"
              }}>
                ⚡ {project.deliveredIn}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 3 }}>{project.title}</h3>
                  <span style={{ color: "#94a3b8", fontSize: "0.76rem", fontWeight: 600 }}>{project.category}</span>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: project.color, flexShrink: 0, marginTop: 5 }} />
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.84rem", lineHeight: 1.55, marginBottom: 14 }}>
                {project.description}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {project.tags.map(tag => (
                  <span key={tag} style={{
                    background: "#f1f5f9", color: "#475569",
                    padding: "3px 10px", borderRadius: 100,
                    fontSize: "0.73rem", fontWeight: 600
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: 52 }}>
        <p style={{ color: "#6b7280", marginBottom: 18, fontSize: "0.95rem" }}>
          Wil jij ook zo'n website? Vraag vrijblijvend een offerte aan.
        </p>
        <a
          href="#contact"
          style={{ background: "#1a73e8", color: "#fff", padding: "13px 32px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: "0.97rem", display: "inline-block", transition: "background 0.2s" }}
          onMouseOver={e => e.currentTarget.style.background = "#00c2ff"}
          onMouseOut={e => e.currentTarget.style.background = "#1a73e8"}
        >
          Gratis offerte aanvragen →
        </a>
      </div>
    </section>
  );
}