import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Catch-all that reproduces the legacy redirect table from the previous
 * src/App.jsx: capitalised legacy URLs, removed admin/CRM/portal paths and the
 * final wildcard all end up on their canonical public counterpart.
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
};

export const Route = createFileRoute("/$")({
  beforeLoad: ({ params }) => {
    const raw = `/${(params._splat ?? "").replace(/\/+$/, "")}`;
    const key = raw.toLowerCase();

    if (key === "/pakketvergelijking") {
      throw redirect({ to: "/prijzen", hash: "vergelijk", replace: true });
    }

    const target = LEGACY_REDIRECTS[key];
    throw redirect({ to: target ?? "/", replace: true });
  },
});
