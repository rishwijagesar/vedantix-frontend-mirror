import { industries, localSeoCities, indexableCitySlugs } from "../data/seoData";
import {
  createBreadcrumbSchema,
  createFAQSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createServiceSchema,
  createWebSiteSchema,
} from "../utils/schema";

const SITE_URL = "https://vedantix.nl";
const INDEX_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
// Local pages without unique local content stay reachable for visitors, but are kept out of the index.
const NOINDEX_ROBOTS = "noindex, follow";

function cityForSlug(slug) {
  return slug ? localSeoCities.find((city) => city.slug === slug) : null;
}

export function getIndustrySeo(branche, stad) {
  const industry = industries[branche];
  const city = cityForSlug(stad);

  if (!industry || (stad && !city)) return null;

  const isCityPage = Boolean(city);
  const path = isCityPage
    ? `/website/${industry.key}/${city.slug}`
    : industry.path;
  const canonical = `${SITE_URL}${path}`;
  const heroTitle = isCityPage
    ? industry.cityHeroTitle(city.name)
    : industry.heroTitle;
  const seoTitle = isCityPage
    ? industry.cityMetaTitle(city.name)
    : industry.metaTitle;
  const seoDescription = isCityPage
    ? industry.cityMetaDescription(city.name)
    : industry.metaDescription;

  const serviceSchema = createServiceSchema({
    name: heroTitle,
    slug: path.replace(/^\//, ""),
    description: seoDescription,
    audienceType: industry.label,
    serviceType: `Website, SEO en online groei voor ${industry.label}`,
    areaServed: city?.name || "Nederland",
  });
  const faqSchema = createFAQSchema(industry.faqs);
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Branches", url: `${SITE_URL}/voorwie` },
    { name: industry.label, url: `${SITE_URL}${industry.path}` },
    ...(isCityPage ? [{ name: city.name, url: canonical }] : []),
  ]);

  const indexable = !isCityPage || indexableCitySlugs.includes(city.slug);

  return {
    canonical,
    indexable,
    seoTitle,
    seoDescription,
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebSiteSchema(),
      serviceSchema,
      faqSchema,
      breadcrumbSchema,
    ],
  };
}

export function createIndustryHead(branche, stad) {
  const seo = getIndustrySeo(branche, stad);

  if (!seo) {
    return {
      meta: [
        { title: "Pagina niet gevonden | Vedantix" },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  }

  return {
    meta: [
      { title: seo.seoTitle },
      { name: "description", content: seo.seoDescription },
      { name: "robots", content: seo.indexable ? INDEX_ROBOTS : NOINDEX_ROBOTS },
      { property: "og:title", content: seo.seoTitle },
      { property: "og:description", content: seo.seoDescription },
      { property: "og:type", content: "website" },
      { property: "og:url", content: seo.canonical },
      { property: "og:site_name", content: "Vedantix" },
      { property: "og:locale", content: "nl_NL" },
      { property: "og:image", content: "https://vedantix.nl/images/og-vedantix.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://vedantix.nl/images/og-vedantix.png" },
      { name: "twitter:title", content: seo.seoTitle },
      { name: "twitter:description", content: seo.seoDescription },
    ],
    links: [
      { rel: "canonical", href: seo.canonical },
      { rel: "alternate", hreflang: "nl-NL", href: seo.canonical },
      { rel: "alternate", hreflang: "x-default", href: seo.canonical },
    ],
    scripts: seo.schemas.map((schema) => ({
      type: "application/ld+json",
      children: JSON.stringify(schema),
    })),
  };
}
