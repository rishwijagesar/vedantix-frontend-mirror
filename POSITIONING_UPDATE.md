# Vedantix positioning update

## Result

Software-first positioning for SMEs and independent professionals across all sectors, retaining the existing visual theme. New substantive `/software-op-maat` and `/over-ons` pages; homepage, shared menu/footer, services, methodology, audience, FAQ, contact and price framing updated. Custom software is quotation-based with startup plus a fixed monthly amount for agreed scope. Website catalog prices, cases and API sources retained, not reseeded or changed.

Named external tools are potential connections to investigate, not partnerships or delivered integrations. Security, acceptance, management, usage, expansion, external subscriptions and handover/export are framed as project-specific agreements.

## Checks

- Automatic harness: latest build/typecheck entry `build OK`.
- `bun test scripts/public-content.test.tsx scripts/website-enquiry.test.ts`: 9 passed, 0 failed.
- Sitemap validator: canonical URL uniqueness and supported industry URLs passed; 404 handling and legacy public routes passed. Existing authored lastmod values preserved because their provenance is unknown; no generation/build-date fallback added.
- 28 public pages checked via SSR: HTTP 200, one H1, descriptions and OG/Twitter. Canonicals checked; the three pages initially missing them were subsequently corrected and checked separately.
- Desktop 1440x1000 and mobile 390x844: home, software, about, contact, pricing and services checked; no horizontal overflow, one H1. Screenshots inspected.
- Business-scan CTA navigated to `/contact#contact-form` on both sizes; mobile menu and software link worked.
- Contact form filled and submitted: visible email-draft handoff confirmed. Legacy website form and complete starters configurator also tested to email-draft confirmation with no runtime exceptions.
- 33 internal links and their anchors checked: no issues.
- `/foo/bar/baz` redirects to `/`; `/pakketvergelijking` redirects to `/prijzen#vergelijk`; unknown single preview slug remains on its own URL.
- Existing pricing page rendered three website cards from the live catalog; Online Growth Audit rendered its existing form. Audit execution was not submitted.

## Limitations and preserved boundaries

- Forms prepare an email draft; they do not send email automatically. Actual delivery requires the visitor's email application. No email delivery was claimed or tested.
- Existing live catalog currently rendered Starter €499 excl. VAT (€603.79 incl.), Growth €799 excl. (€966.79 incl.), Pro €1499 excl. (€1813.79 incl.) and hosting €30 excl. VAT/year. These were already supplied by the current catalog and were deliberately NOT changed to earlier historical prices.
- No software case, review, certification or business statistic invented. Existing case source retained; outcomes and reviews remain the existing website material.
- No admin, auth, database, billing, monitoring backend, DNS, hosting infrastructure or publication changed.
- A pre-existing analytics bootstrap hydration-attribute warning was observed during isolated browser debugging; no runtime exception occurred. Third-party tracking delivery and external tool integrations were not tested.
- No SEO ranking or AI discovery guarantee. Live URL and search previews update only after your next publication.
- Mobile/desktop review covered the six key screens listed, not every long-page section or every industry/blog variant. Existing redirects and industry validation were retained.

## Changed files

- `AGENTS.md`
- `public/.well-known/llms.txt`
- `public/llms-full.txt`
- `public/llms.txt`
- `public/robots.txt`
- `public/sitemap.xml`
- `roadmap.md`
- `scripts/check-sitemap.mjs`
- `scripts/public-content.test.tsx`
- `scripts/website-enquiry.test.ts`
- `src/components/BigFooter.jsx`
- `src/components/NavBar.jsx`
- `src/components/SEO.jsx`
- `src/data/positioning.js`
- `src/data/services.js`
- `src/lib/blog-seo.js`
- `src/lib/industry-seo.js`
- `src/lib/public-head.js`
- `src/lib/website-enquiry.js`
- `src/pages/AiVindbaarheid.jsx`
- `src/pages/Contact.jsx`
- `src/pages/Diensten.jsx`
- `src/pages/FAQ.jsx`
- `src/pages/Groeimodel.jsx`
- `src/pages/Home.jsx`
- `src/pages/HomeFounderSection.jsx`
- `src/pages/HomeHero.jsx`
- `src/pages/Prijzen.jsx`
- `src/pages/Proces.jsx`
- `src/pages/ServiceDetail.jsx`
- `src/pages/Starters.jsx`
- `src/pages/VedantixHome.jsx`
- `src/pages/VoorWie.jsx`
- `src/routes/$.tsx`
- `src/routes/ai-oplossingen.tsx`
- `src/routes/ai-vindbaarheid.tsx`
- `src/routes/betaling/resultaat/$token.tsx`
- `src/routes/blog/index.tsx`
- `src/routes/contact.tsx`
- `src/routes/contract/$token.tsx`
- `src/routes/data-deletion.tsx`
- `src/routes/factuur/$token.tsx`
- `src/routes/faq.tsx`
- `src/routes/groeimodel.tsx`
- `src/routes/index.tsx`
- `src/routes/koppelingen-automatisering.tsx`
- `src/routes/mobiele-apps.tsx`
- `src/routes/offerte/$token.tsx`
- `src/routes/online-groei-audit.tsx`
- `src/routes/over-ons.tsx`
- `src/routes/planning.tsx`
- `src/routes/preview/$token.tsx`
- `src/routes/prijzen.tsx`
- `src/routes/privacy.tsx`
- `src/routes/proces.tsx`
- `src/routes/resultaten.tsx`
- `src/routes/software-op-maat.tsx`
- `src/routes/starters.tsx`
- `src/routes/templates.tsx`
- `src/routes/terms.tsx`
- `src/routes/vedantixhome.tsx`
- `src/routes/voorwie.tsx`
- `src/routes/webapps-klantportalen.tsx`
- `src/routes/website-fotograaf.tsx`
- `src/routes/website-kapper.tsx`
- `src/routes/website-klusbedrijf.tsx`
- `src/routes/website-laten-maken.tsx`
- `src/routes/website-restaurant.tsx`
- `src/routes/website-salon.tsx`
- `src/routes/website-schoonmaakbedrijf.tsx`
- `src/routes/website-zzp.tsx`
- `src/styles/navbar.css`
- `src/utils/schema.js`
