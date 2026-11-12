-- Prijsherziening november 2026 (alleen de publieke catalogus).
-- Offertes, facturen en abonnementen bewaren hun eigen regelprijzen, dus bestaande afspraken veranderen niet.
-- De trigger sync_product_catalog_prices berekent price_incl_vat opnieuw uit price_ex_vat.

-- Websitepakketten: Starter blijft de scherpe instap, Growth en Pro dekken het werk beter.
update public.product_catalog set price_ex_vat = 995,  updated_at = now() where code = 'GROWTH';
update public.product_catalog set price_ex_vat = 1795, updated_at = now() where code = 'PRO';

-- Hosting: nog steeds onder de marktprijs, maar kostendekkend. Geen vijfjarige vooruitbetaling meer.
update public.product_catalog set price_ex_vat = 60,  updated_at = now() where code = 'HOSTING_YEAR';
update public.product_catalog set price_ex_vat = 160, updated_at = now() where code = 'HOSTING_3_YEARS';
update public.product_catalog set active = false,     updated_at = now() where code = 'HOSTING_5_YEARS';

-- Zakelijke e-mail is een terugkerende dienst, geprijsd per mailbox per jaar.
update public.product_catalog
set name = 'Zakelijke e-mail',
    description = 'Zakelijke mailbox op je eigen domein. Prijs per mailbox per jaar.',
    billing_type = 'YEARLY',
    price_ex_vat = 39,
    updated_at = now()
where code = 'EMAIL';

-- Vindbaarheid als logische reeks: SEO < AEO < GEO/AIO.
update public.product_catalog set price_ex_vat = 149, updated_at = now() where code = 'SEO_START';
update public.product_catalog set price_ex_vat = 199, updated_at = now() where code = 'AEO_START';
update public.product_catalog set price_ex_vat = 249, updated_at = now() where code = 'GEO_AIO_START';

-- Eenheden expliciet maken.
update public.product_catalog
set price_ex_vat = 95,
    description = 'Duidelijke webteksten die vertrouwen opbouwen en aanzetten tot contact. Prijs per pagina.',
    metadata = metadata || '{"from_price":true}'::jsonb,
    updated_at = now()
where code = 'COPYWRITING';

update public.product_catalog
set price_ex_vat = 75,
    description = 'Losse hulp bij wijzigingen, vragen of technische verbeteringen. Prijs per uur.',
    metadata = metadata - 'from_price',
    updated_at = now()
where code = 'SUPPORT';

-- Software-instapprijzen: een realistischer anker voor maatwerk.
update public.product_catalog set price_ex_vat = 2950, updated_at = now() where code = 'WEBAPP';
update public.product_catalog set price_ex_vat = 4950, updated_at = now() where code = 'MOBILE_APP';
