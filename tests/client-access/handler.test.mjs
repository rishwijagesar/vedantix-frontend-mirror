import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClientAccessHandler, createClientPasswordResetHandler, callbackUrl, GENERIC_RECOVERY } from '../../supabase/functions/_shared/client-access-handler.ts';
const actor='10000000-0000-4000-8000-000000000001';
const user='20000000-0000-4000-8000-000000000002';
const requestId='30000000-0000-4000-8000-000000000003';
function fixture(overrides={}) {
  const calls=[]; const tasks=[];
  const deps={
    authorize:async(token)=>token==='valid-token'?actor:null,
    command:async(a,action,args)=>{
      calls.push({action,args});
      if(action==='list') return {can_manage:true,sites:[],members:[],invitations:[],audit:[]};
      if(action.startsWith('prepare_')) return {email:'client@example.test',site_name:'Salon',origin:'https://salon.example.test',link_type:'recovery',invitation_id:requestId};
      return {ok:true,status:args.sent===false?'failed':'sent',invitation_id:requestId};
    },
    generate:async(email,type)=>{calls.push({action:'generate',email,type});return {userId:user,email,tokenHash:'never-return-this-otp-hash'};},
    send:async(args)=>{calls.push({action:'send',args});},
    prepareRecovery:async()=>({allowed:true,request_id:requestId,user_id:user,email:'client@example.test',site_name:'Salon',origin:'https://salon.example.test'}),
    finishRecovery:async(id,sent)=>{calls.push({action:'finish_public',id,sent});},
    originAllowed:async(origin)=>origin==='https://salon.example.test',
    background:task=>{tasks.push(task);},
    pause:async()=>{},
    ...overrides,
  };
  return {deps,calls,tasks,admin:createClientAccessHandler(deps),public:createClientPasswordResetHandler(deps)};
}
function request(body,origin='https://vedantix.nl',token='valid-token'){
  return new Request('https://api.example.test/function',{method:'POST',headers:{origin,'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(body)});
}
const invite={action:'invite',email:'client@example.test',site_slug:'sobrinas',request_id:requestId};
test('unverified bearer and untrusted origin cannot run database commands or email',async()=>{
  const f=fixture();
  assert.equal((await f.admin(request(invite,'https://vedantix.nl','invalid'))).status,403);
  assert.equal((await f.admin(request(invite,'https://attacker.test'))).status,403);
  assert.deepEqual(f.calls,[]);
});
test('list never creates tokens or sends messages',async()=>{
  const f=fixture();const response=await f.admin(request({action:'list'}));
  assert.equal(response.status,200);assert.equal((await response.json()).can_manage,true);
  assert.deepEqual(f.calls.map(x=>x.action),['list']);
});
test('roles, redirects, raw active values and oversized bodies are rejected',async()=>{
  const f=fixture();
  for(const body of [{...invite,role:'ADMIN'},{...invite,redirectTo:'https://attacker.test'},{action:'list',site_slug:42},
    {action:'set_membership_active',site_slug:'sobrinas',user_id:user,active:'true',request_id:requestId},{...invite,padding:'x'.repeat(9000)}]){
    assert.equal((await f.admin(request(body))).status,400);
  }
  assert.deepEqual(f.calls,[]);
});
test('invite binds verified identity, sends once then finalizes; bearer secrets absent from response',async()=>{
  const f=fixture();const response=await f.admin(request(invite));
  assert.equal(response.status,200);
  assert.deepEqual(f.calls.map(x=>x.action),['prepare_invite','generate','bind_invite','send','finish_invite']);
  const mail=f.calls.find(x=>x.action==='send').args;
  assert.equal(mail.callback,'https://salon.example.test/admin/accept#token_hash=never-return-this-otp-hash&type=recovery');
  assert.equal((await response.text()).includes('never-return-this-otp-hash'),false);
  assert.equal(f.calls.at(-1).args.sent,true);
});
test('same request replay never generates or sends another message',async()=>{
  const f=fixture({command:async()=>({replayed:true,status:'sent',invitation_id:requestId})});
  assert.equal((await f.admin(request(invite))).status,200);
  assert.deepEqual(f.calls,[]);
});
test('SMTP failure finalizes failed state and returns no provider details or secrets',async()=>{
  const f=fixture({send:async()=>{throw new Error('SMTP sensitive provider message');}});
  const response=await f.admin(request(invite));assert.equal(response.status,503);
  assert.equal(f.calls.at(-1).action,'finish_invite');assert.equal(f.calls.at(-1).args.sent,false);
  assert.equal((await response.text()).includes('SMTP'),false);
});
test('identity substitution and arbitrary callback origin cannot reach mailer',async()=>{
  const f=fixture({generate:async()=>({userId:user,email:'attacker@example.test',tokenHash:'secret'})});
  assert.equal((await f.admin(request(invite))).status,503);
  assert.equal(f.calls.some(x=>x.action==='send'),false);
  assert.throws(()=>callbackUrl('https://salon.example.test@attacker.test/path','secret','recovery'));
  assert.throws(()=>callbackUrl('http://salon.example.test','secret','recovery'));
});
test('a revoked finalization result is preserved instead of claiming a grant succeeded',async()=>{
  const f=fixture();const original=f.deps.command;
  f.deps.command=async(a,action,args)=>action==='finish_invite'?{ok:true,status:'revoked'}:original(a,action,args);
  assert.equal((await (await f.admin(request(invite))).json()).status,'revoked');
});
test('database throttle returns 429 without delivery',async()=>{
  const f=fixture({command:async()=>{throw new Error('RATE_LIMITED');}});
  assert.equal((await f.admin(request(invite))).status,429);assert.deepEqual(f.calls,[]);
});
test('public known, unknown, malformed and denied accounts return identical generic response',async()=>{
  const good=fixture();const bad=fixture({prepareRecovery:async()=>({allowed:false})});
  const req={email:'client@example.test',site_slug:'sobrinas'};
  const known=await good.public(request(req,'https://salon.example.test'));
  const unknown=await bad.public(request({...req,email:'missing@example.test'},'https://salon.example.test'));
  const invalid=await bad.public(request({...req,email:'bad'},'https://salon.example.test'));
  assert.deepEqual(await known.json(),GENERIC_RECOVERY);
  assert.deepEqual(await unknown.json(),GENERIC_RECOVERY);
  assert.deepEqual(await invalid.json(),GENERIC_RECOVERY);
  await Promise.all(good.tasks);assert.equal(good.calls.at(-1).sent,true);
  assert.equal(bad.calls.some(x=>x.action==='send'),false);
});
test('public recovery response does not wait for SMTP, reducing enumeration timing',async()=>{
  let resolveSend;const waiting=new Promise(resolve=>{resolveSend=resolve;});
  const f=fixture({send:async()=>waiting});
  const response=await f.public(request({email:'client@example.test',site_slug:'sobrinas'},'https://salon.example.test'));
  assert.equal(response.status,200);
  assert.equal(f.calls.some(x=>x.action==='finish_public'),false);
  resolveSend();await Promise.all(f.tasks);assert.equal(f.calls.at(-1).sent,true);
});

