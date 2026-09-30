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

  private async writeAll(bytes: Uint8Array) {
    let offset = 0;
    while (offset < bytes.length) offset += await this.conn.write(bytes.subarray(offset));
  }

  async command(command: string, expected: number[]) {
    await this.writeAll(encoder.encode(`${command}\r\n`));
    return await this.response(expected);
  }

  async writeData(data: string, expected: number[]) {
    await this.writeAll(encoder.encode(data));
    return await this.response(expected);
  }

  close() {
    try { this.conn.close(); } catch { /* no-op */ }
  }
}

export async function sendClientMail(args: { user: string; password: string; from: string; to: string; link: string; siteName: string; kind: string }) {
  if (![args.user,args.from,args.to,args.siteName].every(x => x && !/[\r\n]/.test(x))) throw new Error('Invalid mail fields');
  const conn = await Deno.connectTls({ hostname: "smtp.migadu.com", port: 465 });
  const smtp = new SmtpConnection(conn);
  const timer = setTimeout(() => smtp.close(), 15000);
  try {
    await smtp.response([220]);
    await smtp.command("EHLO admin.vedantix.nl", [250]);
    const authPayload = utf8Base64(`\u0000${args.user}\u0000${args.password}`);
    await smtp.command(`AUTH PLAIN ${authPayload}`, [235]);
    await smtp.command(`MAIL FROM:<${args.from}>`, [250]);
    await smtp.command(`RCPT TO:<${args.to}>`, [250, 251]);
    await smtp.command("DATA", [354]);

    const body = [
      args.kind === 'invite' ? `Je bent uitgenodigd om de website ${args.siteName} te beheren.` : `Je hebt gevraagd om je wachtwoord voor ${args.siteName} opnieuw in te stellen.`,
      '', 'Open de beveiligde link en kies je wachtwoord:', args.link, '',
      'Je krijgt alleen toegang tot de aan jou toegewezen website. Deze toegang geeft geen toegang tot het Vedantix Control Center.',
      '', 'Heb je dit niet aangevraagd of verwacht? Dan kun je deze e-mail negeren.', '', 'Vedantix',
    ].join('\n');

    const data = [
      `From: Vedantix <${args.from}>`,
      `To: ${args.to}`,
      `Subject: ${args.kind === 'invite' ? 'Toegang tot je website' : 'Wachtwoord herstellen'} - Vedantix`,
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
    // DATA 250 is the delivery acceptance boundary; QUIT failures must not trigger a duplicate send.
    try { await smtp.command("QUIT", [221]); } catch { /* accepted */ }
  } finally {
    clearTimeout(timer);
    smtp.close();
  }
}

