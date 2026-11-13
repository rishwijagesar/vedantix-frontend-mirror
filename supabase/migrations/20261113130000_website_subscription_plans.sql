-- Websiteabonnementen: lage opstartkosten plus een vast maandbedrag (hosting, onderhoud en kleine aanpassingen).
-- Bestaande eenmalige pakketten blijven ongewijzigd. Prijzen zijn aanpasbaar in de admin (product_catalog).

-- Publieke catalogus geeft ook opstartkosten, minimale looptijd en het bijbehorende pakket terug.
create or replace function public.get_public_catalog()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'code',p.code,'name',p.name,'description',p.description,'category',p.category,
    'billing_type',p.billing_type,'price_ex_vat',p.price_ex_vat,
    'price_incl_vat',p.price_incl_vat,'vat_rate',p.vat_rate,'sort_order',p.sort_order,
    'from_price',coalesce((p.metadata->>'from_price')::boolean,false),
    'duration_years',p.metadata->>'duration_years',
    'setup_fee',(p.metadata->>'setup_fee')::numeric,
    'min_term_months',(p.metadata->>'min_term_months')::int,
    'base_package',p.metadata->>'base_package',
    'included_hours',(p.metadata->>'included_hours')::numeric
  ) order by p.sort_order,p.code),'[]'::jsonb)
  from public.product_catalog p where p.active and p.metadata->>'public_package'='true';
$$;
revoke all on function public.get_public_catalog() from public;
grant execute on function public.get_public_catalog() to anon,authenticated,service_role;

insert into public.product_catalog(code,name,description,category,billing_type,price_ex_vat,vat_rate,active,sort_order,metadata)
values
('STARTER_PLAN','Starter abonnement','Starter-website met hosting, technisch onderhoud en kleine aanpassingen in één maandbedrag.','WEBSITE_PLAN','MONTHLY',39,21,true,5,
 '{"public_package":true,"base_package":"STARTER","setup_fee":149,"min_term_months":12,"included_hours":0.5}'),
('GROWTH_PLAN','Growth abonnement','Growth-website met hosting, technisch onderhoud en kleine aanpassingen in één maandbedrag.','WEBSITE_PLAN','MONTHLY',59,21,true,6,
 '{"public_package":true,"base_package":"GROWTH","setup_fee":299,"min_term_months":12,"included_hours":1}'),
('PRO_PLAN','Pro abonnement','Pro-website met hosting, technisch onderhoud en kleine aanpassingen in één maandbedrag.','WEBSITE_PLAN','MONTHLY',99,21,true,7,
 '{"public_package":true,"base_package":"PRO","setup_fee":595,"min_term_months":12,"included_hours":2}')
on conflict(code) do nothing;
