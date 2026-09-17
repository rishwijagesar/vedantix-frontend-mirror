import { useId, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { fetchPublicCases, safeWebsiteUrl, safeLogoUrl } from "../../lib/public-content";
import { usePublicContent } from "../../lib/use-public-content";
import "../../styles/client-cases.css";

function ClientCaseCard({ client, compact }) {
  const [expanded, setExpanded] = useState(!compact);
  const contentId = useId();
  const website = safeWebsiteUrl(client.website);
  const logo = safeLogoUrl(client.logo);
  const domain = website ? new URL(website).hostname.replace(/^www\./, "") : "";

  return (
    <article className={`client-case${expanded ? " client-case--expanded" : ""}`}>
      <header className="client-case__header">
        <div className="client-case__logo">
          {logo ? (
            <img src={logo} alt={`${client.name} logo`} width="96" height="96" loading="lazy" decoding="async" />
          ) : (
            <span aria-hidden="true">{client.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="client-case__identity">
          <div className="client-case__meta">
            {client.status ? <span className="client-case__status">{client.status}</span> : null}
            <span className="client-case__branch">{client.branch}</span>
          </div>
          <h3>{client.name}</h3>
          {domain ? <span className="client-case__domain">{domain}</span> : null}
        </div>
      </header>

      <div id={contentId} className="client-case__content">
        <p className="client-case__summary">{client.summary}</p>
        {client.outcome ? (
          <div className="client-case__outcome">
            <span className="client-case__outcome-label">Het resultaat</span>
            <p>{client.outcome}</p>
          </div>
        ) : null}
      </div>

      <footer className="client-case__footer">
        {compact ? (
          <button
            type="button"
            className="client-case__more"
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={`${expanded ? "Minder" : "Meer"} over ${client.name}`}
            onClick={() => setExpanded(value => !value)}
          >
            {expanded ? "Minder tonen" : "Over dit project"}
            <ArrowDown size={15} aria-hidden="true" />
          </button>
        ) : null}
        {website ? (
          <a href={website} target="_blank" rel="noopener noreferrer" className="client-case__visit" aria-label={`Bekijk de website van ${client.name} (opent in een nieuw tabblad)`}>
            Bekijk website <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        ) : null}
      </footer>
    </article>
  );
}

export default function ClientCasesSection({ initialCases = null, placement = "home" }) {
  const { data } = usePublicContent(fetchPublicCases, initialCases);
  const compact = placement === "home";
  const clients = data.filter(client => compact ? client.show_on_home : client.show_on_results);
  if (!clients.length) return null;

  return (
    <section className={`client-cases${compact ? "" : " client-cases--results"}`} aria-label="Klantcases">
      <div className="client-cases__container">
        <div className="client-cases__heading">
          <div>
            <span className="client-cases__eyebrow">Gemaakt door Vedantix</span>
            <h2>Een kijkje in ons werk.</h2>
            <p>Websites die passen bij de ondernemer erachter. Bekijk een selectie van onze projecten.</p>
          </div>
          {compact ? <a className="client-cases__all" href="/resultaten">Alle klantcases <ArrowUpRight size={18} aria-hidden="true" /></a> : null}
        </div>
        <div className={`client-cases__grid${clients.length === 1 ? " client-cases__grid--single" : ""}`}>
          {clients.map(client => <ClientCaseCard key={client.id} client={client} compact={compact} />)}
        </div>
      </div>
    </section>
  );
}
