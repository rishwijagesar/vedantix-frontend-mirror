import { useEffect } from "react";
import {
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebSiteSchema,
} from "../utils/schema";

export default function SEO({
  title,
  description,
  canonical,
  schemas = [],
  includeBaseSchemas = true,
}) {
  useEffect(() => {
    const head = document.head;
    const managedSelector = "[data-vedantix-seo='true']";
    const fallbackSelectors = [
      'meta[name="description"]:not([data-rh])',
      'meta[name="robots"]:not([data-rh])',
      'link[rel="canonical"]:not([data-rh])',
      'meta[property="og:title"]:not([data-rh])',
      'meta[property="og:description"]:not([data-rh])',
      'meta[property="og:type"]:not([data-rh])',
      'meta[property="og:url"]:not([data-rh])',
      'meta[property="og:image"]:not([data-rh])',
      'meta[property="og:image:alt"]:not([data-rh])',
      'meta[property="og:site_name"]:not([data-rh])',
      'meta[property="og:locale"]:not([data-rh])',
      'meta[name="twitter:card"]:not([data-rh])',
      'meta[name="twitter:title"]:not([data-rh])',
      'meta[name="twitter:description"]:not([data-rh])',
      'meta[name="twitter:image"]:not([data-rh])',
      'meta[name="twitter:image:alt"]:not([data-rh])',
      'link[rel="alternate"][hreflang]:not([data-rh])',
      'script[type="application/ld+json"]:not([data-vedantix-seo])',
    ];

    document
      .querySelectorAll([...fallbackSelectors, managedSelector].join(","))
      .forEach((element) => {
        element.remove();
      });

    document.title = title;

    const appendElement = (tagName, attributes, textContent) => {
      const element = document.createElement(tagName);
      element.setAttribute("data-vedantix-seo", "true");

      Object.entries(attributes).forEach(([name, value]) => {
        if (value) {
          element.setAttribute(name, value);
        }
      });

      if (textContent) {
        element.textContent = textContent;
      }

      head.appendChild(element);
      return element;
    };

    appendElement("meta", { name: "description", content: description });
    appendElement("meta", {
      name: "robots",
      content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    });
    appendElement("link", { rel: "canonical", href: canonical });
    appendElement("link", { rel: "alternate", hreflang: "nl-NL", href: canonical });
    appendElement("link", { rel: "alternate", hreflang: "x-default", href: canonical });
    appendElement("meta", { property: "og:title", content: title });
    appendElement("meta", { property: "og:description", content: description });
    appendElement("meta", { property: "og:type", content: "website" });
    appendElement("meta", { property: "og:url", content: canonical });
    appendElement("meta", { property: "og:image", content: "https://vedantix.nl/preview.png" });
    appendElement("meta", {
      property: "og:image:alt",
      content: "Vedantix webdesign en online groei voor lokale ondernemers",
    });
    appendElement("meta", { property: "og:site_name", content: "Vedantix" });
    appendElement("meta", { property: "og:locale", content: "nl_NL" });
    appendElement("meta", { name: "twitter:card", content: "summary_large_image" });
    appendElement("meta", { name: "twitter:title", content: title });
    appendElement("meta", { name: "twitter:description", content: description });
    appendElement("meta", { name: "twitter:image", content: "https://vedantix.nl/preview.png" });
    appendElement("meta", {
      name: "twitter:image:alt",
      content: "Vedantix webdesign en online groei voor lokale ondernemers",
    });

    const baseSchemas = includeBaseSchemas
      ? [
          createOrganizationSchema(),
          createLocalBusinessSchema(),
          createWebSiteSchema(),
        ]
      : [];

    [...baseSchemas, ...schemas].forEach((schema) => {
      appendElement(
        "script",
        { type: "application/ld+json" },
        JSON.stringify(schema),
      );
    });
  }, [title, description, canonical, schemas, includeBaseSchemas]);

  return null;
}
