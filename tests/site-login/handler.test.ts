import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteLoginHandler, createSitePasswordResetHandler, GENERIC_RECOVERY, SITE_ORIGIN, type Dependencies, type Provider } from '../../supabase/functions/_shared/site-login-handler.ts';
const session = { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer' as const };
const input = { site_slug: 'naturehealing', email: ' Owner@Example.test ', password: ' short old password ' };
function request(data: unknown = input, origin = SITE_ORIGIN) { return new Request('https://broker.test/site-login', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
function fixture(overrides: Partial<Dependencies> = {}) {
  const calls: { action: string; args: unknown[] }[] = []; const tasks: Promise<void>[] = [];
  const deps: Dependencies = {
    prepare: async (...args) => { calls.push({ action: 'prepare', args }); return { provider: 'local' }; },
    signIn: async (...args) => { calls.push({ action: 'signIn', args }); return session; },
    authorize: async (...args) => { calls.push({ action: 'authorize', args }); return { id: 'owner', email: 'owner@example.test' }; },
    revoke: async (...args) => { calls.push({ action: 'revoke', args }); },
    recover: async (...args) => { calls.push({ action: 'recover', args }); },
    background: task => { tasks.push(task); }, pause: async () => {}, ...overrides,
  };
  return { deps, calls, tasks, handler: createSiteLoginHandler(deps) };
}
test('single provider, unchanged short/whitespace password, normalized email, minimal session response', async () => {
  for (const provider of ['local', 'central'] as Provider[]) {
    const f = fixture({ prepare: async () => ({ provider, expected_user_id: 'owner' }) });
    const r = await f.handler(request()); assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { provider, user: { id: 'owner', email: 'owner@example.test' }, session });
    assert.deepEqual(f.calls.find(c => c.action === 'signIn')!.args, [provider, 'owner@example.test', input.password]);
    assert.equal(f.calls.filter(c => c.action === 'signIn').length, 1);
    assert.match(r.headers.get('cache-control')!, /no-store/);
  }
});
test('wrong password never attempts second provider or returns a provider discriminator', async () => {
  for (const provider of ['local', 'central'] as Provider[]) {
    let attempts = 0;
    const f = fixture({ prepare: async () => ({ provider }), signIn: async selected => { assert.equal(selected, provider); attempts++; return null; } });
    const r = await f.handler(request()); assert.equal(r.status, 401); assert.equal(attempts, 1);
    assert.deepEqual(Object.keys(await r.json()), ['error']); assert.equal(f.calls.some(c => c.action === 'authorize'), false);
  }
});
test('throttle and denied route fail before forwarding password', async () => {
  for (const [route, status] of [[{ limited: true }, 429], [{ denied: true }, 401]] as const) {
    const f = fixture({ prepare: async () => route }); const r = await f.handler(request());
    assert.equal(r.status, status); assert.equal(f.calls.some(c => c.action === 'signIn'), false);
  }
});
test('authorization denial and outage revoke fresh session and never expose tokens', async () => {
  for (const unavailable of [false, true]) {
    const f = fixture({ authorize: async () => { if (unavailable) throw new Error('secret-provider-message'); return null; } });
    const r = await f.handler(request()); assert.equal(r.status, unavailable ? 503 : 401);
    assert.deepEqual(f.calls.find(c => c.action === 'revoke')!.args, ['local', 'access']);
    assert.doesNotMatch(await r.text(), /access|refresh|secret-provider-message/);
  }
});
test('origin, request shape, provider injection, site override and body limit are rejected', async () => {
  const f = fixture(); assert.equal((await f.handler(request(input, 'https://attacker.test'))).status, 403);
  for (const bad of [null, [], { ...input, provider: 'central' }, { ...input, site_slug: 'sobrinas' }, { ...input, password: '' }, { ...input, email: 'bad' }, { ...input, email: 'x'.repeat(33000) }]) {
    assert.equal((await f.handler(request(bad))).status, 400);
  }
  assert.equal(f.calls.length, 0);
});
test('canonical and www origins echo exact allowed origin; OPTIONS forwards no credentials', async () => {
  for (const origin of [SITE_ORIGIN, 'https://www.naturehealing.nl']) {
    const f = fixture(); const r = await f.handler(request(input, origin)); assert.equal(r.headers.get('access-control-allow-origin'), origin);
    const p = await f.handler(new Request('https://broker.test', { method: 'OPTIONS', headers: { origin } })); assert.equal(p.status, 204); assert.equal(p.headers.get('access-control-allow-origin'), origin);
  }
});
test('recovery returns identical generic reply for unknown, limited, denied, invalid and unavailable cases', async () => {
  for (const route of [{ provider: 'local' }, { provider: 'central', expected_user_id: 'owner' }, { limited: true }, { denied: true }, null]) {
    const f = fixture({ prepare: async () => { if (!route) throw new Error('unavailable'); return route as any; } });
    const handler = createSitePasswordResetHandler(f.deps);
    const r = await handler(request({ site_slug: input.site_slug, email: input.email })); assert.equal(r.status, 200); assert.deepEqual(await r.json(), GENERIC_RECOVERY);
    await Promise.all(f.tasks);
    assert.equal(f.calls.filter(c => c.action === 'recover').length, route && 'provider' in route ? 1 : 0);
    assert.equal(f.calls.some(c => c.action === 'signIn'), false);
  }
  const f = fixture(); assert.deepEqual(await (await createSitePasswordResetHandler(f.deps)(request(null))).json(), GENERIC_RECOVERY);
});
