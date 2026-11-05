export type ContractSourceKind = "quote" | "invoice" | "catalog";
export type ContractSourceOption = {
  id: string;
  kind: ContractSourceKind;
  customer_id: string;
  number: string;
  title: string;
};
export type ContractSourceItem = {
  description: string;
  quantity: number;
  billing_type: "ONE_TIME" | "MONTHLY" | "YEARLY";
  line_total_ex_vat: number;
  line_total_incl_vat: number;
};
export type ContractSource = ContractSourceOption & {
  status: string;
  is_active?: boolean;
  total_ex_vat: number;
  vat_total: number;
  total_incl_vat: number;
  document_discount_ex_vat: number;
  due_date?: string | null;
  payment_reference?: string | null;
  intro_text?: string | null;
  terms?: string | null;
  notes?: string | null;
  items: ContractSourceItem[];
};
export type PrefillDraft = {
  customer_id: string;
  status: string;
  project_name: string | null;
  variables: Record<string, string>;
};
export type ContractSuggestion = {
  source: ContractSourceOption;
  fields: Record<string, string>;
  notes: string[];
};

export const contractFieldHelp: Record<string, string> = {
  price_terms: "Het afgesproken bedrag, btw, betaalmomenten en eventuele termijnen. Neem bedragen over uit de offerte of factuur.",
  project_scope: "Wat lever je precies op? Vermeld de afgesproken onderdelen en aantallen. Vul eventuele uitsluitingen zelf aan.",
  delivery_target: "De met de klant afgesproken opleverdatum of planning. Een betaaldeadline is geen opleverdatum.",
  maintenance_terms: "Aanvullende afspraken over hosting en onderhoud, zoals diensten, kosten en looptijd. Vul alleen afgesproken toezeggingen in.",
  revisions_included: "Het afgesproken aantal correctierondes. De vooraf ingevulde waarde komt uit het contracttemplate; controleer deze per klant.",
};
export const contractFieldLabels: Record<string, string> = {
  project_name: "Projectnaam",
  price_terms: "Prijs- en betalingsafspraken",
  project_scope: "Projectscope",
  maintenance_terms: "Onderhoud/hosting aanvullende afspraken",
};

const money = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
const quantity = (value: number) => new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 6 }).format(value);
const frequency = { ONE_TIME: "eenmalig", MONTHLY: "per maand", YEARLY: "per jaar" };
const text = (value?: string | null) => value?.trim() || "";
const date = (value: string) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));

export function catalogContractAmounts(priceIncl: number, vatRate: number) {
  const incl = Number(priceIncl);
  const rate = Number(vatRate);
  if (!Number.isFinite(incl) || !Number.isFinite(rate) || rate < 0 || incl < 0) throw new Error("Het catalogusproduct bevat een ongeldige prijs of btw.");
  const ex = Math.round(incl / (1 + rate / 100) * 100) / 100;
  return { total_ex_vat: ex, vat_total: Math.round((incl - ex) * 100) / 100, total_incl_vat: incl };
}

export function buildContractSuggestion(source: ContractSource, customerId: string): ContractSuggestion {
  if (source.customer_id !== customerId) throw new Error("Dit document hoort bij een andere klant.");
  if (source.kind === "catalog" ? source.status !== "ACTIVE" || source.is_active !== true : source.kind === "quote" ? source.status !== "ACCEPTED" : !["FINALIZED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"].includes(source.status) || source.is_active === false) {
    throw new Error("Kies een geaccepteerde offerte, actieve definitieve factuur of actief catalogusproduct.");
  }
  const values = [source.total_ex_vat, source.vat_total, source.total_incl_vat, source.document_discount_ex_vat,
    ...source.items.flatMap(item => [item.quantity, item.line_total_ex_vat, item.line_total_incl_vat])];
  if (values.some(value => value === null || value === undefined || !Number.isFinite(Number(value)))) throw new Error("Het document bevat ongeldige bedragen of aantallen.");
  if (Math.abs(Number(source.total_ex_vat) + Number(source.vat_total) - Number(source.total_incl_vat)) > 0.011) throw new Error("De documenttotalen sluiten niet aan. Controleer eerst de offerte of factuur.");
  if (source.items.some(item => !Object.hasOwn(frequency, item.billing_type))) throw new Error("Een factuurregel heeft een onbekende facturatiefrequentie.");
  const reference = `${source.kind === "catalog" ? "catalogusproduct" : source.kind === "quote" ? "offerte" : "factuur"} ${source.number}`;
  const priceLines = source.items.map(item => `- ${quantity(item.quantity)} × ${text(item.description)}: ${money(Number(item.line_total_ex_vat))} excl. btw (${money(Number(item.line_total_incl_vat))} incl. btw), ${frequency[item.billing_type]}.`);
  const prices = [
    `${source.kind === "catalog" ? "Prijsvoorstel op basis van" : "Volgens"} ${reference}${text(source.title) ? ` — ${text(source.title)}` : ""}.`,
    `${source.kind === "catalog" ? "Pakketprijs" : "Documenttotaal"}: ${money(Number(source.total_ex_vat))} excl. btw + ${money(Number(source.vat_total))} btw = ${money(Number(source.total_incl_vat))} incl. btw.`,
    priceLines.length ? `Posten uit dit document (regelbedragen voor de genoemde aantallen, na regelkorting en vóór eventuele documentkorting):\n${priceLines.join("\n")}` : "",
    Number(source.document_discount_ex_vat) > 0 ? `Korting op het gehele document: ${money(Number(source.document_discount_ex_vat))} excl. btw. Deze korting is al verwerkt in het documenttotaal.` : "",
    source.kind === "invoice" && source.due_date ? `Betaaldatum volgens ${reference}: uiterlijk ${date(source.due_date)}.` : "",
    source.kind === "invoice" ? `Betalingskenmerk: ${text(source.payment_reference) || source.number}.` : "",
    source.kind === "quote" && text(source.terms) ? `Afspraken uit de offerte:\n${text(source.terms)}` : "",
  ].filter(Boolean).join("\n\n");
  const scope = [source.kind !== "invoice" ? text(source.intro_text) : "",
    source.items.length ? `Onderdelen volgens ${reference}:\n${source.items.map(item => `- ${quantity(item.quantity)} × ${text(item.description)} (${frequency[item.billing_type]}).`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
  const recurring = source.items.filter(item => item.billing_type !== "ONE_TIME");
  const fields: Record<string, string> = { project_name: text(source.title), price_terms: prices };
  if (scope) fields["project_scope"] = scope;
  if (recurring.length) fields["maintenance_terms"] = `Terugkerende diensten volgens ${reference}:\n${recurring.map(item => `- ${quantity(item.quantity)} × ${text(item.description)} (${frequency[item.billing_type]}).`).join("\n")}\nBedragen en eventuele documentkorting staan bij de prijs- en betalingsafspraken.`;
  const notes = ["Controleer de opleverplanning en het aantal revisierondes; deze worden niet afgeleid uit het document."];
  if (source.kind === "catalog") notes.push("Dit is een voorstel op basis van de huidige catalogusprijs. Controleer of het pakket en bedrag met de klant zijn afgesproken en vul betaalmomenten of termijnen aan.");
  if (source.kind === "invoice") notes.push("Controleer of deze factuur de volledige opdracht betreft of slechts een termijn, periode of onderdeel daarvan.");
  if (!scope) notes.push("Er staan geen werkzaamheden in dit document. Vul de projectscope zelf aan.");
  if (!recurring.length) notes.push("Er zijn geen terugkerende diensten in dit document gevonden. Controleer eventuele afzonderlijke afspraken over hosting en onderhoud.");
  if (source.items.some(item => item.billing_type !== "ONE_TIME")) notes.push("Het documenttotaal telt de genoemde posten samen. Controleer de eenmalige, maandelijkse en jaarlijkse bedragen afzonderlijk.");
  return { source: { id: source.id, kind: source.kind, number: source.number, title: source.title, customer_id: source.customer_id }, fields, notes };
}

export function currentContractValue(draft: PrefillDraft, key: string): string {
  return key === "project_name" ? draft.project_name || "" : draft.variables[key] || "";
}

export function applyContractSuggestion<T extends PrefillDraft>(draft: T, suggestion: ContractSuggestion, selectedKeys: string[]): T {
  if (draft.status !== "DRAFT") throw new Error("Alleen een conceptcontract kan worden aangevuld.");
  if (draft.customer_id !== suggestion.source.customer_id) throw new Error("Dit document hoort bij een andere klant.");
  const result = { ...draft, variables: { ...draft.variables } };
  for (const key of selectedKeys) {
    // Only known proposed content can be applied; dates, signatures, status and legal clauses never change here.
    if (!Object.hasOwn(contractFieldLabels, key) || !Object.hasOwn(suggestion.fields, key) || !text(suggestion.fields[key])) continue;
    if (key === "project_name") result.project_name = suggestion.fields[key]!;
    else result.variables[key] = suggestion.fields[key]!;
  }
  return result;
}
