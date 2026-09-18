export class MailError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export type Credentials = { email: string; api_key: string };
export type MigaduCall = (path: string, method?: string, body?: unknown) => Promise<any>;
export function accountCredentials(body: any): Credentials {
  if (typeof body.email !== "string" || !/^[^\s@:]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || body.email.length > 254)
    throw new MailError("Vul het e-mailadres van je Migadu-account in.");
  if (typeof body.api_key !== "string" || !body.api_key.trim() || body.api_key.length > 4096 || /[\r\n]/.test(body.api_key))
    throw new MailError("Vul een geldige Migadu API-sleutel in.");
  return { email: body.email.trim(), api_key: body.api_key.trim() };
}
export function domainName(input: unknown): string {
  if (typeof input !== "string") throw new MailError("Ongeldig domein.");
  const name = input.toLowerCase().trim();
  if (name.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(name))
    throw new MailError("Ongeldig domein.");
  return name;
}
export function localPart(input: unknown): string {
  if (typeof input !== "string") throw new MailError("Vul de naam vóór het @-teken in.");
  const value = input.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/.test(value) || value.includes(".."))
    throw new MailError("Gebruik maximaal 64 letters, cijfers, punten, streepjes of plustekens vóór het @-teken.");
  return value;
}
export function passwordValue(value: unknown): string {
  if (typeof value !== "string" || value.length < 12 || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))
    throw new MailError("Gebruik een wachtwoord van 12 tot 200 tekens zonder regelafbrekingen.");
  return value;
}
function displayName(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100)
    throw new MailError("Vul een naam van maximaal 100 tekens in.");
  return value.trim();
}
export function mailboxPayload(action: string, body: any): Record<string, unknown> {
  if (action === "create_mailbox")
    return { local_part: localPart(body.local_part), name: displayName(body.name), password: passwordValue(body.password), password_method: "password", is_internal: false };
  if (action === "reset_password") return { password: passwordValue(body.password), password_method: "password" };
  const result: Record<string, unknown> = { name: displayName(body.name) };
  for (const key of ["may_send", "may_receive", "may_access_imap", "may_access_pop3"])
    if (typeof body[key] === "boolean") result[key] = body[key];
    else throw new MailError("Controleer de toegangsinstellingen van de mailbox.");
  return result;
}
export function listFrom(value: any, key: string): any[] {
  const rows = Array.isArray(value) ? value : value?.[key];
  if (!Array.isArray(rows) || rows.length > 10000) throw new MailError("Migadu gaf geen volledig overzicht terug. Probeer opnieuw.", 502);
  return rows;
}
export function safeMailbox(value: any) {
  return {
    local_part: String(value.local_part || ""), address: String(value.address || ""),
    name: String(value.name || ""),
    may_send: value.may_send === true, may_receive: value.may_receive === true,
    may_access_imap: value.may_access_imap === true, may_access_pop3: value.may_access_pop3 === true,
  };
}
export function safeDomain(value: any) {
  return { name: String(value.name || ""), state: String(value.state || "unknown"),
    can_send: value.can_send === true, can_receive: value.can_receive === true };
}
export function dnsRecords(value: any) {
  const result: Array<{purpose:string;name:string;type:string;value:string;priority:number|null}> = [];
  for (const [key, purpose] of [["dns_verification","Domeinverificatie"],["mx_records","Ontvangen"],["spf","Verzenden"],["dkim","Ondertekening"],["dmarc","Beleid"]]) {
    for (const record of (Array.isArray(value?.[key]) ? value[key] : value?.[key] ? [value[key]] : [])) {
      if (typeof record.name !== "string" || typeof record.value !== "string" || !["txt","cname","mx"].includes(String(record.type).toLowerCase()))
        throw new MailError("Migadu gaf een onbekend DNS-record terug.", 502);
      result.push({purpose,name:record.name,type:record.type.toUpperCase(),value:record.value,
        priority:Number.isInteger(record.priority) ? record.priority : null});
    }
  }
  if (!result.length) throw new MailError("Migadu gaf nog geen DNS-records terug.", 502);
  return result;
}
export function createMigaduClient(credentials: Credentials, transport: typeof fetch = fetch): MigaduCall {
  // The origin is fixed. Never follow redirects carrying Basic credentials.
  const encoded = btoa(Array.from(new TextEncoder().encode(credentials.email + ":" + credentials.api_key), b => String.fromCharCode(b)).join(""));
  return async (path, method = "GET", body) => {
    if (!/^\/domains(?:\/|$)/.test(path) || path.includes("?") || path.includes("#") || path.includes(".."))
      throw new MailError("Ongeldig Migadu-verzoek.");
    let response: Response;
    try {
      response = await transport("https://api.migadu.com/v1" + path, {
        method, redirect:"error", cache:"no-store", signal:AbortSignal.timeout(20000),
        headers: { Authorization:"Basic " + encoded, "Content-Type":"application/json", Accept:"application/json" },
        ...(body === undefined ? {} : { body:JSON.stringify(body) }),
      });
    } catch {
      throw new MailError("Geen bevestiging van Migadu ontvangen. Vernieuw het overzicht en controleer de wijziging voordat je opnieuw probeert.", 502);
    }
    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) throw new MailError("Migadu weigert de toegang. Controleer je account, API-sleutel en domeinrechten.", 403);
      if (status === 429) throw new MailError("Migadu ontvangt te veel verzoeken. Wacht even en probeer opnieuw.", 429);
      if (status === 422) throw new MailError("Migadu kan het domein nog niet activeren. Controleer de DNS-records en probeer later opnieuw.", 422);
      if (status >= 500) throw new MailError("Migadu is tijdelijk niet beschikbaar. Vernieuw het overzicht voordat je opnieuw probeert.", 502);
      throw new MailError("Migadu heeft de wijziging niet geaccepteerd. Controleer of het adres al bestaat, de gegevens en de rechten van je account.", 400);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text && method === "DELETE") return null;
    try { return JSON.parse(text); } catch { throw new MailError("Migadu gaf geen leesbare bevestiging. Vernieuw eerst het overzicht.", 502); }
  };
}
