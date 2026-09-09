import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const ALLOWED_ORIGINS = new Set([
  "https://vedantix.nl",
  "https://www.vedantix.nl",
  "https://vedantix-migration-test.lovable.app",
]);
const MAX_HTML = 1_500_000;
const AUDIT_VERSION = "3";

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://vedantix.nl",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "origin",
  };
}
function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(request), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function score(checks: boolean[]) { return Math.round((checks.filter(Boolean).length / Math.max(checks.length, 1)) * 100); }
function count(html: string, pattern: RegExp) { return (html.match(pattern) || []).length; }
function text(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function evidence(label: string, pass: boolean, observed: string, source = "HTML") { return { check: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label, status: pass ? "PASS" : "FAIL", observed, source }; }
function normalizeUrl(value: unknown) {
  let raw = String(value || "").trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Alleen HTTP(S)-websites kunnen worden gecontroleerd.");
  if (url.username || url.password) throw new Error("URL's met login-gegevens zijn niet toegestaan.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Alleen standaard webpoorten zijn toegestaan.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Lokale adressen zijn niet toegestaan.");
  if (/^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "::1" || host.startsWith("fc") || host.startsWith("fd")) throw new Error("Private netwerkadressen zijn niet toegestaan.");
  return url.toString();
}
function titleOf(html: string) { return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim(); }
function meta(html: string, name: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const n = tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (n === name.toLowerCase()) return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1]?.trim() || "";
  }
  return "";
}
function hasSchema(html: string, type: string) { return new RegExp(`\\"@type\\"\\s*:\\s*\\"${type}\\"`, "i").test(html); }

async function inspectSite(input: string) {
  const auditedUrl = normalizeUrl(input);
  const started = performance.now();
  const response = await fetch(auditedUrl, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "VedantixGrowthAudit/3.0 (+https://vedantix.nl)" } });
  if (!response.ok) throw new Error(`Website antwoordde met HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) throw new Error("De URL levert geen HTML-pagina op.");
  const html = (await response.text()).slice(0, MAX_HTML);
  const bodyText = text(html).slice(0, 250000);
  const elapsedMs = Math.round(performance.now() - started);
  const title = titleOf(html);
  const description = meta(html, "description");
  const robots = meta(html, "robots");
  const h1Count = count(html, /<h1\b/gi);
  const canonical = /<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i.test(html);
  const jsonLd = /<script\b[^>]*type=["']application\/ld\+json["']/i.test(html);
  const faq = hasSchema(html, "FAQPage") || /\bveelgestelde vragen\b|\bfaq\b/i.test(bodyText);
  const localSchema = hasSchema(html, "LocalBusiness") || hasSchema(html, "Organization");
  const hasPhone = /(?:tel:|\+31|0[1-9][0-9][\s.-]?[0-9])/i.test(html);
  const hasAddress = /\b[1-9][0-9]{3}\s?[A-Z]{2}\b/i.test(bodyText);
  const contactLinks = count(html, /(?:mailto:|tel:|wa\.me|whatsapp|\/contact)/gi);
  const forms = count(html, /<form\b/gi);
  const ctas = count(html, /<button\b|>\s*(?:plan|boek|bel|contact|offerte|start|aanvragen|bestel)[^<]{0,40}</gi);
  const viewport = !!meta(html, "viewport");
  const noindex = /noindex/i.test(robots);
  const https = new URL(response.url).protocol === "https:";
  const hsts = !!response.headers.get("strict-transport-security");
  const csp = !!response.headers.get("content-security-policy");
  const frame = !!response.headers.get("x-frame-options") || /frame-ancestors/i.test(response.headers.get("content-security-policy") || "");

  const seoChecks = [title.length >= 15 && title.length <= 70, description.length >= 50 && description.length <= 180, h1Count === 1, canonical, !noindex];
  const aiChecks = [jsonLd, faq, count(html, /<h[2-3]\b/gi) >= 2, bodyText.length >= 500];
  const securityChecks = [https, hsts, csp, frame];
  const conversionChecks = [contactLinks > 0, forms > 0 || ctas > 1, ctas > 0, viewport];
  const localChecks = [localSchema, hasPhone, hasAddress];
  const scores = [
    { key: "seo", label: "SEO", score: score(seoChecks), status: "COMPLETED", confidence: "HIGH", totalChecks: 5, measuredChecks: 5, summary: "Technische en on-page SEO-signalen op de hoofdpagina.", recommendations: [], evidenceItems: [evidence("Titel", seoChecks[0], title || "Ontbreekt"), evidence("Meta description", seoChecks[1], description || "Ontbreekt"), evidence("Eén H1", seoChecks[2], `${h1Count} H1-element(en)`), evidence("Canonical", canonical, canonical ? "Aanwezig" : "Ontbreekt"), evidence("Indexeerbaar", !noindex, robots || "Geen noindex gevonden")] },
    { key: "ai", label: "AEO / GEO / AI", score: score(aiChecks), status: "COMPLETED", confidence: "MEDIUM", totalChecks: 4, measuredChecks: 4, summary: "Gestructureerde data, vraag-antwoordstructuur en semantische inhoud.", recommendations: [], evidenceItems: [evidence("Structured data", jsonLd, jsonLd ? "JSON-LD gevonden" : "Geen JSON-LD"), evidence("FAQ-signaal", faq, faq ? "FAQ-signaal gevonden" : "Geen duidelijk FAQ-signaal"), evidence("Inhoudsstructuur", aiChecks[2], `${count(html, /<h[2-3]\b/gi)} H2/H3-koppen`), evidence("Inhoudsomvang", aiChecks[3], `${bodyText.length} zichtbare tekens`)] },
    { key: "security", label: "Security", score: score(securityChecks), status: "COMPLETED", confidence: "HIGH", totalChecks: 4, measuredChecks: 4, summary: "HTTPS en zichtbare browser-securityheaders.", recommendations: [], evidenceItems: [evidence("HTTPS", https, response.url, "HTTP"), evidence("HSTS", hsts, hsts ? "Header aanwezig" : "Header ontbreekt", "HTTP headers"), evidence("CSP", csp, csp ? "Header aanwezig" : "Header ontbreekt", "HTTP headers"), evidence("Clickjacking bescherming", frame, frame ? "Aanwezig" : "Niet gevonden", "HTTP headers")] },
    { key: "conversion", label: "Conversie", score: score(conversionChecks), status: "COMPLETED", confidence: "MEDIUM", totalChecks: 4, measuredChecks: 4, summary: "Contactroutes, CTA's, formulieren en mobiele basis.", recommendations: [], evidenceItems: [evidence("Contactroute", contactLinks > 0, `${contactLinks} contact-signalen`), evidence("Conversie-element", conversionChecks[1], `${forms} formulieren, ${ctas} CTA-signalen`), evidence("CTA", ctas > 0, `${ctas} CTA-signalen`), evidence("Viewport", viewport, viewport ? "Mobiele viewport aanwezig" : "Viewport ontbreekt")] },
    { key: "local", label: "Lokale vindbaarheid", score: score(localChecks), status: "COMPLETED", confidence: "MEDIUM", totalChecks: 3, measuredChecks: 3, summary: "Lokale bedrijfs-, telefoon- en adressignalen op de pagina.", recommendations: [], evidenceItems: [evidence("Bedrijfsschema", localSchema, localSchema ? "Organization/LocalBusiness gevonden" : "Niet gevonden"), evidence("Telefoon", hasPhone, hasPhone ? "Telefoonsignaal gevonden" : "Niet gevonden"), evidence("Adres", hasAddress, hasAddress ? "Postcodesignaal gevonden" : "Niet gevonden")] },
    { key: "performance", label: "Performance", score: null, status: "UNKNOWN", confidence: "LOW", totalChecks: 0, measuredChecks: 0, summary: `Serverrespons gemeten in circa ${elapsedMs} ms; volledige Core Web Vitals vereisen PageSpeed/Lighthouse.`, recommendations: ["Controleer Core Web Vitals met Google PageSpeed Insights."], evidenceItems: [] },
    { key: "analytics", label: "Analytics & conversiedata", score: null, status: "UNKNOWN", confidence: "LOW", totalChecks: 0, measuredChecks: 0, summary: "Analytics-accountdata is zonder toestemming niet verifieerbaar.", recommendations: ["Koppel GA4 alleen-lezen voor echte conversiedata."], evidenceItems: [] },
    { key: "backlink", label: "Backlinks", score: null, status: "UNKNOWN", confidence: "LOW", totalChecks: 0, measuredChecks: 0, summary: "Backlinkkwaliteit vereist een externe backlinkdatabase.", recommendations: ["Koppel een betrouwbare backlinkbron voor deze meting."], evidenceItems: [] },
    { key: "googleBusiness", label: "Google Bedrijfsprofiel", score: null, status: "UNKNOWN", confidence: "LOW", totalChecks: 0, measuredChecks: 0, summary: "Profiel- en reviewdata wordt niet geschat zonder geautoriseerde bron.", recommendations: ["Koppel Google Bedrijfsprofiel voor betrouwbare profieldata."], evidenceItems: [] },
  ];
  const measured = scores.filter((s) => typeof s.score === "number");
  const overallScore = Math.round(measured.reduce((sum, s) => sum + Number(s.score), 0) / Math.max(measured.length, 1));
  const critical: string[] = [], important: string[] = [], optimization: string[] = [];
  if (!seoChecks[0]) critical.push("Verbeter de paginatitel zodat onderwerp en zoekintentie direct duidelijk zijn.");
  if (!description) important.push("Voeg een relevante meta description toe.");
  if (h1Count !== 1) important.push("Gebruik precies één duidelijke H1 op de hoofdpagina.");
  if (!jsonLd) important.push("Voeg passende structured data (JSON-LD) toe.");
  if (!contactLinks) critical.push("Maak minimaal één directe contactroute zichtbaar.");
  if (!hsts || !csp) optimization.push("Versterk HTTP-securityheaders zoals HSTS en CSP.");
  if (!faq) optimization.push("Voeg relevante vraag-antwoordcontent of FAQ-structured-data toe.");
  const quickWins = [...critical, ...important, ...optimization].slice(0, 5);
  return {
    auditedUrl, finalUrl: response.url, overallScore, overallConfidence: "MEDIUM", measuredWeightPercent: 70, pagesAnalyzed: 1, auditVersion: AUDIT_VERSION,
    executiveSummary: overallScore >= 75 ? "De basis is sterk. De grootste winst zit waarschijnlijk in verdieping, externe autoriteit en conversiemeting." : overallScore >= 55 ? "De website heeft een bruikbare basis, maar meerdere zichtbare groeisignalen kunnen concreet worden verbeterd." : "De audit ziet meerdere basispunten die eerst aandacht verdienen voor betere vindbaarheid, vertrouwen en conversie.",
    scores, priorityMatrix: { CRITICAL: critical, IMPORTANT: important, OPTIMIZATION: optimization }, quickWins,
    recommendations: [...new Set([...critical, ...important, ...optimization, "Meet Core Web Vitals apart met PageSpeed Insights."])].slice(0, 8),
    limitations: ["Deze scan analyseert de publiek bereikbare hoofdpagina en HTTP-headers; hij logt niet in en omzeilt geen toegangsbeveiliging.", "Google Reviews, Bedrijfsprofiel, backlinks en accountgebonden analytics worden zonder geautoriseerde externe bron niet gescoord.", "Core Web Vitals worden niet geschat op basis van alleen serverresponstijd."],
    _signals: { faqCount: faq ? 1 : 0, conversionSignals: contactLinks + forms + ctas, elapsedMs },
  };
}

async function competitor(url: string) {
  try {
    const r: any = await inspectSite(url);
    const seo = r.scores.find((s: any) => s.key === "seo")?.score ?? null;
    return { url: r.finalUrl || r.auditedUrl, status: "COMPLETED", seoScore: seo, reviewSignals: null, faqCount: r._signals.faqCount, speedScore: null, googleBusinessSignals: null, conversionSignals: r._signals.conversionSignals };
  } catch { return { url, status: "FAILED", seoScore: null, reviewSignals: null, faqCount: null, speedScore: null, googleBusinessSignals: null, conversionSignals: null }; }
}

async function buildPdf(audit: any) {
  const pdf = await PDFDocument.create(); const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]); let y = 785; const left = 48;
  const newPage = () => { page = pdf.addPage([595.28, 841.89]); y = 785; };
  const line = (value: string, size = 10, isBold = false) => { if (y < 55) newPage(); const safe = String(value || "").replace(/[^\x20-\x7E\xA0-\xFF]/g, ""); page.drawText(safe.slice(0, 105), { x: left, y, size, font: isBold ? bold : regular, color: rgb(.08,.1,.16) }); y -= size + 6; };
  page.drawText("VEDANTIX ONLINE GROEI AUDIT", { x:left, y, size:18, font:bold, color:rgb(.05,.09,.16) }); y -= 34;
  line(`Website: ${audit.results?.finalUrl || audit.request?.websiteUrl || "-"}`, 10, true); line(`Score: ${audit.results?.overallScore ?? "-"}/100`); line(`Audit ID: ${audit.public_token}`); line(`Datum: ${new Date(audit.completed_at || audit.created_at).toISOString()}`); y -= 12;
  line(audit.results?.executiveSummary || "", 10, true); y -= 8;
  for (const s of audit.results?.scores || []) { line(`${s.label}: ${s.score === null ? "niet verifieerbaar" : `${s.score}/100`}`, 11, true); line(s.summary || "", 9); }
  y -= 8; line("Prioriteiten", 12, true); for (const p of [...(audit.results?.priorityMatrix?.CRITICAL || []), ...(audit.results?.priorityMatrix?.IMPORTANT || []), ...(audit.results?.priorityMatrix?.OPTIMIZATION || [])]) line(`- ${p}`, 9);
  y -= 8; line("Beperkingen", 12, true); for (const p of audit.results?.limitations || []) line(`- ${p}`, 9);
  return new Uint8Array(await pdf.save());
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL"); const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(request, { error: "Server configuration error" }, 500);
  const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  let body: any; try { body = await request.json(); } catch { return json(request, { error: "Ongeldige aanvraag." }, 400); }
  const action = String(body?.action || ""); const token = String(body?.auditId || "");
  const ipRaw = (request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "").split(",")[0].trim();
  const ip = ipRaw && /^[0-9a-f:.]+$/i.test(ipRaw) ? ipRaw : null;
  try {
    if (action === "get" || action === "pdf") {
      if (!/^[0-9a-f-]{36}$/i.test(token)) return json(request, { error: "Audit niet gevonden." }, 404);
      const { data: audit } = await db.from("online_growth_audits").select("*").eq("public_token", token).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (!audit) return json(request, { error: "Audit niet gevonden." }, 404);
      if (action === "pdf") {
        if (audit.status !== "COMPLETED" || !audit.results) return json(request, { error: "PDF is pas beschikbaar na afronding." }, 409);
        const bytes = await buildPdf(audit); return new Response(bytes, { status:200, headers:{ ...cors(request), "content-type":"application/pdf", "content-disposition":`attachment; filename="Vedantix-Online-Groei-Audit-${token.slice(0,8)}.pdf"`, "cache-control":"no-store" } });
      }
      return json(request, { auditId: audit.public_token, status: audit.status, request: { ...audit.request, errorMessage: audit.error_message || undefined }, results: audit.results });
    }

    let requestData: any; let rerunOf: string | null = null;
    if (action === "rerun") {
      if (!/^[0-9a-f-]{36}$/i.test(token)) return json(request, { error: "Audit niet gevonden." }, 404);
      const { data: old } = await db.from("online_growth_audits").select("id,request").eq("public_token", token).maybeSingle(); if (!old) return json(request, { error: "Audit niet gevonden." }, 404); requestData = old.request; rerunOf = old.id;
    } else if (action === "start") requestData = body?.request || {};
    else return json(request, { error: "Onbekende actie." }, 400);

    if (ip) { const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); const { count } = await db.from("online_growth_audits").select("id", { count:"exact", head:true }).eq("requester_ip", ip).gte("created_at", since); if ((count || 0) >= 5) return json(request, { error: "Te veel audits gestart. Probeer het later opnieuw." }, 429); }
    const clean = { name: String(requestData.name || "").trim().slice(0,120), companyName: String(requestData.companyName || "").trim().slice(0,160), email: String(requestData.email || "").trim().slice(0,254), websiteUrl: normalizeUrl(requestData.websiteUrl), competitorUrl1: requestData.competitorUrl1 ? normalizeUrl(requestData.competitorUrl1) : "", competitorUrl2: requestData.competitorUrl2 ? normalizeUrl(requestData.competitorUrl2) : "" };
    if (!clean.name || !clean.companyName || !/^\S+@\S+\.\S+$/.test(clean.email)) return json(request, { error: "Vul geldige contactgegevens in." }, 400);
    const { data: created, error: insertError } = await db.from("online_growth_audits").insert({ status:"RUNNING", request:clean, requester_ip:ip, user_agent:(request.headers.get("user-agent") || "").slice(0,500), rerun_of:rerunOf }).select("id,public_token").single();
    if (insertError || !created) throw insertError || new Error("Audit aanmaken mislukt");
    try {
      const results: any = await inspectSite(clean.websiteUrl); const competitorUrls = [clean.competitorUrl1, clean.competitorUrl2].filter(Boolean); results.competitors = await Promise.all(competitorUrls.map(competitor)); delete results._signals;
      await db.from("online_growth_audits").update({ status:"COMPLETED", results, completed_at:new Date().toISOString() }).eq("id", created.id);
      return json(request, { auditId:created.public_token, status:"COMPLETED" });
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : "Audit mislukt."; await db.from("online_growth_audits").update({ status:"FAILED", error_message:message, completed_at:new Date().toISOString() }).eq("id", created.id); return json(request, { auditId:created.public_token, status:"FAILED" });
    }
  } catch (error) { console.error(error); return json(request, { error: error instanceof Error ? error.message : "Audit mislukt." }, 500); }
});
