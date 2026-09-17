import { test } from 'node:test';
import assert from 'node:assert/strict';
import { period, inPeriod, emptyData, summarize, entryAmounts, purchaseBalance, allocate, csv, fileDetails, type Entry, type Sale, type Credit, type Bank } from '../src/admin/administration-model.ts';
import { zipStore, makeAdministrationZip, evidenceForPeriod } from '../src/admin/administration-export.ts';
const entry:Entry={id:'e1',entry_date:'2026-03-31',due_date:null,supplier:'Supplier',document_number:'INV-1',document_kind:'PURCHASE',description:'Software',category:'software',treatment:'EXPENSE',business_percent:100,lines:[{base:100,vat:21,deductible:21,code:'21'}],vat_reviewed:true,notes:'',void_reason:null,revision:1};
const sale:Sale={id:'s1',invoice_number:'FAC-2026-0001',invoice_date:'2026-03-31',title:'Website',status:'CREDITED',is_active:true,finalized_at:'2026-03-31',total_ex_vat:1000,vat_total:210,total_incl_vat:1210,invoice_items:[{vat_rate:21,line_total_ex_vat:1000,line_vat:210}]};
const credit:Credit={id:'c1',invoice_id:'s1',credit_number:'CR-2026-0001',credit_date:'2026-04-01',status:'FINALIZED',finalized_at:'2026-04-01',total_ex_vat:-1000,vat_total:-210,total_incl_vat:-1210};
const bank:Bank={id:'b1',transaction_date:'2026-04-01',account:'Bank',description:'Payment',amount:-121,reference:'bank1',kind:'PURCHASE',entry_id:'e1',invoice_id:null,void_reason:null,revision:1};
test('calendar quarters have inclusive boundaries and Q4 deadline in next year',()=>{
 for(const [q,start,end,due] of [[1,'01-01','03-31','2026-04-30'],[2,'04-01','06-30','2026-07-31'],[3,'07-01','09-30','2026-10-31'],[4,'10-01','12-31','2027-01-31']] as const){const p=period(2026,q);assert.equal(p.start,'2026-'+start);assert.equal(p.end,'2026-'+end);assert.equal(p.deadline,due);assert.ok(inPeriod(p.start,p));assert.ok(inPeriod(p.end,p));}
 assert.equal(period(2026,0).deadline,null);assert.equal(period(2026,0).end,'2026-12-31');assert.throws(()=>period(2026,5));
});
test('invoices stay in invoice quarter, later payments do not create revenue again',()=>{
 const data={...emptyData,invoices:[{...sale,status:'PAID'}],entries:[entry],bank:[bank],payments:[{id:'p',invoice_id:'s1',amount:1210,payment_date:'2026-04-01',voided_at:null}]};
 const q1=summarize(data,period(2026,1)),q2=summarize(data,period(2026,2));
 assert.equal(q1.revenue,1000);assert.equal(q1.costs,100);assert.equal(q1.result,900);assert.equal(q1.outstanding,1210);assert.equal(q1.payable,121);assert.equal(q1.inputVat,21);
 assert.equal(q2.revenue,0);assert.equal(q2.costs,0);assert.equal(q2.outstanding,0);assert.equal(q2.payable,0);assert.equal(q2.cashOut,121);
});
test('a credited invoice and its negative credit count once on their respective dates',()=>{
 const data={...emptyData,invoices:[sale],credits:[credit]};
 assert.equal(summarize(data,period(2026,1)).revenue,1000);assert.equal(summarize(data,period(2026,2)).revenue,-1000);
 const year=summarize(data,period(2026,0));assert.equal(year.revenue,0);assert.equal(year.outputVat,0);assert.equal(year.outstanding,0);assert.deepEqual(year.groups['21'],{base:0,vat:0});
});
test('drafts, inactive, test invoices, unfinalized credits and voided payments are excluded',()=>{
 const data={...emptyData,invoices:[{...sale,status:'DRAFT'}, {...sale,id:'inactive',is_active:false},{...sale,id:'test',invoice_number:'TEST-1'},{...sale,id:'mollie'}],credits:[{...credit,status:'DRAFT'}],test_invoice_ids:['mollie']};assert.equal(summarize(data,period(2026,0)).revenue,0);
 const active={...emptyData,invoices:[sale],payments:[{id:'p',invoice_id:'s1',amount:1210,payment_date:'2026-03-31',voided_at:null,metadata:{mollie_mode:'TEST'}}]};assert.equal(summarize(active,period(2026,1)).outstanding,1210);
});
test('business share, non-deductible VAT, investments and private purchases',()=>{
 const mixed={...entry,business_percent:50,lines:[{base:100,vat:21,deductible:5,code:'21' as const}]};assert.equal(entryAmounts(mixed).cost,55.5);
 const data={...emptyData,entries:[mixed,{...entry,id:'asset',treatment:'ASSET' as const},{...entry,id:'private',treatment:'PRIVATE' as const,lines:[{base:100,vat:21,deductible:0,code:'21' as const}]}]};const s=summarize(data,period(2026,1));assert.equal(s.costs,55.5);assert.equal(s.investments,100);
 assert.equal(entryAmounts({...entry,vat_reviewed:false}).deductible,0);assert.equal(entryAmounts({...entry,vat_reviewed:false}).cost,121);
});
test('incoming supplier credit and refunds have correct signs',()=>{
 const e={...entry,document_kind:'CREDIT' as const};assert.equal(entryAmounts(e).cost,-100);assert.equal(entryAmounts(e).deductible,-21);assert.equal(purchaseBalance(e,[{...bank,amount:121}],'2026-04-01'),0);
});
test('allocation preserves totals including negative credits and mixed VAT',()=>{
 assert.deepEqual(allocate(0.05,[1,1,1]),[0.02,0.02,0.01]);assert.deepEqual(allocate(-0.05,[1,1,1]),[-0.02,-0.02,-0.01]);
 const mixed={...sale,total_ex_vat:180,vat_total:27,total_incl_vat:207,invoice_items:[{vat_rate:21,line_total_ex_vat:100,line_vat:21},{vat_rate:9,line_total_ex_vat:100,line_vat:9}]};assert.deepEqual(summarize({...emptyData,invoices:[mixed]},period(2026,1)).groups,{'21':{base:90,vat:18.9},'9':{base:90,vat:8.1}});
});
test('original evidence is included via link even when uploaded in another quarter; failed downloads abort',async()=>{
 const doc={id:'d',document_date:'2026-04-05',filename:'factuur.pdf',object_path:'d/original.pdf',mime_type:'application/pdf',byte_size:3,sha256:'a'.repeat(64),status:'READY' as const,kind:'INVOICE' as const,note:'',entry_id:'e1',bank_id:null,invoice_id:null,contract_id:null,revision:1};const data={...emptyData,entries:[entry],documents:[doc]};assert.equal(evidenceForPeriod(data,period(2026,1)).length,1);
 await assert.rejects(()=>makeAdministrationZip(data,period(2026,1),async()=>{throw Error('Missing original');}),/Missing original/);
 const zip=await makeAdministrationZip(data,period(2026,1),async()=>new Uint8Array([1,2,3]));assert.equal(new DataView(zip.buffer).getUint32(0,true),0x04034b50);
});
test('evidence validation and CSV injection protection',()=>{
 assert.equal(fileDetails('original.EML',100).mime,'message/rfc822');assert.throws(()=>fileDetails('script.html',100));assert.throws(()=>fileDetails('a.pdf',21*1024*1024));assert.throws(()=>fileDetails('a.pdf',0));
 assert.match(csv([['=HYPERLINK("bad")',-12,"  +formula"]]),/'=HYPERLINK/);assert.match(csv([[-12]]),/"-12"/);assert.match(csv([['a;b','x"y']]),/"a;b";"x""y"/);
});
