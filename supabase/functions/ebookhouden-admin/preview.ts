export type PreviewInvoice = { id: string; invoice_number: string | null; status: string; is_active: boolean; title: string; total_incl_vat: number; invoice_date: string | null };
export type PreviewCredit = { id: string; invoice_id: string; credit_number: string | null; status: string; total_incl_vat: number; credit_date: string | null };
export type PreviewPayment = { id: string; invoice_id: string; amount: number; method: string; voided_at: string | null; metadata: Record<string, unknown> | null };
export type PreviewRequest = { invoice_id: string; metadata: Record<string, unknown> | null };
export function isTestMetadata(value: Record<string, unknown> | null) {
  return Boolean(value && (value["test_fixture"] === true || value["test_fixture"] === "true" || String(value["mollie_mode"] || "").toLowerCase() === "test"));
}
export function buildAccountingPreview(invoices: PreviewInvoice[], credits: PreviewCredit[], payments: PreviewPayment[], requests: PreviewRequest[]) {
  const testInvoices = new Set(requests.filter(row => isTestMetadata(row.metadata)).map(row => row.invoice_id));
  const eligible = invoices.filter(row => row.is_active && ["FINALIZED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CREDITED"].includes(row.status) && row.invoice_number && !/^TEST(?:\b|[-_])/i.test(row.invoice_number) && !testInvoices.has(row.id));
  const ids = new Set(eligible.map(row => row.id));
  const eligibleCredits = credits.filter(row => ids.has(row.invoice_id) && ["FINALIZED", "SENT"].includes(row.status) && row.credit_number);
  const eligiblePayments = payments.filter(row => ids.has(row.invoice_id) && !row.voided_at && !isTestMetadata(row.metadata));
  return {
    invoices: eligible.map(row => ({ id: row.id, number: row.invoice_number, title: row.title, date: row.invoice_date, amount: Number(row.total_incl_vat), status: "NOT_SYNCED" })),
    credits: eligibleCredits.map(row => ({ id: row.id, number: row.credit_number, date: row.credit_date, amount: Number(row.total_incl_vat), status: "NOT_SYNCED" })),
    payment_count: eligiblePayments.length,
    payment_amount: Math.round(eligiblePayments.reduce((sum, row) => sum + Number(row.amount), 0) * 100) / 100,
    excluded_invoice_count: invoices.length - eligible.length,
  };
}
