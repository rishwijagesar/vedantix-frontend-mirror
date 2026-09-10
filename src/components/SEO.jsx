import { useEffect } from "react";
import {
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebSiteSchema,
} from "../utils/schema.js";

export default function SEO({
  title,
  description,
  canonical,
  schemas = [],
  includeBaseSchemas = true,
}) {
  useEffect(() => {
    const head = document.head;
    // TanStack/React own the route's head elements. Removing them externally
    // crashes client navigation when React later tries to remove the same node.
    const ownedElements = [];

    document.title = title;

    const appendElement = (tagName, attributes, textContent) => {
      const identity =
        tagName === "meta"
          ? attributes.name
            ? { name: attributes.name }
            : { property: attributes.property }
          : tagName === "link"
            ? {
                rel: attributes.rel,
                ...(attributes.hreflang
                  ? { hreflang: attributes.hreflang }
                  : {}),
              }
            : null;
      if (
        identity &&
        Array.from(head.querySelectorAll(tagName)).some((element) =>
          Object.entries(identity).every(
            ([name, value]) => element.getAttribute(name) === value,
          ),
        )
      )
        return;

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
      ownedElements.push(element);
      return element;
    };

    appendElement("meta", { name: "description", content: description });
    appendElement("meta", {
      name: "robots",
      content:
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    });
    appendElement("link", { rel: "canonical", href: canonical });
    appendElement("link", {
      rel: "alternate",
      hreflang: "nl-NL",
      href: canonical,
    });
    appendElement("link", {
      rel: "alternate",
      hreflang: "x-default",
      href: canonical,
    });
    appendElement("meta", { property: "og:title", content: title });
    appendElement("meta", { property: "og:description", content: description });
    appendElement("meta", { property: "og:type", content: "website" });
    appendElement("meta", { property: "og:url", content: canonical });
    appendElement("meta", {
      property: "og:image",
      content: "https://vedantix.nl/preview.png",
    });
    appendElement("meta", {
      property: "og:image:alt",
      content: "Vedantix webdesign en online groei voor lokale ondernemers",
    });
    appendElement("meta", { property: "og:site_name", content: "Vedantix" });
    appendElement("meta", { property: "og:locale", content: "nl_NL" });
    appendElement("meta", {
      name: "twitter:card",
      content: "summary_large_image",
    });
    appendElement("meta", { name: "twitter:title", content: title });
    appendElement("meta", {
      name: "twitter:description",
      content: description,
    });
    appendElement("meta", {
      name: "twitter:image",
      content: "https://vedantix.nl/preview.png",
    });
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

    return () => ownedElements.forEach((element) => element.remove());
  }, [title, description, canonical, schemas, includeBaseSchemas]);

  return null;
}
