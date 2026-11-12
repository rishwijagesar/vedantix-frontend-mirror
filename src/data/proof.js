/**
 * Proof content for the homepage.
 *
 * PLACEHOLDER_CLIENTS are clearly fictional stand-ins so the layout can be reviewed with a full logo strip.
 * They are only shown while there are fewer real clients than CLIENT_STRIP_MIN, every tile carries a visible
 * "voorbeeld" label, and `bun run scripts/check-placeholder-content.mjs` reports how many are still in use.
 * Replace them by adding real clients in the Control Center (cases with "show on home") and, once you have
 * enough real clients, they disappear automatically.
 */
export const CLIENT_STRIP_MIN = 6;

export const PLACEHOLDER_CLIENTS = [
  { id: "placeholder-1", name: "Bouwbedrijf Voorbeeld", branch: "Bouw", placeholder: true },
  { id: "placeholder-2", name: "Installatie Voorbeeld", branch: "Installatie", placeholder: true },
  { id: "placeholder-3", name: "Zorgpraktijk Voorbeeld", branch: "Zorg en welzijn", placeholder: true },
  { id: "placeholder-4", name: "Studio Voorbeeld", branch: "Creatief", placeholder: true },
  { id: "placeholder-5", name: "Transport Voorbeeld", branch: "Transport", placeholder: true },
  { id: "placeholder-6", name: "Advies Voorbeeld", branch: "Zakelijke dienstverlening", placeholder: true },
];

/** Real clients first, then labelled placeholders until the strip has CLIENT_STRIP_MIN tiles. */
export function buildClientStrip(realClients) {
  const real = (realClients || []).filter((client) => client?.name);
  if (real.length >= CLIENT_STRIP_MIN) return real;
  return [...real, ...PLACEHOLDER_CLIENTS.slice(0, CLIENT_STRIP_MIN - real.length)];
}

export const COMMITMENTS = [
  { title: "Vaste prijs vooraf", text: "Eenmalige opstartkosten en een vast maandbedrag. Wat erin zit, staat in je offerte." },
  { title: "Eerst akkoord, dan live", text: "Jouw team beoordeelt de afgesproken functies voordat een fase live gaat." },
  { title: "Eén vast aanspreekpunt", text: "Je praat met degene die bouwt en beheert. Geen accountmanagers ertussen." },
  { title: "Afspraken over beheer", text: "Onderhoud, support, overdracht en export leggen we vooraf vast." },
];

export const PAIN_POINTS = [
  { title: "Je typt alles dubbel over", text: "Van aanvraag naar offerte naar planning naar factuur: steeds opnieuw dezelfde gegevens in een andere tool." },
  { title: "Excel en mail zijn je systeem", text: "Niemand weet zeker welke versie klopt, en kennis zit in hoofden in plaats van in je bedrijf." },
  { title: "Abonnementen stapelen zich op", text: "Elke tool kost per gebruiker en doet net niet wat jij nodig hebt. Je betaalt voor functies die je niet gebruikt." },
  { title: "Nieuwe collega’s lopen vast", text: "Inwerken kost weken omdat het werkproces verspreid zit over losse tools en losse mensen." },
];

/**
 * Foto's van tevreden klanten. Leeg laten tot er echte foto's zijn waarvoor toestemming is.
 * Vorm: { id, src, name, company, quote? }. Alleen invullen met echte, toegestane gegevens.
 */
export const CLIENT_PHOTOS = [];
