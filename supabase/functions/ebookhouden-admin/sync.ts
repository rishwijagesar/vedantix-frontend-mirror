import { SetupError, validateAccountMapping } from './api.ts';
import { buildDraft, eligible, eligibleCredit, eligiblePayment, mutationMatches, cents, type Draft, type Kind } from './export-model.ts';
import { openBookkeeping, type Bookkeeping } from './provider.ts';

export const configColumns='connected,last_verified_at,mapping,updated_at,connection_revision,sync_enabled,payment_mode,sync_from,anchor_ledger_id,last_sync_at,last_sync_error';
export async function result(q:any) {const {data,error}=await q;if(error) throw new SetupError('De administratie kon niet worden bijgewerkt. Vernieuw het overzicht; mogelijk wordt er nog een boeking verwerkt.');return data;}
export const rpc=(db:any,action:string,lease:string|null=null,data:any={})=>result(db.rpc('ebookhouden_sync',{p_action:action,p_lease:lease,p_data:data}));
export const readConfig=(db:any)=>result(db.from('ebookhouden_config').select(configColumns).eq('id',true).single());
export function publicConfig(c:any) {const {anchor_ledger_id:_,...safe}=c;return {...safe,sync_enabled:!!c.sync_enabled,payment_mode:c.payment_mode || 'EXTERNAL',stage:!c.connected?'TOKEN_REQUIRED':!c.mapping?.debtor||!c.mapping?.revenue?'ACCOUNTS_REQUIRED':c.sync_enabled?'ACTIVE':'REVIEW_REQUIRED'};}
async function list(db:any,table:string,columns='*') {const all:any[]=[];for(let offset=0;offset<20000;offset+=500){const page=await result(db.from(table).select(columns).order('id').range(offset,offset+499));if(!Array.isArray(page))throw new SetupError('Onvolledig administratieoverzicht.');all.push(...page);if(page.length<500)return all;}throw new SetupError('Te veel administratiegegevens om veilig te verwerken.');}
// The journal has a composite primary key, not an id column.
async function journals(db:any) {const all:any[]=[];for(let offset=0;offset<20000;offset+=500){const page=await result(db.from('ebookhouden_exports').select('*').order('source_kind').order('source_id').range(offset,offset+499));all.push(...page);if(page.length<500)return all;}throw new SetupError('Het boekingsarchief is te groot.');}
export async function loadSnapshot(db:any,c:any) {
  const [invoices,credits,payments,requests,exports]=await Promise.all([list(db,'invoices','*,invoice_items(*)'),list(db,'credit_notes'),list(db,'invoice_payments'),list(db,'payment_requests','id,invoice_id,metadata'),journals(db)]);
  const invoiceMap=new Map(invoices.filter(i=>eligible(i,requests)).map(i=>[i.id,i]));
  const rows:any[]=[]; const drafts=new Map<string,Draft>();
  const push=async(kind:Kind,s:any,i:any)=>{
    const key=`${kind}:${s.id}`, j=exports.find(e=>e.source_kind===kind&&e.source_id===s.id);
    let d:Draft|null=null, reason='';
    try {d=await buildDraft(kind,s,i,j&&kind==='PAYMENT'?{...c,payment_mode:'VEDANTIX'}:c);drafts.set(key,d);}catch(e){reason=e instanceof SetupError?e.message:'Deze boeking moet worden gecontroleerd.';}
    let state=j?.status || (reason?'BLOCKED':'READY');
    if(j && (reason || d?.source_hash!==j.source_hash)) {state='CHANGED';reason='Dit document is na de boeking gewijzigd. Controleer en corrigeer het in e-Boekhouden.';}
    if(!j && kind!=='INVOICE' && !rows.some(r=>r.kind==='INVOICE'&&r.id===i.id&&r.state==='SYNCED')) {state='BLOCKED';reason='Zet eerst de bijbehorende factuur over en los eventuele wijzigingen op.';}
    if(j && state!=='CHANGED') reason=j.message || '';
    rows.push({kind,id:s.id,number:d?.number || s.credit_number || i.invoice_number,date:d?.date || s.payment_date || s.credit_date || i.invoice_date,amount:d?.amount ?? Number(kind==='PAYMENT'?s.amount:s.total_incl_vat),base:d?.base,vat:d?.vat,customer:i.customer_snapshot?.company_name || i.customer_snapshot?.contact_name || '',state,reason,remote_id:j?.remote_id,review_hash:j?.review_hash || d?.review_hash,available_at:d?.available_at,ledger_id:j?.draft?.mutation.ledgerId || d?.mutation.ledgerId});
  };
  for(const i of invoiceMap.values()) await push('INVOICE',i,i);
  for(const s of credits) {const i=invoiceMap.get(s.invoice_id);if(i&&eligibleCredit(s))await push('CREDIT',s,i);}
  for(const s of payments) {const i=invoiceMap.get(s.invoice_id);if(i&&eligiblePayment(s))await push('PAYMENT',s,i);}
  for(const j of exports) if(!rows.some(r=>r.kind===j.source_kind&&r.id===j.source_id)) rows.push({kind:j.source_kind,id:j.source_id,number:j.draft.number,date:j.draft.date,amount:j.draft.amount,state:'CHANGED',reason:'De bron is verwijderd, ingetrokken of uitgesloten. Controleer de bestaande boeking in e-Boekhouden.',remote_id:j.remote_id});
  return {rows,drafts,exports,excluded:invoices.length-invoiceMap.size};
}
export async function preview(db:any,c:any) {
  const s=await loadSnapshot(db,c);
  const payments=s.rows.filter(r=>r.kind==='PAYMENT');
  // Keep already-open admin tabs readable while the new frontend is deployed.
  return {rows:s.rows,invoices:s.rows.filter(r=>r.kind==='INVOICE'),credits:s.rows.filter(r=>r.kind==='CREDIT'),payment_count:payments.length,payment_amount:payments.reduce((n,r)=>n+cents(r.amount),0)/100,excluded_invoice_count:s.excluded,first_invoice_synced:s.exports.some(j=>j.source_kind==='INVOICE'&&j.status==='SYNCED'),attention:s.rows.filter(r=>['REVIEW','SENDING','CHANGED'].includes(r.state)).length};
}

async function exportOne(db:any,lease:string,c:any,s:Awaited<ReturnType<typeof loadSnapshot>>,kind:Kind,id:string,hash:string,actor:string|null,provider:Bookkeeping,retry=false,checkOnly=false) {
  const row=s.rows.find(r=>r.kind===kind&&r.id===id), d=s.drafts.get(`${kind}:${id}`);
  if(!row||!d||!['READY','REVIEW','SENDING','SYNCED'].includes(row.state)) throw new SetupError(row?.reason || 'Deze boeking kan niet worden overgezet.');
  const old=s.exports.find(j=>j.source_kind===kind&&j.source_id===id);
  if((old?.review_hash || d.review_hash)!==hash) throw new SetupError('De factuur of instellingen zijn gewijzigd. Vernieuw en controleer opnieuw.');
  if(old?.status==='SYNCED') return {message:'Deze boeking is al overgezet.',remote_id:old.remote_id};
  const ledgers=await provider.ledgers();
  validateAccountMapping(c.mapping,ledgers);
  if(c.anchor_ledger_id && !ledgers.some(l=>Number(l.id)===Number(c.anchor_ledger_id)&&l.category==='DEB')) throw new SetupError('Dit token hoort niet bij de eerder gebruikte administratie. Herstel de oorspronkelijke koppeling.');
  if(kind==='PAYMENT' && !ledgers.some(l=>Number(l.id)===d.mutation.ledgerId&&l.category==='FIN')) throw new SetupError('Voor betalingen is een rekening van het type Bank/kas nodig, ook voor de Mollie tussenrekening.');
  await rpc(db,'anchor',lease,{ledger:c.anchor_ledger_id || c.mapping.debtor});
  const frozen:Draft=old?.draft || d;
  const candidates=await provider.find(frozen.mutation);
  if(candidates.length) {
    if(old && candidates.length===1 && mutationMatches(candidates[0],frozen.mutation,frozen.expected_vat)) {
      await rpc(db,'finish',lease,{kind,id,status:'SYNCED',remote_id:Number(candidates[0].id),message:null});
      return {message:'De bestaande boeking is gecontroleerd en gekoppeld.',remote_id:Number(candidates[0].id)};
    }
    throw new SetupError('Er bestaat al een boeking met dit nummer of kenmerk. De inhoud moet eerst in e-Boekhouden worden gecontroleerd. Er is niets opnieuw geboekt.');
  }
  if(checkOnly) return {message:'Geen bevestigde boeking gevonden. Controleer e-Boekhouden. Gebruik daarna zo nodig Opnieuw proberen; het oorspronkelijke kenmerk blijft behouden.'};
  if(old && !retry) throw new SetupError('De vorige poging is onzeker. Controleer eerst e-Boekhouden en kies daarna bewust Opnieuw proberen.');
  if(kind!=='INVOICE') {
    const parent=s.exports.find(j=>j.source_kind==='INVOICE'&&j.source_id===d.invoice_id&&j.status==='SYNCED');
    if(!parent || !mutationMatches(await provider.detail(Number(parent.remote_id)),parent.draft.mutation,parent.draft.expected_vat)) throw new SetupError('De factuur in e-Boekhouden is gewijzigd of ontbreekt. Controleer die eerst.');
  }
  if(!old) {
    // Reuse a parent invoice's exact relation for credits/payments.
    const parent=s.exports.find(j=>j.source_kind==='INVOICE'&&j.source_id===d.invoice_id&&j.status==='SYNCED');
    const relationId=kind==='INVOICE'?await provider.relation(d):Number(parent?.draft?.mutation.relationId);
    if(!Number.isSafeInteger(relationId)||relationId<=0) throw new SetupError('De klantrelatie van de factuur ontbreekt.');
    frozen.mutation.relationId=relationId;
    if(kind==='PAYMENT') frozen.mutation.rows[0].relationId=relationId;
  }
  if(kind==='PAYMENT' && await provider.outstanding(d.number,frozen.mutation.relationId!)<cents(d.amount)) throw new SetupError('Dit bedrag is groter dan het openstaande bedrag in e-Boekhouden. Controleer of de betaling daar al is verwerkt.');
  // The durable intent is committed BEFORE the irreversible external POST.
  await rpc(db,'sending',lease,{...frozen,source_updated_at:d.source_updated_at,actor});
  let postedId:number|undefined;
  try {
    const actual=await provider.post(frozen.mutation);
    postedId=Number(actual.id);
    if(!mutationMatches(actual,frozen.mutation,frozen.expected_vat)) throw new SetupError('De boeking is aangemaakt, maar de bedragen of btw zijn niet exact bevestigd. Controleer deze in e-Boekhouden voordat je verdergaat.');
    await rpc(db,'finish',lease,{kind,id,status:'SYNCED',remote_id:Number(actual.id),message:null});
    return {message:'Boeking overgezet en bedragen gecontroleerd.',remote_id:Number(actual.id)};
  } catch(e) {
    const message=e instanceof SetupError?e.message:'De boeking is niet bevestigd. Controleer e-Boekhouden.';
    await rpc(db,'finish',lease,{kind,id,status:'REVIEW',message,remote_id:postedId});
    throw new SetupError(message);
  }
}

export async function processSync(db:any,input:any,actor:string|null,open= openBookkeeping) {
  const lease=crypto.randomUUID();
  if(!await rpc(db,'claim',lease)) throw new SetupError('Er wordt al een boeking verwerkt. Vernieuw het overzicht over een minuut.');
  let provider:Bookkeeping|undefined;
  try {
    const c=await readConfig(db);
    if(!c.connected) throw new SetupError('Verbind eerst e-Boekhouden.');
    if(input.action==='worker'&&!c.sync_enabled) return {message:'Automatisch verwerken staat uit.'};
    const s=await loadSnapshot(db,c);
    let target=input;
    if(input.action==='worker') {
      if(s.rows.some(r=>['REVIEW','SENDING','CHANGED'].includes(r.state))) {await rpc(db,'pause',lease,{message:'Er is een boeking die eerst moet worden gecontroleerd.'});return {message:'Controle vereist.'};}
      // Do not backfill old documents on activation. Manual exports remain possible.
      const candidates=s.rows.filter(r=>r.available_at&&Date.parse(r.available_at)>=Date.parse(c.sync_from)&&r.state!=='SYNCED'&&(r.kind!=='PAYMENT'||c.payment_mode==='VEDANTIX'));
      const row=candidates.find(r=>r.state==='READY');
      if(!row) {if(candidates.length)await rpc(db,'pause',lease,{message:candidates[0].reason});return {message:'Geen nieuwe boekingen klaar.'};}
      target={...row,action:'export'};
    }
    if(!['INVOICE','CREDIT','PAYMENT'].includes(target.kind)||typeof target.id!=='string'||typeof target.review_hash!=='string') throw new SetupError('Kies een boeking uit het controleoverzicht.');
    const token=await result(db.rpc('ebookhouden_secret',{p_action:'read',p_token:null}));
    if(!token)throw new SetupError('Het API-token ontbreekt.');
    provider=await open(token);
    return await exportOne(db,lease,c,s,target.kind,target.id,target.review_hash,actor,provider,target.action==='retry_export',target.action==='check_export');
  } catch(e) {if(input.action==='worker') await rpc(db,'pause',lease,{message:e instanceof SetupError?e.message:'Automatische verwerking vraagt om controle.'});throw e;}
  finally {if(provider)await provider.close();await rpc(db,'release',lease);}
}
