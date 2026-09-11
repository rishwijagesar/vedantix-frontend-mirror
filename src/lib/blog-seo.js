import { blogPosts } from "../data/seoData";
import {
  createBreadcrumbSchema,
  createFAQSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebSiteSchema,
} from "../utils/schema";

const SITE_URL = "https://vedantix.nl";
const INDEX_ROBOTS =
  "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

export function getBlogSeo(slug) {
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return null;

  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const title = post.seo?.title || `${post.title} | Vedantix`;
  const description = post.seo?.description || post.intro;

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url: canonical },
  ]);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: "nl-NL",
    author: {
      "@type": "Organization",
      name: "Vedantix",
    },
    publisher: {
      "@type": "Organization",
      name: "Vedantix",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/vedantix_logo.png`,
      },
    },
  };

  const faqSchema = post.faqs?.length ? createFAQSchema(post.faqs) : null;

  return {
    canonical,
    title,
    description,
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebSiteSchema(),
      breadcrumbSchema,
      articleSchema,
      faqSchema,
    ].filter(Boolean),
  };
}

export function createBlogHead(slug) {
  const seo = getBlogSeo(slug);

  if (!seo) {
    return {
      meta: [
        { title: "Artikel niet gevonden | Vedantix" },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  }

  return {
    meta: [
      { title: seo.title },
      { name: "description", content: seo.description },
      { name: "robots", content: INDEX_ROBOTS },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: seo.canonical },
      { property: "og:image", content: `${SITE_URL}/preview.png` },
      { property: "og:site_name", content: "Vedantix" },
      { property: "og:locale", content: "nl_NL" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: seo.title },
      { name: "twitter:description", content: seo.description },
      { name: "twitter:image", content: `${SITE_URL}/preview.png` },
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
