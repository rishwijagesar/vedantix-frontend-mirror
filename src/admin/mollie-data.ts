import { supabase } from "@/lib/supabase";

export type PaymentProviderConfig = {
  id: boolean;
  provider: "MOLLIE";
  enabled: boolean;
  mode: "TEST" | "LIVE";
  credentials_configured: boolean;
  updated_at: string;
};

export type PaymentRequest = {
  id: string;
  invoice_id: string;
  provider: "MOLLIE";
  provider_payment_id: string | null;
  amount: number;
  currency: "EUR";
  status: "CREATING" | "OPEN" | "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELED" | "EXPIRED";
  checkout_url: string | null;
  provider_created_at: string | null;
  provider_paid_at: string | null;
  webhook_received_at: string | null;
  created_at: string;
  invoices?: { invoice_number: string | null; status: string; total_incl_vat: number; amount_paid: number } | null;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getPaymentProviderConfig(): Promise<PaymentProviderConfig> {
  const { data, error } = await supabase.from("payment_provider_config").select("*").eq("id", true).single();
  fail(error);
  return data as PaymentProviderConfig;
}

export async function setPaymentProviderEnabled(enabled: boolean): Promise<PaymentProviderConfig> {
  const { data, error } = await supabase.functions.invoke("mollie-credentials", {
    body: { action: "set_enabled", enabled },
  });
  if (error) throw error;
  if (!data?.ok || !data?.config) throw new Error(data?.error || "Mollie-checkout kon niet worden gewijzigd.");
  return data.config as PaymentProviderConfig;
}

export async function listPaymentRequests(limit = 100): Promise<PaymentRequest[]> {
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*, invoices(invoice_number,status,total_incl_vat,amount_paid)")
    .order("created_at", { ascending: false })
    .limit(limit);
  fail(error);
  return (data ?? []) as PaymentRequest[];
}

export async function saveMollieCredentials(apiKey: string, mode: "TEST" | "LIVE") {
  const { data, error } = await supabase.functions.invoke("mollie-credentials", {
    body: { action: "save", api_key: apiKey, mode },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Mollie-configuratie kon niet worden opgeslagen.");
  return data;
}

export async function testMollieCredentials() {
  const { data, error } = await supabase.functions.invoke("mollie-credentials", { body: { action: "test" } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Mollie-verbinding kon niet worden getest.");
  return data;
}

export async function startMollieTestPayment() {
  const { data, error } = await supabase.functions.invoke("mollie-test-payment", { body: {} });
  if (error) throw error;
  if (!data?.ok || !data?.checkout_url) throw new Error(data?.error || "Mollie-testbetaling kon niet worden gestart.");
  return data as {
    ok: true;
    test: true;
    amount: string;
    invoice_id: string;
    invoice_number: string;
    payment_request_id: string;
    checkout_url: string;
    status: string;
  };
}
