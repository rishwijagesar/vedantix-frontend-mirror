import { analyticsWorkerSnippet, pixelWorkerBootstrap } from "../lib/partytown-config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Suspense, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import MetaPixel from "@/components/MetaPixel";
import CookieConsent from "@/components/CookieConsent";
import WebsiteAnalytics from "@/components/WebsiteAnalytics";
import BigFooter from "@/components/BigFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina niet gevonden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Naar de homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ match, matches }) => {
    // The current match includes the finalized not-found boundary; matches can
    // still contain its earlier snapshot after a child beforeLoad rejects.
    const isNotFound =
      match.globalNotFound ||
      match.status === "notFound" ||
      matches.some((item) => item.status === "notFound" || item.globalNotFound);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        {
          title: isNotFound
            ? "Pagina niet gevonden | Vedantix"
            : "Vedantix | Software op maat, websites en hosting",
        },
        {
          name: "description",
          content:
            "Bedrijfssoftware op maat, websites en hosting voor het mkb en zelfstandigen. Vanuit Den Bosch, voor heel Nederland.",
        },
        {
          name: "robots",
          content: isNotFound
            ? "noindex, nofollow, noarchive"
            : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
        },
        { name: "author", content: "Vedantix" },
        {
          property: "og:title",
          content: "Vedantix | Software op maat, websites en hosting",
        },
        {
          property: "og:description",
          content:
            "Bedrijfssoftware op maat, websites en hosting voor het mkb en zelfstandigen. Vanuit Den Bosch, voor heel Nederland.",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Vedantix" },
        { property: "og:locale", content: "nl_NL" },
        { property: "og:image", content: "https://vedantix.nl/images/og-vedantix.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Vedantix: software op maat voor het mkb, vanuit Den Bosch" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: "https://vedantix.nl/images/og-vedantix.png" },
        { name: "theme-color", content: "#0a1428" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
        { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "sitemap", href: "/sitemap.xml", type: "application/xml" },
        {
          rel: "alternate",
          type: "text/plain",
          href: "/llms.txt",
          title: "Vedantix information for AI systems",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: analyticsWorkerSnippet }} />
        <script
          type="text/partytown"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: pixelWorkerBootstrap }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <QueryClientProvider client={queryClient}>
      {!isAdmin ? <MetaPixel /> : null}
      {!isAdmin ? <WebsiteAnalytics /> : null}
      {!isAdmin ? <CookieConsent /> : null}
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      {!isAdmin ? (
        <Suspense fallback={null}>
          <BigFooter />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
