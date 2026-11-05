export function publicHead(title, description, path, { noindex = false, type = "website" } = {}) {
  const url = `https://vedantix.nl${path}`;
  return { meta: [
    { title }, { name: "description", content: description },
    ...(noindex ? [{ name: "robots", content: "noindex, nofollow, noarchive" }] : []),
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:url", content: url }, { property: "og:type", content: type },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title }, { name: "twitter:description", content: description },
  ] };
}
