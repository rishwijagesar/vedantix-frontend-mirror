export type Json = Record<string, any>;
export type Dependencies = {
  authorize: (token: string) => Promise<string | null>;
  command: (actor: string, action: string, args: Json) => Promise<Json>;
  prepareRecovery: (args: Json, origin: string) => Promise<Json>;
  finishRecovery: (requestId: string, sent: boolean) => Promise<void>;
  originAllowed: (origin: string) => Promise<boolean>;
  generate: (email: string, type: 'invite' | 'recovery') => Promise<{ userId: string; email: string; tokenHash: string }>;
  send: (args: { email: string; siteName: string; callback: string; kind: 'invite' | 'recovery' }) => Promise<void>;
  background: (task: Promise<void>) => void;
  pause?: (ms: number) => Promise<void>;
};
export const ADMIN_ORIGINS = new Set(['https://vedantix.nl', 'https://vedantix-migration-test.lovable.app']);
export const GENERIC_RECOVERY = { ok: true, message: 'Als dit account toegang heeft, ontvang je een e-mail om je wachtwoord opnieuw in te stellen.' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slug = /^[a-z0-9][a-z0-9-]{0,62}$/;
const emailPattern = /^[^\s<>\r\n@]+@[^\s<>\r\n@]+\.[^\s<>\r\n@]+$/;

function headers(origin: string) {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
}
export function callbackUrl(origin: string, tokenHash: string, kind: 'invite' | 'recovery') {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw new Error('Invalid registered origin');
  if (!tokenHash || tokenHash.length > 2048 || /[\r\n]/.test(tokenHash)) throw new Error('Invalid token');
  return origin + '/admin/accept#' + new URLSearchParams({ token_hash: tokenHash, type: kind }).toString();
}
async function jsonBody(request: Request): Promise<Json> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Invalid body');
  if (Number(request.headers.get('content-length') || 0) > 8192) throw new Error('Invalid body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid body');
  let bytes = new Uint8Array();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (bytes.length + value.length > 8192) { await reader.cancel(); throw new Error('Invalid body'); }
      const combined = new Uint8Array(bytes.length + value.length); combined.set(bytes); combined.set(value, bytes.length); bytes = combined;
    }
  } finally { reader.releaseLock(); }
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid body');
  return data;
}
function validateAdmin(body: Json) {
  const allowed: Record<string, string[]> = {
    list: ['action', 'site_slug'],
    invite: ['action', 'site_slug', 'email', 'request_id'],
    recovery: ['action', 'site_slug', 'user_id', 'request_id'],
    revoke: ['action', 'site_slug', 'user_id', 'request_id'],
    set_membership_active: ['action', 'site_slug', 'user_id', 'active', 'request_id'],
    cancel_invitation: ['action', 'invitation_id', 'request_id'],
  };
  if (typeof body.action !== 'string' || !allowed[body.action] || Object.keys(body).some(k => !allowed[body.action].includes(k))) return false;
  if (body.action === 'list') return body.site_slug === undefined || (typeof body.site_slug === 'string' && slug.test(body.site_slug));
  if (typeof body.request_id !== 'string' || !uuid.test(body.request_id)) return false;
  if (body.action === 'cancel_invitation') return typeof body.invitation_id === 'string' && uuid.test(body.invitation_id);
  if (typeof body.site_slug !== 'string' || !slug.test(body.site_slug)) return false;
  if (body.action === 'invite') return typeof body.email === 'string' && body.email.length <= 254 && emailPattern.test(body.email);
  return typeof body.user_id === 'string' && uuid.test(body.user_id)
    && (body.action !== 'set_membership_active' || typeof body.active === 'boolean');
}
function publicResult(data: Json) {
  // Explicit allowlist: never return Auth links, OTP/token hashes, credentials or internal email lookup results.
  return { ok: true, ...(data.invitation_id ? { invitation_id: data.invitation_id } : {}),
    ...(data.status ? { status: data.status } : {}), ...(data.replayed ? { replayed: true } : {}) };
}
export function createClientAccessHandler(deps: Dependencies) {
  return async (request: Request) => {
    const origin = request.headers.get('origin') || '';
    const response = (status: number, data: Json) => new Response(JSON.stringify(data), { status, headers: headers(ADMIN_ORIGINS.has(origin) ? origin : 'https://vedantix.nl') });
    if (!ADMIN_ORIGINS.has(origin)) return response(403, { error: 'Geen toegang.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
    if (request.method !== 'POST') return response(405, { error: 'Methode niet toegestaan.' });
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 16000) return response(401, { error: 'Log opnieuw in.' });
    let actor: string | null;
    try { actor = await deps.authorize(authorization.slice(7)); }
    catch { return response(503, { error: 'De toegangscontrole is tijdelijk niet beschikbaar.' }); }
    if (!actor) return response(403, { error: 'Alleen een actieve administrator kan klanttoegang beheren.' });
    let body: Json;
    try { body = await jsonBody(request); if (body.email) body.email = body.email.trim().toLowerCase(); }
    catch { return response(400, { error: 'Ongeldig verzoek.' }); }
    if (!validateAdmin(body)) return response(400, { error: 'Ongeldig verzoek.' });
    const action = body.action;
    try {
      if (action === 'list') return response(200, await deps.command(actor, 'list', body));
      if (!['invite', 'recovery'].includes(action)) return response(200, publicResult(await deps.command(actor, action, body)));
      const prepared = await deps.command(actor, 'prepare_' + action, body);
      if (prepared.replayed) return response(200, publicResult(prepared));
      // No automatic retries: a network/SMTP uncertainty must be inspected before a new explicit UI send.
      let sent = false;
      let finished: Json = {};
      try {
        const generated = await deps.generate(prepared.email, prepared.link_type);
        if (generated.email.toLowerCase() !== prepared.email) throw new Error('Identity mismatch');
        await deps.command(actor, 'bind_' + action, { request_id: body.request_id, user_id: generated.userId });
        const callback = callbackUrl(prepared.origin, generated.tokenHash, prepared.link_type);
        await deps.send({ email: prepared.email, siteName: prepared.site_name, callback, kind: action as 'invite' | 'recovery' });
        sent = true;
      } finally {
        finished = await deps.command(actor, 'finish_' + action, { request_id: body.request_id, sent });
      }
      return response(200, publicResult(finished));
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code.includes('RATE_LIMITED')) return response(429, { error: 'Wacht even voordat je opnieuw een e-mail verstuurt.' });
      if (code.includes('FORBIDDEN')) return response(403, { error: 'Geen toegang.' });
      if (code.includes('CONFLICT') || code.includes('STAFF_ACCOUNT')) return response(409, { error: 'Deze klanttoegang kan niet worden gewijzigd. Controleer de bestaande toegang of uitnodiging.' });
      if (code.includes('NOT_FOUND') || code.includes('INVALID')) return response(400, { error: 'Controleer de website en het klantaccount.' });
      return response(503, { error: 'De actie is niet voltooid. Vernieuw het overzicht voordat je opnieuw probeert.' });
    }
  };
}
export function createClientPasswordResetHandler(deps: Dependencies) {
  return async (request: Request) => {
    const started = Date.now();
    const origin = request.headers.get('origin') || '';
    const response = (status: number, data: Json) => new Response(JSON.stringify(data), { status, headers: headers(origin) });
    let allowed = false;
    try { allowed = !!origin && await deps.originAllowed(origin); } catch { /* fail closed */ }
    if (!allowed) return response(403, { error: 'Geen toegang.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
    if (request.method !== 'POST') return response(405, { error: 'Methode niet toegestaan.' });
    const generic = async () => {
      // SMTP delivery runs outside the response path; known and unknown accounts use the same response floor.
      await (deps.pause || ((ms: number) => new Promise(r => setTimeout(r, ms))))(Math.max(0, 600 - (Date.now() - started)));
      return response(200, GENERIC_RECOVERY);
    };
    let body: Json;
    try { body = await jsonBody(request); } catch { return generic(); }
    if (Object.keys(body).some(k => !['site_slug', 'email'].includes(k)) ||
      typeof body.site_slug !== 'string' || !slug.test(body.site_slug) ||
      typeof body.email !== 'string' || body.email.length > 254 || !emailPattern.test(body.email.trim())) return generic();
    try {
      const prepared = await deps.prepareRecovery({ site_slug: body.site_slug, email: body.email.trim().toLowerCase() }, origin);
      if (!prepared.allowed) return generic();
      deps.background((async () => {
        let sent = false;
        try {
          const generated = await deps.generate(prepared.email, 'recovery');
          if (generated.userId !== prepared.user_id || generated.email.toLowerCase() !== prepared.email) throw new Error('Identity mismatch');
          await deps.send({ email: prepared.email, siteName: prepared.site_name,
            callback: callbackUrl(prepared.origin, generated.tokenHash, 'recovery'), kind: 'recovery' });
          sent = true;
        } catch { /* audited below; no sensitive provider messages logged */ }
        finally { try { await deps.finishRecovery(prepared.request_id, sent); } catch { /* no automatic duplicate send */ } }
      })());
    } catch { /* identical public result; no secrets/provider messages logged */ }
    return generic();
  };
}
