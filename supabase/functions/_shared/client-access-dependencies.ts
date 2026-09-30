import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { sendClientMail } from './client-mailer.ts';
import type { Dependencies, Json } from './client-access-handler.ts';
declare const EdgeRuntime: { waitUntil(task: Promise<unknown>): void };

// Neither this service credential nor Migadu credentials ever enter a response or log.
export function createDependencies(): Dependencies {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) throw new Error('Client access unavailable');
  const service = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  async function rpc(name: string, args: Json) {
    const { data, error } = await service.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
  return {
    background: (task) => EdgeRuntime.waitUntil(task),
    async authorize(token) {
      const { data, error } = await service.auth.getUser(token);
      const user = data?.user;
      if (error || !user || user.is_anonymous || !user.email_confirmed_at) return null;
      const { data: staff, error: staffError } = await service.from('staff_users').select('role,active').eq('user_id', user.id).maybeSingle();
      if (staffError) throw new Error('Authorization unavailable');
      return staff?.active === true && staff.role === 'ADMIN' ? user.id : null;
    },
    command: (actor, action, args) => rpc('client_access_admin', { p_actor: actor, p_action: action, p_args: args }),
    prepareRecovery: (args, origin) => rpc('client_access_recovery_prepare', { p_site_slug: args.site_slug, p_email: args.email, p_origin: origin }),
    async finishRecovery(requestId, sent) { await rpc('client_access_recovery_finish', { p_request_id: requestId, p_sent: sent }); },
    async originAllowed(origin) {
      const { data, error } = await service.from('site_auth_sites').select('slug').eq('origin', origin).eq('active', true).maybeSingle();
      if (error) throw new Error('Origin lookup unavailable');
      return !!data;
    },
    async generate(email, type) {
      // generateLink does not send mail. The callback uses its OTP hash, never an arbitrary client redirect.
      const { data, error } = await service.auth.admin.generateLink({ type, email });
      if (error || !data?.properties?.hashed_token || !data?.user?.id || !data.user.email) throw new Error('Link generation unavailable');
      return { userId: data.user.id, email: data.user.email.toLowerCase(), tokenHash: data.properties.hashed_token };
    },
    async send(args) {
      const data = await rpc('get_migadu_delivery_credentials', {});
      const creds = Array.isArray(data) ? data[0] : data;
      const user = String(creds?.smtp_user || '').trim();
      const password = String(creds?.smtp_password || '');
      const from = String(creds?.alert_from || user).trim();
      if (!user || !password || !from) throw new Error('Delivery unavailable');
      await sendClientMail({ user, password, from, to: args.email, link: args.callback, siteName: args.siteName, kind: args.kind });
    },
  };
}
