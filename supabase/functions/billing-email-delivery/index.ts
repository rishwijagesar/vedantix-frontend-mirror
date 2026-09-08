import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Mode = "probe" | "deliver";
type BillingMessage = {
  id: string;
  message_type: "QUOTE" | "INVOICE" | "REMINDER";
  quote_id: string | null;
  invoice_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_text: string;
  action_url: string | null;
  status: "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
  attempt_count: number;
  metadata: Record<string, unknown>;
};
type VaultCredentials = {
  smtp_user: string | null;
  smtp_password: string | null;
  alert_to: string | null;
  alert_from: string | null;
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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

class SmtpConnection {
  private conn: Deno.TlsConn;
  private buffer = "";

  constructor(conn: Deno.TlsConn) { this.conn = conn; }

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

  close() { try { this.conn.close(); } catch { /* no-op */ } }
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
  try { await smtp.command("QUIT", [221]); } finally { smtp.close(); }
  return capabilities;
}

function messageHtml(message: BillingMessage) {
  const button = message.action_url
    ? `<a href="${escapeHtml(message.action_url)}" style="display:inline-block;margin-top:24px;background:#0f172a;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">${message.message_type === "QUOTE" ? "Bekijk en reageer op offerte" : "Bekijk factuur"}</a>`
    : "";
  const body = escapeHtml(message.body_text).replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:640px;margin:0 auto;padding:32px 16px"><div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0"><div style="font-size:21px;font-weight:800">Vedantix</div><div style="margin-top:4px;color:#94a3b8;font-size:13px">Websites & online groei</div></div><div style="background:#fff;padding:28px 24px;border-radius:0 0 16px 16px;box-shadow:0 8px 30px rgba(15,23,42,.08)"><div style="font-size:15px;line-height:1.75">${body}</div>${button}<div style="margin-top:30px;padding-top:18px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6">Vedantix · info@vedantix.nl · +31 6 26 21 99 89<br>Dit bericht is automatisch verstuurd vanuit het Vedantix Control Center.</div></div></div></body></html>`;
}

async function sendSmtpMail(args: { user: string; password: string; from: string; recipient: string; subject: string; html: string }) {
  const { smtp } = await connectSmtp();
  try {
    const authPayload = utf8Base64(`\u0000${args.user}\u0000${args.password}`);
    await smtp.command(`AUTH PLAIN ${authPayload}`, [235]);
    await smtp.command(`MAIL FROM:<${args.from}>`, [250]);
    await smtp.command(`RCPT TO:<${args.recipient}>`, [250, 251]);
    await smtp.command("DATA", [354]);
    const messageId = `<${crypto.randomUUID()}@vedantix.nl>`;
    const data = [
      `From: Vedantix <${args.from}>`,
      `To: ${args.recipient}`,
      `Subject: ${args.subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      foldBase64(args.html),
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
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });

  const token = request.headers.get("x-control-token");
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers: jsonHeaders });

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: tokenValid, error: tokenError } = await admin.rpc("verify_notification_delivery_token", { p_token: token });
  if (tokenError || tokenValid !== true) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });

  let body: { mode?: Mode } = {};
  try { body = await request.json(); } catch { /* defaults */ }
  const mode: Mode = body.mode === "probe" ? "probe" : "deliver";

  if (mode === "probe") {
    try {
      const capabilities = await smtpProbe();
      return new Response(JSON.stringify({ ok: true, host: "smtp.migadu.com", port: 465, tls: true, capabilities }), { status: 200, headers: jsonHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), { status: 502, headers: jsonHeaders });
    }
  }

  const { data: credentialRows, error: credentialError } = await admin.rpc("get_migadu_delivery_credentials");
  if (credentialError) return new Response(JSON.stringify({ error: "Could not read SMTP credentials" }), { status: 500, headers: jsonHeaders });
  const credentials = (Array.isArray(credentialRows) ? credentialRows[0] : credentialRows) as VaultCredentials | null;
  const smtpUser = credentials?.smtp_user?.trim();
  const smtpPassword = credentials?.smtp_password;
  const smtpFrom = credentials?.alert_from?.trim() || smtpUser;

  if (!smtpUser || !smtpPassword || !smtpFrom) {
    const { count } = await admin.from("billing_email_outbox").select("id", { count: "exact", head: true }).eq("status", "QUEUED");
    return new Response(JSON.stringify({ ok: true, configured: false, storage: "supabase_vault", queued: count ?? 0 }), { status: 200, headers: jsonHeaders });
  }

  const { data: messages, error: queueError } = await admin.from("billing_email_outbox").select("*").eq("status", "QUEUED").order("created_at", { ascending: true }).limit(10);
  if (queueError) return new Response(JSON.stringify({ error: queueError.message }), { status: 500, headers: jsonHeaders });

  const results: Array<Record<string, unknown>> = [];
  for (const message of (messages ?? []) as BillingMessage[]) {
    try {
      await sendSmtpMail({ user: smtpUser, password: smtpPassword, from: smtpFrom, recipient: message.recipient_email, subject: message.subject, html: messageHtml(message) });
      const now = new Date().toISOString();
      await admin.from("billing_email_outbox").update({ status: "SENT", processed_at: now, error_message: null, attempt_count: Number(message.attempt_count || 0) + 1 }).eq("id", message.id);

      if (message.message_type === "QUOTE" && message.quote_id) {
        const { data: quote } = await admin.from("quotes").select("status,sent_at").eq("id", message.quote_id).maybeSingle();
        if (quote) await admin.from("quotes").update({ status: quote.status === "DRAFT" ? "SENT" : quote.status, sent_at: quote.sent_at || now, updated_at: now }).eq("id", message.quote_id);
      }

      if (message.invoice_id && message.message_type === "INVOICE") {
        const { data: invoice } = await admin.from("invoices").select("status,sent_at").eq("id", message.invoice_id).maybeSingle();
        if (invoice) await admin.from("invoices").update({ status: invoice.status === "FINALIZED" ? "SENT" : invoice.status, sent_at: invoice.sent_at || now, updated_at: now }).eq("id", message.invoice_id);
      }

      if (message.invoice_id && message.message_type === "REMINDER") {
        const reminderNumber = Number(message.metadata?.reminder_number || 1);
        await admin.from("invoices").update({ reminder_count: reminderNumber, last_reminder_at: now, updated_at: now }).eq("id", message.invoice_id);
      }

      results.push({ id: message.id, status: "SENT", type: message.message_type, recipient: message.recipient_email });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await admin.from("billing_email_outbox").update({ status: "FAILED", processed_at: new Date().toISOString(), error_message: errorMessage.slice(0, 1000), attempt_count: Number(message.attempt_count || 0) + 1 }).eq("id", message.id);
      results.push({ id: message.id, status: "FAILED", type: message.message_type, error: errorMessage });
    }
  }

  return new Response(JSON.stringify({ ok: true, configured: true, processed: results.length, results }), { status: 200, headers: jsonHeaders });
});
