import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteLoginDependencies } from '../../supabase/functions/_shared/site-login-dependencies.ts';
const email = 'owner@example.test';
function fixture(options: { user?: any; access?: any; signInStatus?: number; recoveryUser?: string } = {}) {
  const calls: { url: string; body: any; headers: Headers }[] = []; const mails: any[] = [];
  const user = options.user || { id: 'owner', email, email_confirmed_at: '2026-01-01', is_anonymous: false };
  const fetcher: typeof fetch = async (url, init) => {
    const target = String(url); calls.push({ url: target, body: init?.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init?.headers) });
    assert.equal(init?.redirect, 'error');
    if (target.includes('/token?')) return Response.json({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user, ignored_secret: 'not-returned' }, { status: options.signInStatus || 200 });
    if (target.endsWith('/auth/v1/user')) return Response.json(user);
    if (target.includes('/user_roles?')) return Response.json(options.access ?? [{ id: 'role' }]);
    if (target.endsWith('/can_manage_site') || target.endsWith('/site_login_recovery_allowed')) return Response.json(options.access ?? true);
    if (target.includes('/logout?')) return new Response(null, { status: 204 });
    if (target.includes('/recover?')) return Response.json({});
    if (target.endsWith('/admin/generate_link')) return Response.json({ ...user, id: options.recoveryUser || user.id, hashed_token: 'a'.repeat(64), action_link: 'never-returned' });
    if (target.endsWith('/get_migadu_delivery_credentials')) return Response.json([{ smtp_user: 'delivery@example.test', smtp_password: 'smtp-secret', alert_from: 'delivery@example.test' }]);
    if (target.endsWith('/site_login_prepare')) return Response.json({ provider: 'local' });
    throw new Error('Unexpected request');
  };
  return { calls, mails, deps: createSiteLoginDependencies({ serviceKey: 'service-secret', fetcher, background: () => {}, mail: async args => { mails.push(args); } }) };
}
test('provider destinations fixed, raw password unchanged, Auth never receives central service credential', async () => {
  for (const provider of ['local', 'central'] as const) {
    const f = fixture(); const session = await f.deps.signIn(provider, email, '  old\tpass  ');
    assert.deepEqual(session, { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer' });
    assert.equal(f.calls[0]!.body.password, '  old\tpass  ');
    assert.match(f.calls[0]!.url, provider === 'local' ? /arzfwbyomqvvtpswbyzl/ : /zxnexwqvoznmirajhgxj/);
    assert.equal(f.calls[0]!.headers.get('authorization'), null); assert.notEqual(f.calls[0]!.headers.get('apikey'), 'service-secret');
  }
});
test('local authorization uses fresh verified ID and exact admin role filter', async () => {
  const f = fixture(); assert.deepEqual(await f.deps.authorize('local', 'access', email), { id: 'owner', email });
  const u = new URL(f.calls[1]!.url); assert.equal(u.searchParams.get('user_id'), 'eq.owner'); assert.equal(u.searchParams.get('role'), 'eq.admin');
  assert.equal(f.calls[1]!.headers.get('authorization'), 'Bearer access');
  assert.equal(await fixture({ access: [] }).deps.authorize('local', 'access', email), null);
});
test('central authorization rechecks exact Nature membership and expected identity', async () => {
  const f = fixture(); assert.deepEqual(await f.deps.authorize('central', 'access', email, 'owner'), { id: 'owner', email });
  assert.deepEqual(f.calls[1]!.body, { p_site_slug: 'naturehealing' });
  assert.equal(await fixture({ access: false }).deps.authorize('central', 'access', email, 'owner'), null);
  const mismatch = fixture(); assert.equal(await mismatch.deps.authorize('central', 'access', email, 'other'), null); assert.equal(mismatch.calls.length, 1);
  assert.equal(await fixture({ user: { id: 'owner', email: 'other@example.test' } }).deps.authorize('local', 'access', email), null);
});
test('fresh-session cleanup uses only local logout scope', async () => {
  const f = fixture(); await f.deps.revoke('local', 'access'); assert.match(f.calls[0]!.url, /logout\?scope=local$/);
});
test('local recovery preserves original native provider and callback; no central link or mail', async () => {
  const f = fixture(); await f.deps.recover('local', email);
  assert.equal(f.calls.length, 1); assert.match(f.calls[0]!.url, /arzfwbyomqvvtpswbyzl/);
  assert.equal(new URL(f.calls[0]!.url).searchParams.get('redirect_to'), 'https://naturehealing.nl/admin/reset-password');
  assert.deepEqual(f.calls[0]!.body, { email }); assert.equal(f.mails.length, 0);
});
test('central recovery validates route and identity, keeps token and SMTP credentials server-side', async () => {
  const f = fixture(); await f.deps.recover('central', email, 'owner');
  assert.equal(f.mails.length, 1); assert.match(f.mails[0].link, /^https:\/\/naturehealing\.nl\/admin\/accept#token_hash=a+&type=recovery$/);
  assert.equal(f.calls.filter(c => c.url.includes('/admin/generate_link')).length, 1);
  const denied = fixture({ access: false }); await denied.deps.recover('central', email, 'owner'); assert.equal(denied.calls.length, 1); assert.equal(denied.mails.length, 0);
  const mismatch = fixture({ recoveryUser: 'other' }); await assert.rejects(() => mismatch.deps.recover('central', email, 'owner')); assert.equal(mismatch.mails.length, 0);
});
