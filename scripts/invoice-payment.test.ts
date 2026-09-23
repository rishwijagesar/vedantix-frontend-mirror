import { test, expect, mock } from "bun:test";
mock.module("@/lib/supabase", () => ({ supabase: {} }));
const { renderBillingDocumentHtml } = await import("../src/admin/billing-document");
const invoice: any = { invoice_number: "VED-2026-001", public_token: "00000000-0000-4000-8000-000000000001", status: "FINALIZED", total_incl_vat: 121, amount_paid: 0, title: '<script>alert("x")</script>', payment_reference: "PROJECT-ABC" };
const recurringItems: any[] = [
  { description: "Website", billing_type: "ONE_TIME", quantity: 1, unit_price_ex_vat: 499, vat_rate: 21, line_total_ex_vat: 499, line_vat: 104.79 },
  { description: "Webhosting", billing_type: "YEARLY", quantity: 1, unit_price_ex_vat: 30, vat_rate: 21, line_total_ex_vat: 30, line_vat: 6.3 },
  { description: "Mailhosting", billing_type: "YEARLY", quantity: 1, unit_price_ex_vat: 30, vat_rate: 21, line_total_ex_vat: 30, line_vat: 6.3 },
];
const recurringHtml = (patch: any = {}, items = recurringItems) => renderBillingDocumentHtml("INVOICE", { ...invoice, total_incl_vat: 676.39, ...patch }, items).replaceAll("\u00a0", " ");

test("current invoice includes this period; only recurring snapshot lines return next year", () => {
  const html = recurringHtml();
  expect(html).toContain("Nog te betalen voor deze factuur: € 676,39 incl. btw.");
  expect(html).toContain("Daarna jaarlijks: € 60,00 excl. btw (€ 72,60 incl. btw)");
  expect(html).toContain("eenmalige werkzaamheden worden niet opnieuw");
  expect(recurringHtml({}, [recurringItems[0], { ...recurringItems[1], quantity: 2, line_total_ex_vat: 60, line_vat: 12.6 }, recurringItems[2]])).toContain("Daarna jaarlijks: € 90,00 excl. btw (€ 108,90 incl. btw)");
});

test("monthly and yearly services stay separate and renewals do not claim a first year", () => {
  const html = recurringHtml({}, [recurringItems[1], { ...recurringItems[2], billing_type: "MONTHLY", line_total_ex_vat: 10, line_vat: 0.9 }]);
  expect(html).toContain("Daarna maandelijks: € 10,00 excl. btw (€ 10,90 incl. btw)");
  expect(html).toContain("Daarna jaarlijks: € 30,00 excl. btw (€ 36,30 incl. btw)");
  expect(html).not.toContain("eenmalige werkzaamheden");
  expect(html).not.toContain("eerste jaar");
});

test("recurring explanation respects outstanding balance, closed invoices and discounts", () => {
  expect(recurringHtml({ amount_paid: 100, status: "PARTIALLY_PAID" })).toContain("Nog te betalen voor deze factuur: € 576,39");
  expect(recurringHtml({ status: "PAID", amount_paid: 676.39 })).toContain("Deze factuur is betaald.");
  expect(recurringHtml({ status: "PAID" })).not.toContain("Nog te betalen voor deze factuur:");
  expect(recurringHtml({ status: "DRAFT" })).not.toContain("Nog te betalen voor deze factuur:");
  for (const patch of [{ status: "CREDITED" }, { status: "VOID" }, { is_active: false }]) expect(recurringHtml(patch)).not.toContain("Daarna jaarlijks:");
  expect(recurringHtml({ document_discount_ex_vat: 25 })).toContain("Het tarief voor volgende periodes volgt de gemaakte afspraken.");
  expect(recurringHtml({ document_discount_ex_vat: 25 })).not.toContain("Daarna jaarlijks: €");
  expect(recurringHtml({}, [{ ...recurringItems[1], line_discount_ex_vat: 5 }])).not.toContain("Daarna jaarlijks: €");
  expect(recurringHtml({}, [recurringItems[0]])).not.toContain("Deze factuur en terugkerende kosten</h3>");
  expect(renderBillingDocumentHtml("QUOTE", invoice, recurringItems)).not.toContain("Deze factuur en terugkerende kosten</h3>");
});

test("printed invoice uses one token for the clickable button and first-party QR", () => {
  const html = renderBillingDocumentHtml("INVOICE", invoice, []);
  expect(html).toContain('href="https://vedantix.nl/factuur/00000000-0000-4000-8000-000000000001#betalen"');
  expect(html).toContain("invoice-payment-qr?token=00000000-0000-4000-8000-000000000001");
  expect(html).toContain("VED-2026-001 - PROJECT-ABC");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain('<script>alert("x")</script>');
});
test("draft, paid, credited, archived and tokenless documents have no pay CTA", () => {
  for (const patch of [{ status: "DRAFT" }, { status: "PAID" }, { status: "CREDITED" }, { is_active: false }, { amount_paid: 121 }, { public_token: null }]) {
    expect(renderBillingDocumentHtml("INVOICE", { ...invoice, ...patch }, [])).not.toContain('class="payment-button"');
  }
});

test("printed invoice distinguishes delivery date from invoice and due dates", () => {
  const html = renderBillingDocumentHtml("INVOICE", { ...invoice, invoice_date: "2026-09-16", delivery_date: "2026-09-14", due_date: "2026-09-30" }, []);
  expect(html).toContain("<span>Leverdatum</span><strong>14-09-2026</strong>");
  expect(html).toContain("<span>Datum</span><strong>16-09-2026</strong>");
  expect(html).toContain("<span>Vervaldatum</span><strong>30-09-2026</strong>");
  const missing = renderBillingDocumentHtml("INVOICE", { ...invoice, invoice_date: "2026-09-16", delivery_date: null }, []);
  expect(missing).toContain("<span>Leverdatum</span><strong>—</strong>");
});
