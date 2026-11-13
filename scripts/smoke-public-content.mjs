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
const pricing=await page("/prijzen/websites");
await page("/prijzen"); await page("/prijzen/software-op-maat"); await page("/prijzen/beheer-onderhoud");
for(const p of products.filter(p=>p.category==="WEBSITE")){
  assert(pricing.includes(money(p.price_ex_vat)),p.code+" excluding VAT missing from rendered page");
  assert(pricing.includes(money(p.price_incl_vat)),p.code+" including VAT missing from rendered page");
}
for(const [path,flag] of [["/","show_on_home"],["/resultaten","show_on_results"]]){
  const html=await page(path);
  for(const c of cases.filter(c=>c[flag])) assert(html.includes(c.name),path+" missing published case "+c.name);
}
console.log("Production public catalog amounts/VAT and published customer cases verified.");

const documentsEndpoint="https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/billing-documents";
const terms=await fetch(documentsEndpoint+"?mode=terms");
assert.equal(terms.status,200);
assert((terms.headers.get("content-type")||"").includes("application/pdf"));
assert((await terms.arrayBuffer()).byteLength>1000);
const denied=await fetch(documentsEndpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind:"bundle",customer_id:"00000000-0000-4000-8000-000000000001"})});
assert.equal(denied.status,401);
console.log("Live terms PDF and private document access denial verified.");


// Verify new public entry points and crawler-visible metadata before deployment promotion.
for (const [path,codes,quoteBased = false] of [
  ["/diensten",[]], ["/website-laten-maken",["STARTER","GROWTH","PRO"]],
  ["/ai-oplossingen",[],true], ["/webapps-klantportalen",[],true],
  ["/mobiele-apps",["MOBILE_APP"]], ["/koppelingen-automatisering",[],true],
]) {
  const response=await fetch(site+path,{cache:"no-store"}); assert.equal(response.status,200,path);
  const html=await response.text();
  assert(html.includes(`rel="canonical" href="https://vedantix.nl${path}"`),path+" SSR canonical missing");
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,path+" must contain one heading");
  const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert(schemas.some(s=>s["@type"]==="Organization"),path+" SSR business schema missing");
  if(codes.length || quoteBased) {
    assert(schemas.some(s=>s["@type"]==="Service"),path+" service schema missing");
    assert(schemas.some(s=>s["@type"]==="FAQPage"),path+" FAQ schema missing");
    const text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<[^>]+>/g,"").replace(/\s+/g," ");
    if (quoteBased) assert(text.includes("vast maandbedrag op offerte"), path + " quote pricing missing");
    for(const code of codes) { const p=products.find(p=>p.code===code); assert(p,code+" catalog entry missing"); assert(text.includes(money(p.price_ex_vat)),code+" current price missing"); assert(text.includes(money(p.price_incl_vat)),code+" VAT price missing"); }
  }
}
console.log("Service routes, exact catalog prices and SSR canonical/structured data verified.");
