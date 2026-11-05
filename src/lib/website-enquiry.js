export function websiteEnquiryUrl(subject, fields) {
  const body = Object.entries(fields).map(([label, value]) => `${label}: ${value || "-"}`).join("\n");
  return `mailto:info@vedantix.nl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}