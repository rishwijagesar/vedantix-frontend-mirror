import { supabase } from "@/lib/supabase";
import { catalogContractAmounts } from "./contract-prefill";
import type { ContractSource, ContractSourceItem, ContractSourceOption } from "./contract-prefill";

const invoiceStatuses = ["FINALIZED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"];
const commonColumns = "id,customer_id,title,status,total_ex_vat,vat_total,total_incl_vat,document_discount_ex_vat,notes";

export async function listContractSources(customerId: string): Promise<ContractSourceOption[]> {
  const list = async (kind: "quote" | "invoice"): Promise<ContractSourceOption[]> => {
    const result: ContractSourceOption[] = [];
    for (let offset = 0; ; offset += 100) {
      let query = supabase.from(kind === "quote" ? "quotes" : "invoices")
        .select(`id,customer_id,title,${kind === "quote" ? "quote_number" : "invoice_number"}`)
        .eq("customer_id", customerId).order("created_at", { ascending: false }).order("id").range(offset, offset + 99);
      query = kind === "quote" ? query.eq("status", "ACCEPTED") : query.in("status", invoiceStatuses).eq("is_active", true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const rows = (data || []) as unknown as Array<{ id: string; customer_id: string; title: string; quote_number?: string; invoice_number?: string }>;
      result.push(...rows.map(row => ({ id: row.id, kind, customer_id: row.customer_id, title: row.title, number: row.quote_number || row.invoice_number || "Zonder nummer" })));
      if (rows.length < 100) return result;
    }
  };
  const catalog = async (): Promise<ContractSourceOption[]> => {
    const result: ContractSourceOption[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await supabase.from("product_catalog").select("id,code,name")
        .eq("active", true).order("sort_order").order("id").range(offset, offset + 99);
      if (error) throw new Error(error.message);
      result.push(...(data || []).map(row => ({ id: row.id, kind: "catalog" as const, customer_id: customerId, number: row.code, title: row.name })));
      if (!data || data.length < 100) return result;
    }
  };
  const [quotes, invoices, products] = await Promise.all([list("quote"), list("invoice"), catalog()]);
  return [...quotes, ...invoices, ...products];
}

export async function getContractSource(option: ContractSourceOption, customerId: string, customerName = ""): Promise<ContractSource> {
  if (option.customer_id !== customerId) throw new Error("Dit document hoort bij een andere klant.");
  if (option.kind === "catalog") {
    const { data: product, error } = await supabase.from("product_catalog")
      .select("id,code,name,description,price_incl_vat,vat_rate,billing_type").eq("id", option.id).eq("active", true).single();
    if (error) throw new Error("Het catalogusproduct kon niet worden geladen. Vernieuw de bronnen en probeer opnieuw.");
    const amounts = catalogContractAmounts(product.price_incl_vat, product.vat_rate);
    return { ...option, title: `${product.name}${customerName ? ` — ${customerName}` : ""}`, number: product.code,
      status: "ACTIVE", is_active: true, ...amounts, document_discount_ex_vat: 0, intro_text: product.description,
      items: [{ description: product.name, quantity: 1, billing_type: product.billing_type, line_total_ex_vat: amounts.total_ex_vat, line_total_incl_vat: amounts.total_incl_vat }] };
  }
  const isQuote = option.kind === "quote";
  // All reads use the logged-in staff user's existing RLS, including both customer and document filters.
  let query = supabase.from(isQuote ? "quotes" : "invoices")
    .select(`${commonColumns},${isQuote ? "quote_number,intro_text,terms" : "invoice_number,is_active,due_date,payment_reference"}`)
    .eq("id", option.id).eq("customer_id", customerId);
  query = isQuote ? query.eq("status", "ACCEPTED") : query.in("status", invoiceStatuses).eq("is_active", true);
  const { data, error } = await query.single();
  if (error) throw new Error("Het brondocument kon niet worden geladen. Vernieuw de bronnen en probeer opnieuw.");
  const items: ContractSourceItem[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data: rows, error: itemError } = await supabase.from(isQuote ? "quote_items" : "invoice_items")
      .select("description,quantity,billing_type,line_total_ex_vat,line_total_incl_vat")
      .eq(isQuote ? "quote_id" : "invoice_id", option.id).order("position").order("id").range(offset, offset + 99);
    if (itemError) throw new Error(itemError.message);
    items.push(...(rows || []) as ContractSourceItem[]);
    if (!rows || rows.length < 100) break;
  }
  const row = data as unknown as ContractSource & { quote_number?: string; invoice_number?: string };
  return { ...row, kind: option.kind, number: row.quote_number || row.invoice_number || option.number, items };
}
