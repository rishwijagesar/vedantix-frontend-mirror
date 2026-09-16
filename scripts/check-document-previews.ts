import { GENERAL_TERMS } from "../supabase/functions/_shared/general-terms";
const normalize=(s:string)=>s.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,"-").replace(/\s+/g," ").trim();
const terms=normalize(await Bun.file("tmp/invoice-payment/documents/voorwaarden.txt").text());
for(const section of GENERAL_TERMS.sections){
  if(!terms.includes(normalize(section.title)))throw new Error("Missing heading: "+section.title);
  for(const block of section.blocks)if(!terms.includes(normalize(block.text)))throw new Error("Missing terms text: "+block.text.slice(0,70));
}
const contract=await Bun.file("tmp/invoice-payment/documents/concept-contract.txt").text();
if(!contract.includes("CONCEPT - NIET ONDERTEKEND")||!contract.includes("Ontwerp voor Voorbeeldklant."))throw new Error("Draft marking or substituted contract content missing");
console.log("Every published terms paragraph and draft contract marking verified in rendered PDFs.");
