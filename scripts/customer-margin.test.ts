import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annualCents, costShares, emptyMarginData, recurringRevenue, summarizeCustomer, type CustomerCost, type MarginData, type MarginInvoice, type MarginProfile, type MarginSubscription } from '../src/admin/customer-margin-model.ts';
import { activeAdminItem, billingSection, searchAdminNavigation } from '../src/admin/admin-navigation.ts';

const customer = { id: 'a', company_name: 'Klant', status: 'ACTIVE' };
const cost: CustomerCost = { id: 'cost', name: 'Mail', supplier: 'Provider', category: 'email', amount: 10, period: 'MONTHLY', notes: '', archived: false, revision: 1, updated_at: '' };
const invoice: MarginInvoice = { id: 'invoice', customer_id: 'a', invoice_number: 'FAC-2026-0001', invoice_date: '2026-09-23', created_at: '2026-09-23', finalized_at: '2026-09-23', status: 'FINALIZED', is_active: true, invoice_items: [{ billing_type: 'ONE_TIME', line_total_ex_vat: 499 }, { billing_type: 'YEARLY', line_total_ex_vat: 30 }, { billing_type: 'YEARLY', line_total_ex_vat: 30 }] };
const profile: MarginProfile = { id: 'a', revenue_amount: 60, revenue_period: 'YEARLY', revenue_note: '', costs_reviewed: true, revision: 1 };
const subscription: MarginSubscription = { id: 'sub', customer_id: 'a', subscription_number: 'SUB-1', status: 'ACTIVE', start_date: '2026-01-01', billing_type: 'MONTHLY', discount_type: 'NONE', discount_value: 0, first_invoice_discount_ex_vat: 50, subscription_items: [{ line_total_ex_vat: 20 }] };
const data = (overrides: Partial<MarginData> = {}): MarginData => ({ ...emptyMarginData, customers: [customer], ...overrides });
const asOf = '2026-09-23';
const allocations = ['a', 'b', 'c'].map(id => ({ id, customer_id: id, cost_id: 'cost' }));

test('annual, quarterly and monthly prices normalize to the same run rate', () => {
  assert.equal(annualCents(60, 'YEARLY'), 6000);
  assert.equal(annualCents(15, 'QUARTERLY'), 6000);
  assert.equal(annualCents(5, 'MONTHLY'), 6000);
  assert.throws(() => annualCents(-1, 'MONTHLY'));
  assert.throws(() => annualCents(NaN, 'YEARLY'));
});
test('shared costs allocate provider cents exactly once, stably, regardless of row order', () => {
  const shares = costShares(cost, allocations);
  assert.equal([...shares.values()].reduce((n, x) => n + x, 0), 12000);
  assert.equal(shares.get('a'), 4008);
  assert.deepEqual(costShares(cost, [...allocations].reverse()), shares);
  assert.deepEqual(costShares(cost, [...allocations, allocations[0]]), shares);
  assert.throws(() => costShares(cost, []));
});
test('first real invoice yields only a provisional €5 monthly recurring revenue', () => {
  const result = recurringRevenue('a', data({ invoices: [invoice] }), asOf);
  assert.equal(result.annual, 6000);
  assert.equal(result.confirmed, false);
  assert.equal(result.source, 'INVOICE');
});
test('repeat invoices are not accumulated; use only latest recurring invoice', () => {
  assert.equal(recurringRevenue('a', data({ invoices: [invoice, { ...invoice, id: 'later', invoice_date: '2026-09-24', invoice_items: [{ billing_type: 'YEARLY', line_total_ex_vat: 72 }] }] }), '2026-09-24').annual, 7200);
});
test('draft, inactive, future, credit and recognized test invoices never become revenue', () => {
  for (const fields of [{ status: 'DRAFT' }, { status: 'CREDITED' }, { finalized_at: null }, { is_active: false }, { invoice_date: '2027-01-01' }, { invoice_number: 'TEST-1' }]) {
    assert.equal(recurringRevenue('a', data({ invoices: [{ ...invoice, ...fields }] }), asOf).annual, null);
  }
  assert.equal(recurringRevenue('a', data({ invoices: [invoice], test_invoice_ids: ['invoice'] }), asOf).annual, null);
});
test('subscriptions take precedence and retain recurring discount, not initial discount', () => {
  const result = recurringRevenue('a', data({ invoices: [invoice], subscriptions: [{ ...subscription, discount_type: 'PERCENTAGE', discount_value: 10 }] }), asOf);
  assert.equal(result.annual, 21600);
  assert.equal(result.confirmed, true);
});
test('paused, cancelled, future subscriptions do not fall back to old invoices', () => {
  for (const fields of [{ status: 'PAUSED' }, { status: 'CANCELLED' }, { start_date: '2027-01-01' }]) assert.equal(recurringRevenue('a', data({ invoices: [invoice], subscriptions: [{ ...subscription, ...fields }] }), asOf).annual, 0);
  assert.equal(recurringRevenue('a', data({ subscriptions: [{ ...subscription, subscription_items: [] }] }), asOf).annual, null);
});
test('manual price including zero overrides subscriptions and invoices', () => {
  assert.equal(recurringRevenue('a', data({ profiles: [{ ...profile, revenue_amount: 0 }], subscriptions: [subscription], invoices: [invoice] }), asOf).annual, 0);
  assert.equal(recurringRevenue('a', data({ profiles: [{ ...profile, revenue_amount: null }], subscriptions: [subscription] }), asOf).annual, 24000);
});
test('missing costs never produce a confirmed positive margin', () => {
  const result = summarizeCustomer(customer, data({ profiles: [{ ...profile, costs_reviewed: false }] }), asOf);
  assert.equal(result.complete, false);
  assert.equal(result.status, 'Kosten aanvullen');
  assert.equal(result.marginPercent, null);
});
test('costs above revenue produce a loss, correct monthly equivalent, and annual margin', () => {
  const result = summarizeCustomer(customer, data({ profiles: [profile], costs: [cost], allocations: [allocations[0]] }), asOf);
  assert.equal(result.complete, true);
  assert.equal(result.status, 'Negatieve marge');
  assert.equal(result.annualMargin, -6000);
  assert.equal(result.annualMargin! / 1200, -5);
  assert.equal(result.marginPercent, -100);
});
test('archived and other customers costs are excluded; confirmed zero costs remain valid', () => {
  const result = summarizeCustomer(customer, data({ profiles: [profile], costs: [{ ...cost, archived: true }], allocations }), asOf);
  assert.equal(result.annualCost, 0);
  assert.equal(result.complete, true);
  assert.equal(result.annualMargin, 6000);
  assert.equal(summarizeCustomer(customer, data({ costs: [cost], allocations: [allocations[1]] }), asOf).annualCost, 0);
});
test('navigation supports direct route, finance grouping and search', () => {
  assert.equal(billingSection('customer-margin'), 'customer-margin');
  assert.equal(activeAdminItem('/admin/billing', '?section=customer-margin').label, 'Klantrendement');
  assert.ok(searchAdminNavigation('kosten klant').some(g => g.id === 'finance' && g.items.some(i => i.id === 'billing:customer-margin')));
});
