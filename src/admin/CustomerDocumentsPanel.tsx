import { useEffect, useState } from "react";
import { Download, FileArchive, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { termsPdfUrl, GENERAL_TERMS } from "@/lib/general-terms";
import { downloadDocuments, type DocumentRequest } from "./document-downloads";

const buttonClass="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-50";
const statuses:Record<string,string>={DRAFT:"Concept",FINALIZED:"Definitief",VEDANTIX_SIGNED:"Door Vedantix getekend",SENT:"Verzonden",COMPLETED:"Volledig getekend",VOID:"Vervallen",PAID:"Betaald",PARTIALLY_PAID:"Deels betaald",OVERDUE:"Verlopen",CREDITED:"Gecrediteerd"};

export function DocumentDownloadButton({request,children}:{request:DocumentRequest;children:React.ReactNode}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  return <span className="inline-flex flex-col items-start gap-1"><button type="button" disabled={busy} className={buttonClass} onClick={async()=>{setBusy(true);setError(null);try{await downloadDocuments(request);}catch(e){setError(e instanceof Error?e.message:"Download mislukt.");}finally{setBusy(false);}}}>{busy?<Loader2 size={16} className="animate-spin"/>:<Download size={16}/>} {busy?"Download maken…":children}</button>{error?<span role="alert" className="max-w-md text-xs text-red-700">{error}</span>:null}</span>;
}

type DocumentRow={id:string;title:string;status:string;invoice_number?:string|null;contract_number?:string};
export default function CustomerDocumentsPanel({customerId,invoiceId}:{customerId:string;invoiceId?:string}) {
  const [invoices,setInvoices]=useState<DocumentRow[]>([]),[contracts,setContracts]=useState<DocumentRow[]>([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;setLoading(true);setError(null);
    async function load(){
      let q=supabase.from("invoices").select("id,invoice_number,title,status").eq("customer_id",customerId).order("created_at");
      if(invoiceId)q=q.eq("id",invoiceId);
      const [i,c]=await Promise.all([q.limit(101),supabase.from("contracts").select("id,contract_number,title,status").eq("customer_id",customerId).order("created_at").limit(101)]);
      if(i.error||c.error)throw new Error(i.error?.message||c.error?.message);
      if(active){setInvoices(i.data||[]);setContracts(c.data||[]);}
    }
    void load().catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[customerId,invoiceId]);
  return <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 text-lg font-semibold"><FileArchive size={19}/>Documenten downloaden</h3><p className="mt-1 max-w-xl text-sm text-slate-500">{invoiceId?"Deze factuur en alle contracten van deze klant, plus de algemene voorwaarden.":"Alle facturen, contracten en algemene voorwaarden bij elkaar in één klantdossier."}</p></div>{!loading&&!error?<DocumentDownloadButton request={{kind:"bundle",...(invoiceId?{invoice_id:invoiceId}:{customer_id:customerId})}}>Alles downloaden (ZIP)</DocumentDownloadButton>:null}</div>
    {loading?<p className="text-sm text-slate-500">Documenten laden…</p>:null}
    {error?<p role="alert" className="text-sm text-red-700">{error}</p>:null}
    {!loading&&!error?<div className="space-y-3">
      {invoices.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><div><strong className="block text-sm">{item.invoice_number||"Conceptfactuur"}</strong><p className="text-xs text-slate-500">{item.title} · {statuses[item.status]||item.status}</p></div><DocumentDownloadButton request={{kind:"invoice",invoice_id:item.id}}>Factuur PDF</DocumentDownloadButton></div>)}
      {contracts.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><div><strong className="block text-sm">{item.contract_number}</strong><p className="text-xs text-slate-500">{item.title} · {statuses[item.status]||item.status}</p></div><DocumentDownloadButton request={{kind:"contract",contract_id:item.id}}>Contract PDF</DocumentDownloadButton></div>)}
      {!contracts.length?<p className="text-sm text-slate-500">Voor deze klant is nog geen contract opgeslagen.</p>:null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><div><strong className="block text-sm">Algemene voorwaarden</strong><p className="text-xs text-slate-500">Gepubliceerde versie {GENERAL_TERMS.dateLabel}</p></div><a href={termsPdfUrl} className={buttonClass}><Download size={16}/>Voorwaarden PDF</a></div>
      <p className="text-xs leading-5 text-slate-500">Concepten en vervallen contracten zijn gemarkeerd. Bij volledig getekende contracten bevat de ZIP ook het ondertekenbewijs. De voorwaarden zijn de gepubliceerde versie; de bundel verandert bestaande afspraken niet.</p>
    </div>:null}
  </section>;
}
