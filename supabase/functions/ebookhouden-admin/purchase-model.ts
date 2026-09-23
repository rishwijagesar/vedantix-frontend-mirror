import { SetupError } from './api.ts';
import { cents, digest, type Draft, type Mutation } from './export-model.ts';

export const purchaseCategories = ['software','hosting','hardware','office','marketing','travel','education','professional','insurance','bank','depreciation','other'] as const;
const clean = (v: unknown, max: number) => String(v || '').replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, max);
export async function buildPurchaseDraft(entry: any, documents: any[], config: any): Promise<Draft> {
  if (entry.void_reason || !entry.vat_reviewed) throw new SetupError('Controleer eerst de aankoop en de btw-aftrek onder Administratie.');
  if (entry.treatment !== 'EXPENSE' || Number(entry.business_percent) !== 100) throw new SetupError('Investeringen, privégebruik en andere bijzondere boekingen verwerk je afzonderlijk in e-Boekhouden.');
  const creditor = config.mapping?.creditor, ledger = config.mapping?.['cost_' + entry.category];
  if (!Number.isSafeInteger(creditor) || creditor <= 0 || !Number.isSafeInteger(ledger) || ledger <= 0) throw new SetupError('Kies de rekening voor leveranciers en de kostenrekening voor deze kostensoort in stap 2.');
  if (!['PURCHASE','CREDIT'].includes(entry.document_kind)) throw new SetupError('Kies een inkoopfactuur of inkoopcreditnota.');
  if (!entry.document_number?.trim() || entry.document_number.length > 50 || !entry.supplier?.trim()) throw new SetupError('Vul de leverancier en het originele factuurnummer in (maximaal 50 tekens voor e-Boekhouden).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.entry_date) || !Number.isFinite(Date.parse(entry.entry_date)) || new Date(entry.entry_date).toISOString().slice(0,10) !== entry.entry_date) throw new SetupError('Vul een geldige factuurdatum in.');
  const evidence = documents.filter(d => d.entry_id === entry.id && d.status === 'READY').map(d => ({id:d.id,sha256:d.sha256})).sort((a,b) => a.id.localeCompare(b.id));
  if (!evidence.length) throw new SetupError('Koppel eerst de originele factuur of bon aan deze aankoop onder Administratie.');
  if (!Array.isArray(entry.lines) || !entry.lines.length || entry.lines.length > 100) throw new SetupError('Deze aankoop heeft geen geldige btw-regels.');
  const sign = entry.document_kind === 'CREDIT' ? -1 : 1, expected_vat: Record<string,number> = {};
  let net = 0, vat = 0;
  const rows = entry.lines.map((line: any) => {
    if (!['21','9','EXEMPT'].includes(line.code)) throw new SetupError('Buitenlandse, verlegde, onbekende en 0%-btw moeten afzonderlijk worden gecontroleerd in e-Boekhouden.');
    const base = cents(line.base), tax = cents(line.vat), deduction = cents(line.deductible);
    if (base < 0 || tax < 0 || deduction !== tax || tax !== (line.code === 'EXEMPT' ? 0 : Math.round(base * Number(line.code) / 100))) throw new SetupError('Alleen volledig aftrekbare btw met een exacte aansluiting op de factuur wordt overgezet. Controleer de bedragen en afronding.');
    const code = line.code === '21' ? 'HOOG_INK_21' : line.code === '9' ? 'LAAG_INK_9' : 'GEEN';
    if (code !== 'GEEN') expected_vat[code] = (expected_vat[code] || 0) + sign * tax;
    net += base; vat += tax;
    return {amount:sign * base/100,vatCode:code,ledgerId:ledger,description:clean(entry.description,500)};
  });
  if (net <= 0) throw new SetupError('Het aankoopbedrag moet positief zijn; gebruik Inkoopcreditnota voor een correctie.');
  const supplierHash = await digest(entry.supplier.trim().toLocaleLowerCase('nl-NL').replace(/\s+/g,' '));
  const supplierId = `${supplierHash.slice(0,8)}-${supplierHash.slice(8,12)}-${supplierHash.slice(12,16)}-${supplierHash.slice(16,20)}-${supplierHash.slice(20,32)}`;
  const marker = 'VDX-B-' + entry.id;
  const mutation: Mutation = {type:1,date:entry.entry_date,ledgerId:creditor,description:clean(`${entry.document_number} ${entry.supplier}`,50),invoiceNumber:entry.document_number.trim(),entryNumber:marker,paymentReference:marker,checkPaymentReference:true,inExVat:'EX',rows};
  if (entry.due_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.due_date) || !Number.isFinite(Date.parse(entry.due_date)) || new Date(entry.due_date).toISOString().slice(0,10) !== entry.due_date || entry.due_date < entry.entry_date) throw new SetupError('Controleer de vervaldatum van de aankoop.');
    mutation.termOfPayment = Math.round((Date.parse(entry.due_date) - Date.parse(entry.entry_date)) / 86400000);
  }
  const source_hash = await digest({id:entry.id,number:entry.document_number,supplier:entry.supplier,date:entry.entry_date,due:entry.due_date,kind:entry.document_kind,category:entry.category,description:entry.description,lines:entry.lines,business_percent:entry.business_percent,treatment:entry.treatment,evidence});
  const review_hash = await digest({source_hash,mutation,revision:config.connection_revision});
  return {kind:'PURCHASE',id:entry.id,number:entry.document_number,date:entry.entry_date,available_at:entry.created_at,amount:sign*(net+vat)/100,base:sign*net/100,vat:sign*vat/100,customer_id:supplierId,customer:{company_name:entry.supplier},invoice_id:entry.id,source_updated_at:entry.updated_at,source_hash,review_hash,mutation,expected_vat};
}
