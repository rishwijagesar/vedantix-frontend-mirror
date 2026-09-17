export const categories = { software: 'Software & abonnementen', hosting: 'Hosting & domeinen', hardware: 'Computer & apparatuur', office: 'Kantoor', marketing: 'Marketing', travel: 'Reis- & vervoerskosten', education: 'Opleidingen', professional: 'Boekhouder & advies', insurance: 'Verzekeringen', bank: 'Bank- & betaalkosten', depreciation: 'Afschrijvingen', other: 'Overige kosten' } as const;
export const treatments = { EXPENSE: 'Zakelijke kosten', ASSET: 'Investering / bedrijfsmiddel', PRIVATE: 'Privé', TAX: 'Belastingbetaling', TRANSFER: 'Overboeking / lening' } as const;
export const vatCodes = { '21': '21% Nederlandse btw', '9': '9% Nederlandse btw', '0': '0% btw', EXEMPT: 'Vrijgesteld / geen btw', REVERSE: 'Btw verlegd', FOREIGN: 'Buitenlandse btw', UNKNOWN: 'Nog controleren' } as const;
export type VatLine = { base: number; vat: number; deductible: number; code: keyof typeof vatCodes };
export type Entry = { id: string; entry_date: string; due_date: string | null; supplier: string; document_number: string; document_kind: 'PURCHASE' | 'CREDIT'; description: string; category: keyof typeof categories; treatment: keyof typeof treatments; business_percent: number; lines: VatLine[]; vat_reviewed: boolean; notes: string; void_reason: string | null; revision: number };
export type Bank = { id: string; transaction_date: string; account: string; description: string; amount: number; reference: string; kind: 'PURCHASE' | 'SALE' | 'PRIVATE' | 'TAX' | 'TRANSFER' | 'OTHER'; entry_id: string | null; invoice_id: string | null; void_reason: string | null; revision: number };
export type Evidence = { id: string; document_date: string; filename: string; object_path: string; mime_type: string; byte_size: number; sha256: string; status: 'PENDING' | 'READY'; kind: 'RECEIPT' | 'INVOICE' | 'EMAIL' | 'BANK' | 'CONTRACT' | 'OTHER'; note: string; entry_id: string | null; bank_id: string | null; invoice_id: string | null; contract_id: string | null; revision: number };
export type Sale = { id: string; invoice_number: string; invoice_date: string; title: string; status: string; is_active: boolean; finalized_at: string | null; total_ex_vat: number; vat_total: number; total_incl_vat: number; customer_snapshot?: { company_name?: string; name?: string }; invoice_items: { vat_rate: number; line_total_ex_vat: number; line_vat: number }[] };
export type Credit = { id: string; invoice_id: string; credit_number: string; credit_date: string; status: string; finalized_at: string | null; total_ex_vat: number; vat_total: number; total_incl_vat: number };
export type Payment = { id: string; invoice_id: string; amount: number; payment_date: string; voided_at: string | null; metadata?: Record<string, unknown> };
export type AdminData = { entries: Entry[]; bank: Bank[]; documents: Evidence[]; invoices: Sale[]; credits: Credit[]; payments: Payment[]; contracts: { id: string; contract_number: string; title: string }[]; test_invoice_ids?: string[] };
export const emptyData: AdminData = { entries: [], bank: [], documents: [], invoices: [], credits: [], payments: [], contracts: [] };
export type Period = { year: number; quarter: number; start: string; end: string; label: string; deadline: string | null };
export const cents = (value: number | string) => Math.round((Number(value) + Number.EPSILON) * 100);
export const money = (value: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
export function today() { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date()); }
export function period(year: number, quarter: number): Period {
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(quarter) || quarter < 0 || quarter > 4) throw new Error('Kies een geldig jaar en kwartaal.');
  const starts = ['01-01', '01-01', '04-01', '07-01', '10-01'];
  const ends = ['12-31', '03-31', '06-30', '09-30', '12-31'];
  return { year, quarter, start: `${year}-${starts[quarter]}`, end: `${year}-${ends[quarter]}`, label: quarter ? `${year} · Q${quarter}` : `${year} · Heel jaar`, deadline: quarter ? quarter === 4 ? `${year + 1}-01-31` : `${year}-${['', '04-30', '07-31', '10-31'][quarter]}` : null };
}
export function inPeriod(date: string, p: Period) { return date >= p.start && date <= p.end; }
export function entryAmounts(e: Entry) {
  const sign = e.document_kind === 'CREDIT' ? -1 : 1;
  let base = 0, vat = 0, deductible = 0, cost = 0;
  for (const l of e.lines) {
    base += cents(l.base); vat += cents(l.vat);
    const deduction = e.vat_reviewed ? cents(l.deductible) : 0;
    deductible += deduction;
    cost += Math.round(cents(l.base) * Number(e.business_percent) / 100) + Math.round(cents(l.vat) * Number(e.business_percent) / 100) - deduction;
  }
  return { base: sign * base / 100, vat: sign * vat / 100, total: sign * (base + vat) / 100, deductible: sign * deductible / 100, cost: sign * cost / 100 };
}
export function purchaseBalance(entry: Entry, bank: Bank[], end: string) {
  const paid = bank.filter(b => !b.void_reason && b.entry_id === entry.id && b.transaction_date <= end).reduce((n,b) => n + cents(b.amount), 0);
  // Purchases are positive liabilities, incoming credits are negative (supplier owes us).
  return (cents(entryAmounts(entry).total) + paid) / 100;
}
export function eligibleSale(s: Sale) { return s.is_active !== false && !!s.finalized_at && !!s.invoice_number && !/^TEST(?:\b|[-_])/i.test(s.invoice_number) && ['FINALIZED','SENT','PARTIALLY_PAID','PAID','OVERDUE','CREDITED'].includes(s.status); }
export function eligibleCredit(c: Credit) { return !!c.finalized_at && ['FINALIZED','SENT'].includes(c.status); }
export function eligiblePayment(p: Payment) { return !p.voided_at && String(p.metadata?.test_fixture || '').toLowerCase() !== 'true' && String(p.metadata?.mollie_mode || '').toLowerCase() !== 'test'; }
function sum<T>(rows: T[], value: (r: T) => number) { return rows.reduce((n,r) => n + cents(value(r)), 0) / 100; }
// Allocate invoice-level discounts/rounding to VAT groups while preserving document totals.
export function allocate(total: number, weights: number[]) {
  const denominator = weights.reduce((a,b) => a + Math.abs(b), 0);
  if (!weights.length) return [];
  const amount = Math.abs(cents(total));
  const raw = weights.map(w => denominator ? amount * Math.abs(w) / denominator : amount / weights.length);
  const result = raw.map(Math.floor);
  const order = raw.map((v,i) => ({ i, remainder: v - result[i] })).sort((a,b) => b.remainder - a.remainder);
  for (let n = amount - result.reduce((a,b) => a+b, 0), i = 0; i < n; i++) result[order[i % order.length].i]++;
  return result.map(v => (total < 0 ? -v : v) / 100);
}
export function summarize(data: AdminData, p: Period) {
  const allSales = data.invoices.filter(s => eligibleSale(s) && !data.test_invoice_ids?.includes(s.id));
  const saleMap = new Map(allSales.map(s => [s.id,s]));
  const allCredits = data.credits.filter(c => eligibleCredit(c) && saleMap.has(c.invoice_id));
  const sales = allSales.filter(s => inPeriod(s.invoice_date,p));
  const credits = allCredits.filter(c => inPeriod(c.credit_date,p));
  const entries = data.entries.filter(e => !e.void_reason && inPeriod(e.entry_date,p));
  const bank = data.bank.filter(b => !b.void_reason && inPeriod(b.transaction_date,p));
  const revenue = (cents(sum(sales,s => Number(s.total_ex_vat))) + cents(sum(credits,c => Number(c.total_ex_vat)))) / 100;
  const costs = sum(entries.filter(e => e.treatment === 'EXPENSE'),e => entryAmounts(e).cost);
  const outputVat = (cents(sum(sales,s => Number(s.vat_total))) + cents(sum(credits,c => Number(c.vat_total)))) / 100;
  const inputVat = sum(entries,e => entryAmounts(e).deductible);
  const outstanding = sum(allSales.filter(s => s.invoice_date <= p.end), s => Math.max(0, (cents(s.total_incl_vat) + cents(sum(allCredits.filter(c => c.invoice_id === s.id && c.credit_date <= p.end),c => Number(c.total_incl_vat))) - cents(sum(data.payments.filter(t => eligiblePayment(t) && t.invoice_id === s.id && t.payment_date <= p.end),t => Number(t.amount)))) / 100));
  const dueEntries = data.entries.filter(e => !e.void_reason && e.entry_date <= p.end && !['PRIVATE','TAX','TRANSFER'].includes(e.treatment));
  const payable = sum(dueEntries,e => Math.max(0,purchaseBalance(e,data.bank,p.end)));
  const supplierCredit = sum(dueEntries,e => Math.max(0,-purchaseBalance(e,data.bank,p.end)));
  const groups: Record<string,{ base: number; vat: number }> = {};
  for (const doc of [...sales, ...credits]) {
    const invoice = 'invoice_id' in doc ? saleMap.get(doc.invoice_id)! : doc;
    const items = invoice.invoice_items || [];
    const rates = [...new Set(items.map(i => String(i.vat_rate)))];
    if (!rates.length) rates.push('Onbekend');
    const bases = allocate(Number(doc.total_ex_vat),rates.map(rate => sum(items.filter(i => String(i.vat_rate) === rate),i => Number(i.line_total_ex_vat))));
    const vats = allocate(Number(doc.vat_total),rates.map(rate => sum(items.filter(i => String(i.vat_rate) === rate),i => Number(i.line_vat))));
    rates.forEach((rate,i) => { const g = groups[rate] || { base: 0, vat: 0 }; groups[rate] = { base: (cents(g.base)+cents(bases[i]))/100, vat: (cents(g.vat)+cents(vats[i]))/100 }; });
  }
  return { sales, credits, entries, bank, revenue, costs, result: (cents(revenue)-cents(costs))/100, outputVat, inputVat, vatDifference: (cents(outputVat)-cents(inputVat))/100, outstanding, payable, supplierCredit, investments: sum(entries.filter(e => e.treatment === 'ASSET'),e => entryAmounts(e).cost), cashIn: sum(bank.filter(b => Number(b.amount)>0),b => Number(b.amount)), cashOut: -sum(bank.filter(b => Number(b.amount)<0),b => Number(b.amount)), groups,
    missingEvidence: entries.filter(e => !data.documents.some(d => d.entry_id === e.id && d.status === 'READY')).length,
    unreviewed: entries.filter(e => !e.vat_reviewed || e.lines.some(l => ['REVERSE','FOREIGN','UNKNOWN'].includes(l.code))).length,
    unlinkedBank: bank.filter(b => b.kind === 'OTHER' || (b.kind === 'PURCHASE' && !b.entry_id) || (b.kind === 'SALE' && !b.invoice_id)).length,
  };
}
export function csv(rows: unknown[][]) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value ?? '');
    // Neutralize spreadsheet formulas from supplier names, references and filenames.
    if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"','""') + '"';
  }).join(';')).join('\r\n');
}
export function safeFilename(name: string) { return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g,'_').replace(/^\.+/,'').slice(0,150) || 'bewijs'; }
export function fileDetails(filename: string, size: number) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const types: Record<string,string> = { pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',eml:'message/rfc822',msg:'application/vnd.ms-outlook',xml:'application/xml',txt:'text/plain',csv:'text/csv' };
  if (!types[ext] || !filename.includes('.')) throw new Error('Kies een PDF, JPG, PNG, WEBP, EML, MSG, XML, TXT of CSV.');
  if (size <= 0 || size > 20 * 1024 * 1024) throw new Error('Een bewijsstuk moet tussen 1 byte en 20 MB zijn.');
  if (filename.length > 250) throw new Error('Gebruik een bestandsnaam van maximaal 250 tekens.');
  return { ext, mime: types[ext] };
}
