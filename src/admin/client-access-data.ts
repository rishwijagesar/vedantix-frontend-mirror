import { supabase } from "@/lib/supabase";
import { createClientAccessApi } from "./client-access-api";

// The existing authenticated client sends the user's JWT; server authorization is mandatory.
export const clientAccessApi = createClientAccessApi(body => supabase.functions.invoke("client-access", { body }));
