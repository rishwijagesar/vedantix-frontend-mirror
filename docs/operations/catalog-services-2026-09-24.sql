-- Approved Vedantix public catalog update, 2026-09-24.
-- Changes only the current catalog. Existing quote/invoice/subscription line prices are snapshots.
-- Run once after application CI succeeds; expected-price guards prevent replay or overwriting concurrent edits.
begin;
set local lock_timeout = '5s';
lock table public.product_catalog in share row exclusive mode;
do $$
begin
  if (select count(*) from public.product_catalog where (code='STARTER' and price_ex_vat=499) or (code='GROWTH' and price_ex_vat=599) or (code='PRO' and price_ex_vat=999) or (code='VISIBILITY_BASIC' and price_ex_vat=49) or (code='GOOGLE_GROWTH' and price_ex_vat=99) or (code='GOOGLE_AI_GROWTH' and price_ex_vat=149)) <> 6 then
    raise exception 'Catalog prices changed; review before applying';
  end if;
  if exists(select 1 from public.product_catalog where code in ('AI_SCAN','AI_AUTOMATION','WEBAPP','MOBILE_APP','INTEGRATION','TECH_CARE')) then
    raise exception 'New service codes already exist; review before applying';
  end if;
end;
$$;
update public.product_catalog set price_ex_vat=699, description='Professionele onepage met responsive ontwerp, contactformulier/WhatsApp, technische SEO-basis en 2 feedbackrondes.' where code='STARTER' and price_ex_vat=499;
update public.product_catalog set price_ex_vat=1299, description='Bedrijfswebsite tot 5 pagina’s met dienstenstructuur, lokale SEO, FAQ en relevante structured data. Inclusief 3 feedbackrondes.' where code='GROWTH' and price_ex_vat=599;
update public.product_catalog set price_ex_vat=1999, description='Bedrijfswebsite tot 10 pagina’s met uitgebreide diensten- en antwoordstructuur, bezoekersinzichten en 3 feedbackrondes.' where code='PRO' and price_ex_vat=999;
update public.product_catalog set price_ex_vat=79, description='Maandelijkse technische controle, bezoekersoverzicht en maximaal 30 minuten kleine SEO-correcties aan één website.' where code='VISIBILITY_BASIC' and price_ex_vat=49;
update public.product_catalog set price_ex_vat=149, description='Maandelijkse technische controle, rapportage en optimalisatie van één bestaande dienstenpagina voor relevante zoekvragen.' where code='GOOGLE_GROWTH' and price_ex_vat=99;
update public.product_catalog set price_ex_vat=249, description='Maandelijkse technische controle en rapportage, optimalisatie van één bestaande pagina met klantvragen, controle van structured data en een gedocumenteerde AI-zichtbaarheidssteekproef. Geen rankinggarantie.' where code='GOOGLE_AI_GROWTH' and price_ex_vat=149;
insert into public.product_catalog(code,name,description,category,billing_type,price_ex_vat,vat_rate,active,sort_order,metadata) values
('AI_SCAN','AI & automatiseringsscan','Intake van 60 minuten, analyse van één bedrijfsproces en een beknopt advies met kansen, randvoorwaarden en vervolgstappen.','AI','ONE_TIME',249,21,true,31,'{"public_package": true, "from_price": false}'::jsonb),
('AI_AUTOMATION','AI-automatisering','Eén eenvoudige workflow met één bestaande bron of koppeling, inclusief testen en uitleg. Model-, API- en softwaregebruik apart.','AI','ONE_TIME',995,21,true,32,'{"public_package": true, "from_price": true}'::jsonb),
('WEBAPP','Webapp / klantportaal','Eerste versie met één kernproces, maximaal 5 schermen en 2 gebruikersrollen. Koppelingen, migratie en hosting apart.','APP','ONE_TIME',2995,21,true,33,'{"public_package": true, "from_price": true}'::jsonb),
('MOBILE_APP','Mobiele app','Eenvoudige eerste versie voor iOS en Android op gedeelde codebasis: één kernproces, maximaal 5 schermen. Backend, koppelingen en storekosten apart.','APP','ONE_TIME',5995,21,true,34,'{"public_package": true, "from_price": true}'::jsonb),
('INTEGRATION','API-koppeling','Eén datastroom in één richting tussen twee bestaande systemen met geschikte API’s. Eén gegevenssoort; externe licenties apart.','INTEGRATION','ONE_TIME',495,21,true,35,'{"public_package": true, "from_price": true}'::jsonb),
('TECH_CARE','Technisch Beheer Basis','Eén maandelijkse controle en maximaal 30 minuten kleine wijzigingen aan één afgesproken oplossing. Geen 24/7-servicedienst; hosting en verbruik apart.','CARE','MONTHLY',59,21,true,65,'{"public_package": true, "from_price": false}'::jsonb);
-- Correct an existing description: mailboxes are a separate catalog item.
update public.product_catalog set description='Websitehosting en HTTPS. Domeinen, mailboxen, applicatiehosting en uitzonderlijk zwaar gebruik apart.' where code='HOSTING_YEAR';
commit;
