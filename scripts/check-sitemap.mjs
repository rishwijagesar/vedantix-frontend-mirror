import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  industries,
  industryLocationPages,
  industryPages,
  localSeoCities,
} from "../src/data/seoData.js";

const xml = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
const paths = new Set(urls.map((url) => url.pathname));
const citySlugs = new Set(localSeoCities.map((city) => city.slug));

function assertSupportedIndustryPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "website") return false;
  assert.ok(
    segments.length === 2 || segments.length === 3,
    `Unsupported industry URL: ${pathname}`,
  );
  assert.ok(Object.hasOwn(industries, segments[1]), `Unknown industry: ${pathname}`);
  if (segments.length === 3) {
    assert.ok(citySlugs.has(segments[2]), `Unsupported city: ${pathname}`);
  }
  return true;
}

assert.ok(urls.length > 0, "The sitemap must contain public URLs");
for (const path of ["/software-op-maat", "/over-ons", "/diensten", "/website-laten-maken"]) {
  assert.ok(paths.has(path), `Public service page is missing: ${path}`);
}
assert.equal(paths.size, urls.length, "Sitemap URLs must be unique");
for (const url of urls) {
  assert.equal(url.origin, "https://vedantix.nl", "Only the canonical site belongs in its sitemap");
  assert.equal(url.search + url.hash, "", "Sitemap URLs cannot contain query strings or fragments");
  assert.doesNotMatch(url.pathname, /^\/(admin|login|klantenportaal|clientportal)(?:\/|$)/);

  assertSupportedIndustryPath(url.pathname);
}

for (const page of [...industryPages, ...industryLocationPages]) {
  assert.ok(paths.has(page.path), `A supported industry page is missing: ${page.path}`);
}

console.log(
  `Sitemap OK: ${urls.length} unique public URLs, including ${industryLocationPages.length} supported local pages.`,
);

// Supply a running dev/preview origin to exercise SSR status handling as well.
const origin = process.argv[2];
if (origin) {
  const legacyPages = [
    "/website-kapper",
    "/website-salon",
    "/website-klusbedrijf",
    "/website-restaurant",
    "/website-fotograaf",
    "/website-schoonmaakbedrijf",
  ];
  const probes = [
    ["/website/kapper", 200],
    ["/website/kapper/den-bosch", 200],
    ["/website/consultant/nijmegen", 200],
    ["/website/kapper/amsterdam", 404],
    ["/website/kapper/niet-bestaande-stad", 404],
    ["/website/niet-bestaande-branche", 404],
    ["/website/niet-bestaande-branche/den-bosch", 404],
    ["/website/__proto__/den-bosch", 404],
    ...legacyPages.map((path) => [path, 200]),
  ];
  for (const [path, status] of probes) {
    const response = await fetch(new URL(path, origin), {
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, status, `${path} must return HTTP ${status}`);
    const html = await response.text();
    const robotTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
      .map(([tag]) => tag)
      .filter((tag) => /\bname=["']robots["']/i.test(tag));
    const noindex = robotTags.some((tag) => /noindex/i.test(tag));
    assert.equal(noindex, status === 404, `${path} has the wrong indexing directive`);
    assert.equal(robotTags.length, 1, `${path} must have one unambiguous robots directive`);
    if (status === 404) {
      assert.match(html, /<title>Pagina niet gevonden \| Vedantix<\/title>/);
    }
    if (legacyPages.includes(path)) {
      const links = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)];
      let industryLinks = 0;
      for (const [, href] of links) {
        const url = new URL(href, "https://vedantix.nl");
        if (url.origin === "https://vedantix.nl" && assertSupportedIndustryPath(url.pathname)) {
          industryLinks++;
        }
      }
      assert.ok(industryLinks > 0, `${path} must render its related industry pages`);
    }
    console.log(`SSR OK: ${status} ${path}`);
  }
}
