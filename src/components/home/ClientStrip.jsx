import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { safeLogoUrl } from "../../lib/public-content";
import { buildClientStrip } from "../../data/proof";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Tile({ client }) {
  const logo = client.placeholder ? null : safeLogoUrl(client.logo);
  return (
    <li className={`vx-clients__tile${client.placeholder ? " is-placeholder" : ""}`}>
      {logo
        ? <img src={logo} alt="" width="36" height="36" loading="lazy" decoding="async" />
        : <span className="vx-clients__mark" aria-hidden="true">{initials(client.name)}</span>}
      <span className="vx-clients__name">{client.name}</span>
      {client.placeholder ? <em className="vx-clients__tag">voorbeeld</em> : null}
    </li>
  );
}

/** Doorlopende banner met klanten. Pauzeerbaar, en bij "minder beweging" een gewoon raster. */
export default function ClientStrip({ clients }) {
  const tiles = buildClientStrip(clients);
  const [paused, setPaused] = useState(false);
  const hasPlaceholders = tiles.some((tile) => tile.placeholder);
  return (
    <div className={`vx-clients${paused ? " is-paused" : ""}`}>
      <div className="vx-clients__viewport">
        <div className="vx-clients__track">
          <ul className="vx-clients__list" aria-label="Klanten van Vedantix">
            {tiles.map((client) => <Tile key={client.id} client={client} />)}
          </ul>
          <ul className="vx-clients__list vx-clients__list--copy" aria-hidden="true">
            {tiles.map((client) => <Tile key={`copy-${client.id}`} client={client} />)}
          </ul>
        </div>
      </div>
      <div className="vx-clients__foot">
        {hasPlaceholders ? <p className="vx-clients__note">Voorbeeldweergave: de getoonde voorbeeldbedrijven zijn fictief en worden vervangen door echte klanten.</p> : <span />}
        <button type="button" className="vx-clients__toggle" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? "Banner afspelen" : "Banner pauzeren"}
        </button>
      </div>
    </div>
  );
}
