import { supabase } from "@/lib/supabase";
import type { BillingItem, BillingType, DiscountType, Quote } from "./sales-billing-data";

export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export type Subscription = {
  id: string;
  subscription_number: string;
  source_quote_id: string | null;
  customer_id: string;
  billing_type: Exclude<BillingType, "ONE_TIME">;
  status: SubscriptionStatus;
  start_date: string;
  next_invoice_date: string;
  last_invoice_date: string | null;
  auto_finalize: boolean;
  discount_type: "NONE" | "PERCENTAGE";
  discount_value: number;
  first_invoice_discount_ex_vat: number;
  company_snapshot: Record<string, unknown>;
  customer_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};

export type SubscriptionItem = Omit<BillingItem, "billing_type"> & {
  subscription_id: string;
};

export type RecurringBillingRun = {
  id: string;
  trigger_source: "CRON" | "MANUAL" | "SYSTEM";
  as_of_date: string;
  status: "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED";
  subscriptions_processed: number;
  invoices_created: number;
  errors: Array<{ subscription_id?: string; message?: string }>;
  started_at: string;
  completed_at: string | null;
};

export type QuoteBillingActivationResult = {
  immediate_invoice_id: string | null;
  monthly_subscription_id: string | null;
  monthly_subscription_number: string | null;
  yearly_subscription_id: string | null;
  yearly_subscription_number: string | null;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function activateQuoteBilling(input: {
  quoteId: string;
  monthlyStartDate?: string | null;
  yearlyStartDate?: string | null;
  autoFinalize?: boolean;
}): Promise<QuoteBillingActivationResult> {
  const { data, error } = await supabase.rpc("activate_quote_billing", {
    p_quote_id: input.quoteId,
    p_monthly_start_date: input.monthlyStartDate || null,
    p_yearly_start_date: input.yearlyStartDate || null,
    p_auto_finalize: input.autoFinalize ?? true,
  });
  fail(error);
  return data as QuoteBillingActivationResult;
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as Subscription[];
}

export async function listSubscriptionItems(): Promise<SubscriptionItem[]> {
  const { data, error } = await supabase.from("subscription_items").select("*").order("position");
  fail(error);
  return (data ?? []) as SubscriptionItem[];
}

export async function listRecurringBillingRuns(limit = 10): Promise<RecurringBillingRun[]> {
  const { data, error } = await supabase.from("recurring_billing_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  fail(error);
  return (data ?? []) as RecurringBillingRun[];
}

export async function updateSubscription(id: string, changes: Partial<Pick<Subscription, "status" | "next_invoice_date" | "auto_finalize">>) {
  const payload: Record<string, unknown> = { ...changes, updated_at: new Date().toISOString() };
  if (changes.status === "CANCELLED") payload["cancelled_at"] = new Date().toISOString();
  if (changes.status === "ACTIVE") payload["cancelled_at"] = null;
  const { data, error } = await supabase.from("subscriptions").update(payload).eq("id", id).select("*").single();
  fail(error);
  return data as Subscription;
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function estimateSubscriptionInvoice(subscription: Subscription, items: SubscriptionItem[]) {
  const ownItems = items.filter((item) => item.subscription_id === subscription.id);
  const subtotalExVat = round2(ownItems.reduce((sum, item) => sum + Number(item.line_total_ex_vat || 0), 0));
  let documentDiscount = 0;
  let discountType: DiscountType = "NONE";
  let discountValue = 0;

  if (!subscription.last_invoice_date && Number(subscription.first_invoice_discount_ex_vat) > 0) {
    documentDiscount = Math.min(subtotalExVat, Number(subscription.first_invoice_discount_ex_vat));
    discountType = "FIXED";
    discountValue = Number(subscription.first_invoice_discount_ex_vat);
  } else if (subscription.discount_type === "PERCENTAGE") {
    documentDiscount = round2(subtotalExVat * Math.min(Number(subscription.discount_value), 100) / 100);
    discountType = "PERCENTAGE";
    discountValue = Number(subscription.discount_value);
  }

  const totalExVat = round2(Math.max(0, subtotalExVat - documentDiscount));
  const ratio = subtotalExVat > 0 ? totalExVat / subtotalExVat : 1;
  const vat = round2(ownItems.reduce((sum, item) => sum + round2(Number(item.line_total_ex_vat || 0) * ratio * Number(item.vat_rate || 0) / 100), 0));
  return {
    itemCount: ownItems.length,
    subtotalExVat,
    documentDiscount,
    totalExVat,
    vat,
    totalInclVat: round2(totalExVat + vat),
    discountType,
    discountValue,
  };
}

export function quoteHasRecurringItems(items: BillingItem[]) {
  return items.some((item) => item.billing_type === "MONTHLY" || item.billing_type === "YEARLY");
}

export function quoteRecurringTypes(items: BillingItem[]) {
  return {
    hasOneTime: items.some((item) => item.billing_type === "ONE_TIME"),
    hasMonthly: items.some((item) => item.billing_type === "MONTHLY"),
    hasYearly: items.some((item) => item.billing_type === "YEARLY"),
  };
}

export type BillingActivationQuote = Pick<Quote, "id" | "status" | "discount_type" | "billing_activated_at">;
