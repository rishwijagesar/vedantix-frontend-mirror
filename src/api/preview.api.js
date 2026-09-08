const PREVIEW_MESSAGE =
  "Deze oude klantpreview is niet meer gekoppeld aan de voormalige provisioning-backend. Vraag Vedantix om een nieuwe previewlink.";

function unavailable() {
  throw new Error(PREVIEW_MESSAGE);
}

export async function resolveCustomerPreview() {
  return unavailable();
}

export async function fetchCustomerPreviewHtml() {
  return unavailable();
}
