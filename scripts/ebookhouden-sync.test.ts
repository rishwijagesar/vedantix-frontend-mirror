import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildDraft,mutationMatches,eligible,eligiblePayment,cents,normalize} from '../supabase/functions/ebookhouden-admin/export-model.ts';
import {processSync,preview} from '../supabase/functions/ebookhouden-admin/sync.ts';
import {openBookkeeping} from '../supabase/functions/ebookhouden-admin/provider.ts';
import {createEboekhoudenHandler} from '../supabase/functions/ebookhouden-admin/handler.ts';
const id='11111111-1111-4111-8111-111111111111', customer='22222222-2222-4222-8222-222222222222';
const cfg=()=>({connected:true,connection_revision:'initial',mapping:{debtor:1,revenue:2,bank:3,mollie:4},payment_mode:'EXTERNAL',sync_enabled:false,sync_from:null,anchor_ledger_id:null});
const invoice=()=>({id,customer_id:customer,invoice_number:'FAC-2026-0001',invoice_date:'2026-09-23',due_date:'2026-10-07',title:'Website',status:'FINALIZED',is_active:true,finalized_at:'2026-09-23T12:00:00Z',customer_snapshot:{company_name:'Klant',country:'NL',email:'klant@example.org'},total_ex_vat:559,vat_total:117.39,total_incl_vat:676.39,invoice_items:[{id:'a',position:0,description:'Website bouwen',line_total_ex_vat:499,vat_rate:21},{id:'b',position:1,description:'Hosting',line_total_ex_vat:60,vat_rate:21}]});
const ledgers=[{id:1,code:'1300',description:'Debiteuren',category:'DEB'},{id:2,code:'8000',description:'Omzet',category:'VW'},{id:3,code:'1100',description:'Bank',category:'FIN'},{id:4,code:'1150',description:'Mollie',category:'FIN'}];
function remote(d:any,n=101){return {id:n,...structuredClone(d.mutation),vat:Object.entries(d.expected_vat).map(([vatCode,amount])=>({vatCode,amount:Number(amount)/100}))};}

test('finalized invoice retains invoice number, descriptions, exact VAT and reference',async()=>{
 const i=invoice(),d=await buildDraft('INVOICE',i,i,cfg());
 assert.equal(d.mutation.invoiceNumber,i.invoice_number);assert.equal(d.mutation.rows[0].description,'Website bouwen');assert.equal(d.mutation.termOfPayment,14);
 assert.equal(d.expected_vat.HOOG_VERK_21,11739);assert.equal(d.mutation.checkPaymentReference,true);assert.equal(d.mutation.entryNumber,'VDX-I-'+id);
 assert.equal(mutationMatches(remote(d),d.mutation,d.expected_vat),true);
 const bad=remote(d);bad.vat[0].amount=117.38;assert.equal(mutationMatches(bad,d.mutation,d.expected_vat),false);
 const casing=Object.fromEntries(Object.entries(remote(d)).map(([k,v])=>[k[0].toUpperCase()+k.slice(1),v]));assert.equal(mutationMatches(casing,d.mutation,d.expected_vat),true);
});
test('mixed rates and document discounts preserve exact cents; ambiguity is blocked',async()=>{
 const i={...invoice(),total_ex_vat:180,vat_total:27,total_incl_vat:207,invoice_items:[{position:0,description:'A',line_total_ex_vat:100,vat_rate:21},{position:1,description:'B',line_total_ex_vat:100,vat_rate:9}]};
 const d=await buildDraft('INVOICE',i,i,cfg());assert.deepEqual(d.mutation.rows.map(r=>r.amount),[90,90]);assert.deepEqual(d.expected_vat,{HOOG_VERK_21:1890,LAAG_VERK_9:810});
 await assert.rejects(buildDraft('INVOICE',{...i,vat_total:27.01},{...i,vat_total:27.01},cfg()),/afronding/);
 const zero={...invoice(),invoice_items:[{position:0,line_total_ex_vat:559,vat_rate:0}]};await assert.rejects(buildDraft('INVOICE',zero,zero,cfg()),/9% en 21%/);
 const foreign={...invoice(),customer_snapshot:{company_name:'Belgisch',country:'BE'}};await assert.rejects(buildDraft('INVOICE',foreign,foreign,cfg()),/land/);
});
test('full credit reverses original VAT and revenue; partial credits require their own VAT evidence',async()=>{
 const i=invoice(),c={id:'33333333-3333-4333-8333-333333333333',credit_number:'CR-2026-0001',credit_date:'2026-09-24',finalized_at:'2026-09-24T12:00:00Z',total_ex_vat:-559,vat_total:-117.39,total_incl_vat:-676.39};
 const d=await buildDraft('CREDIT',c,i,cfg());assert.equal(d.mutation.rows[0].amount,-499);assert.equal(d.expected_vat.HOOG_VERK_21,-11739);assert.equal(d.mutation.invoiceNumber,c.credit_number);
 await assert.rejects(buildDraft('CREDIT',{...c,total_ex_vat:-100},i,cfg()),/gedeeltelijke/);
});
test('payments are opt-in, never revenue or VAT; Mollie gross receipts go to clearing',async()=>{
 const p={id:'33333333-3333-4333-8333-333333333333',amount:200,payment_date:'2026-09-24',method:'MOLLIE',created_at:'2026-09-24T12:00:00Z'};
 await assert.rejects(buildDraft('PAYMENT',p,invoice(),cfg()),/afgestemd/);
 const d=await buildDraft('PAYMENT',p,invoice(),{...cfg(),payment_mode:'VEDANTIX'});assert.equal(d.mutation.type,3);assert.equal(d.mutation.ledgerId,4);assert.equal(d.vat,0);assert.equal(d.mutation.rows[0].invoiceNumber,'FAC-2026-0001');assert.deepEqual(d.expected_vat,{});
 await assert.rejects(buildDraft('PAYMENT',{...p,method:'CASH'},invoice(),{...cfg(),payment_mode:'VEDANTIX'}),/betaalwijze/);
});
test('drafts, unfinalized records, inactive data, voided payments and test checkouts excluded',()=>{
 assert.equal(eligible({...invoice(),status:'DRAFT'},[]),false);assert.equal(eligible({...invoice(),finalized_at:null},[]),false);assert.equal(eligible(invoice(),[{invoice_id:id,metadata:{mollie_mode:'test'}}]),false);assert.equal(eligiblePayment({voided_at:'2026-09-23'}),false);assert.equal(eligiblePayment({metadata:{test_fixture:true}}),false);
});

// In-memory persistence contract. The SQL suite independently validates locking,
// grants and the durable transition ordering against PostgreSQL.
function dbFixture(){
 const config:any=cfg(),journal:any[]=[],invoices:any[]=[invoice()],payments:any[]=[],credits:any[]=[],events:string[]=[];
 const tables:any={invoices,invoice_payments:payments,credit_notes:credits,payment_requests:[],ebookhouden_exports:journal};let lease:string|null=null;
 const db={from:(name:string)=>{const q:any={select:()=>q,eq:()=>q,order:()=>q,range:async(a:number,b:number)=>({data:tables[name].slice(a,b+1)}),single:async()=>({data:{...config}})};return q;},rpc:async(name:string,a:any)=>{
  if(name==='ebookhouden_secret')return {data:'test-token'};
  const d=a.p_data,action=a.p_action;events.push(action);
  if(action==='claim'){if(lease)return{data:false};lease=a.p_lease;return{data:true};}
  if(action==='release'){assert.equal(a.p_lease,lease);lease=null;return{data:true};}
  assert.equal(a.p_lease,lease);
  if(action==='anchor')config.anchor_ledger_id=d.ledger;
  if(action==='sending'){let j=journal.find(j=>j.source_kind===d.kind&&j.source_id===d.id);if(j)j.status='SENDING';else journal.push({source_kind:d.kind,source_id:d.id,invoice_id:d.invoice_id,source_hash:d.source_hash,review_hash:d.review_hash,status:'SENDING',draft:structuredClone(d)});}
  if(action==='finish'){const j=journal.find(j=>j.source_kind===d.kind&&j.source_id===d.id);assert.ok(j);Object.assign(j,d);}
  if(action==='pause')config.sync_enabled=false;
  return{data:true};
 }};
 const provider:any={close:async()=>{events.push('close');},ledgers:async()=>ledgers,find:async()=>[],relation:async()=>99,outstanding:async()=>67639,detail:async()=>remote(journal[0].draft),post:async()=>{events.push('post');assert.equal(journal.at(-1).status,'SENDING');return remote(journal.at(-1).draft);}};
 const target=async(action='export')=>{const p=await preview(db,config);const row=p.rows.find(r=>r.kind==='INVOICE');return{action,kind:'INVOICE',id,review_hash:row.review_hash};};
 return{db,config,journal,invoices,payments,credits,events,provider,target};
}
test('review hashes reject stale prices/config before posting; every successful post has durable intent',async()=>{
 const f=dbFixture(),target=await f.target();f.config.mapping.revenue=55;
 await assert.rejects(processSync(f.db,target,customer,async()=>f.provider),/gewijzigd/);assert.equal(f.journal.length,0);assert.ok(!f.events.includes('post'));
 f.config.mapping.revenue=2;await processSync(f.db,await f.target(),customer,async()=>f.provider);assert.equal(f.journal[0].status,'SYNCED');assert.equal(f.journal[0].remote_id,101);assert.ok(f.events.indexOf('sending')<f.events.indexOf('post'));
 await processSync(f.db,await f.target(),customer,async()=>f.provider);assert.equal(f.events.filter(e=>e==='post').length,1);
});
test('lost POST response is recoverable by exact remote match without a second POST, even after token rotation',async()=>{
 const f=dbFixture();let accepted:any;
 f.provider.post=async()=>{accepted=remote(f.journal[0].draft);throw new Error('network response lost secret-token');};
 await assert.rejects(processSync(f.db,await f.target(),customer,async()=>f.provider),/niet bevestigd/);assert.equal(f.journal[0].status,'REVIEW');
 f.config.connection_revision='rotated';f.provider.find=async()=>[accepted];f.provider.post=async()=>{throw new Error('Must not retry');};
 const r=await processSync(f.db,await f.target('check_export'),customer,async()=>f.provider);assert.equal(r.remote_id,101);assert.equal(f.journal[0].status,'SYNCED');
});
test('uncertain writes require explicit retry; existing invoice numbers and changed sources block export',async()=>{
 const f=dbFixture();f.provider.post=async()=>{throw new Error('lost');};
 await assert.rejects(processSync(f.db,await f.target(),customer,async()=>f.provider));
 f.provider.post=async()=>{throw new Error('Must not post without consent');};await assert.rejects(processSync(f.db,await f.target(),customer,async()=>f.provider),/vorige poging/);
 const message=await processSync(f.db,await f.target('check_export'),customer,async()=>f.provider);assert.match(message.message,/Geen bevestigde/);
 f.invoices[0].total_ex_vat=500;const p=await preview(f.db,f.config);assert.equal(p.rows[0].state,'CHANGED');
 const other=dbFixture();other.provider.find=async()=>[{id:999,entryNumber:'MANUAL'}];await assert.rejects(processSync(other.db,await other.target(),customer,async()=>other.provider),/bestaat al/);assert.equal(other.journal.length,0);
});
test('automatic activation never backfills old documents; it pauses for unresolved records',async()=>{
 const f=dbFixture();f.config.sync_enabled=true;f.config.sync_from='2026-09-24T00:00:00Z';await processSync(f.db,{action:'worker'},null,async()=>f.provider);assert.equal(f.journal.length,0);
 f.invoices[0].finalized_at='2026-09-25T00:00:00Z';await processSync(f.db,{action:'worker'},null,async()=>f.provider);assert.equal(f.journal.length,1);
 f.journal[0].status='REVIEW';await processSync(f.db,{action:'worker'},null,async()=>f.provider);assert.equal(f.config.sync_enabled,false);
});
test('payment export requires an intact remote invoice and sufficient outstanding amount',async()=>{
 const f=dbFixture();await processSync(f.db,await f.target(),customer,async()=>f.provider);
 f.config.payment_mode='VEDANTIX';f.payments.push({id:'33333333-3333-4333-8333-333333333333',invoice_id:id,amount:200,payment_date:'2026-09-24',created_at:'2026-09-24T12:00:00Z',method:'MOLLIE'});
 const row=(await preview(f.db,f.config)).rows.find(r=>r.kind==='PAYMENT');f.provider.outstanding=async()=>0;
 await assert.rejects(processSync(f.db,{action:'export',...row},customer,async()=>f.provider),/openstaande/);assert.equal(f.journal.length,1);
});
test('provider uses session authorization and deterministic references, never sends a customer invoice',async()=>{
 const calls:any[]=[];let posted:any;
 const d=await buildDraft('INVOICE',invoice(),invoice(),cfg());
 const fetcher=async(url:any,init:any)=>{calls.push([String(url),init]);const path=new URL(url).pathname;
  if(path==='/v1/session')return init.method==='DELETE'?new Response(null,{status:204}):Response.json({Token:'session-token'});
  assert.equal(init.headers.Authorization,'session-token');assert.equal(init.redirect,'error');
  if(path==='/v1/mutation'&&init.method==='POST'){posted=JSON.parse(init.body);return Response.json({Id:101},{status:201});}
  if(path==='/v1/mutation/101')return Response.json(remote(d));
  return Response.json({Items:[]});
 };
 const p=await openBookkeeping('api-secret',fetcher as any);assert.deepEqual(await p.find(d.mutation),[]);await p.post(d.mutation);await p.close();assert.equal(posted.paymentReference,d.mutation.entryNumber);assert.ok(calls.every(([u])=>!u.includes('/invoice?')&&!u.endsWith('/invoice')));
});
test('all export and settings actions require a verified ADMIN, with bounded request body',async()=>{
 for(const action of ['export','retry_export','check_export','sync_settings']){
  const handler=createEboekhoudenHandler(()=>({auth:{getUser:async()=>({data:{user:{id:customer}}})},rpc:async()=>({data:false})}),()=>{throw new Error('Privilege escalation');});
  const r=await handler(new Request('https://example.org',{method:'POST',headers:{Authorization:'Bearer user'},body:JSON.stringify({action})}));assert.equal(r.status,403);
 }
 const handler=createEboekhoudenHandler(()=>({auth:{getUser:async()=>({data:{user:{id:customer}}})},rpc:async()=>({data:true})}),()=>{throw new Error('Service access unexpected');});
 assert.equal((await handler(new Request('https://example.org',{method:'POST',headers:{Authorization:'Bearer user'},body:'x'.repeat(12001)}))).status,413);
});

test('a changed parent customer blocks new payments even when a previous booking exists',async()=>{
 const f=dbFixture();await processSync(f.db,await f.target(),customer,async()=>f.provider);
 f.config.payment_mode='VEDANTIX';f.invoices[0].customer_snapshot.company_name='Changed customer';
 f.payments.push({id:'33333333-3333-4333-8333-333333333333',invoice_id:id,amount:100,payment_date:'2026-09-24',method:'MOLLIE',created_at:'2026-09-24T12:00:00Z'});
 const p=await preview(f.db,f.config);assert.equal(p.rows.find(r=>r.kind==='INVOICE').state,'CHANGED');assert.equal(p.rows.find(r=>r.kind==='PAYMENT').state,'BLOCKED');
});
