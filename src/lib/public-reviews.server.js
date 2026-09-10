import snapshot from "../data/google-reviews.json" with { type: "json" };

const WIDGET_ID = "019e92edd9f87a41aae99010d53be8d25324";
const FEED = `https://www.jotform.com/website-widgets/embed/${WIDGET_ID}`;
let cached = snapshot;
let expires = 0;
let pending;

function safeUrl(value, hosts) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !hosts.includes(url.hostname))
    throw new Error("Unexpected review URL");
  return url.href;
}

// Parse the provider's JSON string as data. Never execute its JavaScript.
export function parseReviews(source) {
  if (source.length > 500_000) throw new Error("Review feed too large");
  const literal = source.match(/const widgetData = '((?:\\.|[^'\\])*)';/);
  if (!literal) throw new Error("Review feed format changed");
  const widget = JSON.parse(
    JSON.parse('"' + literal[1].replace(/\\'/g, "'") + '"'),
  );
  if (widget.widget?.id !== WIDGET_ID) throw new Error("Wrong review widget");
  const fields = {};
  const walk = (items) => {
    for (const f of items) {
      fields[f.name] = f.value;
      if (f.fields) walk(f.fields);
    }
  };
  for (const group of widget.schema) walk(group.fields);
  const data = JSON.parse(fields.review_data);
  if (
    !data.success ||
    data.businessName !== "Vedantix" ||
    !Array.isArray(data.reviews) ||
    !Number.isFinite(data.overallRating) ||
    data.overallRating < 0 ||
    data.overallRating > 5 ||
    !Number.isInteger(data.totalReviews) ||
    data.totalReviews < 0
  )
    throw new Error("Invalid review data");
  const reviews = data.reviews.slice(0, 100).map((review) => {
    if (
      typeof review.name !== "string" ||
      typeof review.text !== "string" ||
      !Number.isFinite(review.rating) ||
      review.rating < 0 ||
      review.rating > 5 ||
      !/^\d{4}-\d{2}-\d{2}/.test(review.published) ||
      !Number.isFinite(Date.parse(review.published.slice(0, 10)))
    )
      throw new Error("Invalid review");
    return {
      ...review,
      url: safeUrl(review.url, ["www.google.com", "google.com"]),
      photo: review.photo
        ? safeUrl(review.photo, [
            "lh3.googleusercontent.com",
            "lh4.googleusercontent.com",
            "lh5.googleusercontent.com",
            "lh6.googleusercontent.com",
          ])
        : "",
    };
  });
  const minimumRating = Number(fields.minimum_rating);
  if (!Number.isFinite(minimumRating) || minimumRating < 0 || minimumRating > 5)
    throw new Error("Invalid rating filter");
  return {
    businessName: data.businessName,
    overallRating: data.overallRating,
    totalReviews: data.totalReviews,
    reviews,
    shareFeedbackUrl: safeUrl(data.shareFeedbackUrl, [
      "search.google.com",
      "www.google.com",
    ]),
    headerTitle: String(fields.header_title || snapshot.headerTitle),
    buttonText: String(fields.button_text || snapshot.buttonText),
    minimumRating,
  };
}

export async function publicReviews(request) {
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  if (Date.now() >= expires) {
    pending ??= (async () => {
      try {
        const response = await fetch(FEED, {
          signal: AbortSignal.timeout(4000),
          redirect: "error",
        });
        if (!response.ok)
          throw new Error(`Review provider HTTP ${response.status}`);
        cached = parseReviews(await response.text());
        expires = Date.now() + 60 * 60 * 1000;
      } catch {
        expires = Date.now() + 5 * 60 * 1000;
      } finally {
        pending = undefined;
      }
    })();
    await pending;
  }
  return new Response(
    request.method === "HEAD" ? null : JSON.stringify(cached),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control":
          "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
