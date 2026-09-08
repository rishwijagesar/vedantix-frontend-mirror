import { supabase } from "@/lib/supabase";

export type ReadinessTarget = {
  ok: boolean;
  http_status: number | null;
  marker: string | null;
  platform: string | null;
  error?: string;
};

export type ProductionReadiness = {
  ok: boolean;
  ready_for_activation?: boolean;
  activated?: boolean;
  billing_enabled?: boolean;
  reminders_enabled?: boolean;
  mollie_unchanged?: boolean;
  error?: string;
  live: ReadinessTarget;
  preview: ReadinessTarget;
  billing: { delivery_enabled: boolean; reminders_enabled: boolean } | null;
  mollie: { enabled: boolean; mode: "TEST" | "LIVE"; credentials_configured: boolean; key_present: boolean } | null;
};

async function invoke(action: "status" | "activate" | "deactivate") {
  const { data, error } = await supabase.functions.invoke("production-readiness", { body: { action } });
  if (error) throw new Error(error.message);
  return data as ProductionReadiness;
}

export const getProductionReadiness = () => invoke("status");
export const activateProductionCommerce = () => invoke("activate");
export const deactivateProductionCommerce = () => invoke("deactivate");
