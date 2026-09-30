import { useEffect, useId, useRef } from "react";
import { enabledModules, groupModules, safePublicUrl } from "./navigation";
import type { WebsiteAdminShellProps } from "./types";

function Icon({ kind }: { kind: "menu" | "close" | "external" | "logout" }) {
  const paths = {
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "m6 6 12 12M18 6 6 18",
    external: "M14 4h6v6M20 4 10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
    logout: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M13 8l4 4-4 4M8 12h12",
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export function WebsiteAdminShell({ site, user, modules, activeModuleId, onModuleChange, onSignOut, children, headerActions, status, bottomBar, className = "", style, signOutLabel = "Uitloggen", signOutDisabled = false }: WebsiteAdminShellProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const menuId = useId();
  const mainId = useId();
  const groups = groupModules(modules);
  const active = enabledModules(modules).find(module => module.id === activeModuleId);
  const publicUrl = safePublicUrl(site.publicUrl);
  const closeMenu = () => dialog.current?.close();

  useEffect(closeMenu, [activeModuleId]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (media.matches) closeMenu(); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  const brand = <a className="va-brand" href="https://vedantix.nl" target="_blank" rel="noopener noreferrer" aria-label="Vedantix website openen">vedantix<span aria-hidden="true">®</span></a>;
  const navigation = <nav className="va-nav" aria-label="Websitebeheer">
    {groups.map(group => <section className="va-nav-group" key={group.label} aria-label={group.label}>
      <h2 className="va-nav-label">{group.label}</h2>
      <ul className="va-nav-list">{group.modules.map(module => <li key={module.id}>
        <button type="button" className={`va-nav-button${module.id === activeModuleId ? " va-nav-button-active" : ""}`} aria-current={module.id === activeModuleId ? "page" : undefined} onClick={() => { onModuleChange(module.id); closeMenu(); }}>
          {module.icon ? <span className="va-nav-icon" aria-hidden="true">{module.icon}</span> : <span className="va-module-dot" aria-hidden="true" />}
          <span>{module.label}</span>
        </button>
      </li>)}</ul>
    </section>)}
  </nav>;
  const siteIdentity = <div className="va-site">
    {site.logoUrl && <img className="va-site-logo" src={site.logoUrl} alt="" width="44" height="44" />}
    <div className="va-site-info"><strong>{site.name}</strong><span>Websitebeheer</span></div>
  </div>;
  const account = <div className="va-account">
    <div className="va-account-info"><span className="va-avatar" aria-hidden="true">{user.label.slice(0, 1).toUpperCase()}</span><div><strong>{user.label}</strong>{user.email && <span>{user.email}</span>}</div></div>
    <button type="button" className="va-signout" onClick={() => void onSignOut()} disabled={signOutDisabled}><Icon kind="logout" />{signOutLabel}</button>
    <small>Design & techniek door Vedantix</small>
  </div>;

  return <div className={`va-shell ${className}`.trim()} style={style}>
    <a className="va-skip-link" href={`#${mainId}`}>Naar de inhoud</a>
    <aside className="va-sidebar"><div className="va-sidebar-brand">{brand}</div>{siteIdentity}{navigation}{account}</aside>
    <dialog className="va-menu-dialog" id={menuId} ref={dialog} aria-label="Beheermenu" onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className="va-dialog-inner"><div className="va-mobile-brand">{brand}<button type="button" className="va-icon-button" onClick={closeMenu} aria-label="Menu sluiten"><Icon kind="close" /></button></div>{siteIdentity}{navigation}{account}</div>
    </dialog>
    <div className="va-main-column">
      <header className="va-topbar">
        <div className="va-topbar-title"><button className="va-menu-button" type="button" aria-label="Beheermenu openen" aria-haspopup="dialog" aria-controls={menuId} onClick={() => dialog.current?.showModal()}><Icon kind="menu" /><span>Menu</span></button><div><span className="va-topbar-eyebrow">{site.name}</span><strong>{active?.label || "Websitebeheer"}</strong></div></div>
        <div className="va-topbar-actions">{headerActions}{publicUrl && <a className="va-public-link" href={publicUrl} target="_blank" rel="noopener noreferrer" aria-label="Website bekijken (nieuw tabblad)"><span>Website bekijken</span><Icon kind="external" /></a>}</div>
      </header>
      {status && <div className="va-status">{status}</div>}
      <main id={mainId} className="va-content" tabIndex={-1}>{children}</main>
      {bottomBar && <div className="va-bottom-bar">{bottomBar}</div>}
    </div>
  </div>;
}
