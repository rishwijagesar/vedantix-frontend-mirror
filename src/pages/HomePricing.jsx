import { Link } from "@/lib/router-compat";
import { fetchPublicCatalog } from "../lib/public-content";
import { usePublicContent } from "../lib/use-public-content";
import "../styles/home-pricing.css";
const moneyFormat = digits => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = { format: value => moneyFormat(Number.isInteger(Number(value)) ? 0 : 2).format(Number(value)) };
export default function HomePricing() {
  const { data, loading, error } = usePublicContent(fetchPublicCatalog);
  const packages = data.filter(p => p.category.toUpperCase() === "WEBSITE");
  return <section id="pricing" className="pricing-section anchor-section"><div className="section-wrap">
    <div className="section-header center"><div className="section-label">Pakketten</div><h2 className="section-h2">Een website die past bij jouw bedrijf</h2><p className="section-p">Bekijk de actuele catalogusprijzen. Hosting en aanvullende diensten kies je apart.</p></div>
    {loading ? <p role="status">Actuele prijzen laden…</p> : null}{error ? <p role="alert">Prijzen tijdelijk niet beschikbaar. Neem contact op voor een offerte.</p> : null}
    <div className="pricing-grid">{packages.map(p => <article key={p.code} className={`pricing-card ${p.code === "GROWTH" ? "featured" : ""}`}><div className="p-tier">{p.name}</div><p>{p.description}</p><div className="p-price">{money.format(p.price_ex_vat)}</div><div className="p-terms">excl. btw · {money.format(p.price_incl_vat)} incl. btw · {p.billing_type === "MONTHLY" ? "per maand" : p.billing_type === "YEARLY" ? "per jaar" : "eenmalig"}</div><Link to="/prijzen" className="p-cta default">Bekijk dit pakket →</Link></article>)}</div>
    <div className="pricing-help"><Link to="/prijzen">Vergelijk alle pakketten, hosting en uitbreidingen →</Link></div>
  </div></section>;
}
