import { RefreshCw, Save, Trash2 } from "lucide-react";
import { lineDraft, previewInvoice, type InvoiceLineDraft, type InvoiceLineEdits } from "./invoice-draft";
import type { BillingItem, BillingType, Invoice } from "./sales-billing-data";

type Product = { id: string; code: string; name: string; billing_type: BillingType; price_ex_vat: number; vat_rate: number };
const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const inputClass = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50";

export default function InvoiceLines({ invoice, items, products, edits, busy, onChange, onSave, onDelete }: {
  invoice: Invoice; items: BillingItem[]; products: Product[]; edits: InvoiceLineEdits; busy: boolean;
  onChange: (id: string, value: InvoiceLineDraft) => void;
  onSave: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const draft = invoice.status === "DRAFT";
  const productMap = new Map(products.map(product => [product.id, product]));
  function useCatalog(item: BillingItem) {
    const product = item.catalog_product_id ? productMap.get(item.catalog_product_id) : null;
    if (product) onChange(item.id, { ...(edits[item.id] || lineDraft(item)), code: product.code, description: product.name, billing_type: product.billing_type, unit_price_ex_vat: String(product.price_ex_vat), vat_rate: String(product.vat_rate) });
  }

  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-semibold">Factuurregels</h3><p className="text-sm text-slate-500">{draft ? "Pas de prijs voor deze klant aan. Totalen rekenen direct mee; bewaar je wijzigingen met Concept opslaan of Regel opslaan." : "Deze factuur is definitief. De bedragen kunnen niet meer worden gewijzigd."}</p></div>
      {draft && items.some(item => item.catalog_product_id && productMap.has(item.catalog_product_id)) ? <button type="button" disabled={busy} onClick={() => { if (confirm("De prijzen en omschrijvingen van gekoppelde regels vervangen door de huidige catalogusgegevens? Sla daarna het concept op.")) items.forEach(useCatalog); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw size={14}/>Alle catalogusprijzen overnemen</button> : null}
    </div>
    {!items.length ? <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">Nog geen factuurregels.</div> : null}
    {items.map(item => {
      const value = edits[item.id] || lineDraft(item);
      const changed = Boolean(edits[item.id]);
      const product = item.catalog_product_id ? productMap.get(item.catalog_product_id) : null;
      const differentPrice = Boolean(product && (Number(value.unit_price_ex_vat) !== product.price_ex_vat || Number(value.vat_rate) !== product.vat_rate || value.billing_type !== product.billing_type));
      let total: number | null = Number(item.line_total_incl_vat);
      if (changed) { try { total = previewInvoice(invoice, [item], edits).lines[0]?.line_total_incl_vat ?? null; } catch { total = null; } }
      return <form key={item.id} onSubmit={event => { event.preventDefault(); void onSave(item.id); }} className={"rounded-xl border p-4 " + (changed ? "border-amber-300 bg-amber-50/40" : "border-slate-100")}>
        <fieldset disabled={!draft || busy} className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-sm font-medium md:col-span-2">Omschrijving<input required value={value.description} onChange={e => onChange(item.id, { ...value, description: e.target.value })} className={inputClass}/></label>
          <label className="text-sm font-medium">Aantal<input required type="number" min="0.01" step="0.01" value={value.quantity} onChange={e => onChange(item.id, { ...value, quantity: e.target.value })} className={inputClass}/></label>
          <label className="text-sm font-medium">Prijs excl. btw<input required type="number" min="0" step="0.01" value={value.unit_price_ex_vat} onChange={e => onChange(item.id, { ...value, unit_price_ex_vat: e.target.value })} className={inputClass}/></label>
          <label className="text-sm font-medium">BTW %<input required type="number" min="0" max="100" step="0.01" value={value.vat_rate} onChange={e => onChange(item.id, { ...value, vat_rate: e.target.value })} className={inputClass}/></label>
          <label className="text-sm font-medium">Type<select value={value.billing_type} onChange={e => onChange(item.id, { ...value, billing_type: e.target.value as BillingType })} className={inputClass}><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maand</option><option value="YEARLY">Jaar</option></select></label>
        </fieldset>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {product ? <><span>Catalogus: {product.name} · {money.format(product.price_ex_vat)} excl. btw</span><span className="ml-2 font-medium">{differentPrice ? "Afwijkende prijs of afspraak voor deze factuur" : "Gelijk aan catalogus"}</span>{differentPrice && draft ? <button type="button" disabled={busy} onClick={() => useCatalog(item)} className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold disabled:opacity-50">Catalogusprijs overnemen</button> : null}</> : null}
            {changed ? <p role="status" className="mt-1 font-medium text-amber-800">Nog niet opgeslagen{total === null ? " · controleer de invoer" : ""}</p> : draft ? <p className="mt-1 text-emerald-700">Opgeslagen</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right"><span className="text-xs text-slate-500">Regeltotaal incl. btw</span><strong className="block text-sm">{total === null ? "—" : money.format(total)}</strong></div>
            {draft ? <><button disabled={busy || !changed} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Save size={15}/>Regel opslaan</button><button type="button" title="Regel verwijderen" aria-label={"Verwijder " + value.description} disabled={busy} onClick={() => void onDelete(item.id)} className="rounded-lg border border-red-100 p-2.5 text-red-600 disabled:opacity-40"><Trash2 size={15}/></button></> : null}
          </div>
        </div>
      </form>;
    })}
  </section>;
}
