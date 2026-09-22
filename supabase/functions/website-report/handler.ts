import { renderWebsiteReport, reportFilename, reportMeasurements, type ReportInput } from './document.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Expose-Headers': 'Content-Disposition', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class ReportError extends Error { constructor(message: string, public status: number) { super(message); } }
async function checked(query: any) { const r = await query; if (r.error) throw new ReportError('Rapportgegevens konden niet worden opgehaald.', 500); return r.data; }
export function createReportHandler(createUser: (authorization: string) => any, createAdmin: () => any, render = renderWebsiteReport) {
  return async (request: Request) => {
    const json = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json('Gebruik POST.', 405);
    try {
      const authorization = request.headers.get('authorization') || '';
      if (!authorization.startsWith('Bearer ')) throw new ReportError('Log in als beheerder.', 401);
      const client = createUser(authorization), auth = await client.auth.getUser();
      if (auth.error || !auth.data?.user) throw new ReportError('Log opnieuw in.', 401);
      const role = await client.rpc('is_staff', { required_roles: ['ADMIN'] });
      if (role.error || role.data !== true) throw new ReportError('Alleen beheerders kunnen dit rapport downloaden.', 403);
      if (Number(request.headers.get('content-length')) > 4096) throw new ReportError('Het verzoek is te groot.', 413);
      const reader = request.body?.getReader(), decoder = new TextDecoder(); let raw = '', size = 0;
      if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 4096) { await reader.cancel(); throw new ReportError('Het verzoek is te groot.', 413); } raw += decoder.decode(value, { stream: true }); } raw += decoder.decode(); }
      let body: any; try { body = JSON.parse(raw); } catch { throw new ReportError('Ongeldig verzoek.', 400); }
      if (!body || typeof body !== 'object' || typeof body.website_id !== 'string' || typeof body.run_id !== 'string' || !uuid.test(body.website_id) || !uuid.test(body.run_id) || (body.include_note !== undefined && typeof body.include_note !== 'boolean')) throw new ReportError('Selecteer een website en een opgeslagen meting.', 400);
      const db = createAdmin();
      const website = await checked(db.from('websites').select('id,name,production_url,customer_id').eq('id', body.website_id).maybeSingle());
      if (!website) throw new ReportError('Website niet gevonden.', 404);
      const run = await checked(db.from('website_insight_runs').select('id,kind,status,created_at,target_url,result,note,error').eq('id', body.run_id).eq('website_id', body.website_id).maybeSingle());
      if (!run) throw new ReportError('Meting niet gevonden bij deze website.', 404);
      const input: ReportInput = { website, run, includeNote: body.include_note === true };
      try { reportMeasurements(input); } catch { throw new ReportError('Download is beschikbaar zodra een PageSpeed-meting resultaten heeft.', 409); }
      const [company, customer] = await Promise.all([
        checked(db.from('company_profile').select('trade_name,email,website').limit(1).maybeSingle()),
        website.customer_id ? checked(db.from('customers').select('company_name').eq('id', website.customer_id).maybeSingle()) : null,
      ]);
      input.company = company; input.customer = customer;
      // Load only this stored snapshot. No new Google requests, secrets or internal notes by default.
      const bytes = await render(input);
      const contentType = request.headers.get('accept') === 'application/octet-stream' ? 'application/octet-stream' : 'application/pdf';
      return new Response(bytes as BodyInit, { headers: { ...cors, 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${reportFilename(input)}"` } });
    } catch (e) { return json(e instanceof ReportError ? e.message : 'Het PDF-rapport kon niet worden gemaakt. Probeer opnieuw.', e instanceof ReportError ? e.status : 500); }
  };
}
