import { serviceForCode } from "../data/services";
export const money = value => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value));
export const period = type => type === "MONTHLY" ? "per maand" : type === "YEARLY" ? "per jaar" : "eenmalig";
export default function ServicePrices({ products = [], details = false }) {
  return <div className="service-price-grid">{products.map(product => <article className="service-price" key={product.code}>
    <h3>{product.name}</h3><p>{product.description}</p>
    <div className="service-amount">{product.from_price ? "Vanaf " : ""}{money(product.price_ex_vat)} <small>excl. btw</small></div>
    <div>{money(product.price_incl_vat)} incl. btw · {period(product.billing_type)}</div>
    {details && serviceForCode(product.code) ? <a href={`/${serviceForCode(product.code).slug}`}>Bekijk inhoud en voorwaarden →</a> : <a href="/contact">Bespreek je project →</a>}
  </article>)}</div>;
}
