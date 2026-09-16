import { createDocumentsHandler } from "../billing-documents/handler.ts";
import { GENERAL_TERMS } from "../_shared/general-terms.ts";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { unzipSync, strFromU8 } from "npm:fflate@0.8.3";

const assert=(v:unknown,message="Assertion failed")=>{if(!v)throw new Error(message);};
const customerId="00000000-0000-4000-8000-000000000001",invoiceId="00000000-0000-4000-8000-000000000002",contractId="00000000-0000-4000-8000-000000000003";
const otherId="00000000-0000-4000-8000-000000000009";
const customer={id:customerId,company_name:"Voorbeeldklant"};
const invoice={id:invoiceId,customer_id:customerId,invoice_number:"VED-TEST-1001",status:"FINALIZED",is_active:true,public_token:invoiceId,title:"Voorbeeld website",total_ex_vat:100,vat_total:21,total_incl_vat:121,amount_paid:0,company_snapshot:{trade_name:"Vedantix",email:"info@example.com"},customer_snapshot:{company_name:"Voorbeeldklant"},invoice_date:"2026-09-16"};
const contract={id:contractId,customer_id:customerId,contract_number:"CON-TEST-1001",status:"DRAFT",title:"Overeenkomst",company_snapshot:{trade_name:"Vedantix"},customer_snapshot:{company_name:"Voorbeeldklant"},clauses:[{title:"1. Afspraak",body:"Ontwerp voor {{client}}."}],variables:{client:"Voorbeeldklant"},template_snapshot:{intro_text:"Een testovereenkomst."}};
function client(options:{staff?:boolean;auth?:boolean;failItems?:boolean;completed?:boolean}={}) {
  const tables:Record<string,any[]>={
    customers:[customer,{id:otherId,company_name:"Andere klant"}],
    invoices:[invoice,{...invoice,id:otherId,customer_id:otherId,invoice_number:"PRIVATE-OTHER"}],
    invoice_items:[{invoice_id:invoiceId,position:1,description:"Website",quantity:1,unit_price_ex_vat:100,vat_rate:21,line_total_ex_vat:100,line_vat:21,line_total_incl_vat:121}],
    contracts:[{...contract,...(options.completed?{status:"COMPLETED",completed_at:"2026-09-16T12:00:00Z"}:{})},{...contract,id:otherId,customer_id:otherId,contract_number:"PRIVATE-OTHER"}],
    contract_signatures:options.completed?["VEDANTIX","CLIENT"].map(role=>({contract_id:contractId,signer_role:role,signer_name:role==="CLIENT"?"Voorbeeldklant":"Vedantix",signature_type:"TYPED",signature_data:"Voorbeeld",signed_at:"2026-09-16T12:00:00Z"})):[],
    contract_events:[],
  };
  return { auth:{getUser:async()=>({data:{user:options.auth===false?null:{id:"staff"}},error:null})},
    rpc:async()=>({data:options.staff!==false,error:null}),
    from(table:string){
      let rows=[...(tables[table]||[])],single=false;
      const q:any={select:()=>q,eq:(key:string,value:any)=>{rows=rows.filter(r=>r[key]===value);return q;},order:()=>q,limit:(n:number)=>{rows=rows.slice(0,n);return q;},maybeSingle:()=>{single=true;return q;},
        then:(resolve:any)=>Promise.resolve({data:single?rows[0]||null:rows,error:options.failItems&&table==="invoice_items"?{message:"unavailable"}:null}).then(resolve)};
      return q;
    }};
}
function post(body:any,auth=true){return new Request("https://edge.example/billing-documents",{method:"POST",headers:{"content-type":"application/json",...(auth?{authorization:"Bearer test-session"}:{})},body:JSON.stringify(body)});}
Deno.test("private downloads require a verified staff session",async()=>{
  let calls=0;
  const noauth=createDocumentsHandler(()=>{calls++;return client();});
  assert((await noauth(post({kind:"bundle",customer_id:customerId},false))).status===401);
  assert(calls===0);
  assert((await createDocumentsHandler(()=>client({auth:false}))(post({kind:"invoice",invoice_id:invoiceId}))).status===401);
  assert((await createDocumentsHandler(()=>client({staff:false}))(post({kind:"bundle",customer_id:customerId}))).status===403);
  assert((await noauth(new Request("https://edge.example?mode=contract"))).status===405);
  assert((await noauth(post({kind:"invoice",invoice_id:"../../other"}))).status===400);
  assert((await noauth(post({kind:"bundle",invoice_id:invoiceId,customer_id:otherId}))).status===400);
});
Deno.test("public terms are a real versioned PDF without staff data",async()=>{
  const handler=createDocumentsHandler(()=>{throw new Error("Public terms must not query private data");});
  const response=await handler(new Request("https://edge.example?mode=terms"));
  assert(response.status===200);
  assert(response.headers.get("content-disposition")?.includes(GENERAL_TERMS.version));
  const bytes=new Uint8Array(await response.arrayBuffer()),pdf=await PDFDocument.load(bytes);
  assert(pdf.getPageCount()>=2);assert(pdf.getTitle()?.includes("Algemene voorwaarden"));
  if(Deno.args.includes("--preview")){await Deno.mkdir("tmp/invoice-payment/documents",{recursive:true});await Deno.writeFile("tmp/invoice-payment/documents/voorwaarden.pdf",bytes);}
});
Deno.test("dossier ZIP includes only this customer's invoices, contracts and published terms",async()=>{
  const handler=createDocumentsHandler(()=>client());
  const response=await handler(post({kind:"bundle",customer_id:customerId}));
  assert(response.status===200);assert(response.headers.get("content-type")==="application/zip");
  const bytes=new Uint8Array(await response.arrayBuffer()),files=unzipSync(bytes),names=Object.keys(files);
  assert(names.length===4,"invoice, contract, terms and contents expected");
  assert(names.some(n=>n.includes("CONCEPT-CON-TEST-1001")));
  assert(!names.some(n=>n.includes("PRIVATE-OTHER")));
  assert(strFromU8(files["Inhoud.txt"]).includes("DRAFT"));
  for(const [name,data] of Object.entries(files))if(name.endsWith(".pdf"))assert((await PDFDocument.load(data)).getPageCount()>0);
  if(Deno.args.includes("--preview")){
    await Deno.mkdir("tmp/invoice-payment/documents",{recursive:true});
    await Deno.writeFile("tmp/invoice-payment/documents/dossier.zip",bytes);
    const draft=names.find(n=>n.includes("CONCEPT-CON-TEST-1001"))!;
    await Deno.writeFile("tmp/invoice-payment/documents/concept-contract.pdf",files[draft]);
  }
});
Deno.test("completed contracts include signatures and certificate; downloads never finalize a draft",async()=>{
  const handler=createDocumentsHandler(()=>client({completed:true}));
  const response=await handler(post({kind:"bundle",invoice_id:invoiceId}));
  const files=unzipSync(new Uint8Array(await response.arrayBuffer()));
  assert(Object.keys(files).some(n=>n.endsWith("-Ondertekenbewijs.pdf")));
  assert(!Object.keys(files).some(n=>n.includes("CONCEPT")));
});
Deno.test("failed document generation returns an error instead of an incomplete ZIP",async()=>{
  const response=await createDocumentsHandler(()=>client({failItems:true}))(post({kind:"bundle",customer_id:customerId}));
  assert(response.status===500);assert(response.headers.get("content-type")==="application/json");
});
