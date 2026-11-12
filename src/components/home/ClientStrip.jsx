import { safeLogoUrl } from "../../lib/public-content";
import { buildClientStrip } from "../../data/proof";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function ClientStrip({ clients }) {
  const tiles = buildClientStrip(clients);
  const hasPlaceholders = tiles.some((tile) => tile.placeholder);
  return (
    <div className="vx-clients">
      <ul className="vx-clients__list" aria-label="Klanten van Vedantix">
        {tiles.map((client) => {
          const logo = client.placeholder ? null : safeLogoUrl(client.logo);
          return (
            <li key={client.id} className={`vx-clients__tile${client.placeholder ? " is-placeholder" : ""}`}>
              {logo
                ? <img src={logo} alt="" width="36" height="36" loading="lazy" decoding="async" />
                : <span className="vx-clients__mark" aria-hidden="true">{initials(client.name)}</span>}
              <span className="vx-clients__name">{client.name}</span>
              {client.placeholder ? <em className="vx-clients__tag">voorbeeld</em> : null}
            </li>
          );
        })}
      </ul>
      {hasPlaceholders ? <p className="vx-clients__note">Voorbeeldweergave: de getoonde voorbeeldbedrijven zijn fictief en worden vervangen door echte klanten.</p> : null}
    </div>
  );
}
