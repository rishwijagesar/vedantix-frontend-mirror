import { supabase } from "@/lib/supabase";
const endpoint="https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/billing-documents";
const publishableKey="sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu";
export type DocumentRequest={kind:"invoice"|"contract"|"bundle";invoice_id?:string;contract_id?:string;customer_id?:string};
export async function downloadDocuments(input:DocumentRequest) {
  const {data,error}=await supabase.auth.getSession();
  if(error||!data.session) throw new Error("Log opnieuw in om documenten te downloaden.");
  const response=await fetch(endpoint,{
    method:"POST",headers:{authorization:"Bearer "+data.session.access_token,apikey:publishableKey,"content-type":"application/json"},
    body:JSON.stringify(input),cache:"no-store",signal:AbortSignal.timeout(120000),
  });
  if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||"Download maken mislukt.");}
  const type=response.headers.get("content-type")||"";
  if(!type.includes("application/pdf")&&!type.includes("application/zip"))throw new Error("Ongeldig downloadbestand ontvangen.");
  const blob=await response.blob();
  if(!blob.size)throw new Error("Het downloadbestand is leeg.");
  const filename=response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1]||(input.kind==="bundle"?"Vedantix-documenten.zip":"Vedantix-document.pdf");
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),10000);
}
