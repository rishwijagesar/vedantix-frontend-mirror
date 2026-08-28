import { API_BASE_URL } from "./client";

export async function resolveCustomerPreview(slug) {
  const response = await fetch(
    `${API_BASE_URL}/api/preview/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": import.meta.env.VITE_TENANT_ID || "default",
        "X-Actor-Id": "public-preview",
        "X-Source": "API",
      },
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      "Preview kon niet worden geladen.";

    throw new Error(message);
  }

  return payload?.data ?? payload;
}

export async function fetchCustomerPreviewHtml(slug) {
  const response = await fetch(
    `${API_BASE_URL}/api/preview/${encodeURIComponent(slug)}/html`,
    {
      method: "GET",
      headers: {
        "X-Tenant-Id": import.meta.env.VITE_TENANT_ID || "default",
        "X-Actor-Id": "public-preview",
        "X-Source": "API",
      },
    }
  );

  const html = await response.text();

  if (!response.ok) {
    throw new Error(html || "Preview kon niet worden geladen.");
  }

  return html;
}
