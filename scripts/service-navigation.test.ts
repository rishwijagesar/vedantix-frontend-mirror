import { expect, test } from "bun:test";
import { SERVICE_GROUPS } from "../src/data/service-navigation";
import { ADDITIONAL_SERVICES } from "../src/data/additional-services";

test("all eleven offered services resolve to their real destination", () => {
  expect(SERVICE_GROUPS.map(group => group.items.map(item => item.href))).toEqual([
    ["/website-laten-maken", "/prijzen/beheer-onderhoud#hosting", "/onderhoud-support"],
    ["/software-op-maat", "/webapps-klantportalen", "/mobiele-apps", "/ai-oplossingen", "/koppelingen-automatisering"],
    ["/ai-vindbaarheid", "/online-marketing", "/ai-marketing"],
  ]);
});
test("new quotation services do not define generic prices or overwrite website catalog codes", () => {
  expect(ADDITIONAL_SERVICES.map(service => service.slug)).toEqual(["online-marketing", "ai-marketing", "onderhoud-support"]);
  for (const service of ADDITIONAL_SERVICES) {
    expect(Object.hasOwn(service, "price")).toBe(false);
    expect(Object.hasOwn(service, "codes")).toBe(false);
  }
});test("price submenu points to the overview and the three pricing pages", async () => {
  const { PRICE_LINKS } = await import("../src/data/service-navigation");
  expect(PRICE_LINKS.map(link => link.href)).toEqual(["/prijzen", "/prijzen/websites", "/prijzen/software-op-maat", "/prijzen/beheer-onderhoud"]);
});
