-- Planning figures only: no accounting entries, invoices or provider changes.
create schema if not exists customer_costs_private;
revoke all on schema customer_costs_private from public, anon, authenticated;

create table public.customer_costs (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 200),
  supplier text not null default '' check(length(supplier)<=200),
  category text not null check(category in ('hosting','email','domain','software','maintenance','other')),
  amount numeric not null check(amount between 0 and 99999999 and amount=round(amount,2)),
  period text not null check(period in ('MONTHLY','QUARTERLY','YEARLY')),
  notes text not null default '' check(length(notes)<=2000),
  archived boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.customer_cost_allocations (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.customer_costs(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  unique(cost_id,customer_id)
);
create index customer_cost_allocations_customer_idx on public.customer_cost_allocations(customer_id);
create table public.customer_cost_profiles (
  id uuid primary key references public.customers(id) on delete restrict,
  revenue_amount numeric check(revenue_amount between 0 and 99999999 and revenue_amount=round(revenue_amount,2)),
  revenue_period text not null default 'MONTHLY' check(revenue_period in ('MONTHLY','QUARTERLY','YEARLY')),
  revenue_note text not null default '' check(length(revenue_note)<=2000),
  costs_reviewed boolean not null default false,
  revision integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.customer_costs enable row level security;
alter table public.customer_cost_allocations enable row level security;
alter table public.customer_cost_profiles enable row level security;
revoke all on public.customer_costs,public.customer_cost_allocations,public.customer_cost_profiles from public,anon,authenticated;
grant select,insert,update on public.customer_costs,public.customer_cost_profiles to authenticated;
grant select,insert,delete on public.customer_cost_allocations to authenticated;
do $$ declare t text; begin
  foreach t in array array['customer_costs','customer_cost_allocations','customer_cost_profiles'] loop
    execute format('create policy admin_read on public.%I for select to authenticated using ((select public.is_staff(array[''ADMIN''])))',t);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select public.is_staff(array[''ADMIN''])))',t);
  end loop;
  foreach t in array array['customer_costs','customer_cost_profiles'] loop
    execute format('create policy admin_update on public.%I for update to authenticated using ((select public.is_staff(array[''ADMIN'']))) with check ((select public.is_staff(array[''ADMIN''])))',t);
  end loop;
end $$;
create policy admin_delete on public.customer_cost_allocations for delete to authenticated using ((select public.is_staff(array['ADMIN'])));

create function customer_costs_private.record_change() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or not public.is_staff(array['ADMIN']) then raise exception 'Alleen beheerders kunnen klantkosten wijzigen.'; end if;
  if tg_op='UPDATE' then
    if new.id<>old.id or new.created_at<>old.created_at then raise exception 'De herkomst kan niet worden gewijzigd.'; end if;
    new.revision:=old.revision+1;
  else new.revision:=1; new.created_at:=now(); end if;
  new.updated_at:=now();
  if tg_table_name='customer_costs' then
    update public.customer_cost_profiles set costs_reviewed=false where costs_reviewed and id in
      (select customer_id from public.customer_cost_allocations where cost_id=new.id);
  end if;
  return new;
end; $$;
revoke all on function customer_costs_private.record_change() from public,anon,authenticated;
create trigger customer_costs_change before insert or update on public.customer_costs for each row execute function customer_costs_private.record_change();
create trigger customer_cost_profiles_change before insert or update on public.customer_cost_profiles for each row execute function customer_costs_private.record_change();

create function customer_costs_private.allocation_change() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_cost uuid; v_customer uuid;
begin
  if tg_op='DELETE' then v_cost:=old.cost_id; v_customer:=old.customer_id;
  else v_cost:=new.cost_id; v_customer:=new.customer_id; end if;
  -- Invalidate the previous customer's review even after their allocation is removed.
  update public.customer_cost_profiles set costs_reviewed=false where id=v_customer and costs_reviewed;
  update public.customer_costs set updated_at=now() where id=v_cost;
  return null;
end; $$;
revoke all on function customer_costs_private.allocation_change() from public,anon,authenticated;
create trigger customer_cost_allocation_change after insert or delete on public.customer_cost_allocations for each row execute function customer_costs_private.allocation_change();

create function customer_costs_private.require_allocation() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
  if tg_table_name='customer_costs' then v_id:=new.id;
  elsif tg_op='DELETE' then v_id:=old.cost_id; else v_id:=new.cost_id; end if;
  if exists(select 1 from public.customer_costs where id=v_id and not archived)
     and not exists(select 1 from public.customer_cost_allocations where cost_id=v_id) then
    raise exception 'Koppel een actieve kostenpost aan minstens één klant.';
  end if;
  return null;
end; $$;
revoke all on function customer_costs_private.require_allocation() from public,anon,authenticated;
create constraint trigger customer_cost_requires_allocation after insert or update on public.customer_costs
  deferrable initially deferred for each row execute function customer_costs_private.require_allocation();
create constraint trigger customer_cost_allocation_required after insert or delete on public.customer_cost_allocations
  deferrable initially deferred for each row execute function customer_costs_private.require_allocation();

-- Invoker RPC keeps RLS in force and saves the cost and its allocation atomically.
create function public.save_customer_cost(p_id uuid,p_revision integer,p_name text,p_supplier text,p_category text,p_amount numeric,p_period text,p_notes text,p_archived boolean,p_customers uuid[])
returns public.customer_costs language plpgsql security invoker set search_path='' as $$
declare v_id uuid; v_old public.customer_costs; v_result public.customer_costs;
begin
  if auth.uid() is null or not public.is_staff(array['ADMIN']) then raise exception 'Alleen beheerders kunnen klantkosten wijzigen.'; end if;
  if p_customers is null or cardinality(p_customers) not between 1 and 100 or array_position(p_customers,null) is not null
     or (select count(distinct c) from unnest(p_customers) c)<>cardinality(p_customers) then
    raise exception 'Selecteer 1 tot 100 verschillende klanten.';
  end if;
  if p_amount is null or not(p_amount between 0 and 99999999) or p_amount<>round(p_amount,2) then raise exception 'Vul een geldig bedrag in euro in, met maximaal twee decimalen.'; end if;
  if p_id is null then
    insert into public.customer_costs(name,supplier,category,amount,period,notes,archived)
      values(btrim(p_name),btrim(p_supplier),p_category,p_amount,p_period,p_notes,p_archived) returning id into v_id;
  else
    select * into v_old from public.customer_costs where id=p_id for update;
    if not found or p_revision is null or v_old.revision<>p_revision then raise exception 'Deze kostenpost is ondertussen gewijzigd. Vernieuw en probeer opnieuw.'; end if;
    v_id:=p_id;
    update public.customer_costs set name=btrim(p_name),supplier=btrim(p_supplier),category=p_category,amount=p_amount,period=p_period,notes=p_notes,archived=p_archived where id=v_id;
    delete from public.customer_cost_allocations where cost_id=v_id;
  end if;
  insert into public.customer_cost_allocations(cost_id,customer_id) select v_id,c from unnest(p_customers) c;
  select * into v_result from public.customer_costs where id=v_id;
  return v_result;
end; $$;
revoke all on function public.save_customer_cost(uuid,integer,text,text,text,numeric,text,text,boolean,uuid[]) from public,anon,authenticated;
grant execute on function public.save_customer_cost(uuid,integer,text,text,text,numeric,text,text,boolean,uuid[]) to authenticated;
notify pgrst,'reload schema';
