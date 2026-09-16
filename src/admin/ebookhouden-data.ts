import { supabase } from "@/lib/supabase";

export type Ledger = { id: number; code: string; description: string; category: string };
export type Mapping = { debtor?: number; revenue?: number; bank?: number | null; mollie?: number | null };
export type AccountingConfig = { connected: boolean; last_verified_at: string | null; mapping: Mapping; sync_enabled: false; stage: "TOKEN_REQUIRED" | "ACCOUNTS_REQUIRED" | "REVIEW_REQUIRED" };
export type AccountingPreview = { invoices: Array<{ id: string; number: string; title: string; date: string | null; amount: number }>; credits: Array<{ id: string; number: string; date: string | null; amount: number }>; payment_count: number; payment_amount: number; excluded_invoice_count: number };

export async function accountingRequest(body: Record<string, unknown>): Promise<{ ok: true; config?: AccountingConfig; ledgers?: Ledger[]; preview?: AccountingPreview }> {
  const { data, error } = await supabase.functions.invoke("ebookhouden-admin", { body });
  if (error) {
    let message = "De boekhoudinstellingen konden niet worden geladen. Probeer opnieuw.";
    if (error.context instanceof Response) {
      try { const detail = await error.context.json(); if (typeof detail.error === "string") message = detail.error; } catch { /* generic error */ }
    }
    throw new Error(message);
  }
  if (!data?.ok) throw new Error(typeof data?.error === "string" ? data.error : "Onverwacht antwoord van de boekhoudkoppeling.");
  return data;
}
