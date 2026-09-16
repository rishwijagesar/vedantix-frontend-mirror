import assert from "node:assert/strict";
const site=(process.argv[2] || "https://vedantix.nl").replace(/\/$/,"");
const api="https://zxnexwqvoznmirajhgxj.supabase.co/rest/v1/rpc/";
const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!key) throw new Error("SUPABASE_PUBLISHABLE_KEY is required");
async function rpc(name) {
  const r=await fetch(api+name,{method:"POST",headers:{apikey:key,"content-type":"application/json"},body:"{}",cache:"no-store"});
  assert.equal(r.status,200,name); const data=await r.json(); assert(Array.isArray(data)); return data;
}
async function page(path) {
  const r=await fetch(site+path,{cache:"no-store"}); assert.equal(r.status,200,path);
  return (await r.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<[^>]+>/g,"").replaceAll("&amp;","&").replaceAll("&#x27;","'").replaceAll("&quot;",'"').replaceAll("&lt;","<").replaceAll("&gt;",">").replace(/\s+/g," ");
}
const [products,cases]=await Promise.all([rpc("get_public_catalog"),rpc("get_public_client_cases")]);
const money=n=>new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:2}).format(n).replace(/\s+/g," ");
const pricing=await page("/prijzen");
for(const p of products.filter(p=>p.category==="WEBSITE")){
  assert(pricing.includes(money(p.price_ex_vat)),p.code+" excluding VAT missing from rendered page");
  assert(pricing.includes(money(p.price_incl_vat)),p.code+" including VAT missing from rendered page");
}
for(const [path,flag] of [["/","show_on_home"],["/resultaten","show_on_results"]]){
  const html=await page(path);
  for(const c of cases.filter(c=>c[flag])) assert(html.includes(c.name),path+" missing published case "+c.name);
}
console.log("Production public catalog amounts/VAT and published customer cases verified.");
