-- Run in BEGIN/ROLLBACK only; never commit the temporary staff fixture.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ begin
 if public.is_staff() then raise exception 'Non-staff identity has staff rights'; end if;
 if exists(select 1 from public.staff_users) or exists(select 1 from public.staff_invites)
 or exists(select 1 from public.customers) or exists(select 1 from public.invoices)
 or exists(select 1 from public.contracts) then raise exception 'Internal data visible to non-staff'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where lower(email)='info@vedantix.nl'),true);
set local role authenticated;
do $$ begin
 if not public.is_staff(array['ADMIN']) then raise exception 'Owner admin denied'; end if;
 if not exists(select 1 from public.staff_users where user_id=auth.uid()) then raise exception 'Owner staff record hidden'; end if;
 if public.is_staff(array['OPERATOR']) then raise exception 'Incorrect staff role granted'; end if;
end $$;
reset role;
insert into auth.users(id) values ('22222222-2222-4222-8222-222222222222');
insert into public.staff_users(user_id,role,active) values ('22222222-2222-4222-8222-222222222222','OPERATOR',true);
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
do $$ begin if not public.is_staff(array['OPERATOR']) or public.is_staff(array['ADMIN']) then raise exception 'Operator role check failed'; end if; end $$;
reset role;
update public.staff_users set active=false where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ begin if public.is_staff() then raise exception 'Inactive staff still has rights'; end if; end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin if public.is_staff() then raise exception 'Anonymous staff rights'; end if; end $$;
reset role;
rollback;
