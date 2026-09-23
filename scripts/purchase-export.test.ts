import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPurchaseDraft } from '../supabase/functions/ebookhouden-admin/purchase-model.ts';
import { mutationMatches } from '../supabase/functions/ebookhouden-admin/export-model.ts';
import { validateAccountMapping } from '../supabase/functions/ebookhouden-admin/api.ts';
const id='11111111-1111-4111-8111-111111111111';
const entry=()=>({id,entry_date:'2026-09-23',due_date:'2026-10-07',supplier:'Hostingbedrijf',document_number:'INK-001',document_kind:'PURCHASE',description:'Hosting september',category:'hosting',treatment:'EXPENSE',business_percent:100,lines:[{base:10,vat:2.1,deductible:2.1,code:'21'}],vat_reviewed:true,void_reason:null,created_at:'2026-09-23T12:00:00Z',updated_at:'2026-09-23T12:00:00Z'});
const docs=[{id:'evidence',entry_id:id,status:'READY',sha256:'original-hash'}];
const config={connection_revision:'test',mapping:{debtor:1,revenue:2,creditor:3,cost_hosting:4}};
test('purchase preserves original number, exact input VAT, supplier and cost account',async()=>{
 const d=await buildPurchaseDraft(entry(),docs,config);
 assert.equal(d.mutation.type,1);assert.equal(d.mutation.ledgerId,3);assert.equal(d.mutation.rows[0].ledgerId,4);
 assert.equal(d.mutation.invoiceNumber,'INK-001');assert.equal(d.mutation.termOfPayment,14);assert.equal(d.amount,12.1);
 assert.deepEqual(d.expected_vat,{HOOG_INK_21:210});assert.equal(d.mutation.entryNumber,'VDX-B-'+id);
 const again=await buildPurchaseDraft({...entry(),supplier:' hostingbedrijf '},docs,config);assert.equal(again.customer_id,d.customer_id);
});
test('purchase credits reverse input VAT and costs',async()=>{
 const d=await buildPurchaseDraft({...entry(),document_kind:'CREDIT'},docs,config);
 assert.equal(d.amount,-12.1);assert.equal(d.mutation.rows[0].amount,-10);assert.deepEqual(d.expected_vat,{HOOG_INK_21:-210});
});
test('unreviewed, unsupported and incomplete purchases never reach posting',async()=>{
 for(const patch of [{vat_reviewed:false},{void_reason:'test'},{business_percent:80},{treatment:'ASSET'},{document_number:''},{entry_date:'2026-02-30'},{due_date:'2026-01-01'},{lines:[{base:10,vat:2.1,deductible:1,code:'21'}]},{lines:[{base:10,vat:2.11,deductible:2.11,code:'21'}]},{lines:[{base:10,vat:0,deductible:0,code:'REVERSE'}]}]) await assert.rejects(buildPurchaseDraft({...entry(),...patch},docs,config));
 await assert.rejects(buildPurchaseDraft(entry(),[],config),/originele/);
 await assert.rejects(buildPurchaseDraft(entry(),docs,{...config,mapping:{}}),/rekening/);
});
test('mixed Dutch rates and exempt lines preserve rounded totals',async()=>{
 const d=await buildPurchaseDraft({...entry(),lines:[{base:10,vat:2.1,deductible:2.1,code:'21'},{base:10,vat:.9,deductible:.9,code:'9'},{base:10,vat:0,deductible:0,code:'EXEMPT'}]},docs,config);
 assert.equal(d.amount,33);assert.equal(d.base,30);assert.equal(d.vat,3);assert.deepEqual(d.expected_vat,{HOOG_INK_21:210,LAAG_INK_9:90});
});
test('source evidence and amount changes invalidate review, mapping is separate',async()=>{
 const d=await buildPurchaseDraft(entry(),docs,config);
 assert.notEqual((await buildPurchaseDraft(entry(),[{...docs[0],sha256:'replaced'}],config)).source_hash,d.source_hash);
 const mapped=await buildPurchaseDraft(entry(),docs,{...config,mapping:{...config.mapping,cost_hosting:5}});
 assert.equal(mapped.source_hash,d.source_hash);assert.notEqual(mapped.review_hash,d.review_hash);
});
test('readback rejects different supplier, costs, number or VAT even for a known purchase ID',async()=>{
 const d=await buildPurchaseDraft(entry(),docs,config);d.mutation.relationId=8;
 const actual={...structuredClone(d.mutation),id:99,entryNumber:'',vat:[{vatCode:'HOOG_INK_21',amount:2.1}]};
 assert.equal(mutationMatches(actual,d.mutation,d.expected_vat,99),true);
 assert.equal(mutationMatches(actual,d.mutation,d.expected_vat),false);
 for(const patch of [{relationId:7},{invoiceNumber:'OTHER'},{ledgerId:1},{vat:[{vatCode:'HOOG_INK_21',amount:2.11}]},{rows:[{...actual.rows[0],ledgerId:2}]}]) assert.equal(mutationMatches({...actual,...patch},d.mutation,d.expected_vat,99),false);
});
test('purchase mapping validates creditors and expense ledgers without changing existing mappings',()=>{
 const ledgers=[{id:1,code:'1300',description:'Debiteuren',category:'DEB'},{id:2,code:'8000',description:'Omzet',category:'VW'},{id:3,code:'1600',description:'Crediteuren',category:'CRED'},{id:4,code:'4500',description:'Kosten',category:'VW'}];
 assert.equal(validateAccountMapping(config.mapping,ledgers).cost_hosting,4);
 assert.throws(()=>validateAccountMapping({...config.mapping,cost_hosting:2},ledgers),/andere rekening/);
 assert.throws(()=>validateAccountMapping({...config.mapping,creditor:1},ledgers),/juiste type/);
});
