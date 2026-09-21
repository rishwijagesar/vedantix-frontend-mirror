import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Activity, BarChart3, BookOpen, BriefcaseBusiness, Building2, ChevronDown, CreditCard, ExternalLink, FileSignature, FileText, Globe2, LayoutDashboard, LogOut, Mail, Menu, MonitorSmartphone, Package, ReceiptText, Repeat2, Search, Send, ShieldCheck, Target, UserCog, Users, WalletCards, X, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLocation } from "@/lib/router-compat";
import { supabase } from "@/lib/supabase";
import { activeAdminItem, adminNavigation, searchAdminNavigation } from "./admin-navigation";

const icons: Record<string, LucideIcon> = { dashboard: LayoutDashboard, users: Users, target: Target, file: FileText, link: ExternalLink, signature: FileSignature, chart: BarChart3, receipt: ReceiptText, wallet: WalletCards, repeat: Repeat2, book: BookOpen, monitor: MonitorSmartphone, globe: Globe2, mail: Mail, external: ExternalLink, activity: Activity, case: BriefcaseBusiness, package: Package, building: Building2, send: Send, card: CreditCard, "user-cog": UserCog, shield: ShieldCheck };

function Brand() {
  return <Link to="/admin" search={{}} className="flex items-center gap-3 rounded-lg text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white font-black text-slate-950">V</span><span><strong className="block text-sm">Vedantix</strong><span className="text-xs text-slate-400">Beheeromgeving</span></span></Link>;
}

export function AdminNavigation({ activeId, onNavigate }: { activeId: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const searchId = useId();
  const groupId = useId();
  const activeLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const group = adminNavigation.find(item => item.items.some(link => link.id === activeId));
    if (group) setExpanded(current => ({ ...current, [group.id]: true }));
    setQuery("");
  }, [activeId]);
  useEffect(() => {
    // Scroll just the sidebar, keeping the page itself in place.
    const link = activeLink.current;
    const scroller = link?.closest("nav");
    if (link && scroller && link.getClientRects().length) {
      const itemRect = link.getBoundingClientRect();
      const navRect = scroller.getBoundingClientRect();
      if (itemRect.bottom > navRect.bottom || itemRect.top < navRect.top) scroller.scrollTop += itemRect.top - navRect.top - 48;
    }
  }, [activeId, expanded]);
  const groups = searchAdminNavigation(query);
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="px-4 pb-4">
      <label htmlFor={searchId} className="sr-only">Zoek een pagina</label>
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 focus-within:ring-2 focus-within:ring-slate-300"><Search size={16} className="shrink-0 text-slate-400" aria-hidden="true"/><input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Zoek een pagina…" autoComplete="off" className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-400"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Zoekopdracht wissen" className="rounded p-1 text-slate-300 hover:text-white"><X size={14}/></button>}</div>
    </div>
    <nav aria-label="Hoofdnavigatie beheer" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-5">
      {groups.map(group => {
        const open = Boolean(query.trim()) || (expanded[group.id] ?? (group.id !== "settings" || group.items.some(item => item.id === activeId)));
        const target = `${groupId}-${group.id}`;
        return <div key={group.id}><button type="button" aria-expanded={open} aria-controls={target} onClick={() => setExpanded(current => ({ ...current, [group.id]: !open }))} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-white"><span>{group.label}</span><ChevronDown size={13} className={open ? "" : "-rotate-90"} aria-hidden="true"/></button><ul id={target} hidden={!open} className="space-y-0.5">{group.items.map(item => {
          const Icon = icons[item.icon];
          const active = item.id === activeId;
          const [pathname, search = ""] = item.href.split("?");
          return <li key={item.id}><Link ref={active ? activeLink : undefined} to={pathname} search={Object.fromEntries(new URLSearchParams(search))} aria-current={active ? "page" : undefined} onClick={onNavigate} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-white ${active ? "bg-white font-semibold text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={17} className="shrink-0" aria-hidden="true"/><span>{item.label}</span></Link></li>;
        })}</ul></div>;
      })}
      {!groups.length && <p role="status" className="px-3 py-5 text-sm leading-6 text-slate-400">Geen pagina gevonden. Probeer bijvoorbeeld ‘facturen’, ‘bonnetjes’ of ‘mailbox’.</p>}
    </nav>
  </div>;
}

export default function AdminLayout({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  const location = useLocation();
  const active = activeAdminItem(location.pathname, location.search);
  const group = adminNavigation.find(group => group.items.some(item => item.id === active.id));
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  function closeMenu() { dialog.current?.close(); }
  useEffect(() => { closeMenu(); }, [location.pathname, location.search]);
  return <div className="flex min-h-screen bg-slate-50 text-slate-950">
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex"><div className="p-5"><Brand/></div><AdminNavigation activeId={active.id}/></aside>
    <dialog ref={dialog} id={dialogId} aria-label="Adminmenu" className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-80 max-w-[calc(100vw-2rem)] border-0 bg-slate-950 p-0 text-white backdrop:bg-slate-950/50">
      <div className="flex h-full flex-col"><div className="flex items-center justify-between gap-3 p-5"><Brand/><button type="button" onClick={closeMenu} aria-label="Menu sluiten" className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={20}/></button></div><AdminNavigation activeId={active.id} onNavigate={closeMenu}/></div>
    </dialog>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-7">
        <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" aria-controls={dialogId} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold lg:hidden"><Menu size={17}/> Menu</button><div className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group?.label}</span><strong className="block truncate text-sm">{active.label}</strong></div></div>
        <div className="flex flex-wrap items-center gap-2">{actions}<button type="button" onClick={() => void supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><LogOut size={14}/><span className="hidden sm:inline">Uitloggen</span><span className="sr-only sm:hidden">Uitloggen</span></button></div>
      </header>
      {children}
    </div>
  </div>;
}
