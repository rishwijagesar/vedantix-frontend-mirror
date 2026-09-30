export type Provider = 'local' | 'central';
export type Purpose = 'login' | 'recovery';
export type Route = { provider?: Provider; expected_user_id?: string | null; denied?: boolean; limited?: boolean };
export type Session = { access_token: string; refresh_token: string; expires_in: number; token_type: 'bearer' };
export type User = { id: string; email: string };
export type Dependencies = {
  prepare(email: string, purpose: Purpose): Promise<Route>;
  signIn(provider: Provider, email: string, password: string): Promise<Session | null>;
  authorize(provider: Provider, token: string, email: string, expectedId?: string | null): Promise<User | null>;
  revoke(provider: Provider, token: string): Promise<void>;
  recover(provider: Provider, email: string, expectedId?: string | null): Promise<void>;
  background(task: Promise<void>): void;
  pause?: (milliseconds: number) => Promise<void>;
};

export const SITE_SLUG = 'naturehealing';
export const SITE_ORIGIN = 'https://naturehealing.nl';
export const SITE_ORIGINS = new Set([SITE_ORIGIN, 'https://www.naturehealing.nl']);
export const GENERIC_LOGIN_ERROR = 'Inloggen is niet gelukt. Controleer je gegevens en probeer het opnieuw.';
export const GENERIC_RECOVERY = { ok: true, message: 'Als dit account toegang heeft, ontvang je een e-mail om je wachtwoord opnieuw in te stellen.' };
const MAX_BODY = 32768;
const EMAIL = /^[^\s<>\r\n@]+@[^\s<>\r\n@]+\.[^\s<>\r\n@]+$/;

function headers(origin = SITE_ORIGIN) {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type', Vary: 'Origin' };
}
function reply(status: number, body: unknown, origin = SITE_ORIGIN) { return new Response(JSON.stringify(body), { status, headers: headers(origin) }); }
function boundary(request: Request): Response | null {
  const origin = request.headers.get('origin') || '';
  if (!SITE_ORIGINS.has(origin)) return reply(403, { error: 'Geen toegang.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
  if (request.method !== 'POST') return reply(405, { error: 'Methode niet toegestaan.' }, origin);
  return null;
}
async function body(request: Request, passwordRequired: boolean): Promise<{ email: string; password: string }> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')
      || Number(request.headers.get('content-length') || 0) > MAX_BODY || !request.body) throw new Error('Invalid input');
  const reader = request.body.getReader();
  let bytes = 0; let text = ''; const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_BODY) { await reader.cancel(); throw new Error('Invalid input'); }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  const input = JSON.parse(text);
  const allowed = passwordRequired ? ['site_slug', 'email', 'password'] : ['site_slug', 'email'];
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).length !== allowed.length || Object.keys(input).some(key => !allowed.includes(key))
      || input.site_slug !== SITE_SLUG || typeof input.email !== 'string' || input.email.length > 254
      || !EMAIL.test(input.email.trim()) || (passwordRequired && (typeof input.password !== 'string' || !input.password || input.password.length > 4096))) throw new Error('Invalid input');
  // Passwords are never trimmed, normalized, logged, persisted, or retried.
  return { email: input.email.trim().toLowerCase(), password: passwordRequired ? input.password : '' };
}
function waitUntilFloor(deps: Dependencies, started: number) {
  return (deps.pause || ((milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))))(Math.max(0, 600 - (Date.now() - started)));
}

export function createSiteLoginHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const rejected = boundary(request); if (rejected) return rejected;
    const respond = (status: number, data: unknown) => reply(status, data, request.headers.get('origin')!);
    const started = Date.now();
    let session: Session | null = null; let provider: Provider | undefined;
    try {
      let input;
      try { input = await body(request, true); } catch { await waitUntilFloor(deps, started); return respond(400, { error: GENERIC_LOGIN_ERROR }); }
      const route = await deps.prepare(input.email, 'login');
      if (route.limited) { await waitUntilFloor(deps, started); return respond(429, { error: 'Te veel pogingen. Probeer het over 15 minuten opnieuw.' }); }
      if (route.denied || !['local', 'central'].includes(route.provider || '')) { await waitUntilFloor(deps, started); return respond(401, { error: GENERIC_LOGIN_ERROR }); }
      provider = route.provider!;
      session = await deps.signIn(provider, input.email, input.password);
      if (!session) { await waitUntilFloor(deps, started); return respond(401, { error: GENERIC_LOGIN_ERROR }); }
      const user = await deps.authorize(provider, session.access_token, input.email, route.expected_user_id);
      if (!user) {
        try { await deps.revoke(provider, session.access_token); } catch { /* Never expose an unauthorized session. */ }
        session = null;
        await waitUntilFloor(deps, started); return respond(401, { error: GENERIC_LOGIN_ERROR });
      }
      return respond(200, { provider, user, session });
    } catch {
      if (provider && session) { try { await deps.revoke(provider, session.access_token); } catch { /* No sensitive logs. */ } }
      await waitUntilFloor(deps, started);
      return respond(503, { error: 'Inloggen is tijdelijk niet beschikbaar. Probeer het opnieuw.' });
    }
  };
}

export function createSitePasswordResetHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const rejected = boundary(request); if (rejected) return rejected;
    const started = Date.now();
    try {
      const input = await body(request, false);
      const route = await deps.prepare(input.email, 'recovery');
      if (!route.limited && !route.denied && (route.provider === 'local' || route.provider === 'central')) {
        // Complete delivery outside the response path; unknown and known emails receive the same public result.
        deps.background(deps.recover(route.provider, input.email, route.expected_user_id).catch(() => { /* No tokens, addresses or provider errors logged. */ }));
      }
    } catch { /* Uniform recovery response, including malformed input and unavailable providers. */ }
    await waitUntilFloor(deps, started);
    return reply(200, GENERIC_RECOVERY, request.headers.get('origin')!);
  };
}
