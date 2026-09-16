-- Billing usability fixes for the first production customer.
-- Keep the legacy inclusive catalog price as a compatibility field while the
-- canonical editable price becomes excluding VAT.

alter table public.customers
  add column if not exists iban text;

alter table public.product_catalog
  add column if not exists price_ex_vat numeric(12,2);

update public.product_catalog
set price_ex_vat = price_incl_vat
where price_ex_vat is null;

alter table public.product_catalog
  alter column price_ex_vat set default 0,
  alter column price_ex_vat set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_catalog'::regclass
      and conname = 'product_catalog_price_ex_vat_check'
  ) then
    alter table public.product_catalog
      add constraint product_catalog_price_ex_vat_check check (price_ex_vat >= 0);
  end if;
end $$;

create or replace function public.sync_product_catalog_prices()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  divisor numeric;
begin
  divisor := 1 + (coalesce(new.vat_rate, 0) / 100);

  if tg_op = 'INSERT' then
    if new.price_ex_vat is null then
      new.price_ex_vat := round(coalesce(new.price_incl_vat, 0) / nullif(divisor, 0), 2);
    end if;
  elsif new.price_ex_vat is not distinct from old.price_ex_vat
    and new.price_incl_vat is distinct from old.price_incl_vat then
    -- Compatibility with the previously deployed catalog editor.
    new.price_ex_vat := round(coalesce(new.price_incl_vat, 0) / nullif(divisor, 0), 2);
  end if;

  new.price_ex_vat := coalesce(new.price_ex_vat, 0);
  new.price_incl_vat := round(new.price_ex_vat * divisor, 2);
  return new;
end;
$$;

drop trigger if exists product_catalog_sync_prices on public.product_catalog;
create trigger product_catalog_sync_prices
before insert or update of price_ex_vat, price_incl_vat, vat_rate
on public.product_catalog
for each row execute function public.sync_product_catalog_prices();

-- Existing catalog numbers were entered by the operator as the intended package
-- prices. Preserve those numbers as excl. VAT and derive the compatibility value.
update public.product_catalog
set price_incl_vat = round(price_ex_vat * (1 + vat_rate / 100), 2);

alter table public.invoices
  add column if not exists is_active boolean not null default true;

create index if not exists invoices_active_created_idx
  on public.invoices (is_active, created_at desc);
