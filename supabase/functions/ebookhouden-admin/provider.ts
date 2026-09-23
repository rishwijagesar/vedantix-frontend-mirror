import { SetupError, type Ledger } from './api.ts';
import { cents, normalize, type Draft, type Mutation } from './export-model.ts';

export async function openBookkeeping(accessToken: string, fetcher: typeof fetch=fetch) {
  let token='';
  async function request(path: string, method='GET', body?: unknown) {
    let response: Response;
    try { response=await fetcher(`https://api.e-boekhouden.nl/v1${path}`,{method,headers:{'Content-Type':'application/json',...(token ? {Authorization:token}: {})},...(body ? {body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)}); }
    catch { throw new SetupError('Het antwoord van e-Boekhouden is niet ontvangen. Controleer de boeking voordat je opnieuw probeert.'); }
    if (!response.ok) throw new SetupError(response.status===429 ? 'e-Boekhouden is tijdelijk druk. Probeer later opnieuw.' : [401,403].includes(response.status) ? 'Geen toegang tot e-Boekhouden. Controleer het token en de rechten.' : 'e-Boekhouden heeft het verzoek niet bevestigd. Controleer de boeking en de rekeninginstellingen.');
    if (response.status===204) return null;
    try { return normalize(await response.json()); } catch { throw new SetupError('e-Boekhouden gaf geen leesbare bevestiging. Controleer de boeking.'); }
  }
  const session=await request('/session','POST',{accessToken,source:'Vedantix'});
  if (typeof session?.token!=='string' || !session.token) throw new SetupError('Geen geldige e-Boekhouden-sessie ontvangen.');
  token=session.token;
  async function list(path: string) {
    const all: any[]=[];
    for (let offset=0;offset<20000;offset+=1000) {
      const page=await request(`${path}${path.includes('?')?'&':'?'}limit=1000&offset=${offset}`);
      if (page?.items===null && [0,'0'].includes(page.count)) return all;
      if (!Array.isArray(page?.items)) throw new SetupError('Het controleoverzicht van e-Boekhouden is onvolledig.');
      all.push(...page.items); if (page.items.length<1000) return all;
    }
    throw new SetupError('Te veel resultaten om de boeking betrouwbaar te controleren.');
  }
  const detail=async(id:number)=>{
    if (!Number.isSafeInteger(id)||id<=0) throw new SetupError('Ongeldig boekingsnummer ontvangen.');
    const mutation=await request(`/mutation/${id}`);
    if (Number(mutation?.id)!==id) throw new SetupError('Het teruggelezen boekingsnummer wijkt af. Controleer de boeking.');
    return mutation;
  };
  return {
    close: async()=>{try {await request('/session','DELETE');} catch { /* Session expires. */ }},
    ledgers: async()=>await list('/ledger') as Ledger[],
    detail,
    find: async(m:Mutation)=>{
      const rows=await list(`/mutation?${m.type===3 ? `description=${encodeURIComponent(m.description)}`:`invoiceNumber=${encodeURIComponent(m.invoiceNumber!)}`}`);
      // Also reject an existing non-Vedantix invoice number: never silently add it again.
      return await Promise.all(rows.map(r=>detail(Number(r.id))));
    },
    relation: async(d:Draft)=>{
      const code=`${d.kind==='PURCHASE'?'VDS':'VDX'}${d.customer_id.replaceAll('-','').slice(0,12)}`;
      const marker=`${d.kind==='PURCHASE'?'vedantix-supplier':'vedantix'}:${d.customer_id}`;
      const rows=await list(`/relation?code=${encodeURIComponent(code)}`);
      if (rows.length>1) throw new SetupError('Meerdere klantrelaties gevonden. Controleer de klant in e-Boekhouden.');
      if (rows.length) {
        const r=await request(`/relation/${Number(rows[0].id)}`);
        if (r.freeText1!==marker || r.code!==code || r.inactive===true) throw new SetupError('De klantcode is al anders in gebruik. Controleer de klantrelatie in e-Boekhouden.');
        return Number(r.id);
      }
      const c=d.customer;
      const take=(v:any,n:number)=>String(v||'').trim().slice(0,n);
      const r=await request('/relation','POST',{code,type:c.company_name?'B':'P',name:take(c.company_name||c.contact_name||c.name,100),contact:take(c.contact_name,50),address:take([c.address_line1,c.address_line2].filter(Boolean).join(' '),150),postalCode:take(c.postal_code,50),city:take(c.city,50),...(d.kind==='PURCHASE'?{}:{country:'Nederland'}),emailAddress:take(c.email,150),...(c.vat_number ? {vatNumber:take(c.vat_number,50)}:{}),...(/^\d{8}$/.test(c.kvk_number||'') ? {companyRegistrationNumber:c.kvk_number}:{}),freeText1:marker,doNotReceiveNewsletters:true});
      if (!Number.isSafeInteger(Number(r.id)) || Number(r.id)<=0) throw new SetupError('De klantrelatie is niet bevestigd. Probeer later opnieuw.');
      return Number(r.id);
    },
    outstanding: async(number:string,relationId:number)=>{
      const rows=await list(`/mutation/invoice/outstanding?credDeb=D&invoiceNumber=${encodeURIComponent(number)}`);
      const match=rows.filter(r=>r.invoiceNumber===number && Number(r.relationId)===relationId);
      if (match.length!==1) throw new SetupError('De factuur staat niet eenduidig open in e-Boekhouden. Mogelijk is de betaling daar al verwerkt.');
      return cents(match[0].outstandingAmount);
    },
    post: async(m:Mutation)=>{const r=await request('/mutation','POST',m); return await detail(Number(r?.id));},
  };
}
export type Bookkeeping = Awaited<ReturnType<typeof openBookkeeping>>;

