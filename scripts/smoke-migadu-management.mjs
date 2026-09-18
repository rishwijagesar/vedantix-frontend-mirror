// Read-only production guard: never creates users, sends mail or mutates mailboxes.
const url="https://zxnexwqvoznmirajhgxj.supabase.co/functions/v1/migadu-admin";
const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!key)throw new Error("Missing publishable key for the auth smoke check");
for(const probe of [
  {name:"anonymous status",method:"POST",headers:{Origin:"https://vedantix.nl"},expected:401},
  {name:"invalid session",method:"POST",headers:{Origin:"https://vedantix.nl",Authorization:"Bearer invalid-test-session"},expected:401},
  {name:"foreign origin",method:"POST",headers:{Origin:"https://untrusted.example"},expected:403},
  {name:"GET is not an action",method:"GET",headers:{Origin:"https://vedantix.nl"},expected:405},
]) {
  const response=await fetch(url,{method:probe.method,headers:{"Content-Type":"application/json",apikey:key,...probe.headers},
    ...(probe.method==="POST"?{body:JSON.stringify({action:"status"})}:{}),signal:AbortSignal.timeout(20000)});
  await response.text();
  if(response.status!==probe.expected)throw new Error(probe.name+" returned "+response.status+"; expected "+probe.expected);
  console.log(probe.name+": "+response.status);
}
