import { createSitePasswordResetHandler } from '../_shared/site-login-handler.ts';
import { createSiteLoginDependencies } from '../_shared/site-login-dependencies.ts';
Deno.serve(createSitePasswordResetHandler(createSiteLoginDependencies({ serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '' })));
