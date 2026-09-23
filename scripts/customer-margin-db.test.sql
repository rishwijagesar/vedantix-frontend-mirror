-- Disposable PostgreSQL only. Never run against production.
\set ON_ERROR_STOP on
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.user_id',true),'')::uuid $$;
create function public.is_staff(required_roles text[] default array['ADMIN','OPERATOR','READ_ONLY']) returns boolean language sql stable as $$ select coalesce(current_setting('test.staff_role',true)=any(required_roles),false) $$;
grant usage on schema auth to authenticated;
create table public.customers(id uuid primary key);
insert into public.customers values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
\ir ../supabase/migrations/20260923110752_customer_recurring_costs.sql
begin;
set local role authenticated;
select set_config('test.user_id','00000000-0000-4000-8000-000000000001',true);
select set_config('test.staff_role','ADMIN',true);
select public.save_customer_cost(null,null,'Mail','Provider','email',10,'MONTHLY','Shared',false,array['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002']::uuid[]);
insert into public.customer_cost_profiles(id,revenue_amount,revenue_period,costs_reviewed) values('00000000-0000-4000-8000-000000000001',60,'YEARLY',true),('00000000-0000-4000-8000-000000000002',0,'YEARLY',true);
set constraints all immediate;
set constraints all deferred;
do $$ declare c public.customer_costs; begin
  select * into c from public.customer_costs limit 1;
  if (select count(*) from public.customer_cost_allocations)<>2 then raise exception 'Missing allocations'; end if;
  begin
    perform public.save_customer_cost(c.id,c.revision-1,'Stale','Provider','email',10,'MONTHLY','',false,array['00000000-0000-4000-8000-000000000001']::uuid[]);
    raise exception 'Stale overwrite accepted';
  exception when raise_exception then if sqlerrm not like 'Deze kostenpost%' then raise; end if; end;
  begin
    perform public.save_customer_cost(c.id,c.revision,'Invalid','Provider','email',10,'MONTHLY','',false,array['99999999-0000-4000-8000-000000000001']::uuid[]);
    raise exception 'Unknown customer accepted';
  exception when foreign_key_violation then null; end;
  if (select name from public.customer_costs where id=c.id)<>'Mail' or (select count(*) from public.customer_cost_allocations)<>2 then raise exception 'Failed save was not atomic'; end if;
  begin
    perform public.save_customer_cost(null,null,'Bad','Provider','email',-1,'MONTHLY','',false,array['00000000-0000-4000-8000-000000000001']::uuid[]);
    raise exception 'Negative cost accepted';
  exception when raise_exception then if sqlerrm not like 'Vul een geldig%' then raise; end if; end;
  begin
    perform public.save_customer_cost(null,null,'Bad','Provider','email',1.111,'MONTHLY','',false,array['00000000-0000-4000-8000-000000000001']::uuid[]);
    raise exception 'Fractional cents accepted';
  exception when raise_exception then if sqlerrm not like 'Vul een geldig%' then raise; end if; end;
  begin
    perform public.save_customer_cost(null,null,'Bad','Provider','email',10,'MONTHLY','',false,'{}'::uuid[]);
    raise exception 'Unallocated cost accepted';
  exception when raise_exception then if sqlerrm not like 'Selecteer 1%' then raise; end if; end;
  begin
    delete from public.customer_cost_allocations where cost_id=c.id;
    set constraints all immediate;
    raise exception 'Orphan cost accepted';
  exception when raise_exception then if sqlerrm not like 'Koppel een actieve%' then raise; end if; end;
  perform public.save_customer_cost(c.id,c.revision,'Mail updated','Provider','email',12,'MONTHLY','',false,array['00000000-0000-4000-8000-000000000002']::uuid[]);
  if exists(select 1 from public.customer_cost_profiles where costs_reviewed) then raise exception 'Old/new customer reviews not invalidated'; end if;
  if (select count(*) from public.customer_cost_allocations)<>1 then raise exception 'Allocation was not replaced'; end if;
  select * into c from public.customer_costs where id=c.id;
  perform public.save_customer_cost(c.id,c.revision,c.name,c.supplier,c.category,c.amount,c.period,c.notes,true,array['00000000-0000-4000-8000-000000000002']::uuid[]);
  if not (select archived from public.customer_costs where id=c.id) then raise exception 'Archive failed'; end if;
  select * into c from public.customer_costs where id=c.id;
  perform public.save_customer_cost(c.id,c.revision,c.name,c.supplier,c.category,c.amount,c.period,c.notes,false,array['00000000-0000-4000-8000-000000000002']::uuid[]);
  if (select archived from public.customer_costs where id=c.id) then raise exception 'Restore failed'; end if;
  begin delete from public.customer_costs; raise exception 'Hard deletion allowed'; exception when insufficient_privilege then null; end;
  begin update public.customer_cost_profiles set revenue_amount=-1; raise exception 'Negative revenue allowed'; exception when check_violation then null; end;
  begin update public.customer_cost_profiles set revenue_amount=1.111; raise exception 'Rounded revenue allowed'; exception when check_violation then null; end;
end $$;
set constraints all immediate;
commit;
begin;
set local role authenticated;
select set_config('test.user_id','00000000-0000-4000-8000-000000000001',true);
do $$ declare r text; begin
  foreach r in array array['OPERATOR','READ_ONLY','NONE'] loop
    perform set_config('test.staff_role',r,true);
    if exists(select 1 from public.customer_costs) or exists(select 1 from public.customer_cost_allocations) or exists(select 1 from public.customer_cost_profiles) then raise exception 'Cost data disclosed to %',r; end if;
    begin
      perform public.save_customer_cost(null,null,'Denied','Provider','email',10,'MONTHLY','',false,array['00000000-0000-4000-8000-000000000001']::uuid[]);
      raise exception 'Non-admin RPC accepted';
    exception when raise_exception then if sqlerrm not like 'Alleen beheerders%' then raise; end if; end;
    begin
      insert into public.customer_cost_profiles(id) values('00000000-0000-4000-8000-000000000001');
      raise exception 'Non-admin profile accepted';
    exception when insufficient_privilege then null; when raise_exception then if sqlerrm not like 'Alleen beheerders%' then raise; end if; end;
    update public.customer_costs set amount=999;
    if found then raise exception 'Non-admin update succeeded'; end if;
    delete from public.customer_cost_allocations;
    if found then raise exception 'Non-admin allocation delete succeeded'; end if;
  end loop;
end $$;
rollback;
begin;
set local role anon;
do $$ begin
  begin perform * from public.customer_costs; raise exception 'Anonymous read allowed'; exception when insufficient_privilege then null; end;
  begin perform public.save_customer_cost(null,null,'Denied','','email',1,'MONTHLY','',false,'{}'::uuid[]); raise exception 'Anonymous RPC allowed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
