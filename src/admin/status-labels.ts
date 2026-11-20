// Eén plek voor de vertaling van technische statuscodes naar gewoon Nederlands in het Control Center.
const STATUS_LABELS: Record<string, string> = {
  HEALTHY: "Gezond",
  WARNING: "Waarschuwing",
  ERROR: "Probleem",
  UNKNOWN: "Onbekend",
  PASS: "In orde",
  FAIL: "Fout",
  SUCCEEDED: "Gelukt",
  SUCCESS: "Gelukt",
  FAILED: "Mislukt",
  RUNNING: "Bezig",
  PENDING: "In afwachting",
  QUEUED: "In wachtrij",
  SENT: "Verzonden",
  SKIPPED: "Overgeslagen",
  OPEN: "Open",
  ACKNOWLEDGED: "Bevestigd",
  RESOLVED: "Opgelost",
  CRITICAL: "Kritiek",
  INFO: "Info",
};

export function statusLabel(value?: string | null): string {
  if (!value) return "Onbekend";
  return STATUS_LABELS[value.toUpperCase()] ?? value;
}

const CHECK_LABELS: Record<string, string> = {
  DNS: "DNS",
  MX: "E-mail ontvangen (MX)",
  SPF: "Afzenderbeveiliging (SPF)",
  DKIM: "Ondertekening (DKIM)",
  DMARC: "Spoofingbeleid (DMARC)",
  SSL: "Beveiligde verbinding (SSL)",
  EXPIRY: "Verloopdatum",
  WEBSITE: "Website bereikbaar",
};

export function checkLabel(value?: string | null): string {
  if (!value) return "Controle";
  return CHECK_LABELS[value.toUpperCase()] ?? value;
}

const EVENT_LABELS: Record<string, string> = {
  ALERT_OPENED: "Probleem gemeld",
  ALERT_RESOLVED: "Hersteld",
  CONTACT_ENQUIRY: "Nieuwe aanvraag",
};

export function eventLabel(value?: string | null): string {
  if (!value) return "Melding";
  return EVENT_LABELS[value] ?? value;
}
