import { test, mock } from 'bun:test';
import assert from 'node:assert/strict';
let mode = 'pdf', request: any;
const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55, 10, 255, 0, 200]);
mock.module('@/lib/supabase', () => ({ supabase: { functions: { invoke: async (name: string, options: any) => {
  request = { name, ...options };
  if (mode === 'error') return { data: null, error: { context: Response.json({ error: 'Log opnieuw in.' }) } };
  if (mode === 'invalid') return { data: new Blob(['Not a PDF'], { type: 'application/octet-stream' }), error: null };
  const response = new Response(bytes, { headers: { 'Content-Type': options.headers?.Accept === 'application/octet-stream' ? 'application/octet-stream' : 'application/pdf' } });
  // Match functions-js: only octet-stream is parsed as Blob; PDF otherwise becomes text.
  return { data: response.headers.get('content-type') === 'application/octet-stream' ? await response.blob() : await response.text(), error: null };
} } } }));
const { websiteReport } = await import('../src/admin/website-insights-data');
test('client negotiates binary PDF, preserves non-UTF8 bytes, and sends exact snapshot/note choice', async () => {
  mode = 'pdf'; const pdf = await websiteReport('site-id', 'run-id', false);
  assert.equal(request.name, 'website-report'); assert.deepEqual(request.body, { website_id: 'site-id', run_id: 'run-id', include_note: false });
  assert.equal(pdf.type, 'application/pdf'); assert.deepEqual(new Uint8Array(await pdf.arrayBuffer()), bytes);
});
test('client rejects unexpected documents and returns a readable authorization error', async () => {
  mode = 'invalid'; await assert.rejects(websiteReport('site', 'run', true), /geen geldig PDF/);
  mode = 'error'; await assert.rejects(websiteReport('site', 'run', true), /Log opnieuw in/);
});
