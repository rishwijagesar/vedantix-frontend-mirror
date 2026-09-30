import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const admin='10000000-0000-4000-8000-000000000001';
const client='20000000-0000-4000-8000-000000000002';
const other='30000000-0000-4000-8000-000000000003';
const file='20260930164911_client_access_admin_api.sql';
const migration=await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8');
const schemaSnapshot=JSON.parse(await readFile(new URL('./fixtures/schema-functions.json',import.meta.url),'utf8'));
const triggerSnapshot=JSON.parse(await readFile(new URL('./fixtures/trigger-functions.json',import.meta.url),'utf8'));
let req=10;
const next=()=> '40000000-0000-4000-8000-'+String(req++).padStart(12,'0');
const command=async(action,args,actor=admin)=>(await db.query('select public.client_access_admin($1,$2,$3) as result',[actor,action,JSON.stringify(args)])).rows[0].result;
const adminActive=(active)=>db.query('update public.staff_users set active=$1 where user_id=$2',[active,admin]);
before(async()=>{
  await db.exec([
    "create role anon; create role authenticated; create role service_role bypassrls;",
    "create schema auth; create schema authz_private;",
    "create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;",
    "create table auth.users(id uuid primary key,email text unique,email_confirmed_at timestamptz);",
    "create table public.staff_users(user_id uuid primary key references auth.users(id),role text not null default 'ADMIN',active boolean not null default true,created_at timestamptz not null default now());",
    "create table public.staff_invites(id uuid primary key default gen_random_uuid(),email text,role text,active boolean default true,invited_by uuid,accepted_by uuid,accepted_at timestamptz,created_at timestamptz default now());",
    "create table public.site_auth_platform_admins(user_id uuid primary key references auth.users(id),active boolean not null default true);",
    "create table public.site_auth_sites(slug text primary key,name text,origin text unique,active boolean);",
    "create table public.site_auth_memberships(site_slug text references public.site_auth_sites(slug),user_id uuid references auth.users(id),active boolean default true,primary key(site_slug,user_id));",
    "insert into public.site_auth_sites values('sobrinas','Sobrinas','https://salon.example.test',true),('naturehealing','Nature Healing','https://nature.example.test',false);"
  ].join('\n'));
  await db.query("insert into auth.users values($1,'admin@vedantix.nl',now()),($2,'client@example.test',now()),($3,'other@example.test',now())",[admin,client,other]);
  await db.query('insert into public.staff_users(user_id) values($1)',[admin]);
  await db.query('insert into public.site_auth_platform_admins values($1,true)',[admin]);
  for(const def of triggerSnapshot) await db.exec(def.definition);
  await db.exec("create trigger apply_staff_invite_on_auth_user after insert or update of email_confirmed_at on auth.users for each row execute function public.apply_staff_invite(); create trigger bootstrap_first_admin_on_auth_user after insert or update of email_confirmed_at on auth.users for each row execute function public.bootstrap_first_admin();");
  for(const name of ['is_site_platform_admin','can_manage_site']) await db.exec(schemaSnapshot.find(x=>x.proname===name).definition);
  await db.exec(migration);
});
after(()=>db.close());
test('migration is re-runnable, private RPCs inaccessible to anon/authenticated',async()=>{
  await db.exec(migration);
  for(const role of ['anon','authenticated']){
    const result=await db.query("select has_function_privilege($1,'public.client_access_admin(uuid,text,jsonb)','EXECUTE') as rpc,has_table_privilege($1,'public.site_auth_client_accounts','SELECT') as accounts",[role]);
    assert.deepEqual(result.rows[0],{rpc:false,accounts:false});
  }
});
test('customer and inactive ADMIN cannot list or invite',async()=>{
  await assert.rejects(()=>command('list',{},client),/FORBIDDEN/);
  await adminActive(false);
  await assert.rejects(()=>command('list',{}),/FORBIDDEN/);
  await adminActive(true);
});
test('rejects staff account and staff-invite conflict before reserving customer',async()=>{
  await assert.rejects(()=>command('prepare_invite',{request_id:next(),site_slug:'sobrinas',email:'admin@vedantix.nl'}),/STAFF_ACCOUNT/);
  await db.exec("insert into public.staff_invites(email,role) values('staff-pending@example.test','OPERATOR')");
  await assert.rejects(()=>command('prepare_invite',{request_id:next(),site_slug:'sobrinas',email:'staff-pending@example.test'}),/STAFF_ACCOUNT/);
  assert.equal((await db.query('select count(*)::int n from public.site_auth_client_accounts')).rows[0].n,0);
});
test('existing customer invite uses recovery, no active grant before delivery; retries idempotent',async()=>{
  const request_id=next();
  const args={request_id,site_slug:'sobrinas',email:'client@example.test'};
  const prepared=await command('prepare_invite',args);
  assert.equal(prepared.link_type,'recovery');
  assert.equal((await db.query('select count(*)::int n from public.site_auth_memberships')).rows[0].n,0);
  const replay=await command('prepare_invite',args);assert.equal(replay.replayed,true);
  await assert.rejects(()=>command('prepare_invite',{...args,email:'other@example.test'}),/CONFLICT/);
  await command('bind_invite',{request_id,user_id:client});
  await command('finish_invite',{request_id,sent:true});
  assert.equal((await db.query('select active from public.site_auth_memberships where user_id=$1',[client])).rows[0].active,true);
  assert.equal((await command('finish_invite',{request_id,sent:true})).replayed,true);
});
test('customer registry blocks staff and platform enrollment in both APIs and direct SQL',async()=>{
  await assert.rejects(()=>db.query("insert into public.staff_users(user_id,role) values($1,'ADMIN')",[client]),/STAFF_ACCOUNT/);
  await assert.rejects(()=>db.query("insert into public.staff_invites(email,role) values('client@example.test','ADMIN')"),/STAFF_ACCOUNT/);
  await assert.rejects(()=>db.query("insert into public.site_auth_platform_admins(user_id) values($1)",[client]),/STAFF_ACCOUNT/);
  assert.equal((await db.query("select count(*)::int n from public.staff_users where user_id=$1",[client])).rows[0].n,0);
});
test('new unconfirmed client gets invite; existing bootstrap trigger never makes it staff',async()=>{
  const newUser='50000000-0000-4000-8000-000000000005';
  const request_id=next();
  const result=await command('prepare_invite',{request_id,site_slug:'sobrinas',email:'new-client@vedantix.nl'});
  assert.equal(result.link_type,'invite');
  await adminActive(false);
  await db.query('insert into auth.users values($1,$2,now())',[newUser,'new-client@vedantix.nl']);
  assert.equal((await db.query('select count(*)::int n from public.staff_users where user_id=$1',[newUser])).rows[0].n,0);
  await adminActive(true);
  await command('bind_invite',{request_id,user_id:newUser});
  await command('finish_invite',{request_id,sent:false});
  assert.equal((await db.query('select count(*)::int n from public.site_auth_memberships where user_id=$1',[newUser])).rows[0].n,0);
});
test('cross-site assignment rejects inactive site; can_manage_site isolates customer sites',async()=>{
  await assert.rejects(()=>command('prepare_invite',{request_id:next(),site_slug:'naturehealing',email:'other@example.test'}),/INVALID_SITE/);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[client]);
  const r=(await db.query("select public.can_manage_site('sobrinas') as salon,public.can_manage_site('naturehealing') as nature")).rows[0];
  assert.deepEqual(r,{salon:true,nature:false});
});
test('revoke is immediate; does not delete Auth account; re-enable explicit and audited',async()=>{
  await command('revoke',{request_id:next(),site_slug:'sobrinas',user_id:client});
  assert.equal((await db.query("select public.can_manage_site('sobrinas') as allowed")).rows[0].allowed,false);
  assert.equal((await db.query('select count(*)::int n from auth.users where id=$1',[client])).rows[0].n,1);
  const enable={request_id:next(),site_slug:'sobrinas',user_id:client,active:true};
  await command('set_membership_active',enable);
  assert.equal((await command('set_membership_active',enable)).status,'active');
  assert.equal((await db.query("select public.can_manage_site('sobrinas') as allowed")).rows[0].allowed,true);
  assert.ok((await command('list',{})).audit.some(x=>x.action==='revoke'&&x.outcome==='revoked'));
});
test('cancel racing mail completion cannot reactivate membership',async()=>{
  const request_id=next();
  const p=await command('prepare_invite',{request_id,site_slug:'sobrinas',email:'other@example.test'});
  await command('bind_invite',{request_id,user_id:other});
  await command('cancel_invitation',{request_id:next(),invitation_id:p.invitation_id});
  assert.equal((await command('finish_invite',{request_id,sent:true})).status,'revoked');
  assert.equal((await db.query('select count(*)::int n from public.site_auth_memberships where user_id=$1',[other])).rows[0].n,0);
});
test('public recovery checks origin, membership and throttle before delivery',async()=>{
  const recover=async(email,origin='https://salon.example.test')=>(await db.query('select public.client_access_recovery_prepare($1,$2,$3) as result',['sobrinas',email,origin])).rows[0].result;
  assert.equal((await recover('client@example.test','https://attacker.test')).allowed,false);
  assert.equal((await recover('missing@example.test')).allowed,false);
  assert.equal((await recover('admin@vedantix.nl')).allowed,false);
  const valid=await recover('client@example.test');assert.equal(valid.allowed,true);
  assert.equal((await recover('client@example.test')).allowed,false);
  await db.query('select public.client_access_recovery_finish($1,true)',[valid.request_id]);
  await command('revoke',{request_id:next(),site_slug:'sobrinas',user_id:client});
  await db.exec("update client_access_private.recovery_requests set created_at=now()-interval '2 hours'");
  assert.equal((await recover('client@example.test')).allowed,false);
});
