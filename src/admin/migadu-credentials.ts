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

export type MigaduTestResult = {
  ok: boolean;
  test_email_sent: boolean;
  recipients: string[];
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

async function extractFunctionError(error: unknown, fallback: string): Promise<never> {
  const context = (error as { context?: Response } | null)?.context;
  if (context) {
    try {
      const payload = await context.clone().json();
      if (payload?.error) throw new Error(String(payload.error));
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") throw parseError;
    }
  }
  throw new Error((error as { message?: string } | null)?.message || fallback);
}

export async function saveMigaduCredentials(input: MigaduCredentialInput): Promise<MigaduCredentialResult> {
  const { data, error } = await supabase.functions.invoke("migadu-credentials", {
    body: {
      action: "save",
      user: input.user.trim().toLowerCase(),
      password: input.password,
      alert_to: input.alert_to?.trim() || undefined,
      alert_from: input.alert_from?.trim() || undefined,
    },
  });

  if (error) await extractFunctionError(error, "Migadu-configuratie kon niet worden opgeslagen.");
  if (!data?.ok || data?.authenticated !== true) {
    throw new Error(data?.error || "Migadu SMTP-authenticatie is mislukt.");
  }
  return data as MigaduCredentialResult;
}

export async function sendMigaduTestEmail(): Promise<MigaduTestResult> {
  const { data, error } = await supabase.functions.invoke("migadu-credentials", {
    body: { action: "test" },
  });

  if (error) await extractFunctionError(error, "Migadu testmail kon niet worden verstuurd.");
  if (!data?.ok || data?.test_email_sent !== true) {
    throw new Error(data?.error || "Migadu testmail kon niet worden verstuurd.");
  }
  return data as MigaduTestResult;
}
