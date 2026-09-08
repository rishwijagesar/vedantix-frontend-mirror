const BILLING_PDF_ENDPOINT = "https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/billing-pdf";

export function billingPdfUrl(kind: "quote" | "invoice", token: string) {
  const params = new URLSearchParams({ kind, token });
  return `${BILLING_PDF_ENDPOINT}?${params.toString()}`;
}
