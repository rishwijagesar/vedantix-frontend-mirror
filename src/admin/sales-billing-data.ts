import { supabase } from "@/lib/supabase";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";
export type BillingType = "ONE_TIME" | "MONTHLY" | "YEARLY";
export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type InvoiceStatus = "DRAFT" | "FINALIZED" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CREDITED";

export type CompanyProfile = {
  id: boolean;
  trade_name: string;
  legal_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  kvk_number: string | null;
  vat_number: string | null;
  iban: string | null;
  bic: string | null;
  email: string;
  phone: string | null;
  website: string;
  default_payment_term_days: number;
  default_quote_valid_days: number;
  default_vat_rate: number;
  quote_prefix: string;
  invoice_prefix: string;
  credit_prefix: string;
  accent_hex: string;
  terms_url: string | null;
  updated_at: string;
};

export type CatalogProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  billing_type: BillingType;
  price_incl_vat: number;
  vat_rate: number;
  active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type BillingItem = {
  id: string;
  position: number;
  catalog_product_id: string | null;
  code: string | null;
  description: string;
  quantity: number;
  unit_price_ex_vat: number;
  vat_rate: number;
  discount_type: DiscountType;
  discount_value: number;
  line_subtotal_ex_vat: number;
  line_discount_ex_vat: number;
  line_total_ex_vat: number;
  line_vat: number;
  line_total_incl_vat: number;
};

export type Quote = {
  id: string;
  quote_number: string;
  customer_id: string;
  status: QuoteStatus;
  quote_date: string;
  valid_until: string | null;
  title: string;
  intro_text: string | null;
  notes: string | null;
  terms: string | null;
  discount_type: DiscountType;
  discount_value: number;
  subtotal_ex_vat: number;
  line_discount_ex_vat: number;
  document_discount_ex_vat: number;
  total_ex_vat: number;
  vat_total: number;
  total_incl_vat: number;
  company_snapshot: Record<string, unknown> | null;
  customer_snapshot: Record<string, unknown> | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string | null;
  source_quote_id: string | null;
  customer_id: string;
  status: InvoiceStatus;
  invoice_date: string | null;
  delivery_date: string | null;
  due_date: string | null;
  title: string;
  notes: string | null;
  payment_reference: string | null;
  discount_type: DiscountType;
  discount_value: number;
  subtotal_ex_vat: number;
  line_discount_ex_vat: number;
  document_discount_ex_vat: number;
  total_ex_vat: number;
  vat_total: number;
  total_incl_vat: number;
  amount_paid: number;
  company_snapshot: Record<string, unknown> | null;
  customer_snapshot: Record<string, unknown> | null;
  finalized_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditNote = {
  id: string;
  credit_number: string | null;
  invoice_id: string;
  customer_id: string;
  status: "DRAFT" | "FINALIZED" | "SENT";
  credit_date: string | null;
  reason: string | null;
  total_ex_vat: number;
  vat_total: number;
  total_incl_vat: number;
  company_snapshot: Record<string, unknown> | null;
  customer_snapshot: Record<string, unknown> | null;
  finalized_at: string | null;
  sent_at: string | null;
  created_at: string;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function priceExVatFromIncl(priceIncl: number, vatRate: number) {
  return Math.round((priceIncl / (1 + vatRate / 100)) * 100) / 100;
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const { data, error } = await supabase.from("company_profile").select("*").eq("id", true).single();
  fail(error);
  return data as CompanyProfile;
}

export async function updateCompanyProfile(changes: Partial<CompanyProfile>): Promise<CompanyProfile> {
  const { id: _id, updated_at: _updatedAt, ...safe } = changes;
  const { data, error } = await supabase
    .from("company_profile")
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("*")
    .single();
  fail(error);
  return data as CompanyProfile;
}

export async function listCatalogProducts(includeInactive = true): Promise<CatalogProduct[]> {
  let query = supabase.from("product_catalog").select("*").order("sort_order").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  fail(error);
  return (data ?? []) as CatalogProduct[];
}

export async function createCatalogProduct(input: Omit<CatalogProduct, "id" | "created_at" | "updated_at" | "metadata"> & { metadata?: Record<string, unknown> }) {
  const { data, error } = await supabase.from("product_catalog").insert(input).select("*").single();
  fail(error);
  return data as CatalogProduct;
}

export async function updateCatalogProduct(id: string, changes: Partial<CatalogProduct>) {
  const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...safe } = changes;
  const { data, error } = await supabase.from("product_catalog").update({ ...safe, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  fail(error);
  return data as CatalogProduct;
}

export async function deleteCatalogProduct(id: string) {
  const { error } = await supabase.from("product_catalog").delete().eq("id", id);
  fail(error);
}

export async function listQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as Quote[];
}

export async function getQuote(id: string): Promise<Quote> {
  const { data, error } = await supabase.from("quotes").select("*").eq("id", id).single();
  fail(error);
  return data as Quote;
}

export async function listQuoteItems(quoteId: string): Promise<BillingItem[]> {
  const { data, error } = await supabase.from("quote_items").select("*").eq("quote_id", quoteId).order("position");
  fail(error);
  return (data ?? []) as BillingItem[];
}

export async function createQuote(customerId: string): Promise<Quote> {
  const { data, error } = await supabase.from("quotes").insert({ customer_id: customerId }).select("*").single();
  fail(error);
  return data as Quote;
}

export async function updateQuote(id: string, changes: Partial<Quote>): Promise<Quote> {
  const { id: _id, quote_number: _number, created_at: _createdAt, updated_at: _updatedAt, company_snapshot: _cs, customer_snapshot: _cus, ...safe } = changes;
  const { data, error } = await supabase.from("quotes").update({ ...safe, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  fail(error);
  return data as Quote;
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  const now = new Date().toISOString();
  const extra = status === "SENT" ? { sent_at: now } : status === "ACCEPTED" ? { accepted_at: now } : status === "REJECTED" ? { rejected_at: now } : {};
  return updateQuote(id, { status, ...extra });
}

export async function deleteQuote(id: string) {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  fail(error);
}

export async function addQuoteItem(quoteId: string, input: {
  position?: number; catalog_product_id?: string | null; code?: string | null; description: string; quantity?: number; unit_price_ex_vat: number; vat_rate?: number; discount_type?: DiscountType; discount_value?: number;
}) {
  const { data, error } = await supabase.from("quote_items").insert({ quote_id: quoteId, ...input }).select("*").single();
  fail(error);
  return data as BillingItem;
}

export async function updateQuoteItem(id: string, changes: Partial<BillingItem>) {
  const { id: _id, ...safe } = changes;
  const { data, error } = await supabase.from("quote_items").update(safe).eq("id", id).select("*").single();
  fail(error);
  return data as BillingItem;
}

export async function deleteQuoteItem(id: string) {
  const { error } = await supabase.from("quote_items").delete().eq("id", id);
  fail(error);
}

export async function listInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
  fail(error);
  return data as Invoice;
}

export async function listInvoiceItems(invoiceId: string): Promise<BillingItem[]> {
  const { data, error } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId).order("position");
  fail(error);
  return (data ?? []) as BillingItem[];
}

export async function createInvoice(customerId: string): Promise<Invoice> {
  const { data, error } = await supabase.from("invoices").insert({ customer_id: customerId }).select("*").single();
  fail(error);
  return data as Invoice;
}

export async function updateInvoice(id: string, changes: Partial<Invoice>): Promise<Invoice> {
  const { id: _id, invoice_number: _number, created_at: _createdAt, updated_at: _updatedAt, company_snapshot: _cs, customer_snapshot: _cus, ...safe } = changes;
  const { data, error } = await supabase.from("invoices").update({ ...safe, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  fail(error);
  return data as Invoice;
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  fail(error);
}

export async function addInvoiceItem(invoiceId: string, input: {
  position?: number; catalog_product_id?: string | null; code?: string | null; description: string; quantity?: number; unit_price_ex_vat: number; vat_rate?: number; discount_type?: DiscountType; discount_value?: number;
}) {
  const { data, error } = await supabase.from("invoice_items").insert({ invoice_id: invoiceId, ...input }).select("*").single();
  fail(error);
  return data as BillingItem;
}

export async function updateInvoiceItem(id: string, changes: Partial<BillingItem>) {
  const { id: _id, ...safe } = changes;
  const { data, error } = await supabase.from("invoice_items").update(safe).eq("id", id).select("*").single();
  fail(error);
  return data as BillingItem;
}

export async function deleteInvoiceItem(id: string) {
  const { error } = await supabase.from("invoice_items").delete().eq("id", id);
  fail(error);
}

export async function quoteToInvoice(quoteId: string): Promise<string> {
  const { data, error } = await supabase.rpc("quote_to_invoice", { p_quote_id: quoteId });
  fail(error);
  return data as string;
}

export async function finalizeInvoice(invoiceId: string): Promise<string> {
  const { data, error } = await supabase.rpc("finalize_invoice", { p_invoice_id: invoiceId });
  fail(error);
  return data as string;
}

export async function createFullCreditNote(invoiceId: string, reason: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_full_credit_note", { p_invoice_id: invoiceId, p_reason: reason || null });
  fail(error);
  return data as string;
}

export async function listCreditNotes(): Promise<CreditNote[]> {
  const { data, error } = await supabase.from("credit_notes").select("*").order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as CreditNote[];
}

export async function markInvoicePaid(invoice: Invoice, amount?: number) {
  const paid = amount ?? invoice.total_incl_vat;
  const status: InvoiceStatus = paid >= invoice.total_incl_vat ? "PAID" : "PARTIALLY_PAID";
  return updateInvoice(invoice.id, { amount_paid: paid, status, paid_at: status === "PAID" ? new Date().toISOString() : null });
}

export async function getBillingDashboard() {
  const [quotes, invoices] = await Promise.all([listQuotes(), listInvoices()]);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const openQuotes = quotes.filter((q) => ["DRAFT", "SENT"].includes(q.status)).length;
  const outstanding = invoices.filter((i) => ["FINALIZED", "SENT", "PARTIALLY_PAID", "OVERDUE"].includes(i.status)).reduce((sum, i) => sum + Math.max(0, Number(i.total_incl_vat) - Number(i.amount_paid)), 0);
  const overdue = invoices.filter((i) => i.due_date && new Date(i.due_date) < now && !["PAID", "CREDITED"].includes(i.status)).reduce((sum, i) => sum + Math.max(0, Number(i.total_incl_vat) - Number(i.amount_paid)), 0);
  const monthRevenue = invoices.filter((i) => i.finalized_at && new Date(i.finalized_at) >= monthStart && !["DRAFT", "CREDITED"].includes(i.status)).reduce((sum, i) => sum + Number(i.total_incl_vat), 0);
  return { openQuotes, outstanding, overdue, monthRevenue };
}
