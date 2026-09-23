import { supabase } from "@/lib/supabase";

export type Ledger = { id: number; code: string; description: string; category: string };
export type Mapping = { debtor?: number; revenue?: number; bank?: number | null; mollie?: number | null };
export type AccountingConfig = { connected: boolean; last_verified_at: string | null; mapping: Mapping; sync_enabled: boolean; payment_mode: 'EXTERNAL' | 'VEDANTIX'; sync_from: string | null; last_sync_at: string | null; last_sync_error: string | null; stage: "TOKEN_REQUIRED" | "ACCOUNTS_REQUIRED" | "REVIEW_REQUIRED" | "ACTIVE" };
export type ExportRow = { kind: 'INVOICE' | 'CREDIT' | 'PAYMENT'; id: string; number: string; date: string; customer?: string; amount: number; base?: number; vat?: number; state: 'READY' | 'BLOCKED' | 'SENDING' | 'REVIEW' | 'SYNCED' | 'CHANGED'; reason?: string; remote_id?: number; review_hash?: string; ledger_id?: number };
export type AccountingPreview = { rows: ExportRow[]; excluded_invoice_count: number; first_invoice_synced: boolean; attention: number };

export async function accountingRequest(body: Record<string, unknown>): Promise<{ ok: true; config?: AccountingConfig; ledgers?: Ledger[]; preview?: AccountingPreview; message?: string; remote_id?: number }> {
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
