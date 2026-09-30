import assert from 'node:assert/strict';
import test from 'node:test';
import { createProxyHandler } from '../supabase/functions/site-admin-naturehealing/handler.ts';

const canonical = 'https://naturehealing.nl';
const www = 'https://www.naturehealing.nl';
const upstream = 'https://adapter.example.test/api/public/vedantix/site-admin';
function fixture(authorize = async () => true) {
  const calls = { authorize: [], forward: [] };
  const handler = createProxyHandler({ upstream,
    authorize: async token => { calls.authorize.push(token); return authorize(token); },
    forward: async (url, options) => {
      calls.forward.push({ url, options });
      return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'set-cookie': 'secret=discard', location: '/discard' } });
    },
  });
  return { handler, calls };
}
function request(origin, method = 'POST', authorization = 'Bearer synthetic-test-token') {
  const headers = { 'content-type': 'application/json', cookie: 'local=discard', 'x-forwarded-host': 'attacker.example.test' };
  if (origin !== undefined) headers.origin = origin;
  if (authorization !== undefined) headers.authorization = authorization;
  return new Request('https://gateway.example.test/site-admin-naturehealing', {
    method, headers, ...(method === 'POST' ? { body: '{"action":"load"}' } : {}),
  });
}

for (const origin of [canonical, www]) {
  test(`preflight permits exactly the public origin ${origin}`, async () => {
    const { handler, calls } = fixture();
    const result = await handler(request(origin, 'OPTIONS'));
    assert.equal(result.status, 204);
    assert.equal(result.headers.get('access-control-allow-origin'), origin);
    assert.equal(result.headers.get('vary'), 'Origin');
    assert.equal(result.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
    assert.equal(result.headers.get('access-control-allow-credentials'), null);
    assert.deepEqual(calls, { authorize: [], forward: [] });
  });

  test(`authorized ${origin} gets matching CORS while upstream origin stays canonical`, async () => {
    const { handler, calls } = fixture();
    const result = await handler(request(origin));
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { ok: true });
    assert.equal(result.headers.get('access-control-allow-origin'), origin);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(result.headers.get('set-cookie'), null);
    assert.equal(result.headers.get('location'), null);
    assert.deepEqual(calls.authorize, ['synthetic-test-token']);
    assert.equal(calls.forward.length, 1);
    const call = calls.forward[0];
    assert.equal(call.url, upstream);
    assert.equal(call.options.headers.get('origin'), canonical);
    assert.equal(call.options.headers.get('authorization'), 'Bearer synthetic-test-token');
    assert.equal(call.options.headers.get('cookie'), null);
    assert.equal(call.options.headers.get('x-forwarded-host'), null);
    assert.equal(call.options.redirect, 'error');
    assert.equal(new TextDecoder().decode(call.options.body), '{"action":"load"}');
  });
}

test('missing, null, HTTP, alternate port and lookalike origins cannot reach authorization or upstream', async () => {
  for (const origin of [undefined, 'null', 'http://naturehealing.nl', 'https://www.naturehealing.nl:8443', 'https://naturehealing.nl.attacker.test', 'https://www.naturehealing.nl.attacker.test']) {
    for (const method of ['OPTIONS', 'POST']) {
      const { handler, calls } = fixture();
      const result = await handler(request(origin, method));
      assert.equal(result.status, 403);
      assert.equal(result.headers.get('access-control-allow-origin'), null);
      assert.deepEqual(calls, { authorize: [], forward: [] });
    }
  }
});

test('both accepted origins still require bearer authentication before authorization or forwarding', async () => {
  for (const origin of [canonical, www]) {
    for (const authorization of ['', 'Basic synthetic', `Bearer ${'x'.repeat(16000)}`]) {
      const { handler, calls } = fixture();
      const result = await handler(request(origin, 'POST', authorization));
      assert.equal(result.status, 401);
      assert.equal(result.headers.get('access-control-allow-origin'), origin);
      assert.deepEqual(calls, { authorize: [], forward: [] });
    }
  }
});

test('failed JWT or site authorization still denies both origins without forwarding', async () => {
  for (const origin of [canonical, www]) {
    const { handler, calls } = fixture(async () => false);
    const result = await handler(request(origin));
    assert.equal(result.status, 403);
    assert.equal(result.headers.get('access-control-allow-origin'), origin);
    assert.deepEqual(calls.authorize, ['synthetic-test-token']);
    assert.equal(calls.forward.length, 0);
  }
});

test('authorization outage still fails closed for both origins', async () => {
  for (const origin of [canonical, www]) {
    const { handler, calls } = fixture(async () => { throw new Error('Unavailable'); });
    const result = await handler(request(origin));
    assert.equal(result.status, 503);
    assert.equal(result.headers.get('access-control-allow-origin'), origin);
    assert.equal(calls.forward.length, 0);
  }
});
