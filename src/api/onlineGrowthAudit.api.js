const LEGACY_AUDIT_MESSAGE =
  "De automatische Online Groei Audit wordt momenteel gemigreerd naar de nieuwe Vedantix-infrastructuur. Er wordt geen verbinding meer gemaakt met de oude api.vedantix.nl-backend. Neem contact op met Vedantix voor een handmatige audit.";

function unavailable() {
  throw new Error(LEGACY_AUDIT_MESSAGE);
}

export async function startOnlineGrowthAudit() {
  return unavailable();
}

export async function fetchOnlineGrowthAudit() {
  return unavailable();
}

export async function rerunOnlineGrowthAudit() {
  return unavailable();
}

export async function downloadOnlineGrowthAuditPdf() {
  return unavailable();
}
