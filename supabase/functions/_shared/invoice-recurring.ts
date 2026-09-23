import { invoiceOutstanding, isInvoicePayable, type InvoicePaymentData } from "./invoice-payment.ts";

type RecurringItem = {
  billing_type?: string;
  line_total_ex_vat?: number | string;
  line_vat?: number | string;
  line_discount_ex_vat?: number | string;
};
type Invoice = InvoicePaymentData & { document_discount_ex_vat?: number | string };

/** Presentation only: invoice snapshots, never live catalogue prices or a new subscription. */
export function invoiceRecurringExplanation(invoice: Invoice, items: RecurringItem[], money: (amount: number) => string): string[] {
  if (invoice.is_active === false || ["VOID", "CREDITED", "CANCELLED"].includes(invoice.status ?? "")) return [];
  const periods = [
    { type: "MONTHLY", label: "maandelijks" },
    { type: "YEARLY", label: "jaarlijks" },
  ].flatMap(({ type, label }) => {
    const rows = items.filter(item => item.billing_type === type);
    return rows.length ? [{ rows, label }] : [];
  });
  if (!periods.length) return [];

  const paid = invoice.status === "PAID" || (Number(invoice.total_incl_vat) > 0 && invoiceOutstanding(invoice) === 0);
  const amount = isInvoicePayable(invoice)
    ? `Nog te betalen voor deze factuur: ${money(invoiceOutstanding(invoice))} incl. btw.`
    : paid ? "Deze factuur is betaald." : `Factuurbedrag: ${money(Number(invoice.total_incl_vat) || 0)} incl. btw.`;
  const mixed = items.some(item => !item.billing_type || item.billing_type === "ONE_TIME");
  const lines = [amount + (mixed
    ? " Het factuurbedrag omvat de eenmalige werkzaamheden en de terugkerende diensten voor de gefactureerde periode."
    : " Het factuurbedrag omvat de terugkerende diensten voor de gefactureerde periode.")];

  for (const { rows, label } of periods) {
    // A discount on this invoice does not establish a discount for future periods.
    const uncertain = Number(invoice.document_discount_ex_vat) > 0 || rows.some(row => Number(row.line_discount_ex_vat) > 0);
    const ex = rows.reduce((sum, row) => sum + Number(row.line_total_ex_vat), 0);
    const vat = rows.reduce((sum, row) => sum + Number(row.line_vat), 0);
    if (uncertain || !Number.isFinite(ex + vat) || ex < 0 || vat < 0) {
      lines.push(`Deze diensten keren ${label} terug. Het tarief voor volgende periodes volgt de gemaakte afspraken.`);
    } else {
      lines.push(`Daarna ${label}: ${money(Math.round(ex * 100) / 100)} excl. btw (${money(Math.round((ex + vat) * 100) / 100)} incl. btw), op basis van de tarieven op deze factuur.`);
    }
  }
  if (mixed) lines.push("De eenmalige werkzaamheden worden niet opnieuw in rekening gebracht.");
  return lines;
}
