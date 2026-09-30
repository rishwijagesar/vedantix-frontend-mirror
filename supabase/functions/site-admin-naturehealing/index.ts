import { createClient } from 'jsr:@supabase/supabase-js@2.57.4';
import { createProxyHandler } from './handler.ts';

const centralUrl = 'https://zxnexwqvoznmirajhgxj.supabase.co';
const centralKey = 'sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu';

// Deploy this entrypoint to the central Vedantix project, not Nature Healing Cloud.
// The Cloud adapter and its local service key stay behind this fixed endpoint.
Deno.serve(createProxyHandler({
  upstream: 'https://project--b1d4590e-b32a-4d79-be6e-4b6542b07bc3.lovable.app/api/public/vedantix/site-admin',
  forward: fetch,
  async authorize(token) {
    const central = createClient(centralUrl, centralKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: identity, error: identityError } = await central.auth.getUser(token);
    if (identityError || !identity.user || identity.user.is_anonymous || !identity.user.email_confirmed_at) return false;
    const { data, error } = await central.rpc('can_manage_site', { p_site_slug: 'naturehealing' });
    if (error) throw new Error('Central authorization unavailable');
    return data === true;
  },
}));
