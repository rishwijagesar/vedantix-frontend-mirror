/** Shared by printed invoices, the public page and the server-side checkout. */
export type InvoicePaymentData = {
  invoice_number?: string | null;
  title?: string | null;
  payment_reference?: string | null;
  status?: string;
  is_active?: boolean;
  total_incl_vat?: number | string;
  amount_paid?: number | string;
  amount_outstanding?: number | string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export function invoicePaymentReference(invoice: InvoicePaymentData) {
  const number = clean(invoice.invoice_number);
  const reference = clean(invoice.payment_reference);
  return (!reference || reference === number ? number : `${number} - ${reference}`).slice(0, 140);
}

export function invoicePaymentDescription(invoice: InvoicePaymentData) {
  const title = clean(invoice.title);
  return `Factuur ${clean(invoice.invoice_number)} - Vedantix${title ? ` - ${title}` : ""}`.slice(0, 255);
}

export function invoiceOutstanding(invoice: InvoicePaymentData) {
  const amount = invoice.amount_outstanding == null
    ? Number(invoice.total_incl_vat ?? 0) - Number(invoice.amount_paid ?? 0)
    : Number(invoice.amount_outstanding);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100) / 100) : 0;
}

export function isInvoicePayable(invoice: InvoicePaymentData) {
  return Boolean(clean(invoice.invoice_number)) && invoice.is_active !== false
    && ["FINALIZED", "SENT", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status ?? "")
    && invoiceOutstanding(invoice) > 0;
}

export function invoicePaymentUrl(token: string | null | undefined) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token ?? "")
    ? `https://vedantix.nl/factuur/${token}#betalen` : null;
}

export function invoiceQrUrl(token: string | null | undefined) {
  return invoicePaymentUrl(token)
    ? `https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/invoice-payment-qr?token=${token}` : null;
}
