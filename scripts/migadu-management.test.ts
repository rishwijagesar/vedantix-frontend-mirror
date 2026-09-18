import { test } from "node:test";
import assert from "node:assert/strict";
import { accountCredentials, createMigaduClient, dnsRecords, localPart, mailboxPayload, safeMailbox } from "../supabase/functions/migadu-admin/api.ts";
import { createMailHandler } from "../supabase/functions/migadu-admin/handler.ts";

const domainId="00000000-0000-4000-8000-000000000001";
const requestId="00000000-0000-4000-8000-000000000002";
const credentials={email:"admin@example.org",api_key:"api-secret-never-return"};
const pwd="A-long-mailbox-password!42";
const box={local_part:"info",address:"info@example.org",name:"Example",may_send:true,may_receive:true,may_access_imap:true,may_access_pop3:false,password:"must-not-leak"};
function fixture(options:any={}) {
  const calls:any[]=[];const writes:any[]=[];const rpcs:any[]=[];let adminCalls=0;
  function query(value:any,onWrite?:(v:any)=>void) {
    const builder:any={
      select:()=>builder,eq:()=>builder,
      insert:(v:any)=>{onWrite?.(v);return builder;},
      update:(v:any)=>{onWrite?.(v);return builder;},
      single:async()=>value,maybeSingle:async()=>value,
      then:(resolve:any,reject:any)=>Promise.resolve(value).then(resolve,reject),
    };return builder;
  }
  const user={
    auth:{getUser:async()=>({data:{user:options.unauth?null:{id:"actor"}},error:null})},
    rpc:async()=>({data:options.denied?false:true,error:null}),
    from:(table:string)=>{assert.equal(table,"domains");return query({data:options.missingDomain?null:{id:domainId,domain_name:"example.org",dns_provider:"Amazon Route 53"},error:null});},
  };
  const admin={
    from:(table:string)=>{
      if(table==="migadu_management_config")return query({data:{connected:options.connected!==false,account_email:credentials.email,last_verified_at:null},error:null});
      if(table==="migadu_management_audit")return query({data:{id:requestId},error:options.duplicate?{code:"23505"}:options.auditFailure?{code:"500"}:null},v=>writes.push({table,...v}));
      if(table==="domains")return query({data:null,error:null},v=>writes.push({table,...v}));
      throw new Error("Unexpected table "+table);
    },
    rpc:async(name:string,args:any)=>{rpcs.push({name,args});return {data:args.p_action==="read"?credentials:null,error:null};},
  };
  const provider=(received:any)=>{
    assert.deepEqual(received,credentials);
    return async(path:string,method="GET",body?:any)=>{
      calls.push({path,method,body});
      if(options.providerFailure)throw new Error("authorization="+credentials.api_key+" password="+pwd);
      if(path==="/domains"&&method==="GET")return {domains:options.absent?[]:[{name:"example.org",state:"active",can_send:true,can_receive:true}]};
      if(path.endsWith("/mailboxes")&&method==="GET")return {mailboxes:[box]};
      if(path.endsWith("/records"))return {dkim:[{name:"key1._domainkey",type:"cname",value:"key1.example.org._domainkey.migadu.com."}],spf:{name:"@",type:"txt",value:"v=spf1 include:spf.migadu.com -all"}};
      if(path.endsWith("/activate"))return {name:"example.org",state:"active",can_send:true,can_receive:true};
      return {...box,password:pwd};
    };
  };
  const handler=createMailHandler(()=>user,()=>{adminCalls++;return admin;},provider);
  const invoke=(body:any={},headers:Record<string,string>={Authorization:"Bearer test-jwt"})=>handler(new Request("https://edge.example/migadu-admin",{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify({request_id:requestId,domain_id:domainId,...body})}));
  return {invoke,calls,writes,rpcs,adminCalls:()=>adminCalls};
}

test("unauthenticated and non-admin callers never instantiate privileged clients",async()=>{
  for(const setup of [{unauth:true},{denied:true}]){const f=fixture(setup);const r=await f.invoke({action:"delete_mailbox"});assert.ok([401,403].includes(r.status));assert.equal(f.adminCalls(),0);assert.equal(f.calls.length,0);}
  const f=fixture();assert.equal((await f.invoke({action:"status"},{})).status,401);assert.equal(f.adminCalls(),0);
});
test("untrusted Origin is rejected before any privileged access",async()=>{
  const f=fixture();assert.equal((await f.invoke({action:"status"},{Authorization:"Bearer x",Origin:"https://attacker.example"})).status,403);assert.equal(f.adminCalls(),0);
});
test("status does not read credentials or contact Migadu",async()=>{
  const f=fixture();const r=await f.invoke({action:"status"});assert.equal(r.status,200);assert.equal(f.rpcs.length,0);assert.equal(f.calls.length,0);assert.equal(r.headers.get("Cache-Control"),"no-store");
});
test("connection is verified before encrypted storage; no unrelated domain list leaks",async()=>{
  const f=fixture();const r=await f.invoke({action:"connect",...credentials});assert.equal(r.status,200);assert.equal(f.calls[0].path,"/domains");assert.equal(f.rpcs[0].args.p_action,"save");assert.deepEqual(await r.json(),{ok:true});
});
test("failed verification never persists credentials and sanitizes all errors",async()=>{
  const f=fixture({providerFailure:true});const r=await f.invoke({action:"connect",...credentials});assert.equal(r.status,500);assert.equal(f.rpcs.length,0);assert.ok(!(await r.text()).includes(credentials.api_key));
});
test("domain lookup uses registered domain id, ignoring supplied hostnames",async()=>{
  const f=fixture();await f.invoke({action:"domain",domain:"attacker.example"});assert.ok(f.calls.every(c=>!c.path.includes("attacker")));
  const missing=fixture({missingDomain:true});assert.equal((await missing.invoke({action:"domain"})).status,404);assert.equal(missing.calls.length,0);
});
test("domain reads never activate domains or create mailboxes",async()=>{
  const f=fixture();const r=await f.invoke({action:"domain"});const out=await r.json();assert.equal(out.mailboxes.length,1);assert.equal(out.mailboxes[0].password,undefined);assert.ok(f.calls.every(c=>c.method==="GET"&&!c.path.endsWith("activate")));assert.equal(f.writes.length,0);
});
test("absent domains show setup without creating them",async()=>{
  const f=fixture({absent:true});const r=await f.invoke({action:"domain"});assert.equal((await r.json()).registered,false);assert.equal(f.calls.length,1);assert.equal(f.writes.length,0);
});
test("domain addition requires explicit confirmation and keeps external DNS",async()=>{
  const f=fixture();assert.equal((await f.invoke({action:"add_domain"})).status,400);assert.equal(f.calls.length,0);
  const r=await f.invoke({action:"add_domain",confirm_domain:"example.org"});assert.equal(r.status,200);assert.deepEqual(f.calls[0],{path:"/domains",method:"POST",body:{name:"example.org",hosted_dns:false,create_default_addresses:true}});
});
test("activation is explicit and only updates local monitoring after provider success",async()=>{
  const f=fixture();assert.equal((await f.invoke({action:"activate_domain"})).status,400);
  const r=await f.invoke({action:"activate_domain",confirm_domain:"example.org"});assert.equal(r.status,200);assert.equal(f.calls[0].path,"/domains/example.org/activate");assert.ok(f.writes.some(w=>w.table==="domains"&&w.email_provider==="Migadu"));
});
test("mailbox create uses real API POST and does not invite or send emails",async()=>{
  const f=fixture();const r=await f.invoke({action:"create_mailbox",local_part:"Info",name:"Example",password:pwd,forwarding_to:"attacker@example.net"});assert.equal(r.status,200);
  assert.deepEqual(f.calls[0],{path:"/domains/example.org/mailboxes",method:"POST",body:{local_part:"info",name:"Example",password:pwd,password_method:"password",is_internal:false}});
  assert.ok(!(await r.text()).includes(pwd));assert.ok(!JSON.stringify(f.writes).includes(pwd));
});
test("update allowlist excludes password, rename and hidden provider settings",async()=>{
  const f=fixture();const r=await f.invoke({action:"update_mailbox",...box,password:pwd,forwarding_to:"attacker@example.net",is_internal:true});
  assert.equal(r.status,200);assert.deepEqual(f.calls[0],{path:"/domains/example.org/mailboxes/info",method:"PUT",body:{name:"Example",may_send:true,may_receive:true,may_access_imap:true,may_access_pop3:false}});
});
test("password reset writes only password fields with PUT",async()=>{
  const f=fixture();const r=await f.invoke({action:"reset_password",local_part:"info",password:pwd,name:"Do not change"});assert.equal(r.status,200);assert.deepEqual(f.calls[0],{path:"/domains/example.org/mailboxes/info",method:"PUT",body:{password:pwd,password_method:"password"}});assert.deepEqual(await r.json(),{ok:true});
});
test("delete is blocked until the exact complete address is confirmed",async()=>{
  const f=fixture();for(const confirm_address of ["","info","info@other.org"]){assert.equal((await f.invoke({action:"delete_mailbox",local_part:"info",confirm_address})).status,400);}
  assert.equal(f.calls.length,0);assert.equal(f.writes.length,0);
  const r=await f.invoke({action:"delete_mailbox",local_part:"info",confirm_address:"info@example.org"});assert.equal(r.status,200);assert.equal(f.calls[0].method,"DELETE");assert.equal(f.calls[0].path,"/domains/example.org/mailboxes/info");
});
test("failed audit and repeated request IDs prevent external writes",async()=>{
  for(const options of [{duplicate:true},{auditFailure:true}]){const f=fixture(options);const r=await f.invoke({action:"reset_password",local_part:"info",password:pwd});assert.ok(r.status>=400);assert.equal(f.calls.length,0);}
});
test("disconnect removes only management credentials",async()=>{
  const f=fixture();const r=await f.invoke({action:"disconnect"});assert.equal(r.status,200);assert.equal(f.calls.length,0);assert.equal(f.rpcs[0].name,"migadu_management_secret");assert.equal(f.rpcs[0].args.p_action,"delete");
});
test("invalid local parts cannot escape the fixed domain mailbox path",()=>{
  for(const part of ["../domains/other","x@y.nl","x?delete=1","a..b",".admin","a/../../","a".repeat(65)])assert.throws(()=>localPart(part));
  assert.equal(localPart("info+website"),"info+website");
});
test("password validation preserves spaces and rejects weak/invalid input",()=>{
  assert.throws(()=>mailboxPayload("reset_password",{password:"short"}));
  assert.throws(()=>mailboxPayload("reset_password",{password:"long-password\nx"}));
  assert.equal(mailboxPayload("reset_password",{password:"  long-passphrase  "}).password,"  long-passphrase  ");
});
test("provider client fixes origin, auth, JSON, timeout and redirect policy",async()=>{
  let seen:any;
  const api=createMigaduClient(credentials,async(url,init)=>{seen={url,init};return new Response(JSON.stringify({ok:true}),{status:200});});
  await api("/domains/example.org/mailboxes","POST",{name:"Example"});
  assert.equal(seen.url,"https://api.migadu.com/v1/domains/example.org/mailboxes");assert.equal(seen.init.redirect,"error");assert.equal(seen.init.cache,"no-store");assert.equal(seen.init.headers.Authorization,"Basic "+btoa(credentials.email+":"+credentials.api_key));assert.ok(seen.init.signal);
  await assert.rejects(()=>api("https://attacker.example"));
});
test("provider errors never disclose response bodies and 422 explains DNS",async()=>{
  const api=createMigaduClient(credentials,async()=>new Response(JSON.stringify({error:pwd}),{status:422}));
  await assert.rejects(()=>api("/domains/example.org/activate"),e=>{assert.ok(!String(e).includes(pwd));assert.match(String(e),/DNS/);return true;});
});
test("DELETE supports empty 204 responses",async()=>{
  const api=createMigaduClient(credentials,async()=>new Response(null,{status:204}));assert.equal(await api("/domains/example.org/mailboxes/info","DELETE"),null);
});
test("safe response projection excludes secrets and DNS records retain MX priority",()=>{
  assert.equal((safeMailbox(box) as any).password,undefined);
  const out=dnsRecords({mx_records:[{name:"@",type:"mx",value:"aspmx1.migadu.com",priority:10}]});assert.equal(out[0].priority,10);
  assert.throws(()=>accountCredentials({email:"admin:bad@example.org",api_key:"abc"}));
});
