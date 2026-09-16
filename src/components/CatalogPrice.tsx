import { fetchPublicCatalog } from "../lib/public-content";
import { usePublicContent } from "../lib/use-public-content";
export default function CatalogPrice({ code }: { code: string }) {
  const { data } = usePublicContent(fetchPublicCatalog);
  const product = data.find(p => p.code === code);
  if (!product) return <a href="/prijzen">Actuele prijs</a>;
  const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
  return <span>{money.format(product.price_ex_vat)} excl. btw ({money.format(product.price_incl_vat)} incl.)</span>;
}
