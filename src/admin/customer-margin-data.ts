import { supabase } from '@/lib/supabase';
import type { CustomerCost, MarginData, MarginProfile } from './customer-margin-model';

async function all(table: string, columns = '*'): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from(table).select(columns).order('id').range(offset, offset + 499);
    if (error) throw new Error('Klantcijfers konden niet volledig worden geladen. Probeer opnieuw.');
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function loadCustomerMargins(): Promise<MarginData> {
  const { data: allowed, error } = await supabase.rpc('is_staff', { required_roles: ['ADMIN'] });
  if (error || !allowed) throw new Error('Alleen beheerders kunnen klantkosten en marges bekijken.');
  const [customers, costs, allocations, profiles, subscriptions, invoices, requests] = await Promise.all([
    all('customers', 'id,company_name,status'), all('customer_costs'), all('customer_cost_allocations'), all('customer_cost_profiles'),
    all('subscriptions', 'id,customer_id,subscription_number,status,start_date,billing_type,discount_type,discount_value,first_invoice_discount_ex_vat,subscription_items(line_total_ex_vat)'),
    all('invoices', 'id,customer_id,invoice_number,invoice_date,created_at,finalized_at,status,is_active,invoice_items(billing_type,line_total_ex_vat)'),
    all('payment_requests', 'id,invoice_id,metadata'),
  ]);
  return { customers: customers.filter(c => !/^__VEDANTIX_.*TEST__$/i.test(c.company_name)), costs, allocations, profiles, subscriptions, invoices,
    test_invoice_ids: requests.filter(r => String(r.metadata?.test_fixture).toLowerCase() === 'true' || String(r.metadata?.mollie_mode).toLowerCase() === 'test').map(r => r.invoice_id) };
}
function fail(error: { code?: string; message: string } | null) {
  if (!error) return;
  throw new Error(error.code === 'P0001' ? error.message : 'Opslaan mislukt. Controleer de gegevens en je beheerdersrechten.');
}
export async function saveCustomerCost(cost: Pick<CustomerCost, 'name' | 'supplier' | 'category' | 'amount' | 'period' | 'notes' | 'archived'>, customerIds: string[], previous?: CustomerCost) {
  const { error } = await supabase.rpc('save_customer_cost', {
    p_id: previous?.id || null, p_revision: previous?.revision || null,
    p_name: cost.name, p_supplier: cost.supplier, p_category: cost.category, p_amount: cost.amount, p_period: cost.period,
    p_notes: cost.notes, p_archived: cost.archived, p_customers: customerIds,
  });
  fail(error);
}
export async function saveMarginProfile(customerId: string, changes: Partial<Pick<MarginProfile, 'revenue_amount' | 'revenue_period' | 'revenue_note' | 'costs_reviewed'>>, previous?: MarginProfile) {
  const request = previous ? supabase.from('customer_cost_profiles').update(changes).eq('id', customerId).eq('revision', previous.revision)
    : supabase.from('customer_cost_profiles').insert({ id: customerId, ...changes });
  const { data, error } = await request.select('id').maybeSingle();
  if (error?.code === '23505' || (!error && !data)) throw new Error('De klantgegevens zijn ondertussen gewijzigd. Vernieuw de pagina en controleer opnieuw.');
  fail(error);
}
