import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const headers = { "content-type": "application/json; charset=utf-8" };
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function smtpProbe() {
  const conn = await Deno.connectTls({ hostname: "smtp.migadu.com", port: 465 });
  let buffer = "";

  async function readLine() {
    while (!buffer.includes("\n")) {
      const chunk = new Uint8Array(4096);
      const read = await conn.read(chunk);
      if (read === null) throw new Error("SMTP connection closed unexpectedly");
      buffer += decoder.decode(chunk.subarray(0, read), { stream: true });
    }
    const newline = buffer.indexOf("\n");
    const line = buffer.slice(0, newline + 1);
    buffer = buffer.slice(newline + 1);
    return line.replace(/\r?\n$/, "");
  }

  async function response(expected: number) {
    const first = await readLine();
    const code = Number(first.slice(0, 3));
    const lines = [first];
    if (first[3] === "-") {
      while (true) {
        const line = await readLine();
        lines.push(line);
        if (line.startsWith(`${code} `)) break;
      }
    }
    if (code !== expected) throw new Error(`SMTP ${code}: ${lines.join(" | ")}`);
    return lines;
  }

  try {
    await response(220);
    await conn.write(encoder.encode("EHLO admin.vedantix.nl\r\n"));
    const ehlo = await response(250);
    await conn.write(encoder.encode("QUIT\r\n"));
    await response(221);
    return ehlo.map((line) => line.slice(4).trim()).filter(Boolean);
  } finally {
    conn.close();
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const token = request.headers.get("x-control-token");
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: valid, error } = await admin.rpc("verify_notification_delivery_token", { p_token: token });
  if (error || valid !== true) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers });
  }

  const smtpUser = Deno.env.get("MIGADU_SMTP_USER")?.trim();
  const smtpPassword = Deno.env.get("MIGADU_SMTP_PASSWORD");
  const credentialsConfigured = Boolean(smtpUser && smtpPassword);

  try {
    const capabilities = await smtpProbe();
    return new Response(
      JSON.stringify({
        ok: true,
        transport_ok: true,
        credentials_configured: credentialsConfigured,
        host: "smtp.migadu.com",
        port: 465,
        tls: true,
        capabilities,
      }),
      { status: 200, headers },
    );
  } catch (probeError) {
    return new Response(
      JSON.stringify({
        ok: false,
        transport_ok: false,
        credentials_configured: credentialsConfigured,
        error: probeError instanceof Error ? probeError.message : String(probeError),
      }),
      { status: 200, headers },
    );
  }
});
