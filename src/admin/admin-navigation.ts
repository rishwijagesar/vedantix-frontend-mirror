export const operationSections = ["dashboard", "client-cases", "customers", "domains", "websites", "customer-access", "health", "monitoring", "staff"] as const;
export const billingSections = ["overview", "quotes", "quote-links", "contracts", "invoices", "payments", "online-payments", "administration", "customer-margin", "accounting", "email", "production", "subscriptions", "catalog", "customers", "company"] as const;
export type OperationSection = typeof operationSections[number];
export type BillingSection = typeof billingSections[number];

export function operationSection(value: string | null): OperationSection {
  return operationSections.includes(value as OperationSection) ? value as OperationSection : "dashboard";
}
export function billingSection(value: string | null): BillingSection {
  return billingSections.includes(value as BillingSection) ? value as BillingSection : "overview";
}

export type AdminNavItem = { id: string; label: string; href: string; icon: string; keywords?: string };
export type AdminNavGroup = { id: string; label: string; items: AdminNavItem[] };
const operation = (section: OperationSection, label: string, icon: string, keywords = ""): AdminNavItem => ({ id: `operations:${section}`, label, icon, keywords, href: section === "dashboard" ? "/admin" : `/admin?section=${section}` });
const billing = (section: BillingSection, label: string, icon: string, keywords = ""): AdminNavItem => ({ id: `billing:${section}`, label, icon, keywords, href: section === "overview" ? "/admin/billing" : `/admin/billing?section=${section}` });

export const adminNavigation: AdminNavGroup[] = [
  { id: "start", label: "Overzicht", items: [operation("dashboard", "Dashboard", "dashboard")] },
  { id: "sales", label: "Klanten & verkoop", items: [
    operation("customers", "Klanten", "users", "klantregister contactpersonen"),
    { id: "leads", label: "Leads & opvolging", href: "/admin/leads", icon: "target", keywords: "sales pipeline aanvragen" },
    billing("quotes", "Offertes", "file", "prijsopgave voorstellen"),
    billing("quote-links", "Offertelinks", "link", "offerte accepteren delen"),
    billing("contracts", "Contracten", "signature", "overeenkomst ondertekenen downloaden voorwaarden"),
  ] },
  { id: "finance", label: "Financiën", items: [
    billing("overview", "Financieel overzicht", "chart", "sales billing"),
    billing("invoices", "Facturen", "receipt", "creditnota facturatie pdf"),
    billing("payments", "Betalingen", "wallet", "openstaand achterstallig deelbetaling"),
    billing("subscriptions", "Abonnementen", "repeat", "maandelijks jaarlijks terugkerend"),
    billing("customer-margin", "Klantrendement", "chart", "kosten per klant marge winst verlies hosting email maandelijks"),
    billing("administration", "Administratie", "book", "boekhouding kosten aankopen bonnetjes bewijsstukken omzet winst btw kwartaal belasting"),
  ] },
  { id: "services", label: "Websites & e-mail", items: [
    operation("websites", "Websites", "monitor", "hosting projecten Google Analytics PageSpeed statistieken snelheid"),
    operation("customer-access", "Klanttoegang", "user-cog", "klantaccounts websitebeheer uitnodigen toegang wachtwoord herstellen"),
    operation("domains", "Domeinen", "globe", "domeinnaam registrar"),
    operation("health", "E-mail & DNS", "mail", "mailbox migadu reserveadres wachtwoord aws route53"),
    { id: "previews", label: "Website previews", href: "/admin/previews", icon: "external", keywords: "voorbeeld klantlink concept" },
    operation("monitoring", "Monitoring", "activity", "alerts storingen controles"),
  ] },
  { id: "marketing", label: "Marketing", items: [
    operation("client-cases", "Klantcases", "case", "portfolio resultaten klantverhalen logo"),
    { id: "growth", label: "Groei & conversie", href: "/admin/growth", icon: "chart", keywords: "marketing audit funnel statistieken" },
  ] },
  { id: "settings", label: "Instellingen", items: [
    billing("catalog", "Catalogus & prijzen", "package", "pakketten diensten producten"),
    billing("customers", "Factuurgegevens klanten", "users", "klantgegevens adres iban btw kvk documenten"),
    billing("company", "Bedrijfsprofiel", "building", "bedrijfsgegevens eigen gegevens iban btw kvk"),
    billing("email", "E-mail & herinneringen", "send", "reminders offertes facturen versturen"),
    billing("online-payments", "Online betalen", "card", "mollie ideal betaallink"),
    billing("accounting", "e-Boekhouden-koppeling", "link", "boekhouding synchronisatie integratie rekeningen"),
    operation("staff", "Team & toegang", "user-cog", "staff medewerkers rollen uitnodigen"),
    billing("production", "Systeemcontrole", "shield", "productie readiness aws activeren"),
  ] },
];

export function activeAdminItem(pathname: string, search = ""): AdminNavItem {
  const path = pathname.replace(/\/+$/, "") || "/";
  const requested = new URLSearchParams(search).get("section");
  const id = path === "/admin" ? `operations:${operationSection(requested)}`
    : path === "/admin/billing" ? `billing:${billingSection(requested)}`
    : path === "/admin/monitoring" ? "operations:monitoring" : null;
  const items = adminNavigation.flatMap(group => group.items);
  return items.find(item => id ? item.id === id : item.href === path) || items[0];
}

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
export function searchAdminNavigation(query: string): AdminNavGroup[] {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return adminNavigation.map(group => ({ ...group, items: group.items.filter(item => {
    const haystack = normalize(`${group.label} ${item.label} ${item.keywords || ""}`);
    return terms.every(term => haystack.includes(term));
  }) })).filter(group => group.items.length > 0);
}
