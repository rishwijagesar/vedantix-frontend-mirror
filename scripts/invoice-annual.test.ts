import {test} from 'node:test';
import assert from 'node:assert/strict';
import {annualInvoicePlan} from '../src/admin/invoice-annual-model.ts';
const invoice={status:'FINALIZED',is_active:true};
const lines=[{id:'1',description:'Website',billing_type:'ONE_TIME',line_total_ex_vat:499},{id:'2',description:'Hosting',billing_type:'YEARLY',line_total_ex_vat:30},{id:'3',description:'E-mail',billing_type:'YEARLY',line_total_ex_vat:30}];
test('only annual lines recur, first year is not invoiced twice',()=>{const p=annualInvoicePlan(invoice,lines,'2026-09-23');assert.equal(p.total,60);assert.equal(p.nextDate,'2027-09-23');assert.equal(p.items.length,2);assert.equal(p.error,'');});
test('leap day clamps like PostgreSQL instead of skipping into March',()=>{assert.equal(annualInvoicePlan(invoice,lines,'2024-02-29').nextDate,'2025-02-28');assert.ok(annualInvoicePlan(invoice,lines,'2026-02-30').error);});
test('draft, inactive, credited and existing billing trajectories cannot activate again',()=>{for(const patch of [{status:'DRAFT'},{status:'CREDITED'},{is_active:false},{subscription_id:'existing'},{source_quote_id:'existing'}])assert.ok(annualInvoicePlan({...invoice,...patch},lines,'2026-09-23').error);});
