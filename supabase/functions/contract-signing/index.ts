import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const jsonHeaders = { "content-type":"application/json; charset=utf-8" };
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function clientIp(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null; }
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((b)=>b.toString(16).padStart(2,"0")).join("");
}
function randomCode() { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return String(100000 + (bytes[0] % 900000)); }
function randomToken() { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
function utf8Base64(value: string) { const bytes = encoder.encode(value); let binary=""; for(const b of bytes) binary += String.fromCharCode(b); return btoa(binary); }
function fold(value:string){const encoded=utf8Base64(value);return encoded.match(/.{1,76}/g)?.join("\r\n")??encoded;}
function escapeHtml(value: unknown){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

class SmtpConnection {
  private conn:Deno.TlsConn; private buffer="";
  constructor(conn:Deno.TlsConn){this.conn=conn;}
  private async readLine(){while(!this.buffer.includes("\n")){const chunk=new Uint8Array(4096);const read=await this.conn.read(chunk);if(read===null)throw new Error("SMTP connection closed");this.buffer+=decoder.decode(chunk.subarray(0,read),{stream:true});}const i=this.buffer.indexOf("\n");const line=this.buffer.slice(0,i+1);this.buffer=this.buffer.slice(i+1);return line.replace(/\r?\n$/,"");}
  async response(expected:number[]){const first=await this.readLine();const code=Number(first.slice(0,3));if(first[3]==="-")while(true){const line=await this.readLine();if(line.startsWith(`${code} `))break;}if(!expected.includes(code))throw new Error(`SMTP ${code}`);}
  async command(command:string,expected:number[]){await this.conn.write(encoder.encode(`${command}\r\n`));await this.response(expected);}
  async data(value:string){await this.conn.write(encoder.encode(value));await this.response([250]);}
  close(){try{this.conn.close();}catch{/*noop*/}}
}
async function sendMail(args:{user:string;password:string;from:string;to:string;subject:string;html:string}){
  const conn=await Deno.connectTls({hostname:"smtp.migadu.com",port:465}); const smtp=new SmtpConnection(conn);
  try{await smtp.response([220]);await smtp.command("EHLO signing.vedantix.nl",[250]);await smtp.command(`AUTH PLAIN ${utf8Base64(`\u0000${args.user}\u0000${args.password}`)}`,[235]);await smtp.command(`MAIL FROM:<${args.from}>`,[250]);await smtp.command(`RCPT TO:<${args.to}>`,[250,251]);await smtp.command("DATA",[354]);const data=[`From: Vedantix <${args.from}>`,`To: ${args.to}`,`Subject: ${args.subject}`,`Date: ${new Date().toUTCString()}`,`Message-ID: <${crypto.randomUUID()}@vedantix.nl>`,"MIME-Version: 1.0","Content-Type: text/html; charset=UTF-8","Content-Transfer-Encoding: base64","",fold(args.html),".",""].join("\r\n");await smtp.data(data);await smtp.command("QUIT",[221]);}finally{smtp.close();}
}
function signatureValid(type:string,data:string){if(type==="TYPED")return data.trim().length>=2&&data.length<=200;return type==="DRAWN"&&data.startsWith("data:image/png;base64,")&&data.length<=120000;}
function publicContract(contract:any, signatures:any[]){return {
  contract_number:contract.contract_number,status:contract.status,title:contract.title,project_name:contract.project_name,
  variables:contract.variables,clauses:contract.clauses,template_snapshot:contract.template_snapshot,
  company:contract.company_snapshot,customer:contract.customer_snapshot,document_hash:contract.document_hash,
  finalized_at:contract.finalized_at,vedantix_signed_at:contract.vedantix_signed_at,sent_at:contract.sent_at,completed_at:contract.completed_at,
  signatures:signatures.map((s)=>({signer_role:s.signer_role,signer_name:s.signer_name,signature_type:s.signature_type,signature_data:s.signature_data,signed_at:s.signed_at,email_verified_at:s.email_verified_at})),
};}

Deno.serve(async(request:Request)=>{
  if(request.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:jsonHeaders});
  const supabaseUrl=Deno.env.get("SUPABASE_URL");const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!supabaseUrl||!serviceRole)return new Response(JSON.stringify({error:"Server configuration missing"}),{status:500,headers:jsonHeaders});
  const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}});
  let body:{action?:"view"|"request_otp"|"verify_otp"|"sign";token?:string;code?:string;session_token?:string;signer_name?:string;signature_type?:"TYPED"|"DRAWN";signature_data?:string;consent?:boolean}={};
  try{body=await request.json();}catch{return new Response(JSON.stringify({error:"Invalid JSON"}),{status:400,headers:jsonHeaders});}
  const token=String(body.token||"").trim();if(!/^[0-9a-f-]{36}$/i.test(token))return new Response(JSON.stringify({error:"Invalid contract token"}),{status:400,headers:jsonHeaders});
  const {data:contract}=await admin.from("contracts").select("*").eq("public_token",token).maybeSingle();
  if(!contract||!["SENT","COMPLETED"].includes(String(contract.status)))return new Response(JSON.stringify({error:"Contract not available"}),{status:404,headers:jsonHeaders});
  const ip=clientIp(request);const userAgent=request.headers.get("user-agent")||null;

  if(body.action==="view"){
    const {data:signatures}=await admin.from("contract_signatures").select("signer_role,signer_name,signature_type,signature_data,signed_at,email_verified_at").eq("contract_id",contract.id).order("signed_at");
    await admin.from("contract_events").insert({contract_id:contract.id,event_type:"DOCUMENT_OPENED",actor_role:"CLIENT",ip_address:ip,user_agent:userAgent});
    return new Response(JSON.stringify({ok:true,contract:publicContract(contract,signatures||[])}),{status:200,headers:jsonHeaders});
  }

  if(body.action==="request_otp"){
    if(contract.status!=="SENT")return new Response(JSON.stringify({error:"Contract is already completed"}),{status:409,headers:jsonHeaders});
    const email=String(contract.customer_snapshot?.email||"").trim().toLowerCase();if(!email.includes("@"))return new Response(JSON.stringify({error:"Signer e-mail missing"}),{status:400,headers:jsonHeaders});
    const hourAgo=new Date(Date.now()-3600000).toISOString();
    const {count}=await admin.from("contract_signing_challenges").select("id",{count:"exact",head:true}).eq("contract_id",contract.id).gte("created_at",hourAgo);
    if((count||0)>=5)return new Response(JSON.stringify({error:"Te veel codes aangevraagd. Probeer later opnieuw."}),{status:429,headers:jsonHeaders});
    const {data:last}=await admin.from("contract_signing_challenges").select("created_at").eq("contract_id",contract.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(last&&Date.now()-new Date(last.created_at).getTime()<60000)return new Response(JSON.stringify({error:"Wacht minimaal 60 seconden voordat je een nieuwe code aanvraagt."}),{status:429,headers:jsonHeaders});
    const code=randomCode();const salt=crypto.randomUUID();const codeHash=await sha256(`${salt}:${code}`);const expiresAt=new Date(Date.now()+10*60000).toISOString();
    await admin.from("contract_signing_challenges").insert({contract_id:contract.id,code_hash:codeHash,salt,expires_at:expiresAt});
    const {data:credentialRows}=await admin.rpc("get_migadu_delivery_credentials");const creds=Array.isArray(credentialRows)?credentialRows[0]:credentialRows;const smtpUser=String(creds?.smtp_user||"").trim();const smtpPassword=String(creds?.smtp_password||"");const smtpFrom=String(creds?.alert_from||smtpUser).trim();
    if(!smtpUser||!smtpPassword||!smtpFrom)return new Response(JSON.stringify({error:"E-mailservice is niet beschikbaar"}),{status:503,headers:jsonHeaders});
    const html=`<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f1f5f9;color:#0f172a;margin:0"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#fff;padding:28px;border-radius:16px"><strong style="font-size:21px">Vedantix</strong><h1 style="font-size:20px;margin-top:24px">Verificatiecode contractondertekening</h1><p>Gebruik onderstaande code om je e-mailadres te verifiëren voor contract <strong>${escapeHtml(contract.contract_number)}</strong>.</p><div style="font-size:32px;letter-spacing:8px;font-weight:800;margin:26px 0">${code}</div><p style="color:#64748b;font-size:13px">Deze code is 10 minuten geldig. Deel deze code niet met anderen.</p></div></div></body></html>`;
    await sendMail({user:smtpUser,password:smtpPassword,from:smtpFrom,to:email,subject:`Verificatiecode ${contract.contract_number}`,html});
    await admin.from("contract_events").insert([{contract_id:contract.id,event_type:"OTP_REQUESTED",actor_role:"CLIENT",actor_email:email,ip_address:ip,user_agent:userAgent},{contract_id:contract.id,event_type:"EMAIL_SENT",actor_role:"SYSTEM",actor_email:email,metadata:{kind:"OTP"}}]);
    return new Response(JSON.stringify({ok:true,expires_at:expiresAt,email_hint:email.replace(/^(.{1,2}).*(@.*)$/,"$1***$2")}),{status:200,headers:jsonHeaders});
  }

  if(body.action==="verify_otp"){
    const code=String(body.code||"").trim();if(!/^\d{6}$/.test(code))return new Response(JSON.stringify({error:"Vul een geldige 6-cijferige code in"}),{status:400,headers:jsonHeaders});
    const {data:challenge}=await admin.from("contract_signing_challenges").select("*").eq("contract_id",contract.id).is("consumed_at",null).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(!challenge||new Date(challenge.expires_at).getTime()<Date.now()||Number(challenge.attempts)>=5)return new Response(JSON.stringify({error:"De verificatiecode is verlopen. Vraag een nieuwe code aan."}),{status:410,headers:jsonHeaders});
    const candidate=await sha256(`${challenge.salt}:${code}`);
    if(candidate!==challenge.code_hash){await admin.from("contract_signing_challenges").update({attempts:Number(challenge.attempts)+1}).eq("id",challenge.id);return new Response(JSON.stringify({error:"Onjuiste verificatiecode"}),{status:401,headers:jsonHeaders});}
    const now=new Date().toISOString();await admin.from("contract_signing_challenges").update({consumed_at:now,attempts:Number(challenge.attempts)+1}).eq("id",challenge.id);
    const sessionToken=randomToken();const tokenHash=await sha256(sessionToken);const expiresAt=new Date(Date.now()+30*60000).toISOString();await admin.from("contract_signing_sessions").insert({contract_id:contract.id,token_hash:tokenHash,expires_at:expiresAt});
    await admin.from("contract_events").insert({contract_id:contract.id,event_type:"OTP_VERIFIED",actor_role:"CLIENT",actor_email:String(contract.customer_snapshot?.email||""),ip_address:ip,user_agent:userAgent});
    return new Response(JSON.stringify({ok:true,session_token:sessionToken,expires_at:expiresAt}),{status:200,headers:jsonHeaders});
  }

  if(body.action==="sign"){
    if(contract.status!=="SENT")return new Response(JSON.stringify({error:"Contract is not awaiting signature"}),{status:409,headers:jsonHeaders});
    if(body.consent!==true)return new Response(JSON.stringify({error:"Je moet akkoord gaan met de overeenkomst voordat je tekent."}),{status:400,headers:jsonHeaders});
    const sessionToken=String(body.session_token||"");const tokenHash=await sha256(sessionToken);const {data:session}=await admin.from("contract_signing_sessions").select("*").eq("contract_id",contract.id).eq("token_hash",tokenHash).is("consumed_at",null).maybeSingle();
    if(!session||new Date(session.expires_at).getTime()<Date.now())return new Response(JSON.stringify({error:"Je verificatiesessie is verlopen. Verifieer je e-mailadres opnieuw."}),{status:401,headers:jsonHeaders});
    const signerName=String(body.signer_name||"").trim();const signatureType=String(body.signature_type||"");const signatureData=String(body.signature_data||"");
    if(signerName.length<2||!signatureValid(signatureType,signatureData))return new Response(JSON.stringify({error:"Vul je naam in en plaats een geldige handtekening."}),{status:400,headers:jsonHeaders});
    const verifiedAt=new Date(session.created_at).toISOString();const email=String(contract.customer_snapshot?.email||"").trim().toLowerCase();
    const {error:signatureError}=await admin.from("contract_signatures").insert({contract_id:contract.id,signer_role:"CLIENT",signer_name:signerName,signer_email:email,signature_type:signatureType,signature_data:signatureData,email_verified_at:verifiedAt,document_hash:contract.document_hash,ip_address:ip,user_agent:userAgent});
    if(signatureError)return new Response(JSON.stringify({error:signatureError.message}),{status:409,headers:jsonHeaders});
    const now=new Date().toISOString();await admin.from("contract_signing_sessions").update({consumed_at:now}).eq("id",session.id);await admin.from("contracts").update({status:"COMPLETED",completed_at:now}).eq("id",contract.id);
    await admin.from("contract_events").insert([
      {contract_id:contract.id,event_type:"CONSENT_GIVEN",actor_role:"CLIENT",actor_name:signerName,actor_email:email,ip_address:ip,user_agent:userAgent,metadata:{document_hash:contract.document_hash}},
      {contract_id:contract.id,event_type:"CLIENT_SIGNED",actor_role:"CLIENT",actor_name:signerName,actor_email:email,ip_address:ip,user_agent:userAgent,metadata:{document_hash:contract.document_hash,signature_type:signatureType}},
      {contract_id:contract.id,event_type:"CONTRACT_COMPLETED",actor_role:"SYSTEM",metadata:{document_hash:contract.document_hash}}
    ]);
    return new Response(JSON.stringify({ok:true,status:"COMPLETED"}),{status:200,headers:jsonHeaders});
  }

  return new Response(JSON.stringify({error:"Unsupported action"}),{status:400,headers:jsonHeaders});
});
