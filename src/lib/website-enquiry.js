export function websiteEnquiryUrl(subject, fields) {
  const body = Object.entries(fields).map(([label, value]) => `${label}: ${value || "-"}`).join("\n");
  return `mailto:info@vedantix.nl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Sends a contact enquiry to the contact-enquiry Edge Function.
 * Resolves only when the server confirms storage; rejects with a readable message otherwise,
 * so callers never claim delivery that did not happen.
 */
export async function submitContactEnquiry(fields, sourcePath = "/contact") {
  const { supabase } = await import("./supabase");
  const { data, error } = await supabase.functions.invoke("contact-enquiry", { body: { ...fields, sourcePath } });
  if (error) {
    let message = "Versturen is niet gelukt.";
    try {
      const response = error?.context;
      if (response instanceof Response) {
        const payload = await response.clone().json();
        message = payload?.error || message;
      }
    } catch { /* keep generic message */ }
    throw new Error(message);
  }
  if (!data?.ok) throw new Error("Versturen is niet gelukt.");
  return true;
}
