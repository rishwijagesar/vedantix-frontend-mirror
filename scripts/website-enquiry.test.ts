import { expect, test } from "bun:test";
import { websiteEnquiryUrl } from "../src/lib/website-enquiry";

test("website enquiry preserves recipient and supplied name, email, package and message in email handoff", () => {
  const url = new URL(websiteEnquiryUrl("Websiteaanvraag Vedantix", { Naam: "Test & bedrijf", Email: "controle@example.com", Pakket: "Growth", Bericht: "Planning bespreken\nGeen direct akkoord" }));
  expect(url.pathname).toBe("info@vedantix.nl");
  expect(url.searchParams.get("subject")).toBe("Websiteaanvraag Vedantix");
  expect(url.searchParams.get("body")).toBe("Naam: Test & bedrijf\nEmail: controle@example.com\nPakket: Growth\nBericht: Planning bespreken\nGeen direct akkoord");
});