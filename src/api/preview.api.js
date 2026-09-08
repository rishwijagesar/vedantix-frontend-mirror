const LEGACY_PREVIEW_MESSAGE =
  "Deze oude klantpreview gebruikt de voormalige Vedantix provisioning-backend niet meer. Vraag Vedantix om een nieuwe previewlink.";

function unavailable() {
  throw new Error(LEGACY_PREVIEW_MESSAGE);
}

export async function resolveCustomerPreview() {
  return unavailable();
}

export async function fetchCustomerPreviewHtml() {
  return unavailable();
}
