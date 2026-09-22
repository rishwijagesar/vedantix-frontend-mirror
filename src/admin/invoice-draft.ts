import type { BillingItem, BillingType, DiscountType, Invoice } from "./sales-billing-data";

export type InvoiceLineDraft = {
  description: string;
  code: string | null;
  billing_type: BillingType;
  quantity: string;
  unit_price_ex_vat: string;
  vat_rate: string;
};
export type InvoiceDocumentDraft = { notes: string; discount_type: DiscountType; discount_value: string };
export type InvoiceLineEdits = Record<string, InvoiceLineDraft>;

export function lineDraft(item: BillingItem): InvoiceLineDraft {
  return { description: item.description, code: item.code, billing_type: item.billing_type, quantity: String(item.quantity), unit_price_ex_vat: String(item.unit_price_ex_vat), vat_rate: String(item.vat_rate) };
}
export function documentDraft(invoice: Invoice): InvoiceDocumentDraft {
  return { notes: invoice.notes || "", discount_type: invoice.discount_type, discount_value: String(invoice.discount_value) };
}

function decimal(value: string, label: string, min = 0, max = 9999999999.99) {
  const normalized = value.trim().replace(",", ".");
  const number = Number(normalized);
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized) || !Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label}: vul een geldig bedrag of aantal in met maximaal twee decimalen.`);
  }
  return number;
}
export function parseLineDraft(draft: InvoiceLineDraft) {
  if (!draft.description.trim()) throw new Error("Vul een omschrijving in voor iedere factuurregel.");
  if (!["ONE_TIME", "MONTHLY", "YEARLY"].includes(draft.billing_type)) throw new Error("Kies een geldig betaaltype.");
  return { ...draft, description: draft.description.trim(), quantity: decimal(draft.quantity, "Aantal", 0.01, 99999999.99), unit_price_ex_vat: decimal(draft.unit_price_ex_vat, "Prijs"), vat_rate: decimal(draft.vat_rate, "Btw", 0, 100) };
}
export function parseDocumentDraft(draft: InvoiceDocumentDraft) {
  if (!["NONE", "PERCENTAGE", "FIXED"].includes(draft.discount_type)) throw new Error("Kies een geldige korting.");
  return { ...draft, notes: draft.notes.trim() || null, discount_value: decimal(draft.discount_value, "Korting") };
}
export function lineIsChanged(item: BillingItem, draft: InvoiceLineDraft) {
  try {
    const parsed = parseLineDraft(draft);
    return parsed.description !== item.description || parsed.code !== item.code || parsed.billing_type !== item.billing_type || parsed.quantity !== Number(item.quantity) || parsed.unit_price_ex_vat !== Number(item.unit_price_ex_vat) || parsed.vat_rate !== Number(item.vat_rate);
  } catch { return true; }
}

// Integer arithmetic follows PostgreSQL's per-line numeric rounding, including
// document discounts distributed over lines with different VAT rates.
const scaled = (value: number) => BigInt(Math.round(Number(value) * 100));
const rounded = (numerator: bigint, denominator: bigint) => (numerator * 2n + denominator) / (denominator * 2n);
const amount = (value: bigint) => Number(value) / 100;
const min = (a: bigint, b: bigint) => a < b ? a : b;
function discount(net: bigint, type: DiscountType, value: number) {
  return type === "PERCENTAGE" ? rounded(net * min(scaled(value), 10000n), 10000n) : type === "FIXED" ? min(scaled(value), net) : 0n;
}
export function previewInvoice(invoice: Invoice, items: BillingItem[], edits: InvoiceLineEdits, document?: InvoiceDocumentDraft | null) {
  const doc = document ? parseDocumentDraft(document) : invoice;
  const lines = items.map(item => {
    const next = edits[item.id] ? { ...item, ...parseLineDraft(edits[item.id]) } : item;
    const subtotal = rounded(scaled(next.quantity) * scaled(next.unit_price_ex_vat), 100n);
    const reduction = discount(subtotal, next.discount_type, Number(next.discount_value));
    const net = subtotal - reduction;
    const vat = rounded(net * scaled(next.vat_rate), 10000n);
    return { ...next, line_subtotal_ex_vat: amount(subtotal), line_discount_ex_vat: amount(reduction), line_total_ex_vat: amount(net), line_vat: amount(vat), line_total_incl_vat: amount(net + vat) };
  });
  const subtotal = lines.reduce((sum, line) => sum + scaled(line.line_subtotal_ex_vat), 0n);
  const lineDiscount = lines.reduce((sum, line) => sum + scaled(line.line_discount_ex_vat), 0n);
  const net = subtotal - lineDiscount;
  const docDiscount = discount(net, doc.discount_type, Number(doc.discount_value));
  const total = net - docDiscount;
  const vat = lines.reduce((sum, line) => sum + (net > 0n ? rounded(scaled(line.line_total_ex_vat) * total * scaled(line.vat_rate), net * 10000n) : 0n), 0n);
  return { lines, subtotal_ex_vat: amount(subtotal), line_discount_ex_vat: amount(lineDiscount), document_discount_ex_vat: amount(docDiscount), total_ex_vat: amount(total), vat_total: amount(vat), total_incl_vat: amount(total + vat) };
}

// Validate the complete edit before the first write. Save sequentially because
// each row update recalculates the same invoice in the database. Successful rows
// are acknowledged individually so a failed later row can be safely retried.
export async function saveInvoiceLineEdits(
  edits: InvoiceLineEdits,
  save: (id: string, changes: ReturnType<typeof parseLineDraft>) => Promise<BillingItem>,
  onSaved: (item: BillingItem) => void,
) {
  const parsed = Object.entries(edits).map(([id, draft]) => [id, parseLineDraft(draft)] as const);
  for (const [id, changes] of parsed) onSaved(await save(id, changes));
}
