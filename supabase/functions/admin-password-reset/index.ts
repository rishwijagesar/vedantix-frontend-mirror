import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix.nl",
  "https://vedantix-migration-test.lovable.app",
]);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function responseHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix.nl";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function utf8Base64(value: string) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function foldBase64(value: string) {
  const encoded = utf8Base64(value);
  return encoded.match(/.{1,76}/g)?.join("\r\n") ?? encoded;
}

class SmtpConnection {
  private conn: Deno.TlsConn;
  private buffer = "";

  constructor(conn: Deno.TlsConn) {
    this.conn = conn;
  }

  private async readLine() {
    while (!this.buffer.includes("\n")) {
      const chunk = new Uint8Array(4096);
      const read = await this.conn.read(chunk);
      if (read === null) throw new Error("SMTP connection closed unexpectedly");
      this.buffer += decoder.decode(chunk.subarray(0, read), { stream: true });
    }
    const newline = this.buffer.indexOf("\n");
    const line = this.buffer.slice(0, newline + 1);
    this.buffer = this.buffer.slice(newline + 1);
    return line.replace(/\r?\n$/, "");
  }

  async response(expected?: number[]) {
    const first = await this.readLine();
    const code = Number(first.slice(0, 3));
    if (!Number.isFinite(code)) throw new Error(`Invalid SMTP response: ${first}`);
    const lines = [first];
    if (first[3] === "-") {
      while (true) {
        const line = await this.readLine();
        lines.push(line);
        if (line.startsWith(`${code} `)) break;
      }
    }
    if (expected && !expected.includes(code)) throw new Error(`SMTP ${code}: ${lines.join(" | ")}`);
    return { code, lines };
  }

  async command(command: string, expected: number[]) {
    await this.conn.write(encoder.encode(`${command}\r\n`));
    return await this.response(expected);
  }

  async writeData(data: string, expected: number[]) {
    await this.conn.write(encoder.encode(data));
    return await this.response(expected);
  }

  close() {
    try { this.conn.close(); } catch { /* no-op */ }
  }
}

async function sendRecoveryMail(args: { user: string; password: string; from: string; to: string; link: string }) {
  const conn = await Deno.connectTls({ hostname: "smtp.migadu.com", port: 465 });
  const smtp = new SmtpConnection(conn);
  try {
    await smtp.response([220]);
    await smtp.command("EHLO admin.vedantix.nl", [250]);
    const authPayload = utf8Base64(`\u0000${args.user}\u0000${args.password}`);
    await smtp.command(`AUTH PLAIN ${authPayload}`, [235]);
    await smtp.command(`MAIL FROM:<${args.from}>`, [250]);
    await smtp.command(`RCPT TO:<${args.to}>`, [250, 251]);
    await smtp.command("DATA", [354]);

    const body = [
      "Je hebt gevraagd om het wachtwoord van het Vedantix Control Center opnieuw in te stellen.",
      "",
      "Open onderstaande beveiligde link en kies een nieuw wachtwoord:",
      args.link,
      "",
      "Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.",
      "",
      "Vedantix",
    ].join("\n");

    const data = [
      `From: Vedantix <${args.from}>`,
      `To: ${args.to}`,
      "Subject: Wachtwoord herstellen - Vedantix Control Center",
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@admin.vedantix.nl>`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      foldBase64(body),
      ".",
      "",
    ].join("\r\n");

    await smtp.writeData(data, [250]);
    await smtp.command("QUIT", [221]);
  } finally {
    smtp.close();
  }
}

Deno.serve(async (request: Request) => {
  const headers = responseHeaders(request);
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  if (!origin || !allowedOrigins.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });

  const generic = () => new Response(
    JSON.stringify({ ok: true, message: "Als dit account bestaat en geautoriseerd is, ontvang je een e-mail om je wachtwoord opnieuw in te stellen." }),
    { status: 200, headers },
  );

  let body: { email?: string } = {};
  try { body = await request.json(); } catch { return generic(); }
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) return generic();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    console.error("admin-password-reset missing Supabase environment variables");
    return new Response(JSON.stringify({ error: "Recovery service unavailable" }), { status: 503, headers });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: allowed, error: guardError } = await admin.rpc("can_request_admin_password_reset", { p_email: email });
  if (guardError) {
    console.error("admin password reset guard failed", guardError.message);
    return new Response(JSON.stringify({ error: "Recovery service unavailable" }), { status: 503, headers });
  }
  if (allowed !== true) return generic();

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: "https://vedantix.nl/admin" },
  });
  if (linkError || !linkData?.properties?.action_link) {
    console.error("admin recovery link generation failed", linkError?.message || "missing action link");
    return new Response(JSON.stringify({ error: "Recovery service unavailable" }), { status: 503, headers });
  }

  const { data: credentialRows, error: credentialError } = await admin.rpc("get_migadu_delivery_credentials");
  const creds = Array.isArray(credentialRows) ? credentialRows[0] : credentialRows;
  const smtpUser = String(creds?.smtp_user || "").trim();
  const smtpPassword = String(creds?.smtp_password || "");
  const smtpFrom = String(creds?.alert_from || smtpUser || "").trim();
  if (credentialError || !smtpUser || !smtpPassword || !smtpFrom) {
    console.error("admin recovery Migadu credentials unavailable");
    return new Response(JSON.stringify({ error: "Recovery service unavailable" }), { status: 503, headers });
  }

  try {
    await sendRecoveryMail({
      user: smtpUser,
      password: smtpPassword,
      from: smtpFrom,
      to: email,
      link: linkData.properties.action_link,
    });
  } catch (error) {
    console.error("admin recovery email failed", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "Recovery service unavailable" }), { status: 503, headers });
  }

  return generic();
});
