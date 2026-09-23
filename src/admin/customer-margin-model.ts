export type Period = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export const periodLabels: Record<Period, string> = { MONTHLY: 'Per maand', QUARTERLY: 'Per kwartaal', YEARLY: 'Per jaar' };
export const categories = { hosting: 'Websitehosting', email: 'E-mail', domain: 'Domeinnaam', software: 'Software / licenties', maintenance: 'Onderhoud / uitbesteed werk', other: 'Overige kosten' };
export type MarginCustomer = { id: string; company_name: string; status: string };
export type CustomerCost = { id: string; name: string; supplier: string; category: keyof typeof categories; amount: number; period: Period; notes: string; archived: boolean; revision: number; updated_at: string };
export type Allocation = { id: string; cost_id: string; customer_id: string };
export type MarginProfile = { id: string; revenue_amount: number | null; revenue_period: Period; revenue_note: string; costs_reviewed: boolean; revision: number };
export type MarginSubscription = { id: string; customer_id: string; subscription_number: string; status: string; start_date: string; billing_type: Period; discount_type: string; discount_value: number; first_invoice_discount_ex_vat: number; subscription_items: { line_total_ex_vat: number }[] };
export type MarginInvoice = { id: string; customer_id: string; invoice_number: string; invoice_date: string; created_at: string; finalized_at: string | null; status: string; is_active: boolean; invoice_items: { billing_type: string; line_total_ex_vat: number }[] };
export type MarginData = { customers: MarginCustomer[]; costs: CustomerCost[]; allocations: Allocation[]; profiles: MarginProfile[]; subscriptions: MarginSubscription[]; invoices: MarginInvoice[]; test_invoice_ids: string[] };
export const emptyMarginData: MarginData = { customers: [], costs: [], allocations: [], profiles: [], subscriptions: [], invoices: [], test_invoice_ids: [] };
export const money = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());

function cents(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 99999999) throw new Error('Een bedrag is ongeldig. Controleer de brongegevens.');
  return Math.round(n * 100);
}
const factors: Record<Period, number> = { MONTHLY: 12, QUARTERLY: 4, YEARLY: 1 };
export function annualCents(amount: number, period: Period) {
  if (!factors[period]) throw new Error('Onbekende betaaltermijn.');
  return cents(amount) * factors[period];
}

// Allocate complete cents in the provider's billing period before annualizing.
// Stable ordering ensures the sum of customer shares equals the supplier bill.
export function costShares(cost: CustomerCost, allocations: Allocation[]): Map<string, number> {
  const ids = [...new Set(allocations.filter(a => a.cost_id === cost.id).map(a => a.customer_id))].sort();
  if (!ids.length) throw new Error(`Koppel de kostenpost '${cost.name}' aan minstens één klant.`);
  const total = cents(cost.amount), base = Math.floor(total / ids.length), remainder = total % ids.length;
  return new Map(ids.map((id, index) => [id, (base + (index < remainder ? 1 : 0)) * factors[cost.period]]));
}

export type Revenue = { annual: number | null; confirmed: boolean; source: 'MANUAL' | 'SUBSCRIPTIONS' | 'INVOICE' | 'MISSING'; description: string };
export function recurringRevenue(customerId: string, data: MarginData, asOf: string): Revenue {
  const profile = data.profiles.find(p => p.id === customerId);
  if (profile?.revenue_amount != null) return { annual: annualCents(profile.revenue_amount, profile.revenue_period), confirmed: true, source: 'MANUAL', description: profile.revenue_note || 'Eigen terugkerende prijsafspraak' };
  const subscriptions = data.subscriptions.filter(s => s.customer_id === customerId);
  if (subscriptions.length) {
    const active = subscriptions.filter(s => s.status === 'ACTIVE' && s.start_date <= asOf);
    if (active.some(s => !s.subscription_items.length)) return { annual: null, confirmed: false, source: 'MISSING', description: 'Een actief abonnement heeft geen prijsregels. Controleer Abonnementen.' };
    const annual = active.reduce((sum, s) => {
      const base = s.subscription_items.reduce((n, i) => n + cents(i.line_total_ex_vat), 0);
      const percentage = s.discount_type === 'PERCENTAGE' ? Number(s.discount_value) : 0;
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error('Controleer de abonnementskorting.');
      // An initial invoice discount is not an ongoing discount.
      return sum + annualCents((base - Math.round(base * percentage / 100)) / 100, s.billing_type);
    }, 0);
    return { annual, confirmed: true, source: 'SUBSCRIPTIONS', description: active.length ? `${active.length} actief abonnement${active.length === 1 ? '' : 'en'} · eerste-factuurkortingen niet meegerekend` : 'Geen lopend abonnement: gepauzeerd, beëindigd of nog niet gestart' };
  }
  const invoice = data.invoices.filter(i => i.customer_id === customerId && i.is_active && i.finalized_at && ['FINALIZED', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status) && !/^TEST(?:\b|[-_])/i.test(i.invoice_number) && !data.test_invoice_ids.includes(i.id) && i.invoice_date <= asOf && i.invoice_items.some(r => r.billing_type === 'MONTHLY' || r.billing_type === 'YEARLY'))
    .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))[0];
  if (invoice) {
    const annual = invoice.invoice_items.filter(r => r.billing_type === 'MONTHLY' || r.billing_type === 'YEARLY').reduce((n, r) => n + annualCents(r.line_total_ex_vat, r.billing_type as Period), 0);
    return { annual, confirmed: false, source: 'INVOICE', description: `Indicatie uit ${invoice.invoice_number}. Bevestig de vervolgprijs; eenmalige bedragen en factuurkortingen zijn niet meegerekend.` };
  }
  return { annual: null, confirmed: false, source: 'MISSING', description: 'Nog geen terugkerende prijsafspraak vastgelegd' };
}

export function summarizeCustomer(customer: MarginCustomer, data: MarginData, asOf = today()) {
  const revenue = recurringRevenue(customer.id, data, asOf);
  const costRows = data.costs.filter(c => !c.archived && data.allocations.some(a => a.cost_id === c.id && a.customer_id === customer.id))
    .map(cost => ({ cost, annual: costShares(cost, data.allocations).get(customer.id) || 0, customerCount: data.allocations.filter(a => a.cost_id === cost.id).length }));
  const annualCost = costRows.reduce((n, r) => n + r.annual, 0);
  const costsReviewed = data.profiles.find(p => p.id === customer.id)?.costs_reviewed === true;
  const annualMargin = revenue.annual === null ? null : revenue.annual - annualCost;
  const complete = revenue.confirmed && costsReviewed;
  const status = !revenue.confirmed ? 'Opbrengst controleren' : !costsReviewed ? 'Kosten aanvullen' : annualMargin! < 0 ? 'Negatieve marge' : annualMargin === 0 ? 'Kostendekkend' : 'Positieve marge';
  return { customer, revenue, costRows, annualCost, annualMargin, complete, costsReviewed, status,
    marginPercent: complete && revenue.annual! > 0 ? annualMargin! / revenue.annual! * 100 : null };
}
