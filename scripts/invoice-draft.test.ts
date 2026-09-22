import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { documentDraft, lineDraft, lineIsChanged, parseLineDraft, previewInvoice, saveInvoiceLineEdits } from "../src/admin/invoice-draft.ts";
import type { BillingItem, Invoice } from "../src/admin/sales-billing-data.ts";

const invoice = { id: "invoice", status: "DRAFT", discount_type: "NONE", discount_value: 0, notes: null } as Invoice;
const item = (id: string, price: number, vat = 21): BillingItem => ({ id, position: 1, catalog_product_id: "catalog", code: "SERVICE", description: "Dienst", billing_type: "ONE_TIME", quantity: 1, unit_price_ex_vat: price, vat_rate: vat, discount_type: "NONE", discount_value: 0, line_subtotal_ex_vat: price, line_discount_ex_vat: 0, line_total_ex_vat: price, line_vat: 0, line_total_incl_vat: 0 });

describe("invoice draft amounts", () => {
  it("recalculates the pictured invoice immediately from a custom price without changing the stored rows", () => {
    const items = [item("site", 499), item("web", 30), item("mail", 30)];
    assert.equal(previewInvoice(invoice, items, {}).total_incl_vat, 676.39);
    const edit = { ...lineDraft(items[0]), unit_price_ex_vat: "400" };
    const result = previewInvoice(invoice, items, { site: edit });
    assert.equal(result.lines[0].line_total_incl_vat, 484);
    assert.equal(result.total_ex_vat, 460);
    assert.equal(result.vat_total, 96.60);
    assert.equal(result.total_incl_vat, 556.60);
    assert.equal(items[0].unit_price_ex_vat, 499);
    assert.equal(lineIsChanged(items[0], edit), true);
    assert.equal(lineIsChanged(items[0], { ...edit, unit_price_ex_vat: "499.00" }), false);
  });
  it("handles quantity, VAT and both discount levels with the database rounding rules", () => {
    const rows = [{ ...item("a", 100), quantity: 2, discount_type: "PERCENTAGE", discount_value: 10 } as BillingItem, item("b", 100, 9)];
    const result = previewInvoice(invoice, rows, {}, { ...documentDraft(invoice), discount_type: "FIXED", discount_value: "28" });
    assert.equal(result.subtotal_ex_vat, 300);
    assert.equal(result.line_discount_ex_vat, 20);
    assert.equal(result.document_discount_ex_vat, 28);
    assert.equal(result.total_ex_vat, 252);
    assert.equal(result.vat_total, 42.12);
    assert.equal(result.total_incl_vat, 294.12);
    assert.equal(previewInvoice(invoice, [item("a", .1), item("b", .2)], {}).total_incl_vat, .36);
    assert.equal(previewInvoice(invoice, [{ ...item("a", 10.05), quantity: .1 }], {}).total_ex_vat, 1.01);
  });
  it("caps discounts at the net amount and permits a free item", () => {
    assert.equal(previewInvoice(invoice, [item("a", 0)], {}).total_incl_vat, 0);
    assert.equal(previewInvoice(invoice, [item("a", 100)], {}, { notes: "", discount_type: "PERCENTAGE", discount_value: "120" }).total_incl_vat, 0);
    assert.equal(previewInvoice(invoice, [item("a", 100)], {}, { notes: "", discount_type: "FIXED", discount_value: "200" }).total_incl_vat, 0);
  });
  it("rejects incomplete and invalid input rather than treating an empty price as zero", () => {
    for (const value of ["", "-1", "NaN", "Infinity", "1.234"]) assert.throws(() => parseLineDraft({ ...lineDraft(item("a", 1)), unit_price_ex_vat: value }));
    assert.throws(() => parseLineDraft({ ...lineDraft(item("a", 1)), quantity: "0" }));
    assert.throws(() => parseLineDraft({ ...lineDraft(item("a", 1)), vat_rate: "101" }));
    assert.throws(() => parseLineDraft({ ...lineDraft(item("a", 1)), description: " " }));
    assert.equal(parseLineDraft({ ...lineDraft(item("a", 1)), unit_price_ex_vat: "12,34" }).unit_price_ex_vat, 12.34);
  });
});

describe("saving invoice edits", () => {
  it("validates every row before writing any changes", async () => {
    let writes = 0;
    await assert.rejects(saveInvoiceLineEdits({ a: lineDraft(item("a", 40)), b: { ...lineDraft(item("b", 30)), unit_price_ex_vat: "" } }, async () => { writes++; return item("a", 40); }, () => {}));
    assert.equal(writes, 0);
  });
  it("persists all custom prices sequentially and preserves existing line discounts", async () => {
    const saved: BillingItem[] = [];
    let active = 0;
    await saveInvoiceLineEdits({ a: lineDraft(item("a", 400)), b: lineDraft(item("b", 25)) }, async (id, changes) => {
      assert.equal(active++, 0);
      await Promise.resolve();
      assert.equal("discount_type" in changes, false);
      active--;
      return { ...item(id, 1), ...changes, discount_type: "FIXED", discount_value: 5 };
    }, row => saved.push(row));
    assert.deepEqual(saved.map(row => row.unit_price_ex_vat), [400, 25]);
    assert.equal(saved[0].discount_value, 5);
  });
  it("acknowledges only successful rows so a failed save retains edits for retry", async () => {
    const edits = { a: lineDraft(item("a", 400)), b: lineDraft(item("b", 25)) };
    const pending: Record<string, unknown> = { ...edits };
    await assert.rejects(saveInvoiceLineEdits(edits, async (id, changes) => {
      if (id === "b") throw new Error("Network error");
      return { ...item(id, 1), ...changes };
    }, row => { delete pending[row.id]; }), /Network error/);
    assert.deepEqual(Object.keys(pending), ["b"]);
  });
});
