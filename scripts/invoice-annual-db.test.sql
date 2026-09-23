\set ON_ERROR_STOP on
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
end; $$;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid; $$;
create function public.is_staff(text[]) returns boolean language sql stable as $$ select coalesce(current_setting('test.admin',true),'false')='true'; $$;
create table invoices(id uuid primary key,status text,is_active boolean,finalized_at timestamptz,subscription_id uuid,source_quote_id uuid,customer_id uuid,invoice_date date,company_snapshot jsonb,customer_snapshot jsonb);
create table invoice_items(id uuid default gen_random_uuid(),invoice_id uuid,position int,catalog_product_id uuid,code text,description text,billing_type text,quantity numeric,unit_price_ex_vat numeric,vat_rate numeric,discount_type text,discount_value numeric);
create table subscriptions(id uuid primary key default gen_random_uuid(),subscription_number text,source_invoice_id uuid,customer_id uuid,billing_type text,status text,start_date date,next_invoice_date date,last_invoice_date date,auto_finalize boolean,discount_type text,discount_value numeric,first_invoice_discount_ex_vat numeric,company_snapshot jsonb,customer_snapshot jsonb,renewal_reminder_days int,cancellation_notice_days int,created_by uuid);
create unique index on subscriptions(source_invoice_id,billing_type);
create table subscription_items(subscription_id uuid,position int,catalog_product_id uuid,code text,description text,quantity numeric,unit_price_ex_vat numeric,vat_rate numeric,discount_type text,discount_value numeric);
create sequence subscription_numbers;
create function public.allocate_subscription_number() returns text language sql as $$ select 'SUB-'||nextval('public.subscription_numbers'); $$;
\ir ../supabase/migrations/20260923115032_annual_billing_activation_guards.sql
insert into invoices values('11111111-1111-4111-8111-111111111111','FINALIZED',true,now(),null,null,'22222222-2222-4222-8222-222222222222','2026-09-23','{}','{}');
insert into invoice_items(invoice_id,position,code,description,billing_type,quantity,unit_price_ex_vat,vat_rate,discount_type,discount_value) values
 ('11111111-1111-4111-8111-111111111111',1,'WEBSITE','Website','ONE_TIME',1,499,21,'NONE',0),
 ('11111111-1111-4111-8111-111111111111',2,'HOSTING_YEAR','Hosting','YEARLY',1,30,21,'NONE',0),
 ('11111111-1111-4111-8111-111111111111',3,'EMAIL','E-mail','YEARLY',1,30,21,'NONE',0),
 ('11111111-1111-4111-8111-111111111111',4,'EMAIL','Eenmalige mailmigratie','ONE_TIME',1,50,21,'NONE',0);
do $$ begin
 if has_function_privilege('anon','activate_invoice_yearly_billing(uuid,date,boolean,integer,integer)','execute') then raise exception 'Anonymous activation allowed'; end if;
 begin perform activate_invoice_yearly_billing('11111111-1111-4111-8111-111111111111','2026-09-23'); raise exception 'Nonstaff accepted'; exception when raise_exception then if SQLERRM<>'Not authorized' then raise; end if; end;
 perform set_config('test.admin','true',true);
 perform activate_invoice_yearly_billing('11111111-1111-4111-8111-111111111111','2026-09-23');
 perform activate_invoice_yearly_billing('11111111-1111-4111-8111-111111111111','2026-09-23');
 if (select count(*) from subscriptions)<>1 or (select count(*) from subscription_items)<>2 or (select sum(quantity*unit_price_ex_vat) from subscription_items)<>60 then raise exception 'Duplicate or wrong annual lines'; end if;
 if not exists(select 1 from subscriptions where next_invoice_date='2027-09-23' and start_date='2026-09-23' and not auto_finalize and last_invoice_date='2026-09-23') then raise exception 'Wrong annual dates'; end if;
 if (select count(*) from invoices)<>1 then raise exception 'Immediate invoice duplicated'; end if;
 update invoices set subscription_id=(select id from subscriptions);
 begin perform activate_invoice_yearly_billing('11111111-1111-4111-8111-111111111111','2026-09-23'); raise exception 'Existing subscription chained'; exception when raise_exception then if SQLERRM not like 'Beheer deze jaarfacturatie%' then raise; end if; end;
 update invoices set subscription_id=null,is_active=false;
 begin perform activate_invoice_yearly_billing('11111111-1111-4111-8111-111111111111','2026-09-23'); raise exception 'Inactive invoice accepted'; exception when raise_exception then if SQLERRM not like 'Maak de factuur%' then raise; end if; end;
end; $$;
