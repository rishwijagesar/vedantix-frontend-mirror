// Google toont ongeveer 155-160 tekens; langer wordt midden in een woord afgekapt.
export function clampDescription(text, max = 158) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.-]+$/, "")}…`;
}

export function publicHead(title, rawDescription, path, { noindex = false, type = "website" } = {}) {
  const description = clampDescription(rawDescription);
  const url = `https://vedantix.nl${path}`;
  return { meta: [
    { title }, { name: "description", content: description },
    ...(noindex ? [{ name: "robots", content: "noindex, nofollow, noarchive" }] : []),
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:url", content: url }, { property: "og:type", content: type },
    { property: "og:image", content: "https://vedantix.nl/images/og-vedantix.png" },
    { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Vedantix: software op maat voor het mkb in heel Nederland" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "https://vedantix.nl/images/og-vedantix.png" },
    { name: "twitter:title", content: title }, { name: "twitter:description", content: description },
  ] };
}
