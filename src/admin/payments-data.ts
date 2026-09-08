import { supabase } from "@/lib/supabase";

export type PaymentMethod = "BANK_TRANSFER" | "IDEAL" | "CARD" | "CASH" | "MOLLIE" | "OTHER";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bankoverschrijving",
  IDEAL: "iDEAL",
  CARD: "Kaart",
  CASH: "Contant",
  MOLLIE: "Mollie",
  OTHER: "Overig",
};

export type InvoicePayment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  external_payment_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listInvoicePayments(invoiceId?: string): Promise<InvoicePayment[]> {
  let query = supabase
    .from("invoice_payments")
    .select("*")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (invoiceId) query = query.eq("invoice_id", invoiceId);
  const { data, error } = await query;
  fail(error);
  return (data ?? []) as InvoicePayment[];
}

export async function registerInvoicePayment(input: {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  externalPaymentId?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("register_invoice_payment", {
    p_invoice_id: input.invoiceId,
    p_amount: input.amount,
    p_payment_date: input.paymentDate,
    p_method: input.method,
    p_reference: input.reference ?? null,
    p_notes: input.notes ?? null,
    p_external_payment_id: input.externalPaymentId ?? null,
  });
  fail(error);
  return data as string;
}

export async function voidInvoicePayment(paymentId: string, reason: string): Promise<string> {
  const { data, error } = await supabase.rpc("void_invoice_payment", {
    p_payment_id: paymentId,
    p_reason: reason,
  });
  fail(error);
  return data as string;
}

export async function refreshOverdueInvoices(): Promise<number> {
  const { data, error } = await supabase.rpc("refresh_overdue_invoices");
  fail(error);
  return Number(data ?? 0);
}
