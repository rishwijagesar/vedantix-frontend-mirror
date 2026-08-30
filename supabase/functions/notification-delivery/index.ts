import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Mode = "probe" | "deliver";
type NotificationRow = {
  id: string;
  alert_id: string | null;
  event_type: "ALERT_OPENED" | "ALERT_RESOLVED";
  channel: string;
  status: "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
  payload: Record<string, unknown>;
  created_at: string;
};

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

  async response(expected?: number[]): Promise<{ code: number; lines: string[] }> {
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
    if (expected && !expected.includes(code)) {
      throw new Error(`SMTP ${code}: ${lines.join(" | ")}`);
    }
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
    try {
      this.conn.close();
    } catch {
      // no-op
    }
  }
}

async function connectSmtp() {
  const conn = await Deno.connectTls({ hostname: "smtp.migadu.com", port: 465 });
  const smtp = new SmtpConnection(conn);
  await smtp.response([220]);
  const ehlo = await smtp.command("EHLO admin.vedantix.nl", [250]);
  return { smtp, capabilities: ehlo.lines.map((line) => line.slice(4).trim()).filter(Boolean) };
}

async function smtpProbe() {
  const { smtp, capabilities } = await connectSmtp();
  try {
    await smtp.command("QUIT", [221]);
  } finally {
    smtp.close();
  }
  return capabilities;
}

async function sendSmtpMail(args: {
  user: string;
  password: string;
  from: string;
  recipients: string[];
  subject: string;
  body: string;
}) {
  const { smtp } = await connectSmtp();
  try {
    const authPayload = utf8Base64(`\u0000${args.user}\u0000${args.password}`);
    await smtp.command(`AUTH PLAIN ${authPayload}`, [235]);
    await smtp.command(`MAIL FROM:<${args.from}>`, [250]);
    for (const recipient of args.recipients) {
      await smtp.command(`RCPT TO:<${recipient}>`, [250, 251]);
    }
    await smtp.command("DATA", [354]);

    const messageId = `<${crypto.randomUUID()}@admin.vedantix.nl>`;
    const data = [
      `From: Vedantix Monitoring <${args.from}>`,
      `To: ${args.recipients.join(", ")}`,
      `Subject: ${args.subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      foldBase64(args.body),
      ".",
      "",
    ].join("\r\n");

    await smtp.writeData(data, [250]);
    await smtp.command("QUIT", [221]);
  } finally {
    smtp.close();
  }
}

function notificationText(notification: NotificationRow, domainName: string) {
  const payload = notification.payload ?? {};
  const checkType = String(payload.check_type ?? "MONITORING");
  const severity = String(payload.severity ?? "INFO");
  const message = String(payload.message ?? "Monitoringstatus gewijzigd");
  const opened = notification.event_type === "ALERT_OPENED";
  const subject = `[Vedantix][${severity}] ${domainName} - ${opened ? "alert" : "hersteld"} - ${checkType}`;
  const body = [
    "Vedantix Control Center monitoring",
    "",
    `Domein: ${domainName}`,
    `Controle: ${checkType}`,
    `Status: ${opened ? "PROBLEEM GEDETECTEERD" : "HERSTELD"}`,
    `Ernst: ${severity}`,
    `Melding: ${message}`,
    "",
    `Event: ${notification.event_type}`,
    `Tijdstip: ${notification.created_at}`,
    "",
    "Control Center: https://admin.vedantix.nl",
  ].join("\n");
  return { subject, body };
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  const token = request.headers.get("x-control-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers: jsonHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: tokenValid, error: tokenError } = await admin.rpc("verify_notification_delivery_token", {
    p_token: token,
  });
  if (tokenError || tokenValid !== true) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });
  }

  let body: { mode?: Mode } = {};
  try {
    body = await request.json();
  } catch {
    // default mode
  }
  const mode: Mode = body.mode === "probe" ? "probe" : "deliver";

  if (mode === "probe") {
    try {
      const capabilities = await smtpProbe();
      return new Response(
        JSON.stringify({ ok: true, host: "smtp.migadu.com", port: 465, tls: true, capabilities }),
        { status: 200, headers: jsonHeaders },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
        { status: 502, headers: jsonHeaders },
      );
    }
  }

  const smtpUser = Deno.env.get("MIGADU_SMTP_USER")?.trim();
  const smtpPassword = Deno.env.get("MIGADU_SMTP_PASSWORD");
  const smtpFrom = Deno.env.get("VEDANTIX_ALERT_EMAIL_FROM")?.trim() || smtpUser;
  const recipients = (Deno.env.get("VEDANTIX_ALERT_EMAIL_TO") || smtpUser || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!smtpUser || !smtpPassword || !smtpFrom || recipients.length === 0) {
    const { count } = await admin
      .from("monitoring_notifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "QUEUED");
    return new Response(
      JSON.stringify({
        ok: true,
        configured: false,
        queued: count ?? 0,
        required_secrets: [
          "MIGADU_SMTP_USER",
          "MIGADU_SMTP_PASSWORD",
          "VEDANTIX_ALERT_EMAIL_TO (optional)",
          "VEDANTIX_ALERT_EMAIL_FROM (optional)",
        ],
      }),
      { status: 200, headers: jsonHeaders },
    );
  }

  const { data: notifications, error: queueError } = await admin
    .from("monitoring_notifications")
    .select("*")
    .eq("status", "QUEUED")
    .order("created_at", { ascending: true })
    .limit(10);

  if (queueError) {
    return new Response(JSON.stringify({ error: queueError.message }), { status: 500, headers: jsonHeaders });
  }

  const rows = (notifications ?? []) as NotificationRow[];
  const results: Array<Record<string, unknown>> = [];

  for (const notification of rows) {
    const domainId = String(notification.payload?.domain_id ?? "");
    const { data: domain } = domainId
      ? await admin.from("domains").select("domain_name").eq("id", domainId).maybeSingle()
      : { data: null };
    const domainName = domain?.domain_name ?? "onbekend-domein";
    const { subject, body: emailBody } = notificationText(notification, domainName);

    try {
      await sendSmtpMail({
        user: smtpUser,
        password: smtpPassword,
        from: smtpFrom,
        recipients,
        subject,
        body: emailBody,
      });
      await admin
        .from("monitoring_notifications")
        .update({
          channel: "MIGADU_SMTP",
          status: "SENT",
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", notification.id);
      results.push({ id: notification.id, status: "SENT", domain: domainName });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await admin
        .from("monitoring_notifications")
        .update({
          channel: "MIGADU_SMTP",
          status: "FAILED",
          processed_at: new Date().toISOString(),
          error_message: errorMessage.slice(0, 1000),
        })
        .eq("id", notification.id);
      results.push({ id: notification.id, status: "FAILED", domain: domainName, error: errorMessage });
    }
  }

  return new Response(JSON.stringify({ ok: true, configured: true, processed: results.length, results }), {
    status: 200,
    headers: jsonHeaders,
  });
});
