import assert from 'node:assert/strict';
import { PDFDocument } from 'npm:pdf-lib@1.17.1';
import { createReportHandler } from '../website-report/handler.ts';
import { renderWebsiteReport, reportFilename, reportMeasurements, scoreLabel, type ReportInput } from '../website-report/document.ts';

const site = '11111111-1111-4111-8111-111111111111', runId = '22222222-2222-4222-8222-222222222222';
const metric = (display: string) => ({ display, value: 0 });
function sample(): ReportInput {
  return { website: { name: 'Voorbeeld website' }, customer: { company_name: 'Voorbeeldbedrijf' }, company: { email: 'info@vedantix.nl', website: 'https://vedantix.nl' }, run: { id: runId, kind: 'pagespeed', status: 'COMPLETED', created_at: '2026-09-22T19:56:00Z', target_url: 'https://example.org/', note: 'INTERNAL_NOTE_DO_NOT_SHARE', result: { measurements: ['mobile', 'desktop'].map(device => ({ device, measured_at: '2026-09-22T19:56:00Z', scores: { performance: device === 'mobile' ? 90 : 100, accessibility: 100, best_practices: 100, seo: 100 }, metrics: { speed_index: metric('4,5 s'), lcp: metric('2,9 s'), fcp: metric('2,1 s'), tbt: metric('0 ms'), cls: metric('0') }, opportunities: [{ title: 'Beperk niet-gebruikt JavaScript', display: 'Geschatte besparingen van 86 KiB' }] })) } } };
}
function fixture(role = 'ADMIN') {
  const input = sample(); let privileged = 0, rendered: ReportInput | undefined;
  const rows: Record<string, any[]> = { websites: [{ id: site, customer_id: 'client', ...input.website }], website_insight_runs: [{ website_id: site, ...input.run }], company_profile: [input.company], customers: [{ id: 'client', ...input.customer }] };
  const db = { from(table: string) { const filters: ((x: any) => boolean)[] = []; const q: any = { select() { return q; }, eq(k: string, v: unknown) { filters.push(x => x[k] === v); return q; }, limit() { return q; }, maybeSingle() { return q; }, then(resolve: any) { resolve({ data: rows[table].find(x => filters.every(f => f(x))) || null, error: null }); } }; return q; } };
  const handler = createReportHandler(() => ({ auth: { getUser: async () => ({ data: { user: role === 'INVALID' ? null : { id: 'admin' } }, error: null }) }, rpc: async () => ({ data: role === 'ADMIN', error: null }) }), () => { privileged++; return db; }, async value => { rendered = value; return new TextEncoder().encode('%PDF-1.7\nTEST'); });
  const send = (body: any = {}, auth = true) => handler(new Request('https://edge.example.org', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer test' } : {}) }, body: JSON.stringify({ website_id: site, run_id: runId, ...body }) }));
  return { send, handler, rows, privileged: () => privileged, rendered: () => rendered };
}
Deno.test('PDF auth rejects missing/invalid login and non-admin before privileged reads', async () => {
  const f = fixture(); assert.equal((await f.send({}, false)).status, 401); assert.equal(f.privileged(), 0);
  for (const role of ['INVALID', 'OPERATOR', 'READ_ONLY']) { const other = fixture(role); assert.equal((await other.send()).status, role === 'INVALID' ? 401 : 403); assert.equal(other.privileged(), 0); }
});
Deno.test('PDF loads exact website snapshot, prevents cross-site IDs and caller data overrides', async () => {
  const f = fixture(); const response = await f.send({ result: { score: 100 }, customer: { company_name: 'FORGED' }, note: 'FORGED', target_url: 'https://evil.org' });
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'application/pdf'); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.match(response.headers.get('content-disposition')!, /^attachment; filename="Vedantix-prestatierapport-example.org-/);
  assert.equal(f.rendered()!.includeNote, false); assert.equal(f.rendered()!.customer!.company_name, 'Voorbeeldbedrijf'); assert.equal(f.rendered()!.run.result.measurements[0].scores.performance, 90);
  f.rows.website_insight_runs[0].website_id = runId; assert.equal((await f.send()).status, 404);
});
Deno.test('PDF rejects analytics, unfinished runs, malformed IDs, oversized bodies and false note consent', async () => {
  const f = fixture(); assert.equal((await f.send({ include_note: 'false' })).status, 400); assert.equal((await f.send({ website_id: 'invalid' })).status, 400);
  assert.equal((await f.send({ extra: 'x'.repeat(5000) })).status, 413); assert.equal(f.privileged(), 0);
  f.rows.website_insight_runs[0].kind = 'analytics'; assert.equal((await f.send()).status, 409);
  f.rows.website_insight_runs[0].kind = 'pagespeed'; f.rows.website_insight_runs[0].status = 'RUNNING'; assert.equal((await f.send()).status, 409);
  f.rows.website_insight_runs[0].status = 'PARTIAL'; assert.equal((await f.send({ include_note: true })).status, 200); assert.equal(f.rendered()!.includeNote, true);
});
Deno.test('PDF preserves measured zero, unknown metrics and invalid data boundaries', () => {
  const input = sample(); input.run.result.measurements[0].scores.performance = 0; assert.equal(reportMeasurements(input)[0].scores.performance, 0); assert.equal(scoreLabel(0), 'Aandacht nodig'); assert.equal(scoreLabel(null), 'Niet beschikbaar');
  input.run.result.measurements[0].scores.performance = NaN; assert.throws(() => reportMeasurements(input));
  input.run.target_url = 'https://example.org/\r\nX-Fake: true'; assert.ok(!/[\r\n]/.test(reportFilename(input)));
});
Deno.test('PDF supports binary negotiation used by Supabase functions-js without corrupting bytes', async () => {
  const f = fixture(); const r = await f.handler(new Request('https://edge.example.org', { method: 'POST', headers: { Authorization: 'Bearer test', Accept: 'application/octet-stream' }, body: JSON.stringify({ website_id: site, run_id: runId }) }));
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'application/octet-stream'); assert.equal(await r.text(), '%PDF-1.7\nTEST');
});
Deno.test('actual PDFs render normal, partial and long agentic reports with safe pagination', async () => {
  const normal = sample(); const partial = sample(); partial.run.status = 'PARTIAL'; partial.run.result.measurements = [partial.run.result.measurements[0]]; partial.run.result.measurements[0].scores.performance = 0; partial.run.result.measurements[0].scores.seo = null; partial.run.result.measurements[0].metrics.lcp = { value: null, display: null };
  const long = sample(); long.website.name = 'Lange naam / ' + 'Bedrijf '.repeat(25); long.customer = null; long.run.target_url += 'een-heel-lang-paginapad-'.repeat(12); long.includeNote = true; long.run.note = 'Klantnotitie met € en leestekens — café 🌱. '.repeat(12);
  long.run.result.measurements[0].agentic = { checks: Array.from({ length: 38 }, (_, i) => ({ id: `check-${i}`, title: `Controle ${i + 1}: ${'een uitgebreide beschrijving van de controle '.repeat(i % 3 + 1)}`, status: ['passed', 'failed', 'informative', 'error'][i % 4], display: i % 2 ? 'Aanvullende informatie over deze controle' : '' })) };
  for (const [name, input] of [['normal', normal], ['partial', partial], ['long', long]] as const) {
    const bytes = await renderWebsiteReport(input), pdf = await PDFDocument.load(bytes); assert.ok(pdf.getPageCount() >= 3 && pdf.getPageCount() < 16); assert.match(pdf.getTitle()!, /Websiteprestaties/);
    for (const page of pdf.getPages()) { assert.equal(Math.round(page.getWidth()), 595); assert.equal(Math.round(page.getHeight()), 842); }
    if (Deno.args.includes('--preview')) { await Deno.mkdir('tmp/website-report', { recursive: true }); await Deno.writeFile(`tmp/website-report/${name}.pdf`, bytes); }
  }
});
