import { createClientPasswordResetHandler } from '../_shared/client-access-handler.ts';
import { createDependencies } from '../_shared/client-access-dependencies.ts';
Deno.serve(createClientPasswordResetHandler(createDependencies()));
