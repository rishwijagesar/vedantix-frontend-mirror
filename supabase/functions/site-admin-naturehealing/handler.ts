type Dependencies = {
  authorize: (token: string) => Promise<boolean>;
  forward: typeof fetch;
  upstream: string;
};

const ORIGIN = 'https://naturehealing.nl';
const ALLOWED_ORIGINS = new Set([ORIGIN, 'https://www.naturehealing.nl']);
const MAX_BODY = 9 * 1024 * 1024;

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export function createProxyHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.has(origin);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(allowedOrigin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    };
    const reply = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers });
    if (!allowedOrigin) return reply(403, 'Geen toegang.');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, 'Methode niet toegestaan.');
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 16000) return reply(401, 'Log opnieuw in.');
    try {
      if (!await deps.authorize(authorization.slice(7))) return reply(403, 'Je hebt geen beheerrechten voor deze website.');
    } catch { return reply(503, 'De toegangscontrole is tijdelijk niet beschikbaar.'); }

    try {
      const body = await readBody(request);
      if (body === null) return reply(413, 'Het bestand of de inhoud is te groot.');
      // Only these headers go to a fixed, server-owned destination. In particular,
      // never relay cookies, client-supplied hosts, or a caller-provided API URL.
      const forwardedHeaders = new Headers({ origin: ORIGIN, authorization });
      const contentType = request.headers.get('content-type');
      if (contentType) forwardedHeaders.set('content-type', contentType);
      const result = await deps.forward(deps.upstream, {
        method: 'POST', headers: forwardedHeaders, body,
        redirect: 'error', signal: AbortSignal.timeout(15000),
      });
      if (!result.headers.get('content-type')?.includes('application/json')) {
        await result.body?.cancel();
        return reply(502, 'De beheerverbinding is tijdelijk niet beschikbaar.');
      }
      // Own CORS/cache headers also apply to errors. Never relay provider cookies,
      // redirect headers, or other hosting-specific response headers to the CMS.
      return new Response(result.body, { status: result.status, headers });
    } catch { return reply(502, 'De beheerverbinding is tijdelijk niet beschikbaar.'); }
  };
}
