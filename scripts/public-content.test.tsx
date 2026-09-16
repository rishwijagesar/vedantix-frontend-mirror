import { afterEach, describe, expect, mock, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fetchPublicCatalog, fetchPublicCases, safeLogoUrl, safeWebsiteUrl } from "../src/lib/public-content";

mock.module("../src/components/SEO", () => ({ default: () => null }));
mock.module("../src/components/NavBar", () => ({ default: () => null }));
mock.module("../src/lib/router-compat", () => ({ Link: ({to, children, ...props}: any) => <a href={to} {...props}>{children}</a> }));
const { default: Prijzen } = await import("../src/pages/Prijzen");
const { default: ClientCasesSection } = await import("../src/components/home/ClientCasesSection");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const product = { code:"STARTER", name:"Starter", description:"Website", category:"WEBSITE", billing_type:"ONE_TIME", price_ex_vat:499, price_incl_vat:603.79, vat_rate:21, sort_order:10, from_price:false, duration_years:null };

describe("Live public content", () => {
  test("reads current catalog on every request without a cached fixed price", async () => {
    let price=499;
    const requests: RequestInit[] = [];
    globalThis.fetch = mock(async (_url: any, options: any) => { requests.push(options); return Response.json([{...product,price_ex_vat:price}]); }) as any;
    expect((await fetchPublicCatalog())[0].price_ex_vat).toBe(499);
    price=512.34;
    expect((await fetchPublicCatalog())[0].price_ex_vat).toBe(512.34);
    expect(requests.every(r=>r.cache==="no-store")).toBe(true);
  });
  test("all visible website amounts and FAQ follow the supplied catalog with exact VAT", () => {
    const current = renderToStaticMarkup(<Prijzen initialProducts={[product]}/>);
    expect(current).toContain("499");
    expect(current).toContain("603,79");
    expect(current).not.toContain("399");
    const changed = renderToStaticMarkup(<Prijzen initialProducts={[{...product,price_ex_vat:512.34,price_incl_vat:619.93}]}/>);
    expect(changed).toContain("512,34");
    expect(changed).toContain("619,93");
    expect(changed).not.toContain("603,79");
    expect(changed).not.toContain("499");
    expect(changed).toContain("excl. btw");
  });
  test("an unavailable catalog never falls back to a stale advertised price", async () => {
    globalThis.fetch = mock(async()=>new Response("",{status:503})) as any;
    await expect(fetchPublicCatalog()).rejects.toThrow();
    const html=renderToStaticMarkup(<Prijzen initialProducts={[]}/>);
    expect(html).not.toContain("399");
    expect(html).not.toContain("499");
    expect(html).not.toContain('class="pricing-package-card');
  });
  test("case placements, edits and removal are reflected without a static fallback", () => {
    const a={id:"a",name:"Nieuwe klant",website:"https://voorbeeld.nl",logo:null,branch:"Horeca",status:"Live",summary:"Nieuwe opdracht",outcome:"",show_on_home:true,show_on_results:false};
    const b={...a,id:"b",name:"Alleen resultaten",show_on_home:false,show_on_results:true};
    const home=renderToStaticMarkup(<ClientCasesSection initialCases={[a,b]}/>);
    expect(home).toContain("Nieuwe klant"); expect(home).not.toContain("Alleen resultaten");
    const results=renderToStaticMarkup(<ClientCasesSection initialCases={[a,b]} placement="results"/>);
    expect(results).toContain("Alleen resultaten"); expect(results).not.toContain("Nieuwe klant");
    expect(renderToStaticMarkup(<ClientCasesSection initialCases={[]}/>)).toBe("");
    const escaped=renderToStaticMarkup(<ClientCasesSection initialCases={[{...a,name:'<script>alert(1)</script>',website:'javascript:alert(1)'}]}/>);
    expect(escaped).not.toContain("<script>"); expect(escaped).not.toContain("javascript:");
  });
  test("invalid content responses and unsafe links are rejected", async () => {
    globalThis.fetch=mock(async()=>Response.json({error:"bad"})) as any;
    await expect(fetchPublicCases()).rejects.toThrow();
    expect(safeWebsiteUrl("javascript:alert(1)")).toBeNull();
    expect(safeWebsiteUrl("https://user:pass@example.com")).toBeNull();
    expect(safeLogoUrl("data:image/svg+xml,<svg/>")).toBeNull();
    expect(safeLogoUrl("/logos/horeca-topper.svg")).toBe("/logos/horeca-topper.svg");
  });
});
