import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const migration = await readFile(new URL('../../supabase/migrations/20260930200413_unified_nature_login.sql', import.meta.url), 'utf8');
const admin='10000000-0000-4000-8000-000000000001',customer='20000000-0000-4000-8000-000000000002',foreign='30000000-0000-4000-8000-000000000003';
const route=async(email,purpose='login',site='naturehealing',origin='https://naturehealing.nl')=>(await db.query('select public.site_login_prepare($1,$2,$3,$4) as result',[site,email,origin,purpose])).rows[0].result;
before(async()=>{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false);
    create table public.site_auth_sites(slug text primary key,name text,origin text,active boolean);
    create table public.site_auth_memberships(site_slug text,user_id uuid,active boolean);
    create table public.site_auth_platform_admins(user_id uuid,active boolean);
    insert into public.site_auth_sites values('naturehealing','Nature Healing','https://naturehealing.nl',true),('sobrinas','Sobrinas','https://sobrinas.example.test',true);`);
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'admin@example.test',now()),($2,'customer@example.test',now()),($3,'foreign@example.test',now())",[admin,customer,foreign]);
  await db.query('insert into public.site_auth_platform_admins values($1,true)',[admin]);
  await db.query("insert into public.site_auth_memberships values('naturehealing',$1,true),('sobrinas',$2,true)",[customer,foreign]);
  await db.exec(migration);
});
after(()=>db.close());
test('migration re-runnable; resolver and throttle unavailable to anon/authenticated',async()=>{
  await db.exec(migration);
  for(const role of ['anon','authenticated']){
    const r=(await db.query("select has_function_privilege($1,'public.site_login_prepare(text,text,text,text)','EXECUTE') as prepare,has_function_privilege($1,'public.site_login_recovery_allowed(text,text,uuid,text)','EXECUTE') as recovery,has_table_privilege($1,'site_login_private.limits','SELECT') as counters",[role])).rows[0];
    assert.deepEqual(r,{prepare:false,recovery:false,counters:false});
    await db.exec('set role '+role);
    try {
      await assert.rejects(route('denied@example.test'), /permission denied/);
      await assert.rejects(db.query('select public.site_login_recovery_allowed($1,$2,$3,$4)', ['naturehealing','admin@example.test',admin,'https://naturehealing.nl']), /permission denied/);
      await assert.rejects(db.query('select * from site_login_private.limits'), /permission denied/);
    } finally { await db.exec('reset role'); }
  }
});
test('normalized exact email selects central active platformadmin or exact-site customer; others remain local',async()=>{
  assert.deepEqual(await route(' ADMIN@EXAMPLE.TEST '),{provider:'central',expected_user_id:admin});
  assert.deepEqual(await route('customer@example.test'),{provider:'central',expected_user_id:customer});
  for(const email of ['foreign@example.test','unknown@example.test','local@example.test']) assert.equal((await route(email)).provider,'local');
});
test('fixed site/origin; inactive registry denies central while preserving local route',async()=>{
  assert.deepEqual(await route('admin@example.test','login','sobrinas'),{denied:true});
  assert.deepEqual(await route('admin@example.test','login','naturehealing','https://attacker.test'),{denied:true});
  await db.exec("update public.site_auth_sites set active=false where slug='naturehealing'");
  assert.deepEqual(await route('admin@example.test'),{denied:true}); assert.equal((await route('local@example.test')).provider,'local');
  await db.exec("update public.site_auth_sites set active=true where slug='naturehealing'");
});
test('login email budget is atomic and refreshes after window; stores no plaintext email/password',async()=>{
  for(let i=0;i<12;i++) assert.equal((await route('throttled@example.test')).provider,'local');
  assert.deepEqual(await route('throttled@example.test'),{limited:true});
  assert.equal((await db.query("select count(*)::int n from site_login_private.limits where key like '%@%' or key like '%password%' ")).rows[0].n,0);
  await db.exec("update site_login_private.limits set window_started=now()-interval '16 minutes'");
  assert.equal((await route('throttled@example.test')).provider,'local');
});
test('public recovery minute/hour limits and current central rights checks',async()=>{
  assert.equal((await route('reset@example.test','recovery')).provider,'local'); assert.deepEqual(await route('reset@example.test','recovery'),{limited:true});
  const allowed=async()=>(await db.query('select public.site_login_recovery_allowed($1,$2,$3,$4) ok',['naturehealing','customer@example.test',customer,'https://naturehealing.nl'])).rows[0].ok;
  assert.equal(await allowed(),true);
  await db.query("update public.site_auth_memberships set active=false where user_id=$1",[customer]); assert.equal(await allowed(),false);
  assert.equal((await route('customer@example.test')).provider,'local');
});

test('parallel login submissions never overshoot the per-email budget',async()=>{
  await db.exec('truncate site_login_private.limits');
  const replies=await Promise.all(Array.from({length:40},()=>route('parallel@example.test')));
  assert.equal(replies.filter(reply=>reply.provider==='local').length,12);
  assert.equal(replies.filter(reply=>reply.limited===true).length,28);
});
test('exhausted site budgets block before creating attacker-chosen email counters',async()=>{
  for(const [purpose,budget] of [['login',300],['recovery',60]]){
    await db.exec('truncate site_login_private.limits');
    await db.query('insert into site_login_private.limits values($1,now(),$2)',[purpose+':site:naturehealing',budget]);
    const replies=await Promise.all(Array.from({length:40},(_,i)=>route('new-'+i+'@example.test',purpose)));
    assert.ok(replies.every(reply=>reply.limited===true));
    assert.equal((await db.query('select count(*)::int n from site_login_private.limits')).rows[0].n,1);
  }
});
