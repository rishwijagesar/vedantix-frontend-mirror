import { afterEach, describe, expect, mock, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fetchPublicCatalog, fetchPublicCases, safeLogoUrl, safeWebsiteUrl } from "../src/lib/public-content";

mock.module("../src/components/SEO", () => ({ default: () => null }));
mock.module("../src/components/NavBar", () => ({ default: () => null }));
mock.module("../src/lib/router-compat", () => ({ Link: ({to, children, ...props}: any) => <a href={to} {...props}>{children}</a> }));
const { default: Prijzen } = await import("../src/pages/Prijzen");
const { default: ClientCasesSection } = await import("../src/components/home/ClientCasesSection");
const { default: ServiceDetail } = await import("../src/pages/ServiceDetail");
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
    const current = renderToStaticMarkup(<Prijzen initialProducts={[product]} view="websites"/>);
    expect(current).toContain("499");
    expect(current).toContain("603,79");
    expect(current).not.toContain("399");
    const changed = renderToStaticMarkup(<Prijzen initialProducts={[{...product,price_ex_vat:512.34,price_incl_vat:619.93}]} view="websites"/>);
    expect(changed).toContain("512,34");
    expect(changed).toContain("619,93");
    expect(changed).not.toContain("603,79");
    expect(changed).not.toContain("499");
    expect(changed).toContain("excl. btw");
  });
  test("an unavailable catalog never falls back to a stale advertised price", async () => {
    globalThis.fetch = mock(async()=>new Response("",{status:503})) as any;
    await expect(fetchPublicCatalog()).rejects.toThrow();
    const html=renderToStaticMarkup(<Prijzen initialProducts={[]} view="websites"/>);
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



describe("Service expansion uses the current catalog", () => {
  const ai = { ...product, code:"AI_AUTOMATION", name:"AI-automatisering", category:"AI", price_ex_vat:1001.23, price_incl_vat:1211.49, from_price:true };
  test("catalog keeps live AI prices while custom software details do not advertise a generic project amount", () => {
    const pricing=renderToStaticMarkup(<Prijzen initialProducts={[product,ai]} view="software"/>);
    const detail=renderToStaticMarkup(<ServiceDetail slug="ai-oplossingen" initialProducts={[product,ai]}/>);
    expect(pricing).toContain("1.001,23"); expect(pricing).toContain("1.211,49");
    expect(detail).not.toContain("1.001,23"); expect(detail).not.toContain("1.211,49");
    expect(detail).not.toContain("603,79");
    const changed=renderToStaticMarkup(<ServiceDetail slug="ai-oplossingen" initialProducts={[{...ai,price_ex_vat:1111.11,price_incl_vat:1344.44}]}/>);
    expect(changed).not.toContain("1.111,11"); expect(changed).not.toContain("1.344,44"); expect(changed).not.toContain("1.001,23");
  });
  test("an unavailable service price leaves useful content and an enquiry path without inventing an amount", () => {
    const html=renderToStaticMarkup(<ServiceDetail slug="mobiele-apps" initialProducts={[]}/>);
    expect(html).toContain("De actuele prijs is op aanvraag");
    expect(html).toContain("href=\"/contact\"");
    expect(html).not.toContain('class="service-price"');
    expect(html).toContain("Veelgestelde vragen");
  });
  test("generic recurring care does not establish a mandatory software subscription price", () => {
    const care={...ai,code:"TECH_CARE",name:"Technisch Beheer Basis",category:"CARE",billing_type:"MONTHLY",from_price:false};
    const html=renderToStaticMarkup(<ServiceDetail slug="koppelingen-automatisering" initialProducts={[care,ai]}/>);
    expect(html).not.toContain("1.001,23"); expect(html).not.toContain("1.211,49");
    expect(html).not.toContain("<h3>AI-automatisering</h3>");
  });
});

describe("Pricing pages are split by audience", () => {
  const plan = { ...product, code:"STARTER_PLAN", name:"Starter abonnement", category:"WEBSITE_PLAN", billing_type:"MONTHLY", price_ex_vat:39, price_incl_vat:47.19, base_package:"STARTER", setup_fee:149, min_term_months:12, included_hours:0.5 };
  const hosting = { ...product, code:"HOSTING_YEAR", name:"Web Hosting", category:"HOSTING", billing_type:"ONE_TIME", price_ex_vat:60, price_incl_vat:72.6, duration_years:"1" };
  test("websites page offers a subscription next to the one-time price, from the catalog", () => {
    const html = renderToStaticMarkup(<Prijzen initialProducts={[product, plan]} view="websites"/>);
    expect(html).toContain("603,79");
    expect(html).toContain("Per maand");
    expect(html).toContain("149");
    expect(html).toContain("12 maanden");
    expect(html).not.toContain("Starter abonnement</h3>");
  });
  test("without subscription products the toggle is hidden", () => {
    const html = renderToStaticMarkup(<Prijzen initialProducts={[product]} view="websites"/>);
    expect(html).not.toContain("pricing-billing-toggle");
  });
  test("hosting lives on the maintenance page, not on the websites page", () => {
    expect(renderToStaticMarkup(<Prijzen initialProducts={[product, hosting]} view="beheer"/>)).toContain("72,60");
    expect(renderToStaticMarkup(<Prijzen initialProducts={[product, hosting]} view="websites"/>)).not.toContain("72,60");
  });
  test("overview links to the three pricing pages", () => {
    const html = renderToStaticMarkup(<Prijzen initialProducts={[product, plan]}/>);
    for (const path of ["/prijzen/websites", "/prijzen/software-op-maat", "/prijzen/beheer-onderhoud"]) expect(html).toContain(`href="${path}"`);
  });
});
