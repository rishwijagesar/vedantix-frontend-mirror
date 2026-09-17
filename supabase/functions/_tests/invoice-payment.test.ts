import { assertEquals, assert, assertStringIncludes } from "jsr:@std/assert@1";
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFString } from "npm:pdf-lib@1.17.1";
import jsQR from "npm:jsqr@1.4.0";
import { invoicePaymentDescription, invoicePaymentReference, invoicePaymentUrl, invoiceOutstanding, isInvoicePayable } from "../_shared/invoice-payment.ts";
import { invoiceQr } from "../_shared/invoice-qr.ts";
import { makePdf } from "../billing-pdf/document.ts";

const token = "00000000-0000-4000-8000-000000000001";
const invoice = {
  invoice_number: "VED-TEST-2026-001", title: "Website & hosting september 2026",
  status: "FINALIZED", invoice_date: "2026-09-16", delivery_date: "2026-09-14", due_date: "2026-09-30",
  total_ex_vat: 100, vat_total: 21, total_incl_vat: 121, amount_paid: 0, amount_outstanding: 121,
  payment_reference: "PROJECT-ABC", company: { trade_name: "Vedantix", iban: "NL00 TEST 0000 0000 00", email: "info@example.com" },
  customer: { company_name: "Voorbeeldklant", address_line1: "Voorbeeldstraat 1", postal_code: "1000 AA", city: "Voorbeeldstad" },
  items: [{ description: "Website & hosting", billing_type: "ONE_TIME", quantity: 1, vat_rate: 21, line_total_ex_vat: 100, line_vat: 21, line_total_incl_vat: 121 }],
};

function links(pdf: PDFDocument) {
  return pdf.getPages().flatMap(page => {
    const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    if (!annots) return [];
    return annots.asArray().map(ref => {
      const annotation = pdf.context.lookup(ref, PDFDict);
      const action = annotation.lookup(PDFName.of("A"), PDFDict);
      return action.lookup(PDFName.of("URI"), PDFString).decodeText();
    });
  });
}

Deno.test("reference and provider description keep invoice number, title and custom reference", () => {
  assertEquals(invoicePaymentReference(invoice), "VED-TEST-2026-001 - PROJECT-ABC");
  assertEquals(invoicePaymentDescription(invoice), "Factuur VED-TEST-2026-001 - Vedantix - Website & hosting september 2026");
  assertEquals(invoicePaymentReference({ ...invoice, payment_reference: invoice.invoice_number }), invoice.invoice_number);
  assertEquals(invoicePaymentReference({ ...invoice, payment_reference: null }), invoice.invoice_number);
  const long = invoicePaymentDescription({ ...invoice, title: "x".repeat(600) });
  assertEquals(long.length, 255);
  assertStringIncludes(long, invoice.invoice_number);
});

Deno.test("only active outstanding finalized/sent invoices can be paid", () => {
  for (const status of ["FINALIZED", "SENT", "PARTIALLY_PAID", "OVERDUE"]) assert(isInvoicePayable({ ...invoice, status }));
  for (const status of ["DRAFT", "PAID", "CREDITED"]) assert(!isInvoicePayable({ ...invoice, status }));
  assert(!isInvoicePayable({ ...invoice, is_active: false }));
  assert(!isInvoicePayable({ ...invoice, amount_outstanding: 0 }));
  assert(!isInvoicePayable({ ...invoice, amount_outstanding: NaN }));
  assertEquals(invoiceOutstanding({ total_incl_vat: 121, amount_paid: 50 }), 71);
  assertEquals(invoicePaymentUrl('"><script>'), null);
});

Deno.test("independent QR decoder reads the exact stable invoice payment URL", () => {
  const url = invoicePaymentUrl(token)!;
  const qr = invoiceQr(url);
  const count = qr.getModuleCount();
  const scale = 6, width = (count + 8) * scale;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
    if (!qr.isDark(row, col)) continue;
    for (let yy = 0; yy < scale; yy++) for (let xx = 0; xx < scale; xx++) {
      const offset = (((row + 4) * scale + yy) * width + (col + 4) * scale + xx) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
    }
  }
  assertEquals(jsQR(pixels, width, width)?.data, url);
});

Deno.test("PDF has a real clickable payment link; closed invoices and quotes do not", async () => {
  for (const status of ["FINALIZED", "SENT", "PARTIALLY_PAID", "OVERDUE"]) {
    const pdf = await PDFDocument.load(await makePdf("invoice", { ...invoice, status }, token));
    assertEquals(links(pdf), [invoicePaymentUrl(token)]);
  }
  for (const change of [{ status: "PAID" }, { status: "CREDITED" }, { status: "DRAFT" }, { is_active: false }, { amount_outstanding: 0 }]) {
    const pdf = await PDFDocument.load(await makePdf("invoice", { ...invoice, ...change }, token));
    assertEquals(links(pdf), []);
  }
  const quote = await PDFDocument.load(await makePdf("quote", { ...invoice, quote_number: "OFF-TEST", quote_date: "2026-09-16", status: "SENT" }, token));
  assertEquals(links(quote), []);
});

Deno.test("long payment descriptions and multipage invoices retain their link", async () => {
  const bytes = await makePdf("invoice", { ...invoice, title: "Langere omschrijving ".repeat(30), items: Array.from({ length: 40 }, () => invoice.items[0]) }, token);
  const pdf = await PDFDocument.load(bytes);
  assert(pdf.getPageCount() > 1);
  assertEquals(links(pdf), [invoicePaymentUrl(token)]);
});

if (Deno.args.includes("--preview")) {
  await Deno.mkdir("tmp/invoice-payment", { recursive: true });
  await Deno.writeFile("tmp/invoice-payment/invoice-payment.pdf", await makePdf("invoice", invoice, token));
  await Deno.writeFile("tmp/invoice-payment/invoice-payment-long.pdf", await makePdf("invoice", { ...invoice, title: "Langere omschrijving ".repeat(30), items: Array.from({ length: 40 }, () => invoice.items[0]) }, token));
}
