create index if not exists company_profile_updated_by_idx on public.company_profile(updated_by);
create index if not exists quotes_created_by_idx on public.quotes(created_by);
create index if not exists quote_items_catalog_product_idx on public.quote_items(catalog_product_id);
create index if not exists invoices_created_by_idx on public.invoices(created_by);
create index if not exists invoice_items_catalog_product_idx on public.invoice_items(catalog_product_id);
create index if not exists credit_notes_customer_idx on public.credit_notes(customer_id);
create index if not exists credit_notes_created_by_idx on public.credit_notes(created_by);
create index if not exists monitoring_notifications_alert_id_idx on public.monitoring_notifications(alert_id);
