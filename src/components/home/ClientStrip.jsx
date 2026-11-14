import { useState } from "react";
import { Building2, Pause, Play } from "lucide-react";
import { safeLogoUrl } from "../../lib/public-content";
import { buildClientStrip } from "../../data/proof";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Tile({ client }) {
  if (client.sector) {
    return (
      <li className="vx-clients__tile is-sector">
        <span className="vx-clients__mark" aria-hidden="true"><Building2 /></span>
        <span className="vx-clients__name">{client.name}</span>
      </li>
    );
  }
  const logo = safeLogoUrl(client.logo);
  return (
    <li className="vx-clients__tile">
      {logo
        ? <img src={logo} alt="" width="36" height="36" loading="lazy" decoding="async" />
        : <span className="vx-clients__mark" aria-hidden="true">{initials(client.name)}</span>}
      <span className="vx-clients__name">{client.name}</span>
    </li>
  );
}

/** Doorlopende banner met klanten. Klein pauze-icoon (WCAG 2.2.2), stopt ook bij hover of focus; bij "minder beweging" een gewoon raster. */
export default function ClientStrip({ clients }) {
  const tiles = buildClientStrip(clients);
  const [paused, setPaused] = useState(false);
  const hasSectors = tiles.some((tile) => tile.sector);
  return (
    <div className={`vx-clients${paused ? " is-paused" : ""}`}>
      <div className="vx-clients__viewport">
        <div className="vx-clients__track">
          <ul className="vx-clients__list" aria-label={hasSectors ? "Klanten en branches" : "Klanten van Vedantix"}>
            {tiles.map((client) => <Tile key={client.id} client={client} />)}
          </ul>
          <ul className="vx-clients__list vx-clients__list--copy" aria-hidden="true">
            {tiles.map((client) => <Tile key={`copy-${client.id}`} client={client} />)}
          </ul>
        </div>
      </div>
      <button type="button" className="vx-clients__pause" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Klantenbanner afspelen" : "Klantenbanner pauzeren"}>
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
    </div>
  );
}
