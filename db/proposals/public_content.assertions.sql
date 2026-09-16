begin;
update public.product_catalog set price_ex_vat=512.34 where code='STARTER';
insert into public.client_cases(name,summary,published,show_on_home) values
('__vedantix_content_draft_test__','Regression test; rolled back',false,true),
('__vedantix_content_public_test__','Regression test; rolled back',true,true);
set local role anon;
do $test$
declare p jsonb; c jsonb;
begin
  p := public.get_public_catalog();
  if not exists(select 1 from jsonb_array_elements(p) x where x->>'code'='STARTER' and (x->>'price_ex_vat')::numeric=512.34 and (x->>'price_incl_vat')::numeric=619.93) then raise exception 'Updated price or VAT not public'; end if;
  if exists(select 1 from jsonb_array_elements(p) x where x ? 'metadata' or x ? 'id') then raise exception 'Private product fields exposed'; end if;
  c := public.get_public_client_cases();
  if exists(select 1 from jsonb_array_elements(c) x where x->>'name'='__vedantix_content_draft_test__') then raise exception 'Draft leaked'; end if;
  if not exists(select 1 from jsonb_array_elements(c) x where x->>'name'='__vedantix_content_public_test__') then raise exception 'Published case not visible'; end if;
  if exists(select 1 from public.client_cases where name='__vedantix_content_draft_test__') then raise exception 'RLS draft leaked'; end if;
  begin if exists(select 1 from public.product_catalog) then raise exception 'Anonymous private catalog rows exposed'; end if; exception when insufficient_privilege then null; end;
  begin insert into public.client_cases(name,summary) values ('bad','bad'); raise exception 'Anonymous mutation allowed'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
update public.product_catalog set active=false where code='STARTER';
update public.client_cases set published=false where name='__vedantix_content_public_test__';
set local role authenticated;
do $test$
begin
  if exists(select 1 from jsonb_array_elements(public.get_public_catalog()) x where x->>'code'='STARTER') then raise exception 'Inactive catalog item leaked'; end if;
  if exists(select 1 from jsonb_array_elements(public.get_public_client_cases()) x where x->>'name'='__vedantix_content_public_test__') then raise exception 'Unpublished case leaked'; end if;
  begin insert into public.client_cases(name,summary) values ('bad','bad'); raise exception 'Nonstaff mutation allowed'; exception when insufficient_privilege then null; end;
end $test$;
reset role;
update public.product_catalog set active=true, metadata=metadata || '{"public_package":false}'::jsonb where code='STARTER';
set local role anon;
do $test$ begin
  if exists(select 1 from jsonb_array_elements(public.get_public_catalog()) x where x->>'code'='STARTER') then raise exception 'Unpublished product leaked'; end if;
end $test$;
reset role;
rollback;
select jsonb_build_object('tests','passed and rolled back','starter_ex_vat',(select price_ex_vat from public.product_catalog where code='STARTER'),'cases',(select count(*) from public.client_cases),'bucket',(select jsonb_build_object('public',public,'limit',file_size_limit,'mime_types',allowed_mime_types) from storage.buckets where id='client-cases')) as result;
