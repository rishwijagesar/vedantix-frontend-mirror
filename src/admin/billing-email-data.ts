import { supabase } from "@/lib/supabase";

export type BillingEmailStatus = "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
export type BillingEmailType = "QUOTE" | "INVOICE" | "REMINDER";

export type BillingEmailRow = {
  id: string;
  message_type: BillingEmailType;
  quote_id: string | null;
  invoice_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_text: string;
  action_url: string | null;
  status: BillingEmailStatus;
  attempt_count: number;
  processed_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listBillingEmails(limit = 100): Promise<BillingEmailRow[]> {
  const { data, error } = await supabase
    .from("billing_email_outbox")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  fail(error);
  return (data ?? []) as BillingEmailRow[];
}

export async function queueQuoteEmail(quoteId: string): Promise<string> {
  const { data, error } = await supabase.rpc("queue_quote_email", { p_quote_id: quoteId });
  fail(error);
  return data as string;
}

export async function queueInvoiceEmail(invoiceId: string): Promise<string> {
  const { data, error } = await supabase.rpc("queue_invoice_email", { p_invoice_id: invoiceId });
  fail(error);
  return data as string;
}

export async function queueDueInvoiceReminders(): Promise<number> {
  const { data, error } = await supabase.rpc("queue_due_invoice_reminders");
  fail(error);
  return Number(data ?? 0);
}

export async function triggerBillingEmailDelivery(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc("trigger_billing_email_delivery");
  fail(error);
  return (data ?? {}) as Record<string, unknown>;
}

export async function retryBillingEmail(messageId: string): Promise<string> {
  const { data, error } = await supabase.rpc("retry_billing_email", { p_message_id: messageId });
  fail(error);
  return data as string;
}
