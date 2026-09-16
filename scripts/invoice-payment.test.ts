import { test, expect, mock } from "bun:test";
mock.module("@/lib/supabase", () => ({ supabase: {} }));
const { renderBillingDocumentHtml } = await import("../src/admin/billing-document");
const invoice: any = { invoice_number: "VED-2026-001", public_token: "00000000-0000-4000-8000-000000000001", status: "FINALIZED", total_incl_vat: 121, amount_paid: 0, title: '<script>alert("x")</script>', payment_reference: "PROJECT-ABC" };

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
