// Fixed Meta host and allowlisted script paths; this is not an arbitrary URL proxy.
export async function metaPixelProxy(request) {
  if (request.method !== "GET")
    return new Response(null, { status: 405, headers: { Allow: "GET" } });
  const url = new URL(request.url);
  const path = url.pathname.slice("/integrations/meta-pixel".length);
  if (!/^\/(?:en_US\/fbevents\.js|signals\/config\/\d+)$/.test(path))
    return new Response(null, { status: 404 });
  const upstream = new URL(path, "https://connect.facebook.net");
  upstream.search = url.search;
  try {
    const response = await fetch(upstream, {
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return new Response(null, { status: 502 });
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": path.endsWith("fbevents.js")
          ? "public, max-age=300, s-maxage=300"
          : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
