const SITE_URL = "https://vedantix.nl";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Neercanne 6",
  postalCode: "5235 HB",
  addressLocality: "'s-Hertogenbosch",
  addressRegion: "Noord-Brabant",
  addressCountry: "NL",
};

const SOCIAL_PROFILES = [
  "https://instagram.com/vedantix.nl",
  "https://www.facebook.com/vedantix",
  "https://www.linkedin.com/company/vedantix-nl",
  "https://trustoo.nl/noord-brabant/den-bosch/webdesign/vedantix/",
];

const SERVICE_CATALOG = {
  "@type": "OfferCatalog",
  name: "Websites en online groei voor lokale ondernemers",
  itemListElement: [
    "Webdesign en webontwikkeling",
    "Managed website hosting en SSL",
    "Technisch websiteonderhoud",
    "SEO en lokale SEO",
    "AEO en vraaggestuurde content",
    "GEO en AI-vindbaarheid",
    "Conversie-optimalisatie",
  ].map((name) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name,
      provider: { "@id": LOCAL_BUSINESS_ID },
    },
  })),
};

export const vedantixEntity = {
  name: "Vedantix",
  url: SITE_URL,
  email: "info@vedantix.nl",
  telephone: "+31626219989",
  description:
    "Vedantix is een webdesign- en online groeibureau in 's-Hertogenbosch voor websites, managed hosting, onderhoud, SEO, AEO, GEO en AI-vindbaarheid.",
};

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: vedantixEntity.name,
    legalName: "Vedantix",
    url: vedantixEntity.url,
    email: vedantixEntity.email,
    telephone: vedantixEntity.telephone,
    description: vedantixEntity.description,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/vedantix_logo.png`,
    },
    address: ADDRESS,
    sameAs: SOCIAL_PROFILES,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: vedantixEntity.telephone,
      email: vedantixEntity.email,
      contactType: "sales and customer service",
      availableLanguage: ["nl", "en"],
      areaServed: "NL",
    },
    identifier: {
      "@type": "PropertyValue",
      propertyID: "KVK",
      value: "42056482",
    },
    vatID: "NL005461438B38",
    areaServed: [
      { "@type": "City", name: "'s-Hertogenbosch" },
      { "@type": "AdministrativeArea", name: "Noord-Brabant" },
      { "@type": "Country", name: "Nederland" },
    ],
    knowsAbout: [
      "Webdesign voor lokale ondernemers",
      "Webontwikkeling",
      "Managed website hosting",
      "Technisch websiteonderhoud",
      "Search Engine Optimization (SEO)",
      "Lokale SEO",
      "Answer Engine Optimization (AEO)",
      "Generative Engine Optimization (GEO)",
      "AI-vindbaarheid",
      "Google Business Profile-optimalisatie",
      "Conversie-optimalisatie",
    ],
  };
}

export function createLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": LOCAL_BUSINESS_ID,
    name: vedantixEntity.name,
    url: vedantixEntity.url,
    image: `${SITE_URL}/preview.png`,
    logo: `${SITE_URL}/vedantix_logo.png`,
    email: vedantixEntity.email,
    telephone: vedantixEntity.telephone,
    description: vedantixEntity.description,
    priceRange: "€€",
    address: ADDRESS,
    sameAs: SOCIAL_PROFILES,
    areaServed: [
      { "@type": "City", name: "'s-Hertogenbosch" },
      { "@type": "AdministrativeArea", name: "Noord-Brabant" },
      { "@type": "Country", name: "Nederland" },
    ],
    hasOfferCatalog: SERVICE_CATALOG,
    parentOrganization: {
      "@id": ORGANIZATION_ID,
    },
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Vedantix",
    url: SITE_URL,
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    inLanguage: "nl-NL",
    about: {
      "@id": ORGANIZATION_ID,
    },
  };
}

export function createAboutPageSchema({
  name,
  description,
  url,
  dateModified,
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#webpage`,
    name,
    description,
    url,
    inLanguage: "nl-NL",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    dateModified,
  };
}

export function createFAQSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function createServiceSchema({
  name,
  slug,
  description,
  audienceType,
  serviceType,
  areaServed = "Nederland",
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    url: `${SITE_URL}/${slug}`,
    areaServed: {
      "@type": "Country",
      name: areaServed,
    },
    audience: {
      "@type": "BusinessAudience",
      audienceType,
    },
    provider: {
      "@id": LOCAL_BUSINESS_ID,
    },
  };
}

export function createBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
