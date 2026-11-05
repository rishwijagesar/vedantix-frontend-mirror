import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Invoice, BillingItem } from './sales-billing-data';
import { annualInvoicePlan } from './invoice-annual-model';

const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateLabel = (value: string) => value.split('-').reverse().join('-');
type Existing = { subscription_number: string; next_invoice_date: string; status: string; auto_finalize: boolean };
export default function InvoiceAnnualBilling({ invoice, items }: { invoice: Invoice & { is_active: boolean }; items: BillingItem[] }) {
  const [start, setStart] = useState(invoice.delivery_date || invoice.invoice_date || "");
  const [autoFinalize, setAutoFinalize] = useState(false);
  const [existing, setExisting] = useState<Existing | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const saving = useRef(false);
  async function load() {
    const { data, error } = await supabase.from('subscriptions').select('subscription_number,next_invoice_date,status,auto_finalize').eq('source_invoice_id', invoice.id).eq('billing_type', 'YEARLY').maybeSingle();
    if (error) throw new Error('Abonnement kon niet worden gecontroleerd. Vernieuw de pagina.');
    setExisting(data);
  }
  useEffect(() => { void load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, [invoice.id]);
  const plan = annualInvoicePlan(invoice, items, start);
  if (!plan.hasYearly) return null;
  async function activate(event: FormEvent) {
    event.preventDefault(); if (saving.current || loading || existing || plan.error) return;
    saving.current = true; setBusy(true); setError('');
    try {
      const { error } = await supabase.rpc('activate_invoice_yearly_billing', { p_invoice_id: invoice.id, p_service_start_date: start, p_auto_finalize: autoFinalize });
      if (error) throw new Error(error.message);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Activeren mislukt. Vernieuw en probeer opnieuw.'); }
    finally { saving.current = false; setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
    <div><h3 className="flex items-center gap-2 font-semibold"><CalendarClock size={18}/>Jaarlijkse facturatie</h3><p className="mt-1 text-sm leading-6 text-slate-600">Deze factuur bevat het eerste jaar. Plan hier de volgende jaarfacturen voor de terugkerende diensten.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {loading ? <p className="text-sm">Abonnement controleren…</p> : existing ? <div role="status" className="space-y-2 text-sm"><p><strong>{existing.subscription_number}</strong> · {({ ACTIVE: 'Actief', PAUSED: 'Gepauzeerd', CANCELLED: 'Gestopt' })[existing.status] || existing.status}</p><p>Volgende factuurdatum: <strong>{dateLabel(existing.next_invoice_date)}</strong>. {existing.auto_finalize ? 'Wordt automatisch definitief gemaakt.' : 'Komt eerst als concept klaar voor controle.'}</p><a className="inline-block font-semibold text-blue-800 underline" href="/admin/billing?section=subscriptions">Abonnement beheren</a></div> : <form onSubmit={activate} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
      <ul className="space-y-1 text-sm">{plan.items.map(item => <li key={item.id} className="flex justify-between gap-4"><span>{item.description}</span><strong>{money.format(Number(item.line_total_ex_vat))} excl. btw / jaar</strong></li>)}</ul>
      <p className="text-sm">Jaarlijks <strong>{money.format(plan.total)} excl. btw</strong>. Eenmalige werkzaamheden worden niet opnieuw gefactureerd. Eventuele algemene korting op de eerste factuur geldt alleen voor die factuur; kortingen op de afzonderlijke jaarregels blijven behouden.</p>
      <label className="block max-w-sm text-sm font-medium">Startdatum van het eerste jaar<input required type="date" value={start} onChange={e => setStart(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
      {plan.nextDate && <p className="text-sm">Volgende factuur op <strong>{dateLabel(plan.nextDate)}</strong>.</p>}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={autoFinalize} onChange={e => setAutoFinalize(e.target.checked)} className="mt-1"/><span>Jaarfacturen automatisch definitief maken. Zonder vinkje staan ze eerst als concept klaar voor controle.</span></label>
      <p className="text-xs text-slate-600">Activeren maakt nu geen extra factuur en verstuurt geen e-mail. Bestaande contractafspraken blijven leidend.</p>
      {plan.error && <p className="text-sm text-amber-900">{plan.error}</p>}
      <button disabled={!!plan.error} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Activeren…' : 'Jaarlijkse facturatie activeren'}</button>
    </fieldset></form>}
  </section>;
}
