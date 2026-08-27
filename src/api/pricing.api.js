import { apiClient } from "./client";

export async function fetchPricingSummary() {
  return apiClient.get("/api/pricing");
}

export async function fetchPackages() {
  const summary = await fetchPricingSummary();
  return summary?.packages || [];
}

