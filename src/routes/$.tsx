import { createFileRoute, redirect } from "@tanstack/react-router";
import { publicHead } from "@/lib/public-head";
import CustomerPreviewPage from "@/pages/CustomerPreviewPage";

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

  // Retired Base44/auth/backoffice routes from the legacy SPA must continue
  // to resolve to the public homepage instead of being treated as preview slugs.
  "/login": "/",
  "/klantenportaal": "/",
  "/clientportal": "/",
  "/crm": "/",
  "/admin": "/",
};

export const Route = createFileRoute("/$")({
  head: () => publicHead("Klantpreview | Vedantix", "Tijdelijke klantpreview van Vedantix.", "/", { noindex: true }),
  beforeLoad: ({ params }) => {
    const splat = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
    const raw = `/${splat}`;
    const key = raw.toLowerCase();

    if (key === "/pakketvergelijking") {
      throw redirect({ to: "/prijzen", hash: "vergelijk", replace: true });
    }

    const target = LEGACY_REDIRECTS[key];
    if (target) {
      throw redirect({ to: target, replace: true });
    }

    // Exactly one unknown segment is treated as a public customer preview slug
    // (legacy `/:previewSlug` route). Anything deeper keeps the old wildcard
    // behaviour and redirects home.
    if (splat && !splat.includes("/")) {
      return { previewSlug: splat };
    }

    throw redirect({ to: "/", replace: true });
  },
  component: CustomerPreviewRoute,
});

function CustomerPreviewRoute() {
  const { previewSlug } = Route.useRouteContext();
  return <CustomerPreviewPage slug={previewSlug} />;
}
