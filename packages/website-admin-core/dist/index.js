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
export {
  WebsiteAdminShell,
  enabledModules,
  groupModules,
  safePublicUrl
};
