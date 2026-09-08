import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix-migration-test.lovable.app",
  "https://vedantix.nl",
]);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cors(request: Request) {
  const origin = request.headers.get("Origin");
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin && allowedOrigins.has(origin) ? origin : "https://vedantix-migration-test.lovable.app",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
  };
}

function utf8Base64(value: string) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fold(value: string) {
  const encoded = utf8Base64(value);
  return encoded.match(/.{1,76}/g)?.join("\r\n") ?? encoded;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

class SmtpConnection {
  private conn: Deno.TlsConn;
  private buffer = "";
  constructor(conn: Deno.TlsConn) { this.conn = conn; }
  private async readLine() {
    while (!this.buffer.includes("\n")) {
      const chunk = new Uint8Array(4096);
      const read = await this.conn.read(chunk);
      if (read === null) throw new Error("SMTP connection closed");
      this.buffer += decoder.decode(chunk.subarray(0, read), { stream: true });
    }
    const index = this.buffer.indexOf("\n");
    const line = this.buffer.slice(0, index + 1);
    this.buffer = this.buffer.slice(index + 1);
    return line.replace(/\r?\n$/, "");
  }
  async response(expected: number[]) {
    const first = await this.readLine();
    const code = Number(first.slice(0,3));
    const lines = [first];
    if (first[3] === "-") while (true) { const line = await this.readLine(); lines.push(line); if (line.startsWith(`${code} `)) break; }
    if (!expected.includes(code)) throw new Error(`SMTP ${code}: ${lines.join(" | ")}`);
  }
  async command(command: string, expected: number[]) { await this.conn.write(encoder.encode(`${command}\r\n`)); await this.response(expected); }
  async data(value: string) { await this.conn.write(encoder.encode(value)); await this.response([250]); }
  close() { try { this.conn.close(); } catch { /* noop */ } }
}

async function sendMail(args: { user:string; password:string; from:string; to:string; subject:string; html:string }) {
  const conn = await Deno.connectTls({ hostname:"smtp.migadu.com", port:465 });
  const smtp = new SmtpConnection(conn);
  try {
    await smtp.response([220]);
    await smtp.command("EHLO contracts.vedantix.nl", [250]);
    await smtp.command(`AUTH PLAIN ${utf8Base64(`\u0000${args.user}\u0000${args.password}`)}`, [235]);
    await smtp.command(`MAIL FROM:<${args.from}>`, [250]);
    await smtp.command(`RCPT TO:<${args.to}>`, [250,251]);
    await smtp.command("DATA", [354]);
    const data = [
      `From: Vedantix <${args.from}>`,`To: ${args.to}`,`Subject: ${args.subject}`,`Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@vedantix.nl>`,"MIME-Version: 1.0","Content-Type: text/html; charset=UTF-8","Content-Transfer-Encoding: base64","",fold(args.html),".",""
    ].join("\r\n");
    await smtp.data(data);
    await smtp.command("QUIT", [221]);
  } finally { smtp.close(); }
}

function signatureValid(type: string, data: string) {
  if (type === "TYPED") return data.trim().length >= 2 && data.length <= 200;
  return type === "DRAWN" && data.startsWith("data:image/png;base64,") && data.length <= 120_000;
}

Deno.serve(async (request: Request) => {
  const headers = cors(request);
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response(null, { status: origin && !allowedOrigins.has(origin) ? 403 : 204, headers });
  if (request.method !== "POST") return new Response(JSON.stringify({ error:"Method not allowed" }), { status:405, headers });
  if (origin && !allowedOrigins.has(origin)) return new Response(JSON.stringify({ error:"Origin not allowed" }), { status:403, headers });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRole || !authHeader) return new Response(JSON.stringify({ error:"Unauthorized" }), { status:401, headers });

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, { global:{ headers:{ Authorization:authHeader } }, auth:{ persistSession:false } });
  const { data:claims, error:claimsError } = await userClient.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return new Response(JSON.stringify({ error:"Invalid session" }), { status:401, headers });
  const { data:staff } = await userClient.from("staff_users").select("role,active").eq("user_id",userId).eq("active",true).maybeSingle();
  if (!staff || !["ADMIN","OPERATOR"].includes(String(staff.role))) return new Response(JSON.stringify({ error:"Staff role required" }), { status:403, headers });

  let body: { action?:"sign"|"send"; contract_id?:string; signer_name?:string; signature_type?:"TYPED"|"DRAWN"; signature_data?:string } = {};
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error:"Invalid JSON" }), { status:400, headers }); }
  const contractId = String(body.contract_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(contractId)) return new Response(JSON.stringify({ error:"Invalid contract id" }), { status:400, headers });

  const admin = createClient(supabaseUrl, serviceRole, { auth:{ persistSession:false } });
  const { data:contract } = await admin.from("contracts").select("*").eq("id",contractId).maybeSingle();
  if (!contract) return new Response(JSON.stringify({ error:"Contract not found" }), { status:404, headers });

  if (body.action === "sign") {
    if (contract.status !== "FINALIZED" || !contract.document_hash) return new Response(JSON.stringify({ error:"Finalized contract required" }), { status:409, headers });
    const signerName = String(body.signer_name || "").trim();
    const signatureType = String(body.signature_type || "");
    const signatureData = String(body.signature_data || "");
    if (signerName.length < 2 || !signatureValid(signatureType, signatureData)) return new Response(JSON.stringify({ error:"Valid signature required" }), { status:400, headers });
    const { data:company } = await admin.from("company_profile").select("email").eq("id",true).maybeSingle();
    const { error:signatureError } = await admin.from("contract_signatures").insert({
      contract_id:contract.id, signer_role:"VEDANTIX", signer_name:signerName, signer_email:company?.email || "info@vedantix.nl",
      signature_type:signatureType, signature_data:signatureData, document_hash:contract.document_hash,
      ip_address:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null, user_agent:request.headers.get("user-agent") || null,
    });
    if (signatureError) return new Response(JSON.stringify({ error:signatureError.message }), { status:409, headers });
    const now = new Date().toISOString();
    await admin.from("contracts").update({ status:"VEDANTIX_SIGNED", vedantix_signed_at:now }).eq("id",contract.id);
    await admin.from("contract_events").insert({ contract_id:contract.id,event_type:"VEDANTIX_SIGNED",actor_role:"VEDANTIX",actor_name:signerName,metadata:{ document_hash:contract.document_hash } });
    return new Response(JSON.stringify({ ok:true,status:"VEDANTIX_SIGNED" }), { status:200, headers });
  }

  if (body.action === "send") {
    if (contract.status !== "VEDANTIX_SIGNED" && contract.status !== "SENT") return new Response(JSON.stringify({ error:"Vedantix signature required" }), { status:409, headers });
    const { data:readiness } = await admin.from("commerce_production_activation").select("live_marker_ok").eq("id",true).maybeSingle();
    if (!readiness?.live_marker_ok) return new Response(JSON.stringify({ error:"Productiedomein is nog niet gevalideerd; contractmail blijft geblokkeerd." }), { status:409, headers });
    const recipient = String(contract.customer_snapshot?.email || "").trim().toLowerCase();
    if (!recipient || !recipient.includes("@")) return new Response(JSON.stringify({ error:"Customer e-mail missing" }), { status:400, headers });
    const { data:credentialRows } = await admin.rpc("get_migadu_delivery_credentials");
    const creds = Array.isArray(credentialRows) ? credentialRows[0] : credentialRows;
    const smtpUser = String(creds?.smtp_user || "").trim();
    const smtpPassword = String(creds?.smtp_password || "");
    const smtpFrom = String(creds?.alert_from || smtpUser).trim();
    if (!smtpUser || !smtpPassword || !smtpFrom) return new Response(JSON.stringify({ error:"SMTP not configured" }), { status:503, headers });
    const link = `https://vedantix.nl/contract/${contract.public_token}`;
    const customerName = escapeHtml(contract.customer_snapshot?.contact_name || contract.customer_snapshot?.company_name || "klant");
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f1f5f9;color:#0f172a;margin:0"><div style="max-width:620px;margin:0 auto;padding:32px 16px"><div style="background:#0f172a;color:#fff;padding:22px;border-radius:16px 16px 0 0"><strong style="font-size:22px">Vedantix</strong></div><div style="background:#fff;padding:28px 24px;border-radius:0 0 16px 16px"><p>Beste ${customerName},</p><p>Het contract <strong>${escapeHtml(contract.contract_number)}</strong> staat klaar voor jouw ondertekening. Vedantix heeft het document al ondertekend.</p><p>Om jouw handtekening te plaatsen verifiëren we eerst je e-mailadres met een eenmalige code.</p><a href="${link}" style="display:inline-block;margin-top:14px;background:#0f172a;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">Contract bekijken en ondertekenen</a><p style="margin-top:28px;color:#64748b;font-size:12px">De ondertekening en documenthash worden vastgelegd in de Vedantix audit trail.</p></div></div></body></html>`;
    await sendMail({ user:smtpUser,password:smtpPassword,from:smtpFrom,to:recipient,subject:`Ondertekening gevraagd: ${contract.contract_number}`,html });
    const now = new Date().toISOString();
    await admin.from("contracts").update({ status:"SENT",sent_at:contract.sent_at || now }).eq("id",contract.id);
    await admin.from("contract_events").insert([
      { contract_id:contract.id,event_type:"SIGNATURE_REQUESTED",actor_role:"VEDANTIX",actor_name:userId,actor_email:smtpFrom,metadata:{ recipient } },
      { contract_id:contract.id,event_type:"EMAIL_SENT",actor_role:"SYSTEM",actor_email:recipient,metadata:{ kind:"SIGNATURE_REQUEST" } },
    ]);
    return new Response(JSON.stringify({ ok:true,status:"SENT",recipient }), { status:200, headers });
  }

  return new Response(JSON.stringify({ error:"Unsupported action" }), { status:400, headers });
});
