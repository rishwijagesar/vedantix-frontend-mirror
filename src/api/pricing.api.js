import { fetchPublicCatalog } from "../lib/public-content";

export async function fetchPackages() {
  const products = await fetchPublicCatalog();
  return products.filter(p => p.category.toUpperCase() === "WEBSITE").map(p => ({
    code: p.code, label: p.name.split(/[—–]/)[0].trim(), description: p.description,
    featured: p.code === "GROWTH", isActive: true, sortOrder: p.sort_order,
    monthlyPriceInclVat: p.billing_type === "MONTHLY" ? Number(p.price_incl_vat) : 0,
    setupPriceInclVat: p.billing_type === "ONE_TIME" ? Number(p.price_incl_vat) : 0,
    setupPriceExVat: p.billing_type === "ONE_TIME" ? Number(p.price_ex_vat) : 0,
    included: p.description ? [p.description] : [],
    cancelNote: "De actuele catalogusprijs geldt. Hosting en aanvullende diensten worden apart gekozen.",
  }));
}
export async function fetchPricingSummary() { return { packages: await fetchPackages() }; }
