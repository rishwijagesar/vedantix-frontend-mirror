import { zipSync, strToU8 } from "npm:fflate@0.8.3";
import { makePdf } from "../billing-pdf/document.ts";
import { buildContractPdf, buildCertificate } from "../_shared/contract-document.ts";
import { buildTermsPdf } from "../_shared/terms-document.ts";
import { GENERAL_TERMS } from "../_shared/general-terms.ts";

const allowedOrigins=new Set(["https://vedantix.nl","https://www.vedantix.nl","http://localhost:5173","http://localhost:3000"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Client=any;
export function safeFilename(value:unknown) {
  return String(value||"document").normalize("NFKD").replace(/[^a-zA-Z0-9_-]/g,"-").replace(/-+/g,"-").slice(0,100)||"document";
}
function fail(result:any) { if(result.error) throw new Error("Documentgegevens konden niet worden opgehaald."); return result.data; }
export function documentName(kind:string, record:any) {
  const draft=record.status==="DRAFT"?"CONCEPT-":record.status==="VOID"?"VERVALLEN-":"";
  return draft+safeFilename(kind==="invoice"?record.invoice_number||record.id:record.contract_number||record.id)+".pdf";
}
export async function invoiceBytes(client:Client, invoice:any) {
  const items=fail(await client.from("invoice_items").select("*").eq("invoice_id",invoice.id).order("position"));
  return makePdf("invoice",{
    ...invoice, invoice_number:invoice.invoice_number||"CONCEPT-"+invoice.id.slice(0,8),
    company:invoice.company_snapshot,customer:invoice.customer_snapshot,items,
    amount_outstanding:Math.max(0,Number(invoice.total_incl_vat||0)-Number(invoice.amount_paid||0)),
  },invoice.is_active!==false?invoice.public_token:undefined);
}
export async function contractFiles(client:Client,contract:any) {
  const signatures=fail(await client.from("contract_signatures").select("*").eq("contract_id",contract.id).order("signed_at"))||[];
  if(contract.status==="COMPLETED" && !["VEDANTIX","CLIENT"].every(role=>signatures.some((s:any)=>s.signer_role===role))) throw new Error("Ondertekeningen van het contract zijn niet compleet.");
  const result:Record<string,Uint8Array>={};
  result[documentName("contract",contract)]=await buildContractPdf(contract,signatures);
  if(contract.status==="COMPLETED"){
    const events=fail(await client.from("contract_events").select("event_type,actor_role,created_at").eq("contract_id",contract.id).order("created_at"))||[];
    result[safeFilename(contract.contract_number)+"-Ondertekenbewijs.pdf"]=await buildCertificate(contract,signatures,events);
  }
  return result;
}

export function createDocumentsHandler(createUserClient:(authorization:string)=>Client) {
  return async(request:Request)=>{
    const origin=request.headers.get("origin");
    const headers:Record<string,string>={"cache-control":"private, no-store","x-content-type-options":"nosniff","vary":"Origin","access-control-expose-headers":"Content-Disposition"};
    if(origin && allowedOrigins.has(origin)) headers["access-control-allow-origin"]=origin;
    const json=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{...headers,"content-type":"application/json"}});
    if(origin && !allowedOrigins.has(origin)) return json(403,"Onbekende website.");
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{...headers,"access-control-allow-methods":"POST, GET, OPTIONS","access-control-allow-headers":"authorization, apikey, content-type, x-client-info"}});
    const pdf=(bytes:Uint8Array,name:string)=>new Response(bytes,{headers:{...headers,"content-type":"application/pdf","content-disposition":'attachment; filename="'+name+'"'}});
    try {
      if(request.method==="GET" && new URL(request.url).searchParams.get("mode")==="terms"){
        return pdf(await buildTermsPdf(),"Vedantix-Algemene-voorwaarden-"+GENERAL_TERMS.version+".pdf");
      }
      if(request.method!=="POST") return json(405,"Gebruik POST voor klantdocumenten.");
      const authorization=request.headers.get("authorization")||"";
      if(!/^Bearer\s+\S+$/.test(authorization)) return json(401,"Log opnieuw in om documenten te downloaden.");
      const client=createUserClient(authorization);
      const {data:auth,error:authError}=await client.auth.getUser();
      if(authError || !auth?.user) return json(401,"Log opnieuw in om documenten te downloaden.");
      const {data:staff,error:staffError}=await client.rpc("is_staff");
      if(staffError||staff!==true) return json(403,"Alleen medewerkers kunnen klantdocumenten downloaden.");
      const input=await request.json().catch(()=>null);
      if(!input||!["invoice","contract","bundle"].includes(input.kind)) return json(400,"Ongeldige documentkeuze.");
      for(const key of ["invoice_id","contract_id","customer_id"]) if(input[key]!==undefined && (typeof input[key]!=="string"||!uuid.test(input[key]))) return json(400,"Ongeldig documentnummer.");
      if(input.kind==="invoice"){
        if(!input.invoice_id) return json(400,"Kies een factuur.");
        const invoice=fail(await client.from("invoices").select("*").eq("id",input.invoice_id).maybeSingle());
        if(!invoice) return json(404,"Factuur niet gevonden.");
        return pdf(await invoiceBytes(client,invoice),documentName("invoice",invoice));
      }
      if(input.kind==="contract"){
        if(!input.contract_id) return json(400,"Kies een contract.");
        const contract=fail(await client.from("contracts").select("*").eq("id",input.contract_id).maybeSingle());
        if(!contract) return json(404,"Contract niet gevonden.");
        const files=await contractFiles(client,contract), name=documentName("contract",contract);
        return pdf(files[name],name);
      }
      // Bundles are a customer dossier. An invoice-scoped bundle contains that invoice
      // plus this customer's contracts; it does not assert a legal link to a contract.
      if(Boolean(input.customer_id)===Boolean(input.invoice_id)) return json(400,"Kies een klant of een factuur.");
      let invoice:any=null;
      if(input.invoice_id){
        invoice=fail(await client.from("invoices").select("*").eq("id",input.invoice_id).maybeSingle());
        if(!invoice) return json(404,"Factuur niet gevonden.");
      }
      const customerId=invoice?.customer_id||input.customer_id;
      const customer=fail(await client.from("customers").select("id,company_name").eq("id",customerId).maybeSingle());
      if(!customer) return json(404,"Klant niet gevonden.");
      const invoices=invoice?[invoice]:fail(await client.from("invoices").select("*").eq("customer_id",customerId).order("created_at").limit(101))||[];
      const contracts=fail(await client.from("contracts").select("*").eq("customer_id",customerId).order("created_at").limit(101))||[];
      if(invoices.length+contracts.length>100) return json(422,"Dit dossier is te groot. Download per factuur of document.");
      const files:Record<string,Uint8Array>={};
      for(const inv of invoices) files["Facturen/"+safeFilename(inv.id.slice(0,8))+"-"+documentName("invoice",inv)]=await invoiceBytes(client,inv);
      for(const contract of contracts) for(const [name,bytes] of Object.entries(await contractFiles(client,contract))) files["Contracten/"+safeFilename(contract.id.slice(0,8))+"-"+name]=bytes;
      files["Algemene-voorwaarden-"+GENERAL_TERMS.version+".pdf"]=await buildTermsPdf();
      files["Inhoud.txt"]=strToU8([
        "Vedantix - klantdossier: "+customer.company_name,
        "Gedownload: "+new Date().toISOString(),
        invoice?"Bevat de geselecteerde factuur en alle contracten van deze klant.":"Bevat alle facturen en contracten van deze klant.",
        "Documenten kunnen verschillende opdrachten betreffen; de bundeling legt geen nieuwe contractkoppeling vast.",
        "Algemene voorwaarden: gepubliceerde versie "+GENERAL_TERMS.dateLabel+" ("+GENERAL_TERMS.canonical+").",
        "Dit is een kopie van de gepubliceerde voorwaarden, geen bewijs van een historische aanvaarding.",
        "Concepten en vervallen contracten zijn als zodanig gemarkeerd.",
        "",...invoices.map((i:any)=>"Factuur: "+(i.invoice_number||"Concept")+" | "+i.status),
        ...contracts.map((c:any)=>"Contract: "+c.contract_number+" | "+c.status),
      ].join("\n"));
      if(Object.values(files).reduce((n,b)=>n+b.length,0)>40*1024*1024) return json(422,"Dit dossier is te groot. Download de documenten afzonderlijk.");
      const bytes=zipSync(files,{level:0});
      return new Response(bytes,{headers:{...headers,"content-type":"application/zip","content-disposition":'attachment; filename="Vedantix-'+safeFilename(customer.company_name)+'-documenten.zip"'}});
    }catch(error){
      console.error("billing-documents: "+(error instanceof Error?error.message:"unexpected error"));
      return json(500,"Download maken mislukt. Probeer opnieuw; er is geen onvolledig bestand gedownload.");
    }
  };
}
