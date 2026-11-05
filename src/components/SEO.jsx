import { createLocalBusinessSchema, createOrganizationSchema, createWebSiteSchema } from "../utils/schema.js";

/**
 * @param {{title: string, description: string, canonical: string, schemas?: object[], includeBaseSchemas?: boolean}} props
 */
export default function SEO({ title, description, canonical, schemas = [], includeBaseSchemas = true }) {
  // Route head() owns all title/social tags. React 19 hoists these links and
  // emits the visible-content schemas during SSR without manual DOM mutation.
  const structuredData = [
    ...(includeBaseSchemas ? [createOrganizationSchema(), createLocalBusinessSchema(), createWebSiteSchema()] : []),
    ...schemas,
  ];
  return <>
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hrefLang="nl-NL" href={canonical} />
    <link rel="alternate" hrefLang="x-default" href={canonical} />
    {structuredData.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
  </>;
}
