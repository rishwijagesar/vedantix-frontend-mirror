import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import {
  downloadOnlineGrowthAuditPdf,
  fetchOnlineGrowthAudit,
  rerunOnlineGrowthAudit,
  startOnlineGrowthAudit,
} from "../api/onlineGrowthAudit.api";
import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { CONTACT } from "../constants/contact";
import {
  createBreadcrumbSchema,
  createFAQSchema,
  createServiceSchema,
} from "../utils/schema";

const INITIAL_FORM = {
  name: "",
  companyName: "",
  email: "",
  websiteUrl: "",
  competitorUrl1: "",
  competitorUrl2: "",
};

const STATUS_LABELS = {
  PENDING: "Audit staat in de wachtrij",
  RUNNING: "Analyse wordt uitgevoerd",
  COMPLETED: "Audit afgerond",
  FAILED: "Audit mislukt",
};

const PRIORITY_LABELS = {
  CRITICAL: "Kritiek",
  IMPORTANT: "Belangrijk",
  OPTIMIZATION: "Optimalisatie",
};

const MODULE_STATUS_LABELS = {
  COMPLETED: "Gemeten",
  UNKNOWN: "Niet verifieerbaar",
  FAILED: "Meting niet beschikbaar",
};

const CONFIDENCE_LABELS = {
  HIGH: "Hoog meetvertrouwen",
  MEDIUM: "Gemiddeld meetvertrouwen",
  LOW: "Beperkt meetvertrouwen",
};

const CONNECTION_GUIDES = {
  analytics: {
    title: "Google Analytics veilig koppelen",
    intro:
      "Voor event- en conversiedata moet de website-eigenaar via Google toestemming geven. De openbare audit krijgt nooit automatisch toegang tot een Analytics-account.",
    steps: [
      "Log in met het Google-account dat toegang heeft tot de juiste GA4-property.",
      "Kies de property van de gecontroleerde website en geef alleen-lezen toestemming.",
      "Vedantix controleert daarna conversie-events, consent en datakwaliteit.",
    ],
  },
  backlink: {
    title: "Een backlinkbron koppelen",
    intro:
      "Backlinks staan niet in de website zelf. Hiervoor is een externe backlinkdatabase en een server-side API-koppeling nodig.",
    steps: [
      "Kies een ondersteunde bron, zoals Semrush, Ahrefs of Majestic.",
      "De API-sleutel wordt uitsluitend versleuteld aan de backend opgeslagen en nooit in de browser gezet.",
      "Na de koppeling kan de auditor verwijzende domeinen, kwaliteit en verloren links meten.",
    ],
  },
  googleBusiness: {
    title: "Google Bedrijfsprofiel veilig koppelen",
    intro:
      "Google Bedrijfsprofieldata is beschermd. De eigenaar moet inloggen en Vedantix via Google OAuth expliciet alleen-lezen toegang geven.",
    steps: [
      "Log in met het Google-account dat het bedrijfsprofiel beheert.",
      "Selecteer de juiste vestiging en verleen toestemming.",
      "Vedantix kan daarna profielgegevens, openingstijden en reviews controleren.",
    ],
  },
};

const FEATURE_CARDS = [
  {
    icon: Search,
    title: "SEO, GEO, AEO en AI",
    text: "Meetbare crawl-, content-, entity- en vraag-antwoordsignalen met zichtbaar bewijs.",
  },
  {
    icon: Zap,
    title: "Performance en security",
    text: "Google PageSpeed, headers, HTTPS, SPF en DMARC worden bij de bron gecontroleerd.",
  },
  {
    icon: Target,
    title: "Conversie en vertrouwen",
    text: "CTA's, contactroutes en on-site trust-signalen worden gecontroleerd; externe data wordt niet geschat.",
  },
];

const FAQS = [
  {
    question: "Wordt de Online Groei Audit in de browser berekend?",
    answer:
      "Nee. De frontend verzamelt alleen invoer en toont resultaten. Alle analyses, scores en PDF-generatie gebeuren in de Vedantix backend.",
  },
  {
    question: "Waarom duurt de audit soms even?",
    answer:
      "De backend rendert JavaScript-pagina’s, crawlt een gerichte steekproef en raadpleegt Google PageSpeed en DNS. Daarom draait de audit asynchroon.",
  },
  {
    question: "Kan ik het rapport downloaden?",
    answer:
      "Ja. Zodra de audit is afgerond genereert de backend een professioneel PDF-rapport dat je direct kunt downloaden.",
  },
  {
    question: "Meet de audit ook backlinks, Google Reviews en mijn Bedrijfsprofiel?",
    answer:
      "Alleen wanneer daarvoor een betrouwbare externe databron is gekoppeld. Zonder zo’n bron toont Vedantix ‘niet verifieerbaar’ en verzint de auditor geen score.",
  },
];

const canonical = "https://vedantix.nl/online-groei-audit";
const serviceSchema = createServiceSchema({
  name: "Online Groei Audit",
  slug: "online-groei-audit",
  description:
    "Gratis backend-gedreven audit voor SEO, GEO, AEO, AIO, performance, security, Google Business, reviews, conversie en lokale vindbaarheid.",
  audienceType: "Lokale ondernemers",
  serviceType: "Online groei audit en conversie analyse",
});
const faqSchema = createFAQSchema(FAQS);
const breadcrumbSchema = createBreadcrumbSchema([
  { name: "Home", url: "https://vedantix.nl/" },
  { name: "Online Groei Audit", url: canonical },
]);

function scoreTone(score) {
  if (score === null || score === undefined) return "unknown";
  if (score >= 75) return "good";
  if (score >= 55) return "mid";
  return "low";
}

function scoreLabel(score) {
  return score === null || score === undefined ? "Niet gemeten" : `${score}/100`;
}

function confidenceLabel(confidence) {
  return CONFIDENCE_LABELS[confidence] || "Meetvertrouwen onbekend";
}

function metricLabel(value) {
  return value === null || value === undefined ? "Niet gemeten" : value;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 400);
}

function auditIdFromBrowser() {
  try {
    const sharedId = new URLSearchParams(window.location.search).get("audit");
    return sharedId || window.localStorage.getItem("vedantix_online_growth_audit_id") || "";
  } catch {
    return "";
  }
}

function rememberAuditId(auditId) {
  try {
    window.localStorage.setItem("vedantix_online_growth_audit_id", auditId);
    const url = new URL(window.location.href);
    url.searchParams.set("audit", auditId);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // The audit remains usable when browser storage or History API is unavailable.
  }
}

function forgetAuditId() {
  try {
    window.localStorage.removeItem("vedantix_online_growth_audit_id");
    const url = new URL(window.location.href);
    url.searchParams.delete("audit");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // The page remains usable when browser storage or History API is unavailable.
  }
}

function StatusBadge({ status }) {
  return (
    <span className={`audit-status-badge ${String(status || "PENDING").toLowerCase()}`}>
      {status === "COMPLETED" ? (
        <CheckCircle2 size={16} aria-hidden="true" />
      ) : status === "FAILED" ? (
        <AlertTriangle size={16} aria-hidden="true" />
      ) : (
        <Loader2 size={16} aria-hidden="true" className="spin" />
      )}
      {STATUS_LABELS[status] || STATUS_LABELS.PENDING}
    </span>
  );
}

function ScoreCard({ score, auditedUrl, onConnect, onRerun, isRerunning }) {
  const tone = scoreTone(score.score);
  const failedChecks = score.evidenceItems?.filter((item) => item.status === "FAIL") || [];
  const passedChecks = score.evidenceItems?.filter((item) => item.status === "PASS") || [];
  const connectionGuide = CONNECTION_GUIDES[score.key];
  const pageSpeedUrl = auditedUrl
    ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(auditedUrl)}`
    : "https://pagespeed.web.dev/";
  return (
    <article className={`audit-score-card ${tone}`}>
      <div>
        <p>{score.label}</p>
        <strong>{scoreLabel(score.score)}</strong>
      </div>
      <div className="audit-score-meta">
        <span>{MODULE_STATUS_LABELS[score.status] || score.status}</span>
        <span>{confidenceLabel(score.confidence)}</span>
        {score.totalChecks ? <span>{score.measuredChecks}/{score.totalChecks} controles</span> : null}
      </div>
      <p>{score.summary}</p>
      {score.recommendations?.[0] ? <em>{score.recommendations[0]}</em> : null}
      {score.key === "performance" && score.score === null ? (
        <div className="audit-card-actions">
          <a href={pageSpeedUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={15} aria-hidden="true" />
            Open losse PageSpeed-test
          </a>
          <button type="button" onClick={onRerun} disabled={isRerunning}>
            <RefreshCw size={15} aria-hidden="true" className={isRerunning ? "spin" : ""} />
            Hele audit opnieuw uitvoeren
          </button>
        </div>
      ) : null}
      {connectionGuide ? (
        <div className="audit-card-actions">
          <button type="button" onClick={() => onConnect(score.key)}>
            <Link2 size={15} aria-hidden="true" />
            Bron koppelen
          </button>
        </div>
      ) : null}
      {score.evidenceItems?.length ? (
        <details className="audit-evidence">
          <summary>Bekijk bewijs en controles</summary>
          <ul>
            {[...failedChecks, ...passedChecks].slice(0, 8).map((item) => (
              <li key={item.check} className={item.status.toLowerCase()}>
                <strong>{item.label}</strong>
                <span>{item.observed}</span>
                <small>Bron: {item.source}</small>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

function PriorityColumn({ label, items }) {
  return (
    <article className="audit-priority-card">
      <h3>{label}</h3>
      {items?.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>Geen directe punten.</p>
      )}
    </article>
  );
}

function CompetitorTable({ competitors }) {
  if (!competitors?.length) return null;

  return (
    <section className="audit-section-card" aria-labelledby="competitors-title">
      <div className="audit-section-heading">
        <p>Vergelijking</p>
        <h2 id="competitors-title">Concurrentieanalyse</h2>
      </div>
      <div className="audit-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Website</th>
              <th>Status</th>
              <th>SEO</th>
              <th>Reviews</th>
              <th>FAQ</th>
              <th>Speed</th>
              <th>Google Business</th>
              <th>Conversie</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor) => (
              <tr key={competitor.url}>
                <td>{competitor.url}</td>
                <td>{competitor.status === "FAILED" ? "Mislukt" : competitor.status === "PARTIAL" ? "Deels gemeten" : "Gemeten"}</td>
                <td>{scoreLabel(competitor.seoScore)}</td>
                <td>{metricLabel(competitor.reviewSignals)}</td>
                <td>{metricLabel(competitor.faqCount)}</td>
                <td>{scoreLabel(competitor.speedScore)}</td>
                <td>{metricLabel(competitor.googleBusinessSignals)}</td>
                <td>{metricLabel(competitor.conversionSignals)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function OnlineGrowthAudit() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [auditId, setAuditId] = useState(auditIdFromBrowser);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [connectionKey, setConnectionKey] = useState("");
  const resultRef = useRef(null);

  const status = audit?.status || (auditId ? "PENDING" : null);
  const results = audit?.results || null;
  const isActive = status === "PENDING" || status === "RUNNING";

  const whatsappUrl = useMemo(() => {
    const message = results
      ? `Hallo Vedantix, mijn Online Groei Audit is afgerond met score ${results.overallScore ?? "UNKNOWN"}/100. Ik wil graag een vrijblijvend gesprek plannen.`
      : "Hallo Vedantix, ik wil graag een Online Groei Audit bespreken.";
    return `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
  }, [results]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const refreshAudit = async (id = auditId, options = {}) => {
    if (!id) return null;
    if (!options.silent) setIsRefreshing(true);
    try {
      const nextAudit = await fetchOnlineGrowthAudit(id);
      setAudit(nextAudit);
      setError("");
      return nextAudit;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Audit ophalen is mislukt.";
      setError(message);
      if (/niet gevonden/i.test(message)) {
        setAuditId("");
        setAudit(null);
        forgetAuditId();
      }
      return null;
    } finally {
      if (!options.silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!auditId) return undefined;
    void refreshAudit(auditId, { silent: true });
    return undefined;
  }, [auditId]);

  useEffect(() => {
    if (!auditId || !isActive) return undefined;
    const interval = window.setInterval(() => {
      void refreshAudit(auditId, { silent: true });
    }, 2500);
    return () => window.clearInterval(interval);
  }, [auditId, isActive]);

  useEffect(() => {
    if (results) {
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [results]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.companyName.trim() || !form.email.trim() || !form.websiteUrl.trim()) {
      setError("Vul naam, bedrijfsnaam, e-mailadres en website URL in om de audit te starten.");
      return;
    }

    setIsStarting(true);
    try {
      const started = await startOnlineGrowthAudit({
        name: form.name,
        companyName: form.companyName,
        email: form.email,
        websiteUrl: form.websiteUrl,
        competitorUrl1: form.competitorUrl1,
        competitorUrl2: form.competitorUrl2,
      });
      setAuditId(started.auditId);
      setAudit({ auditId: started.auditId, status: started.status });
      rememberAuditId(started.auditId);
      await refreshAudit(started.auditId, { silent: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Audit starten is mislukt.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleRerun = async () => {
    if (!auditId || isRerunning) return;
    setIsRerunning(true);
    setError("");
    try {
      const started = await rerunOnlineGrowthAudit(auditId);
      setAuditId(started.auditId);
      setAudit({ auditId: started.auditId, status: started.status });
      rememberAuditId(started.auditId);
      await refreshAudit(started.auditId, { silent: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Audit opnieuw uitvoeren is mislukt.");
    } finally {
      setIsRerunning(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!auditId) return;
    setIsDownloading(true);
    setError("");
    try {
      const { blob, filename } = await downloadOnlineGrowthAuditPdf(auditId);
      saveBlob(blob, filename);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "PDF downloaden is mislukt.");
    } finally {
      setIsDownloading(false);
    }
  };

  const clearAudit = () => {
    const previousRequest = audit?.request;
    setAuditId("");
    setAudit(null);
    setError("");
    setForm({
      ...INITIAL_FORM,
      name: previousRequest?.name || form.name,
      companyName: previousRequest?.companyName || form.companyName,
      email: previousRequest?.email || form.email,
    });
    forgetAuditId();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const connectionGuide = CONNECTION_GUIDES[connectionKey];
  const connectionRequestUrl = useMemo(() => {
    if (!connectionGuide) return whatsappUrl;
    const website = audit?.request?.websiteUrl || results?.auditedUrl || form.websiteUrl;
    const message = `Hallo Vedantix, ik wil ${connectionGuide.title.toLowerCase()} voor ${website || "mijn website"}. Audit ID: ${auditId || "nog niet beschikbaar"}.`;
    return `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
  }, [audit?.request?.websiteUrl, auditId, connectionGuide, form.websiteUrl, results?.auditedUrl, whatsappUrl]);

  return (
    <>
      <SEO
        title="Gratis Online Groei Audit | Vedantix"
        description="Start een backend-gedreven Online Groei Audit en ontdek kansen voor SEO, GEO, AEO, AI-zichtbaarheid, security, reviews, conversie en lokale vindbaarheid."
        canonical={canonical}
        schemas={[serviceSchema, faqSchema, breadcrumbSchema]}
      />
      <style>{AUDIT_STYLES}</style>

      <div className="audit-page">
        <NavBar />
        <main className="audit-shell">
          <section className="audit-hero" aria-labelledby="audit-title">
            <div className="audit-panel audit-hero-copy">
              <div className="audit-kicker">
                <Sparkles size={16} aria-hidden="true" />
                Online Groei Audit™
              </div>
              <h1 id="audit-title">Ontdek waar jouw website groei laat liggen</h1>
              <p>
                Vul je gegevens in. De auditor rendert ook JavaScript-websites en laat per
                controle zien wat werkelijk is gevonden, welke bron is gebruikt en wat niet
                betrouwbaar kon worden gemeten.
              </p>
              <div className="audit-feature-grid">
                {FEATURE_CARDS.map(({ icon: Icon, title, text }) => (
                  <article key={title}>
                    <Icon size={22} aria-hidden="true" />
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </article>
                ))}
              </div>
            </div>

            <form className="audit-panel audit-form" onSubmit={handleSubmit}>
              <div className="audit-form-grid">
                <label>
                  <span>Naam</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  <span>Bedrijfsnaam</span>
                  <input
                    value={form.companyName}
                    onChange={(event) => updateField("companyName", event.target.value)}
                    autoComplete="organization"
                    required
                  />
                </label>
                <label>
                  <span>E-mailadres</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  <span>Website URL</span>
                  <input
                    value={form.websiteUrl}
                    onChange={(event) => updateField("websiteUrl", event.target.value)}
                    placeholder="https://jouwbedrijf.nl"
                    inputMode="url"
                    required
                  />
                </label>
                <label>
                  <span>Concurrent URL 1 <em>optioneel</em></span>
                  <input
                    value={form.competitorUrl1}
                    onChange={(event) => updateField("competitorUrl1", event.target.value)}
                    placeholder="https://concurrent.nl"
                    inputMode="url"
                  />
                </label>
                <label>
                  <span>Concurrent URL 2 <em>optioneel</em></span>
                  <input
                    value={form.competitorUrl2}
                    onChange={(event) => updateField("competitorUrl2", event.target.value)}
                    placeholder="https://andere-concurrent.nl"
                    inputMode="url"
                  />
                </label>
              </div>

              {error ? (
                <div className="audit-error" role="alert">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button className="audit-submit" type="submit" disabled={isStarting}>
                {isStarting ? (
                  <Loader2 size={18} aria-hidden="true" className="spin" />
                ) : (
                  <ArrowRight size={18} aria-hidden="true" />
                )}
                Start gratis audit
              </button>
            </form>
          </section>

          {status ? (
            <section className="audit-status-panel" aria-live="polite">
              <div>
                <StatusBadge status={status} />
                <p>
                  Audit ID: <strong>{auditId}</strong>
                </p>
              </div>
              <div className="audit-status-actions">
                <button type="button" onClick={() => refreshAudit()} disabled={isRefreshing}>
                  <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? "spin" : ""} />
                  Status verversen
                </button>
                {results ? (
                  <button type="button" onClick={handleRerun} disabled={isRerunning}>
                    <RefreshCw size={16} aria-hidden="true" className={isRerunning ? "spin" : ""} />
                    Audit opnieuw uitvoeren
                  </button>
                ) : null}
                <button type="button" onClick={clearAudit} className="audit-secondary-button">
                  Andere website controleren
                </button>
              </div>
            </section>
          ) : null}

          {isActive ? (
            <section className="audit-progress-card">
              <Clock3 size={28} aria-hidden="true" />
              <div>
                <h2>Onze systemen zijn achter de schermen voor je bezig</h2>
                <p>
                  Je website wordt stap voor stap geanalyseerd. Je hoeft deze pagina niet open te
                  houden; als je later terugkomt, halen we de voortgang automatisch weer voor je op.
                </p>
              </div>
            </section>
          ) : null}

          {status === "FAILED" ? (
            <section className="audit-progress-card failed">
              <AlertTriangle size={28} aria-hidden="true" />
              <div>
                <h2>Audit mislukt</h2>
                <p>{audit?.request?.errorMessage || "De analyse kon niet worden afgerond."}</p>
              </div>
            </section>
          ) : null}

          {results ? (
            <section className="audit-results" ref={resultRef}>
              <div className="audit-result-hero">
                <div>
                  <p>Online Groei Score</p>
                  <strong>{scoreLabel(results.overallScore)}</strong>
                  <div className="audit-result-meta">
                    <span>{confidenceLabel(results.overallConfidence)}</span>
                    <span>{results.measuredWeightPercent ?? "?"}% scoregewicht gemeten</span>
                    <span>{results.pagesAnalyzed ?? "?"} pagina’s geanalyseerd</span>
                    <span>Meetmodel v{results.auditVersion || "2"}</span>
                  </div>
                  <span>{results.executiveSummary}</span>
                </div>
                <div className="audit-result-actions">
                  <button type="button" onClick={handleRerun} disabled={isRerunning}>
                    <RefreshCw size={18} aria-hidden="true" className={isRerunning ? "spin" : ""} />
                    Audit opnieuw uitvoeren
                  </button>
                  <button type="button" onClick={clearAudit} className="secondary">
                    Andere website controleren
                  </button>
                  <button type="button" onClick={handleDownloadPdf} disabled={isDownloading}>
                    {isDownloading ? (
                      <Loader2 size={18} aria-hidden="true" className="spin" />
                    ) : (
                      <Download size={18} aria-hidden="true" />
                    )}
                    Download PDF
                  </button>
                </div>
              </div>

              <section className="audit-section-card" aria-labelledby="scores-title">
                <div className="audit-section-heading">
                  <p>Scorecards</p>
                  <h2 id="scores-title">Analyse per categorie</h2>
                </div>
                <div className="audit-score-grid">
                  {results.scores?.map((score) => (
                    <ScoreCard
                      key={score.key}
                      score={score}
                      auditedUrl={results.finalUrl || results.auditedUrl}
                      onConnect={setConnectionKey}
                      onRerun={handleRerun}
                      isRerunning={isRerunning}
                    />
                  ))}
                </div>
              </section>

              <section className="audit-section-card" aria-labelledby="priority-title">
                <div className="audit-section-heading">
                  <p>Actieplan</p>
                  <h2 id="priority-title">Prioriteitenmatrix</h2>
                </div>
                <div className="audit-priority-grid">
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <PriorityColumn
                      key={key}
                      label={label}
                      items={results.priorityMatrix?.[key] || []}
                    />
                  ))}
                </div>
              </section>

              <section className="audit-section-card audit-list-grid" aria-labelledby="wins-title">
                <div>
                  <div className="audit-section-heading">
                    <p>Snel verbeteren</p>
                    <h2 id="wins-title">Quick wins</h2>
                  </div>
                  <ul>
                    {results.quickWins?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="audit-section-heading">
                    <p>Roadmap</p>
                    <h2>Aanbevelingen</h2>
                  </div>
                  <ul>
                    {results.recommendations?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <CompetitorTable competitors={results.competitors} />

              {results.limitations?.length ? (
                <section className="audit-section-card audit-limitations" aria-labelledby="limitations-title">
                  <div className="audit-section-heading">
                    <p>Transparantie</p>
                    <h2 id="limitations-title">Wat deze audit wel en niet bewijst</h2>
                  </div>
                  <ul>
                    {results.limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="audit-final-cta">
                <div>
                  <FileText size={26} aria-hidden="true" />
                  <h2>Bespreek je belangrijkste groeikansen</h2>
                  <p>
                    We vertalen de gemeten signalen naar concrete experimenten voor
                    zichtbaarheid, vertrouwen en conversie. Resultaten zijn nooit gegarandeerd.
                  </p>
                </div>
                <div>
                  <Link to="/planning">Plan een gesprek</Link>
                  <a href={whatsappUrl}>WhatsApp Vedantix</a>
                </div>
              </section>
            </section>
          ) : null}
        </main>
        {connectionGuide ? (
          <div className="audit-dialog-backdrop" role="presentation" onMouseDown={() => setConnectionKey("")}>
            <section
              className="audit-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="audit-dialog-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="audit-dialog-close"
                onClick={() => setConnectionKey("")}
                aria-label="Venster sluiten"
              >
                <X size={20} aria-hidden="true" />
              </button>
              <div className="audit-dialog-icon"><Link2 size={22} aria-hidden="true" /></div>
              <h2 id="audit-dialog-title">{connectionGuide.title}</h2>
              <p>{connectionGuide.intro}</p>
              <ol>
                {connectionGuide.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className="audit-dialog-notice">
                Dit is bewust geen directe openbare login: eerst moet worden vastgesteld dat de aanvrager eigenaar of beheerder van de website is.
              </div>
              <div className="audit-dialog-actions">
                <a href={connectionRequestUrl}>Koppeling aanvragen via WhatsApp</a>
                <button type="button" onClick={() => setConnectionKey("")}>Sluiten</button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}

const AUDIT_STYLES = `
.audit-page {
  min-height: 100vh;
  background: #f4f7fb;
  color: #0f172a;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.audit-page a {
  text-decoration: none;
}

.audit-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 118px 0 74px;
}

.audit-hero {
  display: grid;
  gap: 18px;
  align-items: start;
}

.audit-panel,
.audit-section-card,
.audit-status-panel,
.audit-progress-card,
.audit-result-hero,
.audit-final-cta {
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, .07);
}

.audit-hero-copy {
  padding: clamp(24px, 5vw, 42px);
  color: #fff;
  background:
    radial-gradient(circle at 82% 15%, rgba(96, 165, 250, .26), transparent 32%),
    radial-gradient(circle at 20% 82%, rgba(34, 197, 94, .16), transparent 30%),
    linear-gradient(145deg, #061023, #0c1f3d 58%, #0e2c52);
}

.audit-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin-bottom: 18px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 999px;
  background: rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .88);
  font-size: .72rem;
  font-weight: 950;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.audit-hero h1 {
  max-width: 720px;
  margin: 0;
  color: #fff;
  font-size: clamp(2.55rem, 9vw, 5rem);
  font-weight: 950;
  line-height: .98;
  letter-spacing: 0;
}

.audit-hero-copy > p {
  max-width: 680px;
  margin: 18px 0 0;
  color: rgba(255, 255, 255, .78);
  font-size: 1.05rem;
  line-height: 1.75;
}

.audit-feature-grid {
  display: grid;
  gap: 12px;
  margin-top: 26px;
}

.audit-feature-grid article {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, .13);
  border-radius: 8px;
  background: rgba(255, 255, 255, .07);
}

.audit-feature-grid svg {
  color: #93c5fd;
}

.audit-feature-grid strong {
  color: #fff;
  font-size: .98rem;
}

.audit-feature-grid span {
  color: rgba(255, 255, 255, .72);
  font-size: .88rem;
  line-height: 1.55;
}

.audit-form {
  padding: clamp(22px, 4vw, 30px);
}

.audit-form-grid {
  display: grid;
  gap: 14px;
}

.audit-form label {
  display: grid;
  gap: 7px;
}

.audit-form span {
  color: #334155;
  font-size: .84rem;
  font-weight: 900;
}

.audit-form em {
  color: #94a3b8;
  font-style: normal;
  font-weight: 760;
}

.audit-form input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font: inherit;
  outline: none;
}

.audit-form input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .11);
}

.audit-submit,
.audit-status-panel button,
.audit-result-hero button,
.audit-final-cta a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 950;
  cursor: pointer;
}

.audit-submit {
  width: 100%;
  margin-top: 18px;
  background: #0f172a;
  color: #fff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, .18);
}

.audit-submit:disabled,
.audit-status-panel button:disabled,
.audit-result-hero button:disabled,
.audit-card-actions button:disabled {
  cursor: not-allowed;
  opacity: .68;
}

.audit-error {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 16px;
  padding: 13px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff1f2;
  color: #b91c1c;
  font-size: .9rem;
  font-weight: 850;
}

.audit-status-panel,
.audit-progress-card,
.audit-result-hero,
.audit-section-card,
.audit-final-cta {
  margin-top: 18px;
}

.audit-status-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
}

.audit-status-actions,
.audit-result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.audit-status-panel p {
  margin: 10px 0 0;
  color: #64748b;
  font-size: .85rem;
}

.audit-status-panel button {
  padding: 0 14px;
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.audit-status-panel .audit-secondary-button {
  border-color: #e2e8f0;
  background: #fff;
  color: #475569;
}

.audit-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: .78rem;
  font-weight: 950;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.audit-status-badge.completed {
  background: #ecfdf5;
  color: #059669;
}

.audit-status-badge.failed {
  background: #fff1f2;
  color: #dc2626;
}

.audit-progress-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 20px;
}

.audit-progress-card svg {
  flex: 0 0 auto;
  color: #2563eb;
}

.audit-progress-card.failed svg {
  color: #dc2626;
}

.audit-progress-card h2 {
  margin: 0 0 5px;
  font-size: 1.16rem;
  font-weight: 950;
}

.audit-progress-card p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

.audit-result-hero {
  display: grid;
  gap: 18px;
  padding: 24px;
  background: linear-gradient(145deg, #071225, #0d2a52);
  color: #fff;
}

.audit-result-hero p {
  margin: 0 0 8px;
  color: #93c5fd;
  font-size: .78rem;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.audit-result-hero strong {
  display: block;
  margin-bottom: 10px;
  font-size: clamp(2.7rem, 10vw, 4.7rem);
  font-weight: 950;
  line-height: .95;
}

.audit-result-hero span {
  display: block;
  max-width: 780px;
  color: rgba(255, 255, 255, .78);
  line-height: 1.7;
}

.audit-result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0 0 12px;
}

.audit-result-meta span {
  width: auto;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 999px;
  background: rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .88);
  font-size: .72rem;
  font-weight: 850;
  line-height: 1.2;
}

.audit-result-hero button {
  width: 100%;
  padding: 0 18px;
  background: #fff;
  color: #0f172a;
}

.audit-result-hero button.secondary {
  border-color: rgba(255, 255, 255, .34);
  background: transparent;
  color: #fff;
}

.audit-result-actions {
  display: grid;
}

.audit-section-card {
  padding: 22px;
}

.audit-section-heading {
  margin-bottom: 16px;
}

.audit-section-heading p {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: .72rem;
  font-weight: 950;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.audit-section-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.45rem, 5vw, 2.25rem);
  font-weight: 950;
  line-height: 1.06;
}

.audit-score-grid,
.audit-priority-grid,
.audit-list-grid {
  display: grid;
  gap: 14px;
}

.audit-score-card,
.audit-priority-card {
  padding: 17px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #f8fafc;
}

.audit-score-card.good {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.audit-score-card.mid {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.audit-score-card.low {
  border-color: #fed7aa;
  background: #fff7ed;
}

.audit-score-card.unknown {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.audit-score-card > div {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
}

.audit-score-card p {
  margin: 0;
  color: #64748b;
  font-size: .86rem;
  line-height: 1.55;
}

.audit-score-card strong {
  color: #0f172a;
  font-size: 1.55rem;
  font-weight: 950;
  white-space: nowrap;
}

.audit-score-card .audit-score-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
  margin: 10px 0;
}

.audit-score-meta span {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(37, 99, 235, .08);
  color: #1d4ed8;
  font-size: .66rem;
  font-weight: 900;
  letter-spacing: .025em;
}

.audit-score-card em {
  display: block;
  margin-top: 10px;
  color: #334155;
  font-size: .84rem;
  font-style: normal;
  font-weight: 850;
  line-height: 1.5;
}

.audit-card-actions {
  display: grid !important;
  gap: 8px !important;
  margin-top: 14px;
}

.audit-card-actions a,
.audit-card-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 8px 11px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #fff;
  color: #1d4ed8;
  font: inherit;
  font-size: .76rem;
  font-weight: 900;
  cursor: pointer;
}

.audit-card-actions button {
  border-color: #dbe4f0;
  color: #334155;
}

.audit-evidence {
  margin-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, .35);
  padding-top: 10px;
}

.audit-evidence summary {
  color: #1d4ed8;
  font-size: .78rem;
  font-weight: 900;
  cursor: pointer;
}

.audit-evidence ul {
  display: grid;
  gap: 8px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.audit-evidence li {
  display: grid;
  gap: 2px;
  padding-left: 10px;
  border-left: 3px solid #16a34a;
}

.audit-evidence li.fail {
  border-left-color: #ea580c;
}

.audit-evidence li strong,
.audit-evidence li span,
.audit-evidence li small {
  color: #334155;
  font-size: .75rem;
  line-height: 1.4;
}

.audit-evidence li small {
  color: #64748b;
}

.audit-limitations ul {
  display: grid;
  gap: 9px;
  margin: 0;
  padding-left: 20px;
  color: #475569;
  font-size: .88rem;
  line-height: 1.55;
}

.audit-priority-card h3 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 950;
}

.audit-priority-card ul,
.audit-list-grid ul {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.audit-priority-card li,
.audit-list-grid li {
  position: relative;
  padding-left: 18px;
  color: #334155;
  font-size: .91rem;
  line-height: 1.55;
}

.audit-priority-card li::before,
.audit-list-grid li::before {
  position: absolute;
  top: .62em;
  left: 0;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #2563eb;
  content: "";
}

.audit-priority-card p {
  margin: 0;
  color: #64748b;
}

.audit-table-wrap {
  overflow-x: auto;
}

.audit-table-wrap table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.audit-table-wrap th,
.audit-table-wrap td {
  padding: 12px 10px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

.audit-table-wrap th {
  color: #64748b;
  font-size: .72rem;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.audit-table-wrap td {
  color: #334155;
  font-size: .88rem;
}

.audit-final-cta {
  display: grid;
  gap: 18px;
  padding: 24px;
}

.audit-final-cta h2 {
  margin: 10px 0 8px;
  color: #0f172a;
  font-size: 1.55rem;
  font-weight: 950;
}

.audit-final-cta p {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.audit-final-cta > div:last-child {
  display: grid;
  gap: 10px;
}

.audit-final-cta a {
  padding: 0 16px;
  background: #0f172a;
  color: #fff;
}

.audit-final-cta a:last-child {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.audit-dialog-backdrop {
  position: fixed;
  z-index: 2000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(2, 6, 23, .72);
  backdrop-filter: blur(5px);
}

.audit-dialog {
  position: relative;
  width: min(600px, 100%);
  max-height: min(760px, calc(100vh - 36px));
  overflow-y: auto;
  padding: clamp(24px, 5vw, 36px);
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 30px 90px rgba(2, 6, 23, .3);
}

.audit-dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.audit-dialog-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
}

.audit-dialog h2 {
  margin: 18px 44px 8px 0;
  font-size: clamp(1.45rem, 5vw, 2rem);
  line-height: 1.08;
}

.audit-dialog > p,
.audit-dialog li {
  color: #475569;
  line-height: 1.65;
}

.audit-dialog ol {
  display: grid;
  gap: 8px;
  padding-left: 22px;
}

.audit-dialog-notice {
  margin-top: 18px;
  padding: 13px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  font-size: .84rem;
  font-weight: 800;
  line-height: 1.55;
}

.audit-dialog-actions {
  display: grid;
  gap: 9px;
  margin-top: 20px;
}

.audit-dialog-actions a,
.audit-dialog-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid #0f172a;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.audit-dialog-actions button {
  border-color: #dbe4f0;
  background: #fff;
  color: #475569;
}

.spin {
  animation: audit-spin .9s linear infinite;
}

@keyframes audit-spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 760px) {
  .audit-hero {
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, .75fr);
  }

  .audit-feature-grid,
  .audit-score-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .audit-form-grid,
  .audit-priority-grid,
  .audit-list-grid,
  .audit-final-cta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .audit-result-hero {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .audit-result-hero button {
    width: auto;
  }

  .audit-result-actions {
    min-width: 250px;
  }

  .audit-dialog-actions {
    grid-template-columns: 1fr auto;
  }
}

@media (min-width: 1100px) {
  .audit-score-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .audit-shell {
    width: min(100% - 24px, 1180px);
    padding-top: 104px;
  }
}
`;
