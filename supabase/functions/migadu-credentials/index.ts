import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix-migration-test.lovable.app",
  "https://vedantix-control-center-test.lovable.app",
  "https://admin.vedantix.nl",
]);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function responseHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix-control-center-test.lovable.app";
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

  private async readLine(): Promise<string> {
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

  async response(expected: number[]) {
    const first = await this.readLine();
    const code = Number(first.slice(0, 3));
    const lines = [first];
    if (first[3] === "-") {
      while (true) {
        const line = await this.readLine();
        lines.push(line);
        if (line.startsWith(`${code} `)) break;
      }
    }
    if (!expected.includes(code)) throw new Error(`SMTP ${code}: ${lines.join(" | ")}`);
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

async function connectAuthenticated(user: string, password: string) {
  const conn = await Deno.connectTls({ hostname: "smtp.migadu.com", port: 465 });
  const smtp = new SmtpConnection(conn);
  try {
    await smtp.response([220]);
    await smtp.command("EHLO admin.vedantix.nl", [250]);
    const authPayload = utf8Base64(`\u0000${user}\u0000${password}`);
    await smtp.command(`AUTH PLAIN ${authPayload}`, [235]);
    return smtp;
  } catch (error) {
    smtp.close();
    throw error;
  }
}

async function verifyMigaduLogin(user: string, password: string) {
  const smtp = await connectAuthenticated(user, password);
  try {
    await smtp.command("QUIT", [221]);
  } finally {
    smtp.close();
  }
}

async function sendTestMail(args: { user: string; password: string; from: string; recipients: string[] }) {
  const smtp = await connectAuthenticated(args.user, args.password);
  try {
    await smtp.command(`MAIL FROM:<${args.from}>`, [250]);
    for (const recipient of args.recipients) {
      await smtp.command(`RCPT TO:<${recipient}>`, [250, 251]);
    }
    await smtp.command("DATA", [354]);

    const body = [
      "Vedantix Control Center monitoring",
      "",
      "Deze testmail bevestigt dat de beveiligde Migadu SMTP-koppeling werkt.",
      "",
      `SMTP mailbox: ${args.user}`,
      `Tijdstip: ${new Date().toISOString()}`,
      "",
      "Er is geen test-alert of andere operationele data aangemaakt.",
    ].join("\n");

    const data = [
      `From: Vedantix Monitoring <${args.from}>`,
      `To: ${args.recipients.join(", ")}`,
      "Subject: [Vedantix] Monitoring testmail",
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
  if (origin && !allowedOrigins.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRole || !authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers });

  const { data: staff, error: staffError } = await userClient
    .from("staff_users")
    .select("role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (staffError || staff?.role !== "ADMIN") return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers });

  let body: { action?: "save" | "test"; user?: string; password?: string; alert_to?: string; alert_from?: string } = {};
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  if (body.action === "test") {
    const { data: credentialRows, error: credentialError } = await admin.rpc("get_migadu_delivery_credentials");
    const credentials = Array.isArray(credentialRows) ? credentialRows[0] : credentialRows;
    if (credentialError || !credentials?.smtp_user || !credentials?.smtp_password) {
      return new Response(JSON.stringify({ error: "Migadu credentials are not configured" }), { status: 400, headers });
    }

    const recipients = String(credentials.alert_to || credentials.smtp_user)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const from = String(credentials.alert_from || credentials.smtp_user).trim();

    try {
      await sendTestMail({
        user: String(credentials.smtp_user),
        password: String(credentials.smtp_password),
        from,
        recipients,
      });
      return new Response(JSON.stringify({ ok: true, test_email_sent: true, recipients }), { status: 200, headers });
    } catch {
      return new Response(JSON.stringify({ ok: false, test_email_sent: false, error: "Migadu testmail kon niet worden verstuurd." }), { status: 502, headers });
    }
  }

  const smtpUser = body.user?.trim().toLowerCase() ?? "";
  const smtpPassword = body.password ?? "";
  const alertTo = body.alert_to?.trim() || smtpUser;
  const alertFrom = body.alert_from?.trim() || smtpUser;
  if (!smtpUser || !smtpUser.includes("@") || !smtpPassword) {
    return new Response(JSON.stringify({ error: "SMTP user and password are required" }), { status: 400, headers });
  }

  try {
    await verifyMigaduLogin(smtpUser, smtpPassword);
  } catch {
    return new Response(
      JSON.stringify({ ok: false, authenticated: false, error: "Migadu SMTP-authenticatie is mislukt. Controleer mailbox en wachtwoord." }),
      { status: 400, headers },
    );
  }

  const { error: storeError } = await admin.rpc("store_migadu_delivery_credentials", {
    p_user: smtpUser,
    p_password: smtpPassword,
    p_alert_to: alertTo,
    p_alert_from: alertFrom,
  });
  if (storeError) return new Response(JSON.stringify({ error: "Credentials could not be stored securely" }), { status: 500, headers });

  return new Response(
    JSON.stringify({ ok: true, authenticated: true, stored_in: "supabase_vault", user: smtpUser, alert_to: alertTo, alert_from: alertFrom }),
    { status: 200, headers },
  );
});
