type Line = { id: string; description: string; billing_type: string; line_total_ex_vat: number | string };
export function annualInvoicePlan<T extends Line>(invoice: { status: string; is_active?: boolean; subscription_id?: string | null; source_quote_id?: string | null }, lines: T[], start: string) {
  const items = lines.filter(i => i.billing_type === 'YEARLY');
  let nextDate = '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(start) && Number.isFinite(Date.parse(start)) && new Date(start).toISOString().slice(0, 10) === start) {
    const [year, month, day] = start.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year + 1, month, 0)).getUTCDate();
    nextDate = `${year + 1}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }
  const total = items.reduce((n, i) => n + Math.round(Number(i.line_total_ex_vat) * 100), 0) / 100;
  const error = !['FINALIZED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].includes(invoice.status) || invoice.is_active === false ? 'Maak de factuur eerst definitief en actief.' : invoice.subscription_id || invoice.source_quote_id ? 'Deze factuur hoort bij een bestaand facturatietraject. Beheer de jaarfacturatie via Abonnementen of de oorspronkelijke offerte.' : !nextDate ? 'Vul een geldige startdatum in.' : !items.length || total <= 0 || !Number.isFinite(total) ? 'Er zijn geen geldige jaarlijkse factuurregels.' : '';
  return { items, total, nextDate, hasYearly: items.length > 0, error };
}
