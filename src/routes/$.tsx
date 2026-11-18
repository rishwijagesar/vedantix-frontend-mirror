import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

/**
 * Catch-all that reproduces the legacy redirect table from the previous
 * src/App.jsx: capitalised legacy URLs, removed admin/CRM/portal paths and the
 * final wildcard all end up on their canonical public counterpart.
 * Every other unknown URL is a real 404 (root notFoundComponent, noindex). The
 * old one-segment customer-preview slugs were retired; previews live at /preview/$token.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  "/home": "/",
  "/planning": "/planning",
  "/prijzen": "/prijzen",
  "/privacy": "/privacy",
  "/groeimodel": "/groeimodel",
  "/proces": "/proces",
  "/starters": "/starters",
  "/templates": "/templates",
  "/vedantixhome": "/vedantixhome",
  "/voorwie": "/voorwie",
  "/voorwaarden": "/terms",
  "/terms": "/terms",
  "/datadeletion": "/data-deletion",
  "/data-deletion": "/data-deletion",
  "/faq": "/faq",
  "/contact": "/contact",
  "/resultaten": "/resultaten",
  "/blog": "/blog",
  "/pakketvergelijking": "/prijzen",
  "/online-groei-audit": "/online-groei-audit",
  "/ai-vindbaarheid": "/ai-vindbaarheid",

  // Retired Base44/auth/backoffice routes from the legacy SPA must continue
  // to resolve to the public homepage instead of being treated as preview slugs.
  "/login": "/",
  "/klantenportaal": "/",
  "/clientportal": "/",
  "/crm": "/",
  "/admin": "/",
};

export const Route = createFileRoute("/$")({
  beforeLoad: ({ params }) => {
    const splat = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
    const key = `/${splat}`.toLowerCase();

    if (key === "/pakketvergelijking") {
      throw redirect({ to: "/prijzen", hash: "vergelijk", replace: true });
    }

    const target = LEGACY_REDIRECTS[key];
    if (target) {
      throw redirect({ to: target, replace: true });
    }

    throw notFound();
  },
  component: () => null,
});
