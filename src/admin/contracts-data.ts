import { supabase } from "@/lib/supabase";

export type ContractClause = { key: string; title: string; body: string; locked_core?: boolean };
export type ContractTemplate = { id:string; code:string; name:string; description:string|null; active:boolean; current_version:number };
export type ContractTemplateVersion = { id:string; template_id:string; version_no:number; title:string; intro_text:string|null; clauses:ContractClause[]; variables_schema:Record<string,{label?:string;type?:string;required?:boolean}> };
export type ContractStatus = "DRAFT"|"FINALIZED"|"VEDANTIX_SIGNED"|"SENT"|"COMPLETED"|"VOID";
export type ContractRecord = {
  id:string; contract_number:string; customer_id:string; source_quote_id:string|null; template_id:string|null; template_version:number|null;
  status:ContractStatus; title:string; project_name:string|null; variables:Record<string,string>; clauses:ContractClause[]; template_snapshot:Record<string,any>|null;
  company_snapshot:Record<string,any>; customer_snapshot:Record<string,any>; public_token:string; document_hash:string|null; final_pdf_hash:string|null; certificate_pdf_hash:string|null;
  finalized_at:string|null; vedantix_signed_at:string|null; sent_at:string|null; completed_at:string|null; created_at:string;
};
export type AcceptedQuote = { id:string; quote_number:string; title:string; customer_id:string; total_incl_vat:number };
export type ContractSignature = { id:string; signer_role:"VEDANTIX"|"CLIENT"; signer_name:string; signer_email:string|null; signature_type:"TYPED"|"DRAWN"; signature_data:string; email_verified_at:string|null; signed_at:string; document_hash:string };
export type ContractEvent = { id:string; event_type:string; actor_role:string|null; actor_name:string|null; created_at:string; metadata:Record<string,unknown> };

function fail(error:any){if(error)throw new Error(error.message||String(error));}

export async function listContractTemplates(){const {data,error}=await supabase.from("contract_templates").select("*").eq("active",true).order("name");fail(error);return (data||[]) as ContractTemplate[];}
export async function getCurrentTemplateVersion(template:ContractTemplate){const {data,error}=await supabase.from("contract_template_versions").select("*").eq("template_id",template.id).eq("version_no",template.current_version).single();fail(error);return data as ContractTemplateVersion;}
export async function listContracts(){const {data,error}=await supabase.from("contracts").select("*").order("created_at",{ascending:false});fail(error);return (data||[]) as ContractRecord[];}
export async function getContract(id:string){const {data,error}=await supabase.from("contracts").select("*").eq("id",id).single();fail(error);return data as ContractRecord;}
export async function listAcceptedQuotes(){const {data,error}=await supabase.from("quotes").select("id,quote_number,title,customer_id,total_incl_vat").eq("status","ACCEPTED").order("accepted_at",{ascending:false});fail(error);return (data||[]) as AcceptedQuote[];}
export async function createContract(customerId:string,templateId:string,sourceQuoteId?:string|null){const {data,error}=await supabase.rpc("create_contract_from_template",{p_customer_id:customerId,p_template_id:templateId,p_source_quote_id:sourceQuoteId||null});fail(error);return String(data);}
export async function saveContractDraft(contract:ContractRecord){const {error}=await supabase.rpc("update_contract_draft",{p_contract_id:contract.id,p_title:contract.title,p_project_name:contract.project_name,p_variables:contract.variables,p_clauses:contract.clauses});fail(error);}
export async function finalizeContract(id:string){const {data,error}=await supabase.rpc("finalize_contract",{p_contract_id:id});fail(error);return data as {contract_id:string;document_hash:string};}
export async function voidContract(id:string,reason?:string){const {error}=await supabase.rpc("void_contract",{p_contract_id:id,p_reason:reason||null});fail(error);}
export async function signContractAsVedantix(id:string,signerName:string,signatureType:"TYPED"|"DRAWN",signatureData:string){const {data,error}=await supabase.functions.invoke("contract-admin",{body:{action:"sign",contract_id:id,signer_name:signerName,signature_type:signatureType,signature_data:signatureData}});if(error)throw new Error((data as any)?.error||error.message);if((data as any)?.error)throw new Error((data as any).error);return data;}
export async function sendContract(id:string){const {data,error}=await supabase.functions.invoke("contract-admin",{body:{action:"send",contract_id:id}});if(error)throw new Error((data as any)?.error||error.message);if((data as any)?.error)throw new Error((data as any).error);return data;}
export async function getContractSignatures(id:string){const {data,error}=await supabase.from("contract_signatures").select("*").eq("contract_id",id).order("signed_at");fail(error);return (data||[]) as ContractSignature[];}
export async function getContractEvents(id:string){const {data,error}=await supabase.from("contract_events").select("id,event_type,actor_role,actor_name,created_at,metadata").eq("contract_id",id).order("created_at");fail(error);return (data||[]) as ContractEvent[];}
export async function saveTemplateVersion(templateId:string,version:ContractTemplateVersion){const {data,error}=await supabase.rpc("save_contract_template_version",{p_template_id:templateId,p_title:version.title,p_intro_text:version.intro_text||"",p_clauses:version.clauses,p_variables_schema:version.variables_schema||{}});fail(error);return Number(data);}

export const contractPdfUrl=(token:string,certificate=false)=>`https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/contract-pdf?token=${encodeURIComponent(token)}&mode=${certificate?"certificate":"contract"}`;
