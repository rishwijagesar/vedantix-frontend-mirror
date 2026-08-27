import { useEffect, useRef, useState } from "react";

const CLIENT_CASES = [
  {
    name: "Horeca Topper",
    logo: "/logos/horeca-topper.svg",
    website: "https://www.horeca-topper.nl/",
    domainLabel: "horeca-topper.nl",
    branch: "Horeca / dienstverlening",
    status: "Live",
    summary:
      "Een sterkere online basis met duidelijke structuur, mobiele zichtbaarheid en een uitstraling die sneller vertrouwen geeft.",
    outcome:
      "Meer vertrouwen, duidelijkere contactmomenten en een betere basis voor aanvragen en online zichtbaarheid.",
  },
];

export default function ClientCasesSection() {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();

    const el = trackRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollByAmount = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const amount = Math.min(360, el.clientWidth * 0.9);

    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section style={styles.section}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div style={styles.headerContent}>
            <div style={styles.eyebrow}>KLANTCASES</div>
            <h2 style={styles.title}>Online groei die al voor echte bedrijven werkt</h2>
            <p style={styles.subtitle}>
              Geen loze beloftes, maar voorbeelden van ondernemers die hun online basis sterker maken voor meer vertrouwen,
              meer duidelijkheid en een betere basis voor aanvragen.
            </p>
          </div>

          <div style={styles.controls}>
            <button
              type="button"
              onClick={() => scrollByAmount("left")}
              style={{
                ...styles.navButton,
                ...(!canScrollLeft ? styles.navButtonDisabled : {}),
              }}
              disabled={!canScrollLeft}
              aria-label="Scroll naar links"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => scrollByAmount("right")}
              style={{
                ...styles.navButton,
                ...(!canScrollRight ? styles.navButtonDisabled : {}),
              }}
              disabled={!canScrollRight}
              aria-label="Scroll naar rechts"
            >
              →
            </button>
          </div>
        </div>

        <div ref={trackRef} style={styles.carousel} aria-label="Klantcases">
          {CLIENT_CASES.map((client) => (
            <article key={client.name} style={styles.card}>
              <div style={styles.logoWrap}>
                <img
                  src={client.logo}
                  alt={`${client.name} logo`}
                  style={styles.logo}
                />
              </div>

              <div style={styles.metaRow}>
                <span style={styles.statusBadge}>{client.status}</span>
                <span style={styles.branch}>{client.branch}</span>
              </div>

              <h3 style={styles.cardTitle}>{client.name}</h3>

              <a
                href={client.website}
                target="_blank"
                rel="noreferrer"
                style={styles.domainLink}
              >
                {client.domainLabel}
              </a>

              <p style={styles.summary}>{client.summary}</p>

              <div style={styles.outcomeBox}>
                {client.outcome}
              </div>

              <div style={styles.cardFooter}>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.primaryButton}
                >
                  Bekijk website
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** @type {Record<string, import("react").CSSProperties>} */
const styles = {
  section: {
    position: "relative",
    overflow: "hidden",
    padding: "84px 20px",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  },
  glowOne: {
    position: "absolute",
    top: "-140px",
    left: "-120px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.08)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  glowTwo: {
    position: "absolute",
    right: "-100px",
    bottom: "-100px",
    width: "240px",
    height: "240px",
    borderRadius: "999px",
    background: "rgba(168,85,247,0.08)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "28px",
  },
  headerContent: {
    maxWidth: "760px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "rgba(15,23,42,0.04)",
    border: "1px solid rgba(15,23,42,0.06)",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: "14px",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "clamp(30px, 4vw, 48px)",
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: 1.7,
    color: "#475569",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navButton: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.8)",
    color: "#0f172a",
    fontSize: "18px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  carousel: {
    display: "flex",
    gap: "18px",
    overflowX: "auto",
    scrollBehavior: "smooth",
    paddingBottom: "8px",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  card: {
    flex: "0 0 320px",
    borderRadius: "24px",
    padding: "22px",
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    color: "#0f172a",
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  logoWrap: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    marginBottom: "4px",
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.12)",
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: 700,
  },
  branch: {
    fontSize: "13px",
    color: "#64748b",
  },
  cardTitle: {
    margin: "0",
    fontSize: "20px",
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0f172a",
  },
  domainLink: {
    display: "inline-block",
    fontSize: "14px",
    color: "#2563eb",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  summary: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#475569",
  },
  outcomeBox: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    lineHeight: 1.65,
    color: "#334155",
    fontWeight: 700,
  },
  cardFooter: {
    marginTop: "auto",
    paddingTop: "6px",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "44px",
    width: "100%",
    borderRadius: "12px",
    background: "#0f172a",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: "0 8px 20px rgba(15,23,42,0.12)",
  },
};
