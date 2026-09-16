import { invoiceOutstanding, invoicePaymentDescription, invoicePaymentReference, invoicePaymentUrl, invoiceQrUrl, isInvoicePayable } from "../lib/invoice-payment";
import {
  BILLING_TYPE_LABELS,
  buildPaymentBreakdown,
  type BillingItem,
  type BillingType,
  type CompanyProfile,
  type CreditNote,
  type Invoice,
  type Quote,
} from "./sales-billing-data";

type BillingDocument = Quote | Invoice | CreditNote;
type DocumentKind = "QUOTE" | "INVOICE" | "CREDIT";

type CustomerSnapshot = {
  company_name?: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  kvk_number?: string | null;
  vat_number?: string | null;
};

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const billingTypes: BillingType[] = ["ONE_TIME", "MONTHLY", "YEARLY"];

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dateNl(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function addressLines(snapshot: Record<string, unknown> | null | undefined) {
  const x = (snapshot ?? {}) as CustomerSnapshot;
  return [x.address_line1, x.address_line2, [x.postal_code, x.city].filter(Boolean).join(" "), x.country].filter(Boolean) as string[];
}

function vedantixLogoSvg() {
  return `<svg width="170" height="40" viewBox="0 0 178 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Vedantix">
    <rect width="40" height="40" rx="10" fill="#0f172a"/>
    <line x1="10" y1="11" x2="20" y2="29" stroke="white" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="30" y1="11" x2="20" y2="29" stroke="white" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="13.5" y1="19.5" x2="26.5" y2="19.5" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity=".9"/>
    <text x="50" y="29" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="22" letter-spacing="-.5" fill="#0f172a">Vedantix</text>
  </svg>`;
}

function vatRows(items: BillingItem[], totalEx: number) {
  if (!items.length) return [];
  const itemNet = items.reduce((sum, item) => sum + Number(item.line_total_ex_vat), 0);
  const ratio = itemNet > 0 ? Math.max(0, totalEx) / itemNet : 1;
  const groups = new Map<number, { base: number; vat: number }>();
  for (const item of items) {
    const rate = Number(item.vat_rate);
    const base = Number(item.line_total_ex_vat) * ratio;
    const current = groups.get(rate) ?? { base: 0, vat: 0 };
    current.base += base;
    current.vat += base * rate / 100;
    groups.set(rate, current);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([rate, values]) => ({ rate, base: values.base, vat: values.vat }));
}

function quoteCostOverview(items: BillingItem[], quote: Quote) {
  const breakdown = buildPaymentBreakdown(items, Number(quote.total_ex_vat), Number(quote.vat_total));
  const labels: Record<BillingType, { title: string; suffix: string }> = {
    ONE_TIME: { title: "Eenmalig bij start", suffix: "" },
    MONTHLY: { title: "Daarna per maand", suffix: " p/m" },
    YEARLY: { title: "Daarnaast per jaar", suffix: " p/j" },
  };

  const rows = billingTypes
    .filter((type) => breakdown[type].itemCount > 0)
    .map((type) => {
      const part = breakdown[type];
      return `<div class="cost-card">
        <span>${labels[type].title}</span>
        <strong>${euro.format(part.inclVat)}${labels[type].suffix}</strong>
        <small>${euro.format(part.exVat)} excl. btw · ${euro.format(part.vat)} btw</small>
      </div>`;
    }).join("");

  return `<section class="cost-overview">
    <h3>Kostenoverzicht</h3>
    <div class="cost-grid">${rows || `<div class="cost-card"><span>Geen kosten</span><strong>${euro.format(0)}</strong></div>`}</div>
    ${Number(quote.document_discount_ex_vat) > 0 ? `<p class="discount-note">De algemene korting is naar rato verdeeld over de betaalmomenten.</p>` : ""}
  </section>`;
}

export function billingDocumentFilename(kind: DocumentKind, document: BillingDocument) {
  const number = kind === "QUOTE" ? (document as Quote).quote_number : kind === "INVOICE" ? (document as Invoice).invoice_number : (document as CreditNote).credit_number;
  return `${number || kind.toLowerCase()}-${new Date().toISOString().slice(0,10)}.pdf`;
}

export function renderBillingDocumentHtml(kind: DocumentKind, document: BillingDocument, items: BillingItem[], currentProfile?: CompanyProfile | null) {
  const company = ((document as Quote | Invoice | CreditNote).company_snapshot ?? currentProfile ?? {}) as Record<string, unknown>;
  const customer = ((document as Quote | Invoice | CreditNote).customer_snapshot ?? {}) as Record<string, unknown>;
  const isInvoice = kind === "INVOICE";
  const isQuote = kind === "QUOTE";
  const isCredit = kind === "CREDIT";
  const number = isQuote ? (document as Quote).quote_number : isInvoice ? (document as Invoice).invoice_number : (document as CreditNote).credit_number;
  const docDate = isQuote ? (document as Quote).quote_date : isInvoice ? (document as Invoice).invoice_date : (document as CreditNote).credit_date;
  const totalEx = Number((document as Quote | Invoice | CreditNote).total_ex_vat || 0);
  const vatTotal = Number((document as Quote | Invoice | CreditNote).vat_total || 0);
  const totalIncl = Number((document as Quote | Invoice | CreditNote).total_incl_vat || 0);
  const lineDiscount = isCredit ? 0 : Number((document as Quote | Invoice).line_discount_ex_vat || 0);
  const documentDiscount = isCredit ? 0 : Number((document as Quote | Invoice).document_discount_ex_vat || 0);
  const subtotal = isCredit ? Math.abs(totalEx) : Number((document as Quote | Invoice).subtotal_ex_vat || 0);
  const vatGroups = vatRows(items, totalEx);
  const customerAddress = addressLines(customer);
  const companyAddress = addressLines(company);
  const title = isQuote ? "Offerte" : isInvoice ? "Factuur" : "Creditnota";
  const accent = String(company.accent_hex || "#3b82f6");

  const invoice = document as Invoice;
  const paymentUrl = isInvoice && isInvoicePayable(invoice) ? invoicePaymentUrl(invoice.public_token) : null;
  const paymentSection = paymentUrl ? `<section class="invoice-payment" id="betalen">
    <div class="payment-copy"><h3>Factuur betalen</h3>
      <p>Openstaand: <strong>${euro.format(invoiceOutstanding(invoice))}</strong></p>
      <p><strong>Factuurnummer:</strong> ${esc(invoice.invoice_number)}<br>
      <strong>Omschrijving:</strong> ${esc(invoicePaymentDescription(invoice))}</p>
      <a class="payment-button" href="${esc(paymentUrl)}" target="_blank" rel="noopener noreferrer">Betaal factuur online</a>
      <p class="payment-hint">Klik op de knop of scan de QR-code met je telefooncamera.</p>
      ${company.iban ? `<p class="payment-hint">Liever overmaken? IBAN ${esc(company.iban)}<br>Vermeld: ${esc(invoicePaymentReference(invoice))}</p>` : ""}
    </div>
    <a class="payment-qr" href="${esc(paymentUrl)}" target="_blank" rel="noopener noreferrer"><img src="${esc(invoiceQrUrl(invoice.public_token))}" width="140" height="140" alt="Scan om factuur ${esc(invoice.invoice_number)} te betalen" referrerpolicy="no-referrer"><span>Scan om te betalen</span></a>
  </section>` : "";

  const itemRows = items.length ? items.map((item) => `<tr>
      <td><strong>${esc(item.description)}</strong>${item.code ? `<div class="muted">${esc(item.code)}</div>` : ""}</td>
      <td>${esc(BILLING_TYPE_LABELS[(item.billing_type || "ONE_TIME") as BillingType])}</td>
      <td class="num">${Number(item.quantity).toLocaleString("nl-NL")}</td>
      <td class="num">${euro.format(Number(item.unit_price_ex_vat))}</td>
      <td class="num">${Number(item.vat_rate).toLocaleString("nl-NL")}%</td>
      <td class="num">${item.line_discount_ex_vat ? `− ${euro.format(Number(item.line_discount_ex_vat))}` : "—"}</td>
      <td class="num strong">${euro.format(Number(item.line_total_ex_vat))}</td>
    </tr>`).join("") : `<tr><td colspan="7">${isCredit ? `Volledige creditering van factuur ${esc((document as CreditNote).invoice_number || "oorspronkelijke factuur")}` : "Geen regels"}</td></tr>`;

  const normalSummary = `<section class="summary">
      <div class="sum-row"><span>Subtotaal excl. btw</span><strong>${euro.format(subtotal)}</strong></div>
      ${lineDiscount ? `<div class="sum-row discount"><span>Regelkortingen</span><strong>− ${euro.format(lineDiscount)}</strong></div>` : ""}
      ${documentDiscount ? `<div class="sum-row discount"><span>Algemene korting</span><strong>− ${euro.format(documentDiscount)}</strong></div>` : ""}
      <div class="sum-row"><span>Totaal excl. btw</span><strong>${euro.format(totalEx)}</strong></div>
      ${vatGroups.length ? vatGroups.map(v=>`<div class="sum-row vat-line"><span>BTW ${v.rate.toLocaleString("nl-NL")}% over ${euro.format(v.base)}</span><strong>${euro.format(v.vat)}</strong></div>`).join("") : `<div class="sum-row"><span>BTW</span><strong>${euro.format(vatTotal)}</strong></div>`}
      <div class="sum-row total"><span>${isCredit ? "Te crediteren" : "Totaal incl. btw"}</span><strong>${euro.format(totalIncl)}</strong></div>
    </section>`;

  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>${esc(title)} ${esc(number)}</title>
  <style>
    @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:0;background:#fff;font-size:12px;line-height:1.45}
    .page{max-width:180mm;margin:0 auto}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:18px;margin-bottom:26px}
    .doc-title{text-align:right}.doc-title h1{font-size:30px;margin:0 0 4px;letter-spacing:-.8px}.doc-no{font-size:13px;color:#64748b}.accent{height:4px;background:${esc(accent)};width:52px;border-radius:999px;margin:10px 0 0 auto}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:26px}.block h3{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin:0 0 8px}.block strong{font-size:14px}.muted{color:#64748b;font-size:10px;margin-top:2px}
    .meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}.meta div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px}.meta span{display:block;color:#64748b;font-size:10px}.meta strong{font-size:11px}
    .intro{margin:18px 0 20px;color:#334155}.items{width:100%;border-collapse:collapse;margin-top:10px}.items th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;text-align:left;border-bottom:1px solid #cbd5e1;padding:9px 7px}.items td{border-bottom:1px solid #e2e8f0;padding:10px 7px;vertical-align:top}.num{text-align:right!important;white-space:nowrap}.strong{font-weight:700}
    .summary{width:48%;margin:22px 0 0 auto}.sum-row{display:flex;justify-content:space-between;padding:5px 0;color:#475569}.sum-row.total{border-top:2px solid #0f172a;margin-top:7px;padding-top:11px;color:#0f172a;font-size:16px;font-weight:800}.sum-row.discount{color:#0f766e}.vat-line{font-size:10px;color:#64748b}
    .cost-overview{margin-top:24px;border-top:2px solid #0f172a;padding-top:16px}.cost-overview h3{font-size:13px;margin:0 0 10px}.cost-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.cost-card{border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#f8fafc}.cost-card span{display:block;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.cost-card strong{display:block;font-size:17px;margin-top:4px}.cost-card small{display:block;color:#64748b;margin-top:3px}.discount-note{font-size:10px;color:#64748b;margin:8px 0 0}
    .notes{margin-top:28px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px}.notes h4{margin:0 0 6px}.footer{display:flex;justify-content:space-between;gap:18px;border-top:1px solid #e2e8f0;margin-top:28px;padding-top:14px;color:#64748b;font-size:9.5px}.footer strong{color:#334155}
    .invoice-payment{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:24px;padding:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;break-inside:avoid;page-break-inside:avoid}.invoice-payment h3{margin:0 0 8px;font-size:15px}.invoice-payment p{margin:6px 0;overflow-wrap:anywhere}.payment-copy{min-width:0;flex:1}.payment-button{display:inline-block;background:#1d4ed8;color:white!important;text-decoration:none;font-weight:700;border-radius:7px;padding:10px 16px;margin:7px 0;print-color-adjust:exact;-webkit-print-color-adjust:exact}.payment-hint{font-size:10px;color:#475569}.payment-qr{flex:0 0 140px;text-align:center;text-decoration:none;color:#334155;font-size:10px}.payment-qr img{display:block;width:140px;height:140px;background:white}.payment-qr span{display:block;margin-top:4px}
    .printbar{position:fixed;top:12px;right:12px;display:flex;gap:8px}.printbar button{border:0;background:#0f172a;color:white;padding:10px 14px;border-radius:9px;font-weight:700;cursor:pointer}.printbar .secondary{background:white;color:#0f172a;border:1px solid #cbd5e1}@media print{.printbar{display:none}.page{max-width:none}}
  </style></head><body><div class="printbar"><button class="secondary" onclick="window.close()">Sluiten</button><button onclick="window.print()">Opslaan als PDF / printen</button></div><main class="page">
    <section class="top"><div>${vedantixLogoSvg()}</div><div class="doc-title"><h1>${title}</h1><div class="doc-no">${esc(number || "Concept")}</div><div class="accent"></div></div></section>
    <section class="grid"><div class="block"><h3>Van</h3><strong>${esc(company.trade_name || "Vedantix")}</strong>${company.legal_name ? `<div>${esc(company.legal_name)}</div>` : ""}${companyAddress.map((x)=>`<div>${esc(x)}</div>`).join("")}<div>${esc(company.email || "")}</div>${company.phone ? `<div>${esc(company.phone)}</div>` : ""}</div>
      <div class="block"><h3>Aan</h3><strong>${esc(customer.company_name || "Klant")}</strong>${customer.contact_name ? `<div>${esc(customer.contact_name)}</div>` : ""}${customerAddress.map((x)=>`<div>${esc(x)}</div>`).join("")}${customer.email ? `<div>${esc(customer.email)}</div>` : ""}
      <div class="meta"><div><span>Datum</span><strong>${dateNl(docDate)}</strong></div>${isQuote ? `<div><span>Geldig tot</span><strong>${dateNl((document as Quote).valid_until)}</strong></div>` : ""}${isInvoice ? `<div><span>Vervaldatum</span><strong>${dateNl((document as Invoice).due_date)}</strong></div><div><span>Betalingskenmerk</span><strong>${esc(invoicePaymentReference(invoice) || "—")}</strong></div>` : ""}</div></div></section>
    ${isQuote && (document as Quote).intro_text ? `<div class="intro">${esc((document as Quote).intro_text).replaceAll("\n","<br>")}</div>` : ""}
    <table class="items"><thead><tr><th>Omschrijving</th><th>Termijn</th><th class="num">Aantal</th><th class="num">Prijs excl.</th><th class="num">BTW</th><th class="num">Korting</th><th class="num">Totaal excl.</th></tr></thead><tbody>${itemRows}</tbody></table>
    ${isQuote ? quoteCostOverview(items, document as Quote) : normalSummary}
    ${paymentSection}
    ${(isQuote && ((document as Quote).notes || (document as Quote).terms)) || (isInvoice && (document as Invoice).notes) || (isCredit && (document as CreditNote).reason) ? `<section class="notes"><h4>${isCredit ? "Reden creditnota" : "Opmerkingen"}</h4><div>${esc(isQuote ? ((document as Quote).notes || (document as Quote).terms) : isInvoice ? (document as Invoice).notes : (document as CreditNote).reason).replaceAll("\n","<br>")}</div></section>` : ""}
    <footer class="footer"><div><strong>${esc(company.trade_name || "Vedantix")}</strong><br>${esc(company.website || "vedantix.nl")} · ${esc(company.email || "")}</div><div>${company.kvk_number ? `KVK ${esc(company.kvk_number)}<br>` : ""}${company.vat_number ? `BTW-ID ${esc(company.vat_number)}<br>` : ""}${company.iban ? `IBAN ${esc(company.iban)}` : ""}</div>${isInvoice && company.default_payment_term_days ? `<div>Betaling binnen ${esc(company.default_payment_term_days)} dagen.</div>` : ""}</footer>
  </main></body></html>`;
}

export function openBillingDocument(kind: DocumentKind, document: BillingDocument, items: BillingItem[], currentProfile?: CompanyProfile | null) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) throw new Error("Pop-up geblokkeerd. Sta pop-ups toe voor de PDF-preview.");
  win.document.open();
  win.document.write(renderBillingDocumentHtml(kind, document, items, currentProfile));
  win.document.close();
}
