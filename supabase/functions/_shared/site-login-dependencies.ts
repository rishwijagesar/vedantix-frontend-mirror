import { sendClientMail } from './client-mailer.ts';
import { SITE_ORIGIN, SITE_SLUG, type Dependencies, type Provider, type Session } from './site-login-handler.ts';
declare const EdgeRuntime: { waitUntil(task: Promise<unknown>): void };

const CENTRAL_URL = 'https://zxnexwqvoznmirajhgxj.supabase.co';
const CENTRAL_KEY = 'sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu';
const LOCAL_URL = 'https://arzfwbyomqvvtpswbyzl.supabase.co';
const LOCAL_KEY = 'sb_publishable_FZ-WVOV7ue59ubIh0pq0ow_q8kYVj_B';
const FIXED = { central: { url: CENTRAL_URL, key: CENTRAL_KEY }, local: { url: LOCAL_URL, key: LOCAL_KEY } } as const;
type Options = { serviceKey: string; fetcher?: typeof fetch; background?: (task: Promise<void>) => void; mail?: typeof sendClientMail };

/** Every destination is fixed server code. There is no user-selected provider, URL, role or redirect. */
export function createSiteLoginDependencies(options: Options): Dependencies {
  if (!options.serviceKey) throw new Error('Login service unavailable');
  const fetcher = options.fetcher || fetch;
  async function request(provider: Provider, path: string, body?: unknown, token?: string, service = false) {
    const config = FIXED[provider];
    const key = service ? options.serviceKey : config.key;
    return fetcher(config.url + path, { method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: { apikey: key, ...(service || token ? { Authorization: 'Bearer ' + (token || key) } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
  }
  async function rpc(name: string, args: unknown) {
    const response = await request('central', '/rest/v1/rpc/' + name, args, undefined, true);
    if (!response.ok) throw new Error('Login service unavailable');
    return response.json();
  }
  return {
    background: options.background || (task => EdgeRuntime.waitUntil(task)),
    prepare: (email, purpose) => rpc('site_login_prepare', { p_site_slug: SITE_SLUG, p_email: email, p_origin: SITE_ORIGIN, p_purpose: purpose }),
    async signIn(provider, email, password) {
      const response = await request(provider, '/auth/v1/token?grant_type=password', { email, password });
      if (response.status === 400 || response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new Error('Login service unavailable');
      const data = await response.json();
      if (typeof data.access_token !== 'string' || !data.access_token || typeof data.refresh_token !== 'string' || !data.refresh_token
          || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error('Invalid provider response');
      return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in, token_type: 'bearer' } satisfies Session;
    },
    async authorize(provider, token, email, expectedId) {
      const response = await request(provider, '/auth/v1/user', undefined, token);
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new Error('Identity unavailable');
      const user = await response.json();
      if (!user.id || user.is_anonymous || typeof user.email !== 'string' || user.email.trim().toLowerCase() !== email
          || (expectedId && user.id !== expectedId) || (provider === 'central' && !user.email_confirmed_at)) return null;
      if (provider === 'central') {
        const access = await request(provider, '/rest/v1/rpc/can_manage_site', { p_site_slug: SITE_SLUG }, token);
        if (!access.ok) throw new Error('Authorization unavailable');
        if (await access.json() !== true) return null;
      } else {
        const params = new URLSearchParams({ select: 'id', user_id: 'eq.' + user.id, role: 'eq.admin', limit: '1' });
        const access = await request(provider, '/rest/v1/user_roles?' + params, undefined, token);
        if (!access.ok) throw new Error('Authorization unavailable');
        const roles = await access.json();
        if (!Array.isArray(roles) || !roles.length) return null;
      }
      return { id: user.id, email: user.email };
    },
    async revoke(provider, token) {
      const response = await request(provider, '/auth/v1/logout?scope=local', {}, token);
      if (!response.ok) throw new Error('Session cleanup unavailable');
    },
    async recover(provider, email, expectedId) {
      if (provider === 'local') {
        // Keep the existing local Auth mail service and implicit-session callback intact.
        const response = await request('local', '/auth/v1/recover?redirect_to=' + encodeURIComponent(SITE_ORIGIN + '/admin/reset-password'), { email });
        if (!response.ok) throw new Error('Recovery unavailable');
        return;
      }
      // Recheck live routing immediately before creating a central recovery link, without consuming a second throttle slot.
      const allowed = await rpc('site_login_recovery_allowed', { p_site_slug: SITE_SLUG, p_email: email, p_user_id: expectedId, p_origin: SITE_ORIGIN });
      if (allowed !== true || !expectedId) return;
      const generated = await request('central', '/auth/v1/admin/generate_link', { type: 'recovery', email }, undefined, true);
      if (!generated.ok) throw new Error('Recovery unavailable');
      const link = await generated.json();
      const user = link.user || link;
      const hash = link.hashed_token || link.properties?.hashed_token;
      if (user.id !== expectedId || typeof user.email !== 'string' || user.email.toLowerCase() !== email
          || typeof hash !== 'string' || !/^[a-zA-Z0-9_-]{20,256}$/.test(hash)) throw new Error('Invalid recovery identity');
      const data = await rpc('get_migadu_delivery_credentials', {});
      const credentials = Array.isArray(data) ? data[0] : data;
      const smtpUser = String(credentials?.smtp_user || '').trim();
      const smtpPassword = String(credentials?.smtp_password || '');
      const from = String(credentials?.alert_from || smtpUser).trim();
      if (!smtpUser || !smtpPassword || !from) throw new Error('Delivery unavailable');
      await (options.mail || sendClientMail)({ user: smtpUser, password: smtpPassword, from, to: email,
        link: SITE_ORIGIN + '/admin/accept#' + new URLSearchParams({ token_hash: hash, type: 'recovery' }), siteName: 'Nature Healing', kind: 'recovery' });
    },
  };
}
