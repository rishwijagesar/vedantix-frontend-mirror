"use client";

// src/WebsiteAdminShell.tsx
import { useEffect, useId, useRef } from "react";

// src/navigation.ts
function enabledModules(modules) {
  const ids = /* @__PURE__ */ new Set();
  return modules.filter((module) => {
    if (!module.id || ids.has(module.id)) throw new Error("Admin module IDs must be non-empty and unique.");
    ids.add(module.id);
    return module.enabled;
  });
}
function groupModules(modules) {
  const groups = /* @__PURE__ */ new Map();
  for (const module of enabledModules(modules)) {
    const label = module.group || "Website";
    const group = groups.get(label) || [];
    group.push(module);
    groups.set(label, group);
  }
  return [...groups].map(([label, modules2]) => ({ label, modules: modules2 }));
}
function safePublicUrl(value) {
  try {
    if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) return null;
    const url = new URL(value, "https://vedantix.invalid");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password || value.startsWith("//")) return null;
    return value.startsWith("/") ? url.pathname + url.search + url.hash : url.href;
  } catch {
    return null;
  }
}

// src/WebsiteAdminShell.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Icon({ kind }) {
  const paths = {
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "m6 6 12 12M18 6 6 18",
    external: "M14 4h6v6M20 4 10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
    logout: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M13 8l4 4-4 4M8 12h12"
  };
  return /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: paths[kind] }) });
}
function WebsiteAdminShell({ site, user, modules, activeModuleId, onModuleChange, onSignOut, children, headerActions, status, bottomBar, className = "", style, signOutLabel = "Uitloggen", signOutDisabled = false }) {
  const dialog = useRef(null);
  const menuId = useId();
  const mainId = useId();
  const groups = groupModules(modules);
  const active = enabledModules(modules).find((module) => module.id === activeModuleId);
  const publicUrl = safePublicUrl(site.publicUrl);
  const closeMenu = () => dialog.current?.close();
  useEffect(closeMenu, [activeModuleId]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (media.matches) closeMenu();
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  const brand = /* @__PURE__ */ jsxs("a", { className: "va-brand", href: "https://vedantix.nl", target: "_blank", rel: "noopener noreferrer", "aria-label": "Vedantix website openen", children: [
    "vedantix",
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\xAE" })
  ] });
  const navigation = /* @__PURE__ */ jsx("nav", { className: "va-nav", "aria-label": "Websitebeheer", children: groups.map((group) => /* @__PURE__ */ jsxs("section", { className: "va-nav-group", "aria-label": group.label, children: [
    /* @__PURE__ */ jsx("h2", { className: "va-nav-label", children: group.label }),
    /* @__PURE__ */ jsx("ul", { className: "va-nav-list", children: group.modules.map((module) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { type: "button", className: `va-nav-button${module.id === activeModuleId ? " va-nav-button-active" : ""}`, "aria-current": module.id === activeModuleId ? "page" : void 0, onClick: () => {
      onModuleChange(module.id);
      closeMenu();
    }, children: [
      module.icon ? /* @__PURE__ */ jsx("span", { className: "va-nav-icon", "aria-hidden": "true", children: module.icon }) : /* @__PURE__ */ jsx("span", { className: "va-module-dot", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { children: module.label })
    ] }) }, module.id)) })
  ] }, group.label)) });
  const siteIdentity = /* @__PURE__ */ jsxs("div", { className: "va-site", children: [
    site.logoUrl && /* @__PURE__ */ jsx("img", { className: "va-site-logo", src: site.logoUrl, alt: "", width: "44", height: "44" }),
    /* @__PURE__ */ jsxs("div", { className: "va-site-info", children: [
      /* @__PURE__ */ jsx("strong", { children: site.name }),
      /* @__PURE__ */ jsx("span", { children: "Websitebeheer" })
    ] })
  ] });
  const account = /* @__PURE__ */ jsxs("div", { className: "va-account", children: [
    /* @__PURE__ */ jsxs("div", { className: "va-account-info", children: [
      /* @__PURE__ */ jsx("span", { className: "va-avatar", "aria-hidden": "true", children: user.label.slice(0, 1).toUpperCase() }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: user.label }),
        user.email && /* @__PURE__ */ jsx("span", { children: user.email })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("button", { type: "button", className: "va-signout", onClick: () => void onSignOut(), disabled: signOutDisabled, children: [
      /* @__PURE__ */ jsx(Icon, { kind: "logout" }),
      signOutLabel
    ] }),
    /* @__PURE__ */ jsx("small", { children: "Design & techniek door Vedantix" })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: `va-shell ${className}`.trim(), style, children: [
    /* @__PURE__ */ jsx("a", { className: "va-skip-link", href: `#${mainId}`, children: "Naar de inhoud" }),
    /* @__PURE__ */ jsxs("aside", { className: "va-sidebar", children: [
      /* @__PURE__ */ jsx("div", { className: "va-sidebar-brand", children: brand }),
      siteIdentity,
      navigation,
      account
    ] }),
    /* @__PURE__ */ jsx("dialog", { className: "va-menu-dialog", id: menuId, ref: dialog, "aria-label": "Beheermenu", onClick: (event) => {
      if (event.target === event.currentTarget) closeMenu();
    }, children: /* @__PURE__ */ jsxs("div", { className: "va-dialog-inner", children: [
      /* @__PURE__ */ jsxs("div", { className: "va-mobile-brand", children: [
        brand,
        /* @__PURE__ */ jsx("button", { type: "button", className: "va-icon-button", onClick: closeMenu, "aria-label": "Menu sluiten", children: /* @__PURE__ */ jsx(Icon, { kind: "close" }) })
      ] }),
      siteIdentity,
      navigation,
      account
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "va-main-column", children: [
      /* @__PURE__ */ jsxs("header", { className: "va-topbar", children: [
        /* @__PURE__ */ jsxs("div", { className: "va-topbar-title", children: [
          /* @__PURE__ */ jsxs("button", { className: "va-menu-button", type: "button", "aria-label": "Beheermenu openen", "aria-haspopup": "dialog", "aria-controls": menuId, onClick: () => dialog.current?.showModal(), children: [
            /* @__PURE__ */ jsx(Icon, { kind: "menu" }),
            /* @__PURE__ */ jsx("span", { children: "Menu" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "va-topbar-eyebrow", children: site.name }),
            /* @__PURE__ */ jsx("strong", { children: active?.label || "Websitebeheer" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "va-topbar-actions", children: [
          headerActions,
          publicUrl && /* @__PURE__ */ jsxs("a", { className: "va-public-link", href: publicUrl, target: "_blank", rel: "noopener noreferrer", "aria-label": "Website bekijken (nieuw tabblad)", children: [
            /* @__PURE__ */ jsx("span", { children: "Website bekijken" }),
            /* @__PURE__ */ jsx(Icon, { kind: "external" })
          ] })
        ] })
      ] }),
      status && /* @__PURE__ */ jsx("div", { className: "va-status", children: status }),
      /* @__PURE__ */ jsx("main", { id: mainId, className: "va-content", tabIndex: -1, children }),
      bottomBar && /* @__PURE__ */ jsx("div", { className: "va-bottom-bar", children: bottomBar })
    ] })
  ] });
}

// src/WebsiteAdminLogin.tsx
import { useEffect as useEffect3, useId as useId2, useRef as useRef2, useState as useState2 } from "react";

// src/useLoginPresentation.ts
import { useEffect as useEffect2, useState } from "react";

// src/login-presentation.ts
var WEBSITE_ADMIN_LOGIN_PRESENTATION_URL = "https://vedantix.nl/api/public/website-admin-login";
var LOGIN_PRESENTATION_MAX_BYTES = 4096;
var LOGIN_PRESENTATION_TIMEOUT_MS = 3e3;
var DEFAULT_LOGIN_PRESENTATION = Object.freeze({
  version: 1,
  layout: "split",
  brandName: "vedantix",
  eyebrow: "JOUW WEBSITE. JOUW VERHAAL.",
  storyTitle: "Mooi ontworpen.\nMakkelijk beheerd.",
  storyText: "Een vertrouwde plek voor je teksten, afbeeldingen en behandelingen.",
  heading: "Welkom terug",
  description: "Log in met je e-mailadres en wachtwoord.",
  primaryColor: "#173963",
  backgroundColor: "#F6F8FC",
  borderRadius: "16px"
});
var textLimits = { brandName: 40, eyebrow: 60, storyTitle: 120, storyText: 280, heading: 80, description: 240 };
var keys = Object.keys(DEFAULT_LOGIN_PRESENTATION);
var colorPattern = /^#[0-9a-fA-F]{6}$/;
function luminance(color) {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function validateLoginPresentation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value;
  if (Object.keys(data).length !== keys.length || Object.keys(data).some((key) => !keys.includes(key))) return null;
  if (data["version"] !== 1 || data["layout"] !== "split" && data["layout"] !== "centered") return null;
  for (const [key, limit] of Object.entries(textLimits)) {
    const text = data[key];
    if (typeof text !== "string" || !text.trim() || text.length > limit || /[<>\u0000-\u0008\u000b-\u001f\u007f]/.test(text) || /(?:https?:\/\/|www\.|javascript:|data:|url\s*\()/i.test(text)) return null;
  }
  if (typeof data["primaryColor"] !== "string" || !colorPattern.test(data["primaryColor"]) || typeof data["backgroundColor"] !== "string" || !colorPattern.test(data["backgroundColor"])) return null;
  if (contrast(data["primaryColor"], "#FFFFFF") < 4.5 || contrast(data["backgroundColor"], "#0F172A") < 4.5) return null;
  if (typeof data["borderRadius"] !== "string" || !["8px", "12px", "16px", "24px"].includes(data["borderRadius"])) return null;
  return Object.fromEntries(keys.map((key) => [key, data[key]]));
}
function mayApplyLoginPresentation(interacted, disposed) {
  return !interacted && !disposed;
}
async function loadLoginPresentation(fetcher = globalThis.fetch, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) return DEFAULT_LOGIN_PRESENTATION;
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, LOGIN_PRESENTATION_TIMEOUT_MS);
  let reader;
  try {
    const response = await fetcher(WEBSITE_ADMIN_LOGIN_PRESENTATION_URL, {
      method: "GET",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      mode: "cors",
      cache: "default",
      signal: controller.signal
    });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("application/json")) return DEFAULT_LOGIN_PRESENTATION;
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > LOGIN_PRESENTATION_MAX_BYTES || !response.body) return DEFAULT_LOGIN_PRESENTATION;
    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0;
    let json = "";
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > LOGIN_PRESENTATION_MAX_BYTES) {
        await reader.cancel();
        return DEFAULT_LOGIN_PRESENTATION;
      }
      json += decoder.decode(part.value, { stream: true });
    }
    json += decoder.decode();
    return validateLoginPresentation(JSON.parse(json)) || DEFAULT_LOGIN_PRESENTATION;
  } catch {
    return DEFAULT_LOGIN_PRESENTATION;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    reader?.releaseLock();
  }
}

// src/useLoginPresentation.ts
function useLoginPresentation(interaction) {
  const [presentation, setPresentation] = useState(DEFAULT_LOGIN_PRESENTATION);
  useEffect2(() => {
    let disposed = false;
    const controller = new AbortController();
    void loadLoginPresentation(globalThis.fetch, controller.signal).then((next) => {
      if (mayApplyLoginPresentation(interaction.current, disposed)) setPresentation(next);
    });
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [interaction]);
  return presentation;
}

// src/WebsiteAdminLogin.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Arrow() {
  return /* @__PURE__ */ jsx2("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx2("path", { d: "M19 12H5m7-7-7 7 7 7" }) });
}
function WebsiteAdminLogin({ site, onSubmit, mode = "customer", busy = false, error, notice, recoveryUrl, supportEmail, returnUrl, demoUrl, footer, className = "" }) {
  const [email, setEmail] = useState2("");
  const [password, setPassword] = useState2("");
  const [submitting, setSubmitting] = useState2(false);
  const [localError, setLocalError] = useState2("");
  const formId = useId2();
  const requestActive = useRef2(false);
  const mounted = useRef2(true);
  const interacted = useRef2(false);
  const presentation = useLoginPresentation(interacted);
  const pending = busy || submitting;
  const back = safePublicUrl(returnUrl || site.publicUrl);
  const recovery = recoveryUrl ? safePublicUrl(recoveryUrl) : null;
  const demo = demoUrl ? safePublicUrl(demoUrl) : null;
  const support = supportEmail && /^[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+$/.test(supportEmail) ? `mailto:${supportEmail}` : null;
  const message = error || localError;
  const style = { "--va-login-primary": presentation.primaryColor, "--va-login-bg": presentation.backgroundColor, "--va-login-radius": presentation.borderRadius };
  useEffect3(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect3(() => {
    setPassword("");
    setLocalError("");
  }, [mode]);
  async function submit(event) {
    event.preventDefault();
    interacted.current = true;
    if (pending || requestActive.current) return;
    requestActive.current = true;
    setSubmitting(true);
    setLocalError("");
    try {
      await onSubmit({ email: email.trim(), password, mode });
    } catch {
      if (mounted.current) setLocalError("Inloggen is niet gelukt. Controleer je gegevens en probeer het opnieuw.");
    } finally {
      requestActive.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }
  const brand = /* @__PURE__ */ jsxs2("a", { className: "va-login-brand", href: "https://vedantix.nl", target: "_blank", rel: "noopener noreferrer", "aria-label": "Vedantix website openen", children: [
    presentation.brandName,
    /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\xAE" })
  ] });
  return /* @__PURE__ */ jsxs2("main", { className: `va-login va-login-${presentation.layout} ${className}`.trim(), style, onFocusCapture: () => {
    interacted.current = true;
  }, onPointerDownCapture: () => {
    interacted.current = true;
  }, children: [
    /* @__PURE__ */ jsxs2("aside", { className: "va-login-story", "aria-label": "Vedantix websitebeheer", children: [
      brand,
      /* @__PURE__ */ jsxs2("div", { className: "va-login-story-copy", children: [
        /* @__PURE__ */ jsx2("p", { className: "va-login-eyebrow", children: presentation.eyebrow }),
        /* @__PURE__ */ jsx2("h1", { children: presentation.storyTitle }),
        /* @__PURE__ */ jsx2("p", { className: "va-login-story-text", children: presentation.storyText })
      ] }),
      /* @__PURE__ */ jsx2("p", { className: "va-login-signature", children: "Content door jou. Design door Vedantix." })
    ] }),
    /* @__PURE__ */ jsxs2("section", { className: "va-login-form-side", "aria-labelledby": `${formId}-heading`, children: [
      back && /* @__PURE__ */ jsxs2("a", { className: "va-login-back", href: back, children: [
        /* @__PURE__ */ jsx2(Arrow, {}),
        /* @__PURE__ */ jsxs2("span", { children: [
          "Terug naar ",
          site.name
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "va-login-card", children: [
        /* @__PURE__ */ jsx2("div", { className: "va-login-compact-brand", children: brand }),
        /* @__PURE__ */ jsxs2("div", { className: "va-login-tenant", children: [
          site.logoUrl && /* @__PURE__ */ jsx2("img", { src: site.logoUrl, width: "46", height: "46", alt: "" }),
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsx2("span", { children: "Websitebeheer" }),
            /* @__PURE__ */ jsx2("strong", { children: site.name })
          ] })
        ] }),
        /* @__PURE__ */ jsx2("h2", { id: `${formId}-heading`, children: presentation.heading }),
        /* @__PURE__ */ jsx2("p", { className: "va-login-description", id: `${formId}-description`, children: presentation.description }),
        /* @__PURE__ */ jsxs2("form", { className: "va-login-form", onSubmit: submit, "aria-describedby": `${formId}-description`, "aria-busy": pending, onInputCapture: () => {
          interacted.current = true;
        }, children: [
          /* @__PURE__ */ jsx2("label", { htmlFor: `${formId}-email`, children: "E-mailadres" }),
          /* @__PURE__ */ jsx2("input", { id: `${formId}-email`, name: "email", type: "email", autoComplete: "username", autoCapitalize: "none", spellCheck: false, required: true, value: email, onChange: (event) => setEmail(event.target.value), disabled: pending }),
          /* @__PURE__ */ jsx2("label", { htmlFor: `${formId}-password`, children: "Wachtwoord" }),
          /* @__PURE__ */ jsx2("input", { id: `${formId}-password`, name: "password", type: "password", autoComplete: "current-password", required: true, value: password, onChange: (event) => setPassword(event.target.value), disabled: pending }),
          message && /* @__PURE__ */ jsx2("p", { role: "alert", className: "va-login-error", children: message }),
          notice && /* @__PURE__ */ jsx2("p", { role: "status", className: "va-login-notice", children: notice }),
          /* @__PURE__ */ jsx2("button", { className: "va-login-submit", type: "submit", disabled: pending, children: pending ? "Bezig met inloggen\u2026" : "Veilig inloggen" }),
          recovery && /* @__PURE__ */ jsx2("a", { className: "va-login-recovery", href: recovery, children: "Wachtwoord vergeten?" })
        ] }),
        support && /* @__PURE__ */ jsxs2("p", { className: "va-login-help", children: [
          "Hulp nodig met je account? Neem contact op met ",
          /* @__PURE__ */ jsx2("a", { href: support, children: "Vedantix" }),
          "."
        ] }),
        demo && /* @__PURE__ */ jsxs2("div", { className: "va-login-demo", children: [
          /* @__PURE__ */ jsx2("a", { href: demo, children: "Bekijk een voorbeeld van het beheer \u2192" }),
          /* @__PURE__ */ jsx2("span", { children: "Je kunt rondkijken zonder iets te publiceren." })
        ] }),
        footer && /* @__PURE__ */ jsx2("div", { className: "va-login-footer", children: footer })
      ] })
    ] })
  ] });
}
export {
  DEFAULT_LOGIN_PRESENTATION,
  LOGIN_PRESENTATION_MAX_BYTES,
  LOGIN_PRESENTATION_TIMEOUT_MS,
  WEBSITE_ADMIN_LOGIN_PRESENTATION_URL,
  WebsiteAdminLogin,
  WebsiteAdminShell,
  enabledModules,
  groupModules,
  loadLoginPresentation,
  safePublicUrl,
  validateLoginPresentation
};
