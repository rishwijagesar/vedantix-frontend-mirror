-- Public reads expose only published catalog fields; operational product data stays private.
create or replace function public.get_public_catalog()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'code',p.code,'name',p.name,'description',p.description,'category',p.category,
    'billing_type',p.billing_type,'price_ex_vat',p.price_ex_vat,
    'price_incl_vat',p.price_incl_vat,'vat_rate',p.vat_rate,'sort_order',p.sort_order,
    'from_price',coalesce((p.metadata->>'from_price')::boolean,false),
    'duration_years',p.metadata->>'duration_years'
  ) order by p.sort_order,p.code),'[]'::jsonb)
  from public.product_catalog p where p.active and p.metadata->>'public_package'='true';
$$;
revoke all on function public.get_public_catalog() from public;
grant execute on function public.get_public_catalog() to anon,authenticated,service_role;

-- Bring existing advertised services into the editable catalog without changing existing prices.
insert into public.product_catalog(code,name,description,category,billing_type,price_ex_vat,vat_rate,active,sort_order,metadata)
values
('VISIBILITY_BASIC','Zichtbaarheid Basis','Technische checks, bezoekersinzichten en kleine SEO-verbeteringen.','GROWTH','MONTHLY',49,21,true,45,'{"public_package":true}'),
('HOSTING_3_YEARS','Web Hosting - 3 jaar','Hosting voor drie jaar.','HOSTING','ONE_TIME',85,21,true,41,'{"public_package":true,"duration_years":3}'),
('HOSTING_5_YEARS','Web Hosting - 5 jaar','Hosting voor vijf jaar.','HOSTING','ONE_TIME',135,21,true,42,'{"public_package":true,"duration_years":5}'),
('SEO_START','SEO Start','Extra optimalisatie van titels, teksten, diensten en technische Google-signalen.','ADDON','ONE_TIME',149,21,true,71,'{"public_package":true}'),
('AEO_START','AEO Start','FAQ-, antwoord- en structured-data optimalisatie.','ADDON','ONE_TIME',99,21,true,72,'{"public_package":true}'),
('GEO_AIO_START','GEO + AIO Start','Content en structuur verbeteren voor moderne AI-zoek- en antwoordplatformen.','ADDON','ONE_TIME',199,21,true,73,'{"public_package":true}'),
('ANALYTICS','Bezoekersinzichten','Analytics inrichten zodat je ziet hoeveel bezoekers en aanvragen je krijgt.','ADDON','ONE_TIME',49,21,true,74,'{"public_package":true}'),
('APPOINTMENTS','Online afspraken','Laat klanten rechtstreeks een afspraak of intake aanvragen.','ADDON','ONE_TIME',149,21,true,75,'{"public_package":true,"from_price":true}'),
('EXTRA_PAGE','Extra pagina','Voor een extra dienst, locatie, product of campagnepagina.','ADDON','ONE_TIME',99,21,true,76,'{"public_package":true,"from_price":true}'),
('COPYWRITING','Teksten laten schrijven','Duidelijke webteksten die vertrouwen opbouwen en aanzetten tot contact.','ADDON','ONE_TIME',99,21,true,77,'{"public_package":true,"from_price":true}'),
('SUPPORT','Ondersteuning achteraf','Losse hulp bij wijzigingen, vragen of technische verbeteringen.','ADDON','ONE_TIME',35,21,true,78,'{"public_package":true,"from_price":true}')
on conflict(code) do nothing;
update public.product_catalog set metadata=metadata || '{"public_package":true}'::jsonb where code='EMAIL';

create table public.client_cases (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 160),
  website_url text,
  logo_url text,
  branch text not null default '',
  status_label text not null default 'Live',
  summary text not null check(length(btrim(summary)) between 1 and 3000),
  outcome text not null default '',
  published boolean not null default false,
  show_on_home boolean not null default true,
  show_on_results boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_website_url_safe check(website_url is null or website_url ~ '^https://[^[:space:]]+$'),
  constraint case_logo_url_safe check(logo_url is null or logo_url ~ '^https://[^[:space:]]+$' or logo_url ~ '^/logos/[A-Za-z0-9._/-]+$')
);
alter table public.client_cases enable row level security;
grant select on public.client_cases to anon, authenticated;
grant insert,update,delete on public.client_cases to authenticated;
create policy client_cases_public_read on public.client_cases for select to anon,authenticated using(published=true);
create policy client_cases_staff_read on public.client_cases for select to authenticated using(public.is_staff());
create policy client_cases_staff_insert on public.client_cases for insert to authenticated with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy client_cases_staff_update on public.client_cases for update to authenticated using(public.is_staff(array['ADMIN','OPERATOR'])) with check(public.is_staff(array['ADMIN','OPERATOR']));
create policy client_cases_staff_delete on public.client_cases for delete to authenticated using(public.is_staff(array['ADMIN','OPERATOR']));
create index client_cases_published_sort_idx on public.client_cases(sort_order,created_at) where published=true;

create or replace function public.get_public_client_cases()
returns jsonb language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'name',c.name,'website',c.website_url,'logo',c.logo_url,
    'branch',c.branch,'status',c.status_label,'summary',c.summary,'outcome',c.outcome,
    'show_on_home',c.show_on_home,'show_on_results',c.show_on_results
  ) order by c.sort_order,c.created_at),'[]'::jsonb)
  from public.client_cases c where c.published=true;
$$;
revoke all on function public.get_public_client_cases() from public;
grant execute on function public.get_public_client_cases() to anon,authenticated,service_role;

insert into public.client_cases(name,website_url,logo_url,branch,summary,outcome,published,show_on_home,show_on_results,sort_order)
values
('Horeca Topper','https://www.horeca-topper.nl/','/logos/horeca-topper.svg','Horeca / dienstverlening',
'Een sterkere online basis met duidelijke structuur, mobiele zichtbaarheid en een uitstraling die sneller vertrouwen geeft.',
'Meer vertrouwen, duidelijkere contactmomenten en een betere basis voor aanvragen en online zichtbaarheid.',true,true,true,10),
('Jitan Sports',null,null,'Sport & begeleiding',
'Voor Jitan Sports draait online groei om vertrouwen, duidelijke diensten, lokale zichtbaarheid en laagdrempelige contactmomenten.',
'Heldere positionering, contact via proefles en WhatsApp, en een structuur gericht op lokale vindbaarheid.',true,false,true,20);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('client-cases','client-cases',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do nothing;
create policy client_cases_images_staff_select on storage.objects for select to authenticated using(bucket_id='client-cases' and public.is_staff());
create policy client_cases_images_staff_insert on storage.objects for insert to authenticated with check(bucket_id='client-cases' and public.is_staff(array['ADMIN','OPERATOR']));
create policy client_cases_images_staff_update on storage.objects for update to authenticated using(bucket_id='client-cases' and public.is_staff(array['ADMIN','OPERATOR'])) with check(bucket_id='client-cases' and public.is_staff(array['ADMIN','OPERATOR']));
create policy client_cases_images_staff_delete on storage.objects for delete to authenticated using(bucket_id='client-cases' and public.is_staff(array['ADMIN','OPERATOR']));
