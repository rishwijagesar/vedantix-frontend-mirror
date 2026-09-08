import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 46;
const CONTENT_WIDTH = A4.width - MARGIN * 2;
const DARK = rgb(0.0588, 0.0902, 0.1647);
const SLATE = rgb(0.278, 0.333, 0.412);
const LIGHT = rgb(0.945, 0.957, 0.976);
const BORDER = rgb(0.82, 0.85, 0.89);
const BLUE = rgb(0.145, 0.388, 0.922);
const GREEN = rgb(0.047, 0.55, 0.32);
const RED = rgb(0.78, 0.12, 0.16);

function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF\u20AC]/g, "");
}

function money(value: unknown) {
  const amount = Number(value || 0);
  return `EUR ${amount.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateNl(value: unknown) {
  if (!value) return "-";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return safeText(value);
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const result: string[] = [];
  for (const paragraph of safeText(text).split(/\n/)) {
    if (!paragraph.trim()) { result.push(""); continue; }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        if (line) result.push(line);
        if (font.widthOfTextAtSize(word, size) <= maxWidth) line = word;
        else {
          let piece = "";
          for (const char of word) {
            if (font.widthOfTextAtSize(piece + char, size) <= maxWidth) piece += char;
            else { if (piece) result.push(piece); piece = char; }
          }
          line = piece;
        }
      }
    }
    if (line) result.push(line);
  }
  return result;
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, font: PDFFont, size: number, color = DARK, lineHeight = size * 1.35) {
  let current = y;
  for (const line of lines) {
    page.drawText(line || " ", { x, y: current, size, font, color });
    current -= lineHeight;
  }
  return current;
}

type DocKind = "quote" | "invoice";
type AnyRecord = Record<string, any>;

async function makePdf(kind: DocKind, doc: AnyRecord) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage;
  let y = 0;
  let pageNo = 0;

  const newPage = () => {
    page = pdf.addPage([A4.width, A4.height]);
    pageNo += 1;
    page.drawRectangle({ x: 0, y: A4.height - 104, width: A4.width, height: 104, color: DARK });
    page.drawText("VEDANTIX", { x: MARGIN, y: A4.height - 55, size: 21, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Websites & online groei", { x: MARGIN, y: A4.height - 76, size: 9, font: regular, color: rgb(0.65, 0.7, 0.78) });
    const title = kind === "quote" ? "OFFERTE" : "FACTUUR";
    const number = safeText(kind === "quote" ? doc.quote_number : doc.invoice_number);
    const titleWidth = bold.widthOfTextAtSize(title, 10);
    const numberWidth = bold.widthOfTextAtSize(number, 17);
    page.drawText(title, { x: A4.width - MARGIN - titleWidth, y: A4.height - 48, size: 10, font: bold, color: rgb(0.65, 0.7, 0.78) });
    page.drawText(number, { x: A4.width - MARGIN - numberWidth, y: A4.height - 72, size: 17, font: bold, color: rgb(1, 1, 1) });
    y = A4.height - 134;
  };

  const ensure = (needed: number) => {
    if (y - needed < 60) newPage();
  };

  const label = (text: string, x: number, yy: number) => page.drawText(text.toUpperCase(), { x, y: yy, size: 7.5, font: bold, color: SLATE });
  const value = (text: unknown, x: number, yy: number, size = 9.5) => page.drawText(safeText(text) || "-", { x, y: yy, size, font: regular, color: DARK });

  newPage();

  const company = doc.company || {};
  const customer = doc.customer || {};

  label(kind === "quote" ? "Offerte voor" : "Factuur aan", MARGIN, y);
  label(kind === "quote" ? "Offertedatum" : "Factuurdatum", 350, y);
  y -= 18;
  page.drawText(safeText(customer.company_name || customer.contact_name || "Klant"), { x: MARGIN, y, size: 12, font: bold, color: DARK });
  value(dateNl(kind === "quote" ? doc.quote_date : doc.invoice_date), 430, y);
  y -= 17;
  if (customer.contact_name && customer.company_name) { value(customer.contact_name, MARGIN, y); y -= 14; }
  if (customer.address_line1) { value(customer.address_line1, MARGIN, y); y -= 14; }
  if (customer.address_line2) { value(customer.address_line2, MARGIN, y); y -= 14; }
  if (customer.postal_code || customer.city) { value(`${customer.postal_code || ""} ${customer.city || ""}`.trim(), MARGIN, y); y -= 14; }
  if (customer.country) { value(customer.country, MARGIN, y); }

  const sideY = A4.height - 169;
  label(kind === "quote" ? "Geldig tot" : "Vervaldatum", 350, sideY - 28);
  value(dateNl(kind === "quote" ? doc.valid_until : doc.due_date), 430, sideY - 28);
  label("Status", 350, sideY - 56);
  const statusText = safeText(doc.status);
  const statusColor = ["ACCEPTED", "PAID"].includes(statusText) ? GREEN : ["REJECTED", "OVERDUE"].includes(statusText) ? RED : BLUE;
  page.drawText(statusText, { x: 430, y: sideY - 56, size: 9, font: bold, color: statusColor });

  y -= 35;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4.width - MARGIN, y }, thickness: 0.8, color: BORDER });
  y -= 24;

  if (kind === "quote" && doc.intro_text) {
    const lines = wrap(doc.intro_text, regular, 9.5, CONTENT_WIDTH);
    ensure(lines.length * 14 + 24);
    y = drawLines(page, lines, MARGIN, y, regular, 9.5, DARK, 14);
    y -= 14;
  }

  const items: AnyRecord[] = Array.isArray(doc.items) ? doc.items : [];
  const groups = [
    ["ONE_TIME", "Eenmalig"],
    ["MONTHLY", "Maandelijks"],
    ["YEARLY", "Jaarlijks"],
  ] as const;

  const cols = { desc: MARGIN, qty: 322, excl: 365, vat: 441, incl: 489 };
  const widths = { desc: 266, qty: 36, excl: 68, vat: 44, incl: 60 };

  for (const [billingType, groupName] of groups) {
    const rows = items.filter((item) => (item.billing_type || "ONE_TIME") === billingType);
    if (!rows.length) continue;
    ensure(50);
    page.drawText(groupName, { x: MARGIN, y, size: 10.5, font: bold, color: DARK });
    y -= 18;
    page.drawRectangle({ x: MARGIN, y: y - 19, width: CONTENT_WIDTH, height: 23, color: LIGHT });
    page.drawText("Omschrijving", { x: cols.desc + 5, y: y - 12, size: 7.5, font: bold, color: SLATE });
    page.drawText("Aantal", { x: cols.qty, y: y - 12, size: 7.5, font: bold, color: SLATE });
    page.drawText("Excl.", { x: cols.excl, y: y - 12, size: 7.5, font: bold, color: SLATE });
    page.drawText("BTW", { x: cols.vat, y: y - 12, size: 7.5, font: bold, color: SLATE });
    page.drawText("Incl.", { x: cols.incl, y: y - 12, size: 7.5, font: bold, color: SLATE });
    y -= 27;

    for (const item of rows) {
      const descLines = wrap(item.description || "", regular, 8.5, widths.desc - 8);
      const rowHeight = Math.max(25, descLines.length * 11 + 10);
      ensure(rowHeight + 8);
      let descY = y - 10;
      for (const line of descLines) { page.drawText(line, { x: cols.desc + 5, y: descY, size: 8.5, font: regular, color: DARK }); descY -= 11; }
      page.drawText(safeText(Number(item.quantity || 0)), { x: cols.qty, y: y - 10, size: 8.5, font: regular, color: DARK });
      page.drawText(money(item.line_total_ex_vat), { x: cols.excl, y: y - 10, size: 7.8, font: regular, color: DARK });
      page.drawText(money(item.line_vat), { x: cols.vat, y: y - 10, size: 7.8, font: regular, color: DARK });
      page.drawText(money(item.line_total_incl_vat), { x: cols.incl, y: y - 10, size: 7.8, font: bold, color: DARK });
      y -= rowHeight;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: A4.width - MARGIN, y }, thickness: 0.4, color: BORDER });
    }
    y -= 17;
  }

  ensure(145);
  const boxX = 306;
  const boxW = A4.width - MARGIN - boxX;
  const totalRows: Array<[string, string, boolean?]> = [
    ["Totaal excl. btw", money(doc.total_ex_vat)],
    ["BTW", money(doc.vat_total)],
    ["Totaal incl. btw", money(doc.total_incl_vat), true],
  ];
  if (kind === "invoice" && Number(doc.amount_paid || 0) > 0) totalRows.push(["Reeds betaald", `- ${money(doc.amount_paid)}`]);
  if (kind === "invoice") totalRows.push(["Openstaand", money(doc.amount_outstanding), true]);

  const boxH = totalRows.length * 23 + 20;
  page.drawRectangle({ x: boxX, y: y - boxH + 10, width: boxW, height: boxH, color: LIGHT, borderColor: BORDER, borderWidth: 0.5 });
  let ty = y - 8;
  for (const [name, amount, strong] of totalRows) {
    page.drawText(name, { x: boxX + 12, y: ty, size: strong ? 9.5 : 8.7, font: strong ? bold : regular, color: DARK });
    const f = strong ? bold : regular;
    const s = strong ? 9.5 : 8.7;
    const tw = f.widthOfTextAtSize(amount, s);
    page.drawText(amount, { x: boxX + boxW - 12 - tw, y: ty, size: s, font: f, color: DARK });
    ty -= 23;
  }
  y -= boxH + 14;

  if (kind === "invoice" && Number(doc.amount_outstanding || 0) > 0 && doc.status !== "CREDITED") {
    ensure(95);
    page.drawRectangle({ x: MARGIN, y: y - 72, width: CONTENT_WIDTH, height: 78, color: rgb(0.92, 0.95, 1), borderColor: rgb(0.65, 0.75, 0.95), borderWidth: 0.6 });
    page.drawText("Betaalgegevens", { x: MARGIN + 12, y: y - 16, size: 10, font: bold, color: DARK });
    const paymentLines = [
      `Openstaand: ${money(doc.amount_outstanding)}`,
      company.iban ? `IBAN: ${safeText(company.iban)}` : "",
      doc.payment_reference ? `Betalingskenmerk: ${safeText(doc.payment_reference)}` : "",
      doc.due_date ? `Betaal uiterlijk: ${dateNl(doc.due_date)}` : "",
    ].filter(Boolean);
    drawLines(page, paymentLines, MARGIN + 12, y - 33, regular, 8.7, DARK, 12);
    y -= 92;
  }

  const notes = kind === "quote" ? (doc.notes || doc.terms) : doc.notes;
  if (notes) {
    const noteLines = wrap(notes, regular, 8.7, CONTENT_WIDTH);
    ensure(noteLines.length * 12 + 36);
    page.drawText(kind === "quote" ? "Notities / voorwaarden" : "Notitie", { x: MARGIN, y, size: 9.5, font: bold, color: DARK });
    y -= 17;
    y = drawLines(page, noteLines, MARGIN, y, regular, 8.7, SLATE, 12);
    y -= 15;
  }

  ensure(80);
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4.width - MARGIN, y }, thickness: 0.6, color: BORDER });
  y -= 18;
  const footerLines = [
    safeText(company.trade_name || "Vedantix"),
    [company.address_line1, company.postal_code, company.city].filter(Boolean).map(safeText).join(" · "),
    [company.email || "info@vedantix.nl", company.phone, company.kvk_number ? `KVK ${company.kvk_number}` : "", company.vat_number ? `BTW ${company.vat_number}` : ""].filter(Boolean).map(safeText).join(" · "),
  ].filter(Boolean);
  drawLines(page, footerLines, MARGIN, y, regular, 7.8, SLATE, 11);

  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    const text = `Vedantix · ${kind === "quote" ? "Offerte" : "Factuur"} · pagina ${index + 1}/${pages.length}`;
    p.drawText(text, { x: MARGIN, y: 25, size: 7, font: regular, color: rgb(0.55, 0.58, 0.63) });
  });

  return await pdf.save();
}

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as DocKind | null;
  const token = url.searchParams.get("token") || "";
  if (!kind || !["quote", "invoice"].includes(kind) || !/^[0-9a-f-]{36}$/i.test(token)) return new Response("Invalid request", { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return new Response("Server configuration missing", { status: 500 });
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const rpc = kind === "quote" ? "get_public_quote" : "get_public_invoice";
  const { data, error } = await admin.rpc(rpc, { p_token: token });
  if (error || !data) return new Response("Document not found", { status: 404 });

  const bytes = await makePdf(kind, data as AnyRecord);
  const number = safeText(kind === "quote" ? data.quote_number : data.invoice_number).replace(/[^A-Za-z0-9._-]/g, "-") || kind;
  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Vedantix-${number}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
