import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

type FindingCategory = "seo" | "links" | "technical" | "geo" | "content";
type FindingSeverity = "critical" | "high" | "medium" | "low";
type OwnerLane = "claude_lovable" | "hermes" | "openclaw" | "pc_perplexity" | "codex";

type FindingInput = {
  category: FindingCategory;
  severity: FindingSeverity;
  owner_lane: OwnerLane;
  title: string;
  page_url: string;
  details: string;
  recommendation: string;
  evidence?: Record<string, unknown>;
  fix_payload?: Record<string, unknown>;
};

const DEFAULT_SITE_URL = "https://www.mercuryrepower.ca";
const CORE_PATHS = ["/", "/agents", "/llms.txt", "/catalog.md", "/sitemap.xml", "/robots.txt", "/pricing-reference", "/pricing-reference.md"];

function normalizeSiteUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_SITE_URL;
  try {
    const parsed = new URL(value);
    if (!/mercuryrepower\.ca$/i.test(parsed.hostname)) return DEFAULT_SITE_URL;
    parsed.hash = "";
    parsed.search = "";
    return parsed.origin.replace("https://mercuryrepower.ca", DEFAULT_SITE_URL);
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function buildUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString();
}

async function fetchText(url: string, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MercuryRepower-GrowthAgent/1.0" },
      signal: controller.signal,
    });
    const text = await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      text,
      elapsed_ms: Date.now() - started,
      content_type: response.headers.get("content-type"),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      elapsed_ms: Date.now() - started,
      content_type: null,
      error: (error as Error).message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractSitemapUrls(xml: string) {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((match) => match[1].trim()).filter(Boolean);
}

function hasJsonLd(html: string) {
  return /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html);
}

function titleText(html: string) {
  return html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/\s+/g, " ").trim() || "";
}

function metaDescription(html: string) {
  return html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim() || "";
}

function hasCanonical(html: string) {
  return /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);
}

function includesAny(text: string, values: string[]) {
  const haystack = text.toLowerCase();
  return values.some((value) => haystack.includes(value.toLowerCase()));
}

async function auditSite(siteUrl: string, operatorNotes: string): Promise<{
  findings: FindingInput[];
  scores: Record<string, number>;
  summary: Record<string, unknown>;
}> {
  const findings: FindingInput[] = [];
  const checks: Record<string, Awaited<ReturnType<typeof fetchText>>> = {};

  await Promise.all(
    CORE_PATHS.map(async (path) => {
      checks[path] = await fetchText(buildUrl(siteUrl, path));
    }),
  );

  for (const path of CORE_PATHS) {
    const result = checks[path];
    if (!result.ok) {
      findings.push({
        category: path.endsWith(".txt") || path.endsWith(".md") ? "geo" : "technical",
        severity: path === "/sitemap.xml" || path === "/robots.txt" ? "high" : "medium",
        owner_lane: "codex",
        title: `${path} is not returning cleanly`,
        page_url: buildUrl(siteUrl, path),
        details: `The public check returned status ${result.status || "network error"}.`,
        recommendation: "Verify the route in the deployed Vercel output and check Supabase/Vercel logs before assuming the content strategy is wrong.",
        evidence: result,
      });
    }
  }

  const sitemapUrls = checks["/sitemap.xml"]?.ok ? extractSitemapUrls(checks["/sitemap.xml"].text) : [];
  if (sitemapUrls.length < 100) {
      findings.push({
        category: "seo",
        severity: "high",
        owner_lane: "pc_perplexity",
        title: "Sitemap discovered fewer URLs than expected",
        page_url: buildUrl(siteUrl, "/sitemap.xml"),
        details: `The audit found ${sitemapUrls.length} URLs in the sitemap. Recent Search Console work expected a larger indexed page set.`,
        recommendation: "Have PC verify the Mercury Repower Search Console property and sitemap discovery count, then have Hermes keep it on the daily queue until resolved.",
        evidence: { sitemap_url_count: sitemapUrls.length },
      });
  }

  const sampleUrls = Array.from(
    new Set([
      buildUrl(siteUrl, "/"),
      buildUrl(siteUrl, "/agents"),
      buildUrl(siteUrl, "/pricing-reference"),
      ...sitemapUrls.filter((url) => /\/blog\/|\/motors\/|\/locations\//.test(url)).slice(0, 8),
    ]),
  ).slice(0, 12);

  const pageResults = await Promise.all(
    sampleUrls.map(async (url) => ({ url, result: await fetchText(url, 9000) })),
  );

  for (const { url, result } of pageResults) {
    if (!result.ok) continue;
    const html = result.text;
    const title = titleText(html);
    const description = metaDescription(html);

    if (!title || title.length > 70) {
      findings.push({
        category: "seo",
        severity: "medium",
        owner_lane: "pc_perplexity",
        title: "Title tag needs review",
        page_url: url,
        details: title ? `Current title is ${title.length} characters: ${title}` : "No title tag was found in the crawler-visible HTML.",
        recommendation: "Have PC or Claude draft a concise Ontario/Mercury intent title, then have Codex verify it in static prerender output after the edit.",
        evidence: { title, title_length: title.length },
      });
    }

    if (!description || description.length < 90 || description.length > 170) {
      findings.push({
        category: "seo",
        severity: "low",
        owner_lane: "pc_perplexity",
        title: "Meta description should be tightened",
        page_url: url,
        details: description ? `Current description length is ${description.length}.` : "No meta description was found.",
        recommendation: "Have PC or Claude draft a clear buyer-facing description with Mercury, Ontario, CAD pricing, quote, install, or pickup language as appropriate.",
        evidence: { description, description_length: description.length },
      });
    }

    if (!hasCanonical(html)) {
      findings.push({
        category: "technical",
        severity: "high",
        owner_lane: "codex",
        title: "Canonical tag missing from crawler-visible HTML",
        page_url: url,
        details: "The raw HTML response did not include a canonical link.",
        recommendation: "Patch the page SEO component or static prerender route and verify the raw production HTML.",
      });
    }

    if (!hasJsonLd(html)) {
      findings.push({
        category: "geo",
        severity: "medium",
        owner_lane: "codex",
        title: "Structured data missing from crawler-visible HTML",
        page_url: url,
        details: "No application/ld+json block was found in the raw HTML response.",
        recommendation: "Add route-appropriate schema and verify it survives static prerender.",
      });
    }
  }

  const agentsText = checks["/agents"]?.text || "";
  const llmsText = checks["/llms.txt"]?.text || "";
  const catalogText = checks["/catalog.md"]?.text || "";
  const pricingText = `${checks["/pricing-reference"]?.text || ""}\n${checks["/pricing-reference.md"]?.text || ""}`;

  if (!includesAny(`${agentsText}\n${llmsText}\n${catalogText}`, ["agent-mcp-server", "public-motors-api", "build_quote"])) {
    findings.push({
      category: "geo",
      severity: "high",
      owner_lane: "codex",
      title: "AI-agent endpoint references are weak or missing",
      page_url: buildUrl(siteUrl, "/agents"),
      details: "The agent-readable surfaces should expose the MCP endpoint, public motors API, and quote-building path.",
      recommendation: "Refresh /agents, /llms.txt, and catalog.md together so AI crawlers get one consistent source of truth.",
    });
  }

  if (!includesAny(pricingText, ["ontario", "gores landing", "pickup", "cad", "install"])) {
    findings.push({
      category: "geo",
      severity: "high",
      owner_lane: "pc_perplexity",
      title: "Pricing page may not be explicit enough for regional AI answers",
      page_url: buildUrl(siteUrl, "/pricing-reference"),
      details: "The pricing page should make the Ontario/pickup/install lane unmissable for AI search and human buyers.",
      recommendation: "Have PC test AI-answer visibility and draft the regional framing, then Claude/Lovable can apply the buyer-facing copy if approved.",
    });
  }

  if (operatorNotes.toLowerCase().includes("openclaw")) {
    findings.push({
      category: "technical",
      severity: "low",
      owner_lane: "openclaw",
      title: "OpenClaw verification requested by operator notes",
      page_url: siteUrl,
      details: "The operator notes mention OpenClaw, so browser/catalog evidence should be verified on the shared local runtime.",
      recommendation: "Route screenshots, catalogue checks, and machine-bound proof through OpenClaw before marking this run fully verified.",
      evidence: { operator_notes: operatorNotes },
    });
  }

  const openCount = findings.length;
  const scores = {
    seo: Math.max(50, 100 - findings.filter((finding) => finding.category === "seo").length * 8),
    links: Math.max(60, 90 - findings.filter((finding) => finding.category === "links").length * 10),
    technical: Math.max(45, 100 - findings.filter((finding) => finding.category === "technical").length * 10),
    geo: Math.max(45, 100 - findings.filter((finding) => finding.category === "geo").length * 10),
    content: Math.max(60, 90 - findings.filter((finding) => finding.category === "content").length * 10),
  };

  return {
    findings,
    scores,
    summary: {
      pages_checked: pageResults.length,
      issue_count: openCount,
      sitemap_url_count: sitemapUrls.length,
      next_best_action: openCount
        ? "Route high-severity findings to Hermes first, then assign fixes to Claude/Lovable, PC, OpenClaw, or Codex."
        : "No urgent issues found. Keep Hermes on daily monitoring.",
      source: "growth-agent-audit",
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = await requireAdmin(req, corsHeaders);
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const siteUrl = normalizeSiteUrl(body.site_url);
    const operatorNotes = typeof body.operator_notes === "string" ? body.operator_notes : "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: run, error: runError } = await supabase
      .from("growth_agent_audit_runs")
      .insert({
        site_url: siteUrl,
        status: "running",
        source: body.mode === "cron" ? "cron" : "manual",
        created_by: admin.userId === "internal" || admin.userId === "service_role" ? null : admin.userId,
        summary: { operator_notes: operatorNotes },
      })
      .select("id")
      .single();

    if (runError) throw runError;

    const audit = await auditSite(siteUrl, operatorNotes);
    const findings = audit.findings.map((finding) => ({
      ...finding,
      run_id: run.id,
      status: "open",
      evidence: finding.evidence || {},
      fix_payload: finding.fix_payload || {},
    }));

    if (findings.length > 0) {
      const { error: findingError } = await supabase.from("growth_agent_findings").insert(findings);
      if (findingError) throw findingError;
    }

    const { error: updateError } = await supabase
      .from("growth_agent_audit_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        scores: audit.scores,
        summary: audit.summary,
      })
      .eq("id", run.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        run_id: run.id,
        findings_created: findings.length,
        scores: audit.scores,
        summary: audit.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("[growth-agent-audit] failed", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
