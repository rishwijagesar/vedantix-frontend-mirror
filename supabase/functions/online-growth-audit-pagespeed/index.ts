import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://vedantix.nl",
  "https://www.vedantix.nl",
  "https://vedantix-migration-test.lovable.app",
]);
const API_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const METRIC_IDS = {
  fcp: "first-contentful-paint",
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  tbt: "total-blocking-time",
  speedIndex: "speed-index",
};

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://vedantix.nl",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function categoryScore(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
}

function auditMetric(audits: Record<string, any>, id: string) {
  const audit = audits?.[id];
  if (!audit) return null;
  const numericValue = Number(audit.numericValue);
  return {
    value: Number.isFinite(numericValue) ? numericValue : null,
    displayValue: typeof audit.displayValue === "string" ? audit.displayValue : null,
  };
}

function fieldMetric(metrics: Record<string, any>, id: string) {
  const metric = metrics?.[id];
  if (!metric) return null;
  return {
    percentile: typeof metric.percentile === "number" ? metric.percentile : null,
    category: typeof metric.category === "string" ? metric.category : null,
  };
}

function normalizeResult(payload: any, strategy: "mobile" | "desktop") {
  const lighthouse = payload?.lighthouseResult || {};
  const categories = lighthouse.categories || {};
  const audits = lighthouse.audits || {};
  const field = payload?.loadingExperience?.metrics || {};
  const opportunities = Object.values(audits)
    .filter((audit: any) => audit?.details?.type === "opportunity" && Number(audit?.score) < 0.9)
    .map((audit: any) => ({
      id: String(audit.id || ""),
      title: String(audit.title || "Verbeterpunt"),
      displayValue: typeof audit.displayValue === "string" ? audit.displayValue : null,
      savingsMs: Number(audit?.details?.overallSavingsMs || 0),
    }))
    .sort((a: any, b: any) => b.savingsMs - a.savingsMs)
    .slice(0, 5);

  return {
    strategy,
    fetchedUrl: payload?.id || lighthouse?.finalDisplayedUrl || null,
    fetchTime: payload?.analysisUTCTimestamp || lighthouse?.fetchTime || new Date().toISOString(),
    lighthouseVersion: lighthouse?.lighthouseVersion || null,
    categories: {
      performance: categoryScore(categories?.performance?.score),
      accessibility: categoryScore(categories?.accessibility?.score),
      bestPractices: categoryScore(categories?.["best-practices"]?.score),
      seo: categoryScore(categories?.seo?.score),
    },
    lab: {
      fcp: auditMetric(audits, METRIC_IDS.fcp),
      lcp: auditMetric(audits, METRIC_IDS.lcp),
      cls: auditMetric(audits, METRIC_IDS.cls),
      tbt: auditMetric(audits, METRIC_IDS.tbt),
      speedIndex: auditMetric(audits, METRIC_IDS.speedIndex),
    },
    field: {
      fcp: fieldMetric(field, "FIRST_CONTENTFUL_PAINT_MS"),
      lcp: fieldMetric(field, "LARGEST_CONTENTFUL_PAINT_MS"),
      cls: fieldMetric(field, "CUMULATIVE_LAYOUT_SHIFT_SCORE"),
      inp: fieldMetric(field, "INTERACTION_TO_NEXT_PAINT"),
    },
    opportunities,
  };
}

async function runPageSpeed(targetUrl: string, strategy: "mobile" | "desktop") {
  const url = new URL(API_ENDPOINT);
  url.searchParams.set("url", targetUrl);
  url.searchParams.set("strategy", strategy);
  url.searchParams.set("locale", "nl");
  for (const category of CATEGORIES) url.searchParams.append("category", category);
  const apiKey = Deno.env.get("PAGESPEED_API_KEY");
  if (apiKey) url.searchParams.set("key", apiKey);

  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`PageSpeed ${strategy} gaf HTTP ${response.status}${body ? `: ${body.slice(0, 180)}` : ""}`);
  }
  return normalizeResult(await response.json(), strategy);
}

function performanceEvidence(mobile: any, desktop: any) {
  const evidence: any[] = [];
  const add = (label: string, value: unknown, pass: boolean, source = "Google PageSpeed Insights / Lighthouse") => {
    if (value === null || value === undefined || value === "") return;
    evidence.push({
      check: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label,
      status: pass ? "PASS" : "FAIL",
      observed: String(value),
      source,
    });
  };
  if (mobile) {
    add("Mobile performance", `${mobile.categories.performance}/100`, Number(mobile.categories.performance) >= 75);
    add("Mobile LCP", mobile.lab.lcp?.displayValue, Number(mobile.lab.lcp?.value) <= 2500);
    add("Mobile CLS", mobile.lab.cls?.displayValue ?? mobile.lab.cls?.value, Number(mobile.lab.cls?.value) <= 0.1);
    add("Mobile TBT", mobile.lab.tbt?.displayValue, Number(mobile.lab.tbt?.value) <= 200);
  }
  if (desktop) {
    add("Desktop performance", `${desktop.categories.performance}/100`, Number(desktop.categories.performance) >= 75);
    add("Desktop LCP", desktop.lab.lcp?.displayValue, Number(desktop.lab.lcp?.value) <= 2500);
    add("Desktop CLS", desktop.lab.cls?.displayValue ?? desktop.lab.cls?.value, Number(desktop.lab.cls?.value) <= 0.1);
  }
  return evidence.slice(0, 8);
}

function enrichResults(results: any, pageSpeed: any) {
  const mobileScore = pageSpeed.mobile?.categories?.performance;
  const desktopScore = pageSpeed.desktop?.categories?.performance;
  const available = [mobileScore, desktopScore].filter((value) => typeof value === "number") as number[];
  const performanceScore = available.length
    ? Math.round(available.reduce((sum, value) => sum + value, 0) / available.length)
    : null;

  const scores = Array.isArray(results?.scores) ? [...results.scores] : [];
  const existingIndex = scores.findIndex((entry: any) => entry?.key === "performance");
  const performanceEntry = performanceScore === null
    ? {
        key: "performance",
        label: "Performance",
        score: null,
        status: "UNKNOWN",
        confidence: "LOW",
        totalChecks: 0,
        measuredChecks: 0,
        summary: "Google PageSpeed Insights was tijdelijk niet beschikbaar.",
        recommendations: ["Voer de audit later opnieuw uit voor een nieuwe PageSpeed-meting."],
        evidenceItems: [],
      }
    : {
        key: "performance",
        label: "Performance",
        score: performanceScore,
        status: pageSpeed.status === "COMPLETED" ? "COMPLETED" : "PARTIAL",
        confidence: "HIGH",
        totalChecks: pageSpeed.mobile && pageSpeed.desktop ? 2 : 1,
        measuredChecks: pageSpeed.mobile && pageSpeed.desktop ? 2 : 1,
        summary: `Google PageSpeed Insights: mobile ${mobileScore ?? "niet beschikbaar"}/100, desktop ${desktopScore ?? "niet beschikbaar"}/100.`,
        recommendations: [
          ...(pageSpeed.mobile?.opportunities || []),
          ...(pageSpeed.desktop?.opportunities || []),
        ].map((item: any) => item.title).filter(Boolean).slice(0, 3),
        evidenceItems: performanceEvidence(pageSpeed.mobile, pageSpeed.desktop),
      };

  if (existingIndex >= 0) scores[existingIndex] = performanceEntry;
  else scores.push(performanceEntry);

  const measured = scores.filter((entry: any) => typeof entry?.score === "number");
  const overallScore = measured.length
    ? Math.round(measured.reduce((sum: number, entry: any) => sum + Number(entry.score), 0) / measured.length)
    : Number(results?.overallScore || 0);

  const matrix = {
    CRITICAL: [...(results?.priorityMatrix?.CRITICAL || [])],
    IMPORTANT: [...(results?.priorityMatrix?.IMPORTANT || [])],
    OPTIMIZATION: [...(results?.priorityMatrix?.OPTIMIZATION || [])],
  };
  const mobilePerformance = Number(mobileScore);
  if (Number.isFinite(mobilePerformance) && mobilePerformance < 50) {
    matrix.CRITICAL.push("Mobiele PageSpeed-performance is lager dan 50/100; optimaliseer de grootste Lighthouse-knelpunten.");
  } else if (Number.isFinite(mobilePerformance) && mobilePerformance < 75) {
    matrix.IMPORTANT.push("Verbeter de mobiele PageSpeed-performance; Lighthouse ziet nog duidelijke snelheidswinst.");
  }

  const dedupe = (items: unknown[]) => [...new Set(items.map((item) => String(item)).filter(Boolean))];
  matrix.CRITICAL = dedupe(matrix.CRITICAL);
  matrix.IMPORTANT = dedupe(matrix.IMPORTANT);
  matrix.OPTIMIZATION = dedupe(matrix.OPTIMIZATION);

  const opportunityTitles = dedupe([
    ...(pageSpeed.mobile?.opportunities || []).map((item: any) => item.title),
    ...(pageSpeed.desktop?.opportunities || []).map((item: any) => item.title),
  ]).slice(0, 4);
  const baseRecommendations = (results?.recommendations || []).filter(
    (item: unknown) => !/core web vitals|pagespeed/i.test(String(item)),
  );

  return {
    ...results,
    overallScore,
    measuredWeightPercent: Math.max(Number(results?.measuredWeightPercent || 0), performanceScore === null ? 70 : 80),
    scores,
    pageSpeed,
    priorityMatrix: matrix,
    quickWins: dedupe([...matrix.CRITICAL, ...matrix.IMPORTANT, ...matrix.OPTIMIZATION]).slice(0, 5),
    recommendations: dedupe([...matrix.CRITICAL, ...matrix.IMPORTANT, ...opportunityTitles, ...baseRecommendations]).slice(0, 8),
    limitations: dedupe([
      ...(results?.limitations || []).filter((item: unknown) => !/core web vitals/i.test(String(item))),
      "PageSpeed is een Lighthouse-labmeting. Eventuele CrUX-velddata wordt alleen getoond wanneer Google die voor de URL beschikbaar stelt.",
    ]),
  };
}

Deno.serve(async (request: Request) => {
  const headers = cors(request);
  const origin = request.headers.get("origin") || "";
  if (request.method === "OPTIONS") return new Response(null, { status: origin && !ALLOWED_ORIGINS.has(origin) ? 403 : 204, headers });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  if (!ALLOWED_ORIGINS.has(origin)) return json(request, { error: "Origin not allowed" }, 403);

  let body: any;
  try { body = await request.json(); } catch { return json(request, { error: "Ongeldige aanvraag." }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["auditId"].includes(key))) {
    return json(request, { error: "Ongeldige aanvraag." }, 400);
  }
  const auditId = String(body.auditId || "");
  if (!/^[0-9a-f-]{36}$/i.test(auditId)) return json(request, { error: "Audit niet gevonden." }, 404);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(request, { error: "Server configuration error" }, 500);
  const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const { data: audit, error: auditError } = await db
    .from("online_growth_audits")
    .select("id,public_token,status,request,results,expires_at")
    .eq("public_token", auditId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (auditError) return json(request, { error: auditError.message }, 500);
  if (!audit || audit.status !== "COMPLETED" || !audit.results) return json(request, { error: "Audit is nog niet klaar voor PageSpeed." }, 409);

  const existingStatus = audit.results?.pageSpeed?.status;
  if (["COMPLETED", "PARTIAL", "FAILED"].includes(existingStatus)) {
    return json(request, { ok: true, cached: true, status: existingStatus });
  }

  const targetUrl = String(audit.results?.finalUrl || audit.request?.websiteUrl || "");
  if (!/^https?:\/\//i.test(targetUrl)) return json(request, { error: "Geen geldige website-URL beschikbaar." }, 400);

  const settled = await Promise.allSettled([
    runPageSpeed(targetUrl, "mobile"),
    runPageSpeed(targetUrl, "desktop"),
  ]);
  const mobile = settled[0].status === "fulfilled" ? settled[0].value : null;
  const desktop = settled[1].status === "fulfilled" ? settled[1].value : null;
  const errors = settled
    .filter((item): item is PromiseRejectedResult => item.status === "rejected")
    .map((item) => item.reason instanceof Error ? item.reason.message : String(item.reason));

  const pageSpeed = {
    status: mobile && desktop ? "COMPLETED" : mobile || desktop ? "PARTIAL" : "FAILED",
    measuredAt: new Date().toISOString(),
    source: "Google PageSpeed Insights API v5 / Lighthouse",
    mobile,
    desktop,
    errors,
  };
  const nextResults = enrichResults(audit.results, pageSpeed);
  const { error: updateError } = await db
    .from("online_growth_audits")
    .update({ results: nextResults })
    .eq("id", audit.id);
  if (updateError) return json(request, { error: updateError.message }, 500);

  return json(request, {
    ok: true,
    status: pageSpeed.status,
    overallScore: nextResults.overallScore,
    performanceScore: nextResults.scores?.find((entry: any) => entry?.key === "performance")?.score ?? null,
  });
});
