import { supabase } from "@/lib/supabase";
import { createQuote, type Quote } from "./sales-billing-data";

export type LeadStage = "NEW" | "CONTACT" | "CONVERSATION" | "QUOTE" | "WON" | "LOST";
export type LeadSource = "AUDIT" | "CONTACT" | "WHATSAPP" | "MANUAL" | "OTHER";
export type LeadActivityType =
  | "AUDIT_ATTACHED"
  | "NOTE"
  | "STAGE_CHANGED"
  | "FOLLOW_UP"
  | "CONTACTED"
  | "QUOTE_CREATED"
  | "WON"
  | "LOST";

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "Nieuw",
  CONTACT: "Contact opnemen",
  CONVERSATION: "Gesprek",
  QUOTE: "Offerte",
  WON: "Gewonnen",
  LOST: "Verloren",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  AUDIT: "Online Groei Audit",
  CONTACT: "Contactformulier",
  WHATSAPP: "WhatsApp",
  MANUAL: "Handmatig",
  OTHER: "Overig",
};

export const LEAD_STAGES: LeadStage[] = ["NEW", "CONTACT", "CONVERSATION", "QUOTE", "WON", "LOST"];
const ACTIVE_STAGES: LeadStage[] = ["NEW", "CONTACT", "CONVERSATION", "QUOTE"];

export type LeadCustomer = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
};

export type LeadAudit = {
  id: string;
  public_token: string;
  status: string;
  request: Record<string, unknown>;
  results: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
};

export type LeadQuote = {
  id: string;
  quote_number: string | null;
  status: string;
  total_incl_vat: number;
  created_at: string;
};

export type SalesLead = {
  id: string;
  customer_id: string;
  source: LeadSource;
  stage: LeadStage;
  score: number;
  website_url: string | null;
  latest_audit_id: string | null;
  latest_quote_id: string | null;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  stage_updated_at: string;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: LeadCustomer;
  latest_audit: LeadAudit | null;
  latest_quote: LeadQuote | null;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  activity_type: LeadActivityType;
  body: string | null;
  audit_id: string | null;
  quote_id: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const leadSelect = `
  *,
  customer:customers!sales_leads_customer_id_fkey(id,company_name,contact_name,email,phone,status),
  latest_audit:online_growth_audits!sales_leads_latest_audit_id_fkey(id,public_token,status,request,results,created_at,completed_at),
  latest_quote:quotes!sales_leads_latest_quote_id_fkey(id,quote_number,status,total_incl_vat,created_at)
`;

export async function listSalesLeads(): Promise<SalesLead[]> {
  const { data, error } = await supabase
    .from("sales_leads")
    .select(leadSelect)
    .order("updated_at", { ascending: false });
  fail(error);
  return (data ?? []) as unknown as SalesLead[];
}

export async function getSalesLead(id: string): Promise<SalesLead> {
  const { data, error } = await supabase.from("sales_leads").select(leadSelect).eq("id", id).single();
  fail(error);
  return data as unknown as SalesLead;
}

export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from("sales_lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as LeadActivity[];
}

export async function updateSalesLead(
  id: string,
  changes: Partial<Pick<SalesLead, "stage" | "score" | "website_url" | "next_follow_up_at" | "last_contacted_at" | "lost_reason" | "notes" | "latest_quote_id">>,
): Promise<SalesLead> {
  const { data, error } = await supabase
    .from("sales_leads")
    .update(changes)
    .eq("id", id)
    .select(leadSelect)
    .single();
  fail(error);
  return data as unknown as SalesLead;
}

export async function addLeadActivity(
  leadId: string,
  activityType: LeadActivityType,
  body?: string | null,
  metadata: Record<string, unknown> = {},
): Promise<LeadActivity> {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("sales_lead_activities")
    .insert({
      lead_id: leadId,
      activity_type: activityType,
      body: body?.trim() || null,
      metadata,
      created_by: authData.user?.id ?? null,
    })
    .select("*")
    .single();
  fail(error);
  return data as LeadActivity;
}

export async function addLeadNote(leadId: string, note: string) {
  const clean = note.trim();
  if (!clean) return;
  await addLeadActivity(leadId, "NOTE", clean);
}

export async function scheduleLeadFollowUp(leadId: string, isoDate: string | null, note?: string) {
  await updateSalesLead(leadId, { next_follow_up_at: isoDate });
  await addLeadActivity(
    leadId,
    "FOLLOW_UP",
    note?.trim() || (isoDate ? `Follow-up gepland voor ${new Date(isoDate).toLocaleString("nl-NL")}` : "Follow-up verwijderd"),
    { next_follow_up_at: isoDate },
  );
}

export async function markLeadContacted(lead: SalesLead, note?: string) {
  const now = new Date().toISOString();
  await updateSalesLead(lead.id, {
    last_contacted_at: now,
    stage: lead.stage === "NEW" ? "CONTACT" : lead.stage,
  });
  await addLeadActivity(lead.id, "CONTACTED", note?.trim() || "Contactmoment geregistreerd");
}

export async function changeLeadStage(leadId: string, stage: LeadStage, lostReason?: string | null) {
  return updateSalesLead(leadId, {
    stage,
    lost_reason: stage === "LOST" ? lostReason?.trim() || "Geen reden opgegeven" : null,
  });
}

export async function createManualLead(input: {
  companyName: string;
  contactName?: string;
  email: string;
  phone?: string;
  websiteUrl?: string;
  source?: LeadSource;
  note?: string;
}): Promise<SalesLead> {
  const companyName = input.companyName.trim();
  const email = input.email.trim().toLowerCase();
  if (!companyName || !email) throw new Error("Bedrijfsnaam en e-mailadres zijn verplicht.");

  const { data: existingCustomer, error: customerLookupError } = await supabase
    .from("customers")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  fail(customerLookupError);

  let customerId = existingCustomer?.id as string | undefined;
  if (!customerId) {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        company_name: companyName,
        contact_name: input.contactName?.trim() || null,
        email,
        phone: input.phone?.trim() || null,
        status: "LEAD",
      })
      .select("id")
      .single();
    fail(error);
    customerId = customer.id as string;
  }

  const { data: existingLead, error: leadLookupError } = await supabase
    .from("sales_leads")
    .select("id")
    .eq("customer_id", customerId)
    .in("stage", ACTIVE_STAGES)
    .limit(1)
    .maybeSingle();
  fail(leadLookupError);

  let leadId = existingLead?.id as string | undefined;
  if (!leadId) {
    const { data: lead, error } = await supabase
      .from("sales_leads")
      .insert({
        customer_id: customerId,
        source: input.source ?? "MANUAL",
        stage: "NEW",
        score: input.source === "AUDIT" ? 40 : 25,
        website_url: input.websiteUrl?.trim() || null,
      })
      .select("id")
      .single();
    fail(error);
    leadId = lead.id as string;
  }

  if (input.note?.trim()) await addLeadNote(leadId, input.note);
  return getSalesLead(leadId);
}

export async function createQuoteForLead(lead: SalesLead): Promise<Quote> {
  const quote = await createQuote(lead.customer_id);
  await updateSalesLead(lead.id, { latest_quote_id: quote.id, stage: "QUOTE" });
  return quote;
}
