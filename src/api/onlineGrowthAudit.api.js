const AUDIT_MESSAGE =
  "De automatische Online Groei Audit wordt momenteel gemigreerd naar de nieuwe Vedantix-infrastructuur. Neem contact op met Vedantix voor een handmatige audit.";

function unavailable() {
  throw new Error(AUDIT_MESSAGE);
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
