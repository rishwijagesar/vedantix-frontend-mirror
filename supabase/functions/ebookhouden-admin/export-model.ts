import { SetupError } from './api.ts';

export type Kind = 'INVOICE' | 'CREDIT' | 'PAYMENT';
export type Mutation = { type: number; date: string; ledgerId: number; description: string; entryNumber: string; paymentReference: string; checkPaymentReference: true; inExVat: 'EX'; invoiceNumber?: string; relationId?: number; termOfPayment?: number; rows: Array<{ amount: number; vatCode: string; ledgerId?: number; description: string; invoiceNumber?: string; relationId?: number }> };
export type Draft = { kind: Kind; id: string; number: string; date: string; available_at: string; amount: number; base: number; vat: number; customer_id: string; customer: any; source_updated_at?: string; source_method?: string; source_reference?: string | null; invoice_id: string; source_hash: string; review_hash: string; mutation: Mutation; expected_vat: Record<string, number> };
export const cents = (n: unknown) => { const v = Number(n); if (!Number.isFinite(v) || Math.abs(v) > 1e9) throw new SetupError('Ongeldig bedrag.'); return Math.round((v + Math.sign(v) * Number.EPSILON) * 100); };
const date = (v: unknown) => { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(v).toISOString().slice(0,10) !== v) throw new SetupError('Een geldige boekingsdatum ontbreekt.'); return v; };
const uuid = (v: unknown) => { if (typeof v !== 'string' || !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(v)) throw new SetupError('Ongeldige document- of klantidentificatie.'); return v; };
const text = (v: unknown, max: number) => String(v || '').replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0,max);
export async function digest(value: unknown) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value))); return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join(''); }
const isTest = (v: any) => String(v?.test_fixture).toLowerCase() === 'true' || String(v?.mollie_mode).toLowerCase() === 'test';
export function eligible(invoice: any, requests: any[]) { return invoice?.is_active !== false && !!invoice?.finalized_at && !!invoice?.invoice_number && !/^TEST(?:\b|[-_])/i.test(invoice.invoice_number) && ['FINALIZED','SENT','PARTIALLY_PAID','PAID','OVERDUE','CREDITED'].includes(invoice.status) && !requests.some(r => r.invoice_id === invoice.id && isTest(r.metadata)); }
export function eligiblePayment(p: any) { return !p.voided_at && !isTest(p.metadata); }
export function eligibleCredit(c: any) { return !!c.finalized_at && ['FINALIZED','SENT'].includes(c.status); }

// Work only from finalized document snapshots. No catalogue prices enter a booking.
// A largest-remainder allocation preserves the exact invoice discount in cents.
function rowsFor(invoice: any, mapping: any, sign: number) {
  const items = [...(invoice.invoice_items || [])].sort((a,b) => a.position - b.position || String(a.id).localeCompare(String(b.id)));
  if (!items.length || items.length > 500) throw new SetupError('De factuur moet 1 tot 500 factuurregels hebben.');
  const weights = items.map(i => cents(i.line_total_ex_vat));
  const net = weights.reduce((a,b) => a+b,0), total = cents(invoice.total_ex_vat);
  if (weights.some(n => n < 0) || net <= 0 || total <= 0 || total > net) throw new SetupError('Deze factuurbedragen vragen om handmatige controle.');
  const raw = weights.map(w => w * total / net), bases = raw.map(Math.floor);
  const order = raw.map((v,i) => ({i,r:v-bases[i]})).sort((a,b) => b.r-a.r);
  for (let n = total-bases.reduce((a,b) => a+b,0), i=0; i<n; i++) bases[order[i].i]++;
  const vat: Record<string,number> = {};
  const rows = items.map((item,i) => {
    const rate = Number(item.vat_rate);
    // Zero-rate documents need an explicit fiscal reason, which the billing model
    // does not yet store (0%, exempt, export, reverse charge are not interchangeable).
    if (![9,21].includes(rate)) throw new SetupError('Alleen Nederlandse 9% en 21% btw worden automatisch verwerkt. Laat 0%, vrijstelling en verlegde btw eerst controleren.');
    const code = rate === 21 ? 'HOOG_VERK_21' : 'LAAG_VERK_9';
    vat[code] = (vat[code] || 0) + sign * Math.round(bases[i] * rate / 100);
    return { ledgerId: mapping.revenue, amount: sign*bases[i]/100, vatCode: code, description: text(item.description,500) || 'Dienst' };
  });
  if (Object.values(vat).reduce((a,b)=>a+b,0) !== sign*cents(invoice.vat_total) || total+cents(invoice.vat_total) !== cents(invoice.total_incl_vat)) throw new SetupError('De btw-afronding sluit niet exact aan op de factuur. Laat deze boeking handmatig controleren.');
  return { rows, vat };
}

export async function buildDraft(kind: Kind, source: any, invoice: any, config: any): Promise<Draft> {
  uuid(source.id); uuid(invoice.customer_id);
  if (!config.mapping?.debtor || !config.mapping?.revenue) throw new SetupError('Kies eerst de rekeningen voor openstaande klantbedragen en omzet.');
  const number = String(kind === 'CREDIT' ? source.credit_number : invoice.invoice_number || '');
  if (!number || number.length > 50) throw new SetupError('Het factuurnummer ontbreekt of is langer dan 50 tekens.');
  const marker = `VDX-${kind[0]}-${source.id}`;
  const customer = invoice.customer_snapshot || {};
  if (!text(customer.company_name || customer.contact_name || customer.name,100)) throw new SetupError('De klantnaam ontbreekt in de definitieve factuur.');
  const country = String(customer.country || '').toUpperCase();
  if (!['NL','NEDERLAND','NETHERLANDS'].includes(country)) throw new SetupError('Controleer de btw-behandeling en het land van deze klant handmatig.');
  let base = Number(source.total_ex_vat), vat = Number(source.vat_total), amount = Number(source.total_incl_vat);
  let expected: Record<string,number> = {};
  let mutation: Mutation = { type: 2, date: date(kind === 'CREDIT' ? source.credit_date : invoice.invoice_date), ledgerId: config.mapping.debtor, description: text(`${number} ${source.title || source.reason || invoice.title}`,50), invoiceNumber:number, entryNumber:marker, paymentReference:marker, checkPaymentReference:true, inExVat:'EX', rows:[] };
  if (kind === 'PAYMENT') {
    if (config.payment_mode !== 'VEDANTIX') throw new SetupError('Betalingen worden in e-Boekhouden afgestemd. Alleen facturen en creditnota’s worden overgezet.');
    if (!['MOLLIE','BANK','BANK_TRANSFER'].includes(String(source.method).toUpperCase())) throw new SetupError('Kies voor deze betaalwijze eerst de juiste boekhoudrekening; automatische verwerking is niet beschikbaar.');
    const mollie = String(source.method).toUpperCase() === 'MOLLIE';
    const ledger = mollie ? config.mapping.mollie : config.mapping.bank;
    if (!ledger) throw new SetupError(mollie ? 'Kies eerst een Mollie tussenrekening van het type Bank/kas.' : 'Kies eerst de zakelijke bankrekening.');
    if (cents(source.amount) <= 0) throw new SetupError('Terugbetalingen en negatieve bedragen vragen om handmatige controle.');
    base=0; vat=0; amount=Number(source.amount);
    mutation = { ...mutation, type:3, date:date(source.payment_date), ledgerId:ledger, description:marker, rows:[{amount,vatCode:'GEEN',invoiceNumber:number,description:text(`${number} ${source.reference || ''}`,500)}] };
    delete mutation.invoiceNumber;
  } else {
    if (kind === 'CREDIT' && (cents(source.total_ex_vat) !== -cents(invoice.total_ex_vat) || cents(source.vat_total) !== -cents(invoice.vat_total) || cents(source.total_incl_vat) !== -cents(invoice.total_incl_vat))) throw new SetupError('Deze gedeeltelijke creditnota heeft geen eigen btw-regels. Controleer de verdeling handmatig.');
    const result = rowsFor(invoice,config.mapping,kind === 'CREDIT' ? -1 : 1);
    mutation.rows=result.rows; expected=result.vat;
    if (kind === 'INVOICE' && invoice.due_date) mutation.termOfPayment = Math.max(0,Math.round((Date.parse(date(invoice.due_date))-Date.parse(mutation.date))/86400000));
  }
  const source_hash = await digest({ kind, id:source.id, number, date:mutation.date, customer_id:invoice.customer_id, customer, amount, base, vat, method:kind==='PAYMENT'?source.method:undefined, rows:mutation.rows.map(({ledgerId:_,...r})=>r), expected, term:mutation.termOfPayment });
  const review_hash = await digest({source_hash,mutation,revision:config.connection_revision,payment_mode:config.payment_mode});
  return {kind,id:source.id,source_updated_at:source.updated_at,source_method:source.method,source_reference:source.reference,number,date:mutation.date,available_at:source.finalized_at || source.created_at,amount,base,vat,customer_id:invoice.customer_id,customer,invoice_id:invoice.id,source_hash,review_hash,mutation,expected_vat:expected};
}

// Responses can be PascalCase in older API releases.
export function normalize(value: any): any { if (Array.isArray(value)) return value.map(normalize); if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k[0].toLowerCase()+k.slice(1),normalize(v)])); return value; }
export function mutationMatches(actual: any, expected: Mutation, vat: Record<string,number>, confirmedRemoteId?: number): boolean {
  const a=normalize(actual);
  if (!a || typeof a!=='object') return false;
  const knownId=Number.isSafeInteger(confirmedRemoteId) && Number(confirmedRemoteId)>0;
  if (confirmedRemoteId!==undefined && (!knownId || Number(a.id)!==confirmedRemoteId)) return false;
  // Some administrations return an empty entryNumber for sales invoices.
  // Accept that only for the exact ID returned by our POST or already recorded
  // in our journal, with the same invoice number, customer and financial data.
  // An unknown existing invoice or a conflicting non-empty marker stays blocked.
  const knownInvoiceWithoutMarker=expected.type===2 && knownId && (a.entryNumber==null || a.entryNumber==='') && !!expected.invoiceNumber && Number.isSafeInteger(expected.relationId) && Number(expected.relationId)>0;
  if (a.entryNumber!==expected.entryNumber && !knownInvoiceWithoutMarker) return false;
  if (Number(a.type)!==expected.type || a.date?.slice(0,10)!==expected.date || Number(a.ledgerId)!==expected.ledgerId || a.inExVat!=='EX' || a.description!==expected.description || (expected.invoiceNumber && a.invoiceNumber!==expected.invoiceNumber) || (expected.relationId && Number(a.relationId)!==expected.relationId) || (expected.termOfPayment!==undefined && Number(a.termOfPayment)!==expected.termOfPayment)) return false;
  if (!Array.isArray(a.rows) || a.rows.length!==expected.rows.length) return false;
  // e-Boekhouden repeats the invoice number and relation on sales rows even
  // when the request specifies them only on the header. Conflicts still fail.
  const canonical = (rows: any[]) => rows.map(r=>JSON.stringify([cents(r.amount),r.vatCode,expected.type===3 ? 0 : Number(r.ledgerId || 0),r.invoiceNumber || (expected.type===2 ? expected.invoiceNumber : '') || '',Number(r.relationId || (expected.type===2 ? expected.relationId : 0) || 0)])).sort();
  if (JSON.stringify(canonical(a.rows))!==JSON.stringify(canonical(expected.rows))) return false;
  if (expected.type===3) return true;
  if (!Array.isArray(a.vat)) return false;
  const totals: Record<string,number>={};
  for (const r of a.vat) totals[r.vatCode]=(totals[r.vatCode] || 0)+cents(r.amount);
  return Object.entries(vat).every(([k,v])=>totals[k]===v) && Object.keys(totals).every(k=>k in vat || totals[k]===0);
}
