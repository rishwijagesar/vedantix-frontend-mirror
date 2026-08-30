import { supabase } from "@/lib/supabase";

export type MigaduCredentialInput = {
  user: string;
  password: string;
  alert_to?: string;
  alert_from?: string;
};

export type MigaduCredentialResult = {
  ok: boolean;
  authenticated: boolean;
  stored_in: "supabase_vault";
  user: string;
  alert_to: string;
  alert_from: string;
};

export async function getCurrentStaffRole(): Promise<string | null> {
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) throw new Error(claimsError.message);
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("staff_users")
    .select("role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.role ?? null;
}

export async function saveMigaduCredentials(input: MigaduCredentialInput): Promise<MigaduCredentialResult> {
  const { data, error } = await supabase.functions.invoke("migadu-credentials", {
    body: {
      user: input.user.trim().toLowerCase(),
      password: input.password,
      alert_to: input.alert_to?.trim() || undefined,
      alert_from: input.alert_from?.trim() || undefined,
    },
  });

  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const payload = await context.clone().json();
        if (payload?.error) throw new Error(String(payload.error));
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") throw parseError;
      }
    }
    throw new Error(error.message || "Migadu-configuratie kon niet worden opgeslagen.");
  }

  if (!data?.ok || data?.authenticated !== true) {
    throw new Error(data?.error || "Migadu SMTP-authenticatie is mislukt.");
  }

  return data as MigaduCredentialResult;
}
