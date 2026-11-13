/**
 * Proof content for the homepage.
 *
 * The client banner shows real clients (cases with "show on home"). Until there are CLIENT_STRIP_MIN real
 * clients, it is filled with SECTOR_TILES: the branches Vedantix builds for. These are not presented as
 * clients (no company names, own styling, heading changes), so the banner never shows invented customers.
 */
export const CLIENT_STRIP_MIN = 6;

export const SECTOR_TILES = [
  { id: "sector-bouw", name: "Bouw en renovatie", sector: true },
  { id: "sector-installatie", name: "Installatietechniek", sector: true },
  { id: "sector-zorg", name: "Zorgpraktijken", sector: true },
  { id: "sector-beauty", name: "Kappers en salons", sector: true },
  { id: "sector-transport", name: "Transport en logistiek", sector: true },
  { id: "sector-advies", name: "Advies en administratie", sector: true },
];

/** @deprecated kept for older imports; sector tiles replaced the fictional placeholder clients. */
export const PLACEHOLDER_CLIENTS = SECTOR_TILES;

/** Real clients first, then sector tiles until the strip has CLIENT_STRIP_MIN tiles. */
export function buildClientStrip(realClients) {
  const real = (realClients || []).filter((client) => client?.name);
  if (real.length >= CLIENT_STRIP_MIN) return real;
  return [...real, ...SECTOR_TILES.slice(0, CLIENT_STRIP_MIN - real.length)];
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
