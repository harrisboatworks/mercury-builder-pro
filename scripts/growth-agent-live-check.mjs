import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = process.env.MERCURY_SITE_URL || "https://www.mercuryrepower.ca";
const HARRIS_SITE_URL = process.env.HARRIS_SITE_URL || "https://harrisboatworks.ca";
const GOOGLE_PLACES_URL = process.env.GOOGLE_PLACES_URL || "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places";
const SKIP_AI_ACCESS_MATRIX = process.env.GROWTH_SKIP_AI_ACCESS_MATRIX === "1";
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TSX_BIN = join(
  ROOT,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);
const FINANCE_POLICY = JSON.parse(
  readFileSync(new URL("../src/data/finance-policy.json", import.meta.url), "utf8"),
);

const AI_CRAWLER_ALLOWLIST = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Bingbot",
  "BingPreview",
  "MicrosoftPreview",
  "msnbot",
  "MSNBot",
  "Google-Extended",
  "CCBot",
  "Amazonbot",
  "Applebot",
  "Applebot-Extended",
  "Bytespider",
  "Meta-ExternalAgent",
  "meta-externalagent",
  "PerplexityBot",
  "Perplexity-User",
  "Diffbot",
  "cohere-ai",
  "Cohere-Web",
  "YouBot",
  "PhindBot",
  "MistralAI-User",
  "KimiBot",
  "Kimi-User",
  "Kimi-SearchBot",
  "DeepSeekBot",
  "DeepSeek-Crawler",
  "DeepSeek",
  "ChatGLM-Spider",
  "ZhipuBot",
  "Qwen",
  "Tongyi",
  "AliyunBot",
  "AliyunCrawler",
  "AlibabaCloud",
  "Baiduspider",
  "BaiduAI",
  "Baidu-YiYan",
  "ERNIEBot",
  "ERNIE-Bot",
  "Sogou web spider",
  "360Spider",
  "YisouSpider",
  "PetalBot",
  "TencentBot",
  "YuanbaoBot",
  "HunyuanAide",
  "iFlytekBot",
  "Xinghuo",
  "PanguBot",
  "MiniMaxBot",
  "MoonshotAI",
  "MoonshotBot",
  "Wenxiaobai",
];

const CHECKS = [
  { path: "/admin/growth-agent", required: true, signals: ["Mercury Repower"] },
  { path: "/sitemap.xml", required: true },
  { path: "/robots.txt", required: true },
  { path: "/rss.xml", required: true, signals: ["<rss", "<item>", "<lastBuildDate>"] },
  { path: "/agents", required: true, signals: ["agent", "MCP", "public-motors-api", "build_quote", "pickup", ["install", "installation"]] },
  { path: "/llms.txt", required: true, signals: ["Ontario", "CAD", "pickup", "Gores Landing"] },
  { path: "/catalog.md", required: true, signals: ["CAD", "pickup", "Gores Landing", ["public-motors-api", "build_quote"]] },
  { path: "/.well-known/mcp.json", required: true, signals: ["build_quote"] },
  { path: "/.well-known/brand.json", required: true, signals: ["Harris Boat Works"] },
  { path: "/.well-known/ucp", required: true, signals: ["dev.ucp.shopping.checkout", "quote"] },
  { path: "/.well-known/ai.txt", required: true, signals: [["MCP", "agent-mcp-server"], ["public-motors-api", "build_quote"], "CAD", "Ontario", "Gores Landing", "pickup", ["install", "installation"]] },
  { path: "/api/agents/motors.md", required: true, signals: ["Mercury Outboard Catalog", "special-order only", "CAD"] },
  { path: "/pricing-reference", required: true, signals: ["Mercury", "Ontario", "CAD", "Gores Landing"] },
  { path: "/pricing-reference.md", required: true, signals: ["CAD", "pickup_only", "Gores Landing", "motor_count"] },
];

const AI_ACCESS_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "Bingbot",
  "BingPreview",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "KimiBot",
  "DeepSeekBot",
  "ChatGLM-Spider",
  "Qwen",
  "Baiduspider",
  "Sogou web spider",
  "360Spider",
  "PetalBot",
  "TencentBot",
];

const AI_ACCESS_PATHS = [
  "/",
  "/robots.txt",
  "/llms.txt",
  "/catalog.md",
  "/pricing-reference",
  "/pricing-reference.md",
  "/api/agents/motors.md",
  "/repower",
  "/blog/best-mercury-dealer-ontario-hbw-difference",
  "/zh",
];

function urlFor(path) {
  return new URL(path, SITE_URL).toString();
}

async function fetchArtifact(path, options = {}) {
  const url = path.startsWith("http") ? path : urlFor(path);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      ...options,
      headers: { "User-Agent": "MercuryRepower-GrowthAgentLiveCheck/1.0", ...(options.headers || {}) },
    });
    return { path, url: response.url, status: response.status, ok: response.ok, text: await response.text() };
  } catch (error) {
    return { path, url, status: 0, ok: false, text: "", error: error.message };
  }
}

function parseJsonArtifact(artifact, failures) {
  try {
    return JSON.parse(artifact.text);
  } catch (error) {
    failures.push(`${artifact.path} is not valid JSON: ${error.message}`);
    return null;
  }
}

function parsePricingRows(markdown) {
  const rows = new Map();
  const rowRx = /^\|\s*[\d.]+\s*\|\s*[^|]+?\s*\|\s*([A-Z0-9]+)\s*\|.*?\|\s*\$([\d,]+)\s*_\(MSRP \$([\d,]+)\)_\s*\|/gm;
  for (const match of markdown.matchAll(rowRx)) {
    rows.set(match[1], {
      sellingPrice: Number(match[2].replace(/,/g, "")),
      msrp: Number(match[3].replace(/,/g, "")),
    });
  }
  return rows;
}

function semanticArtifactAssertion(artifacts) {
  const failures = [];
  for (const artifact of Object.values(artifacts)) {
    if (!artifact.ok) failures.push(`${artifact.path} returned ${artifact.status || artifact.error || "an error"}`);
  }
  if (failures.length > 0) return { ok: false, failures };

  const brand = parseJsonArtifact(artifacts.brand, failures);
  const mcp = parseJsonArtifact(artifacts.mcp, failures);
  const places = parseJsonArtifact(artifacts.places, failures);
  const motors = parseJsonArtifact(artifacts.motors, failures);
  if (!brand || !mcp || !places || !motors) return { ok: false, failures };

  const placeLat = Number(places?.location?.latitude);
  const placeLng = Number(places?.location?.longitude);
  const geoPairs = [
    ["brand.json", Number(brand?.geography?.headquarters?.lat), Number(brand?.geography?.headquarters?.lng)],
    ["mcp.json", Number(mcp?.geography?.originLat), Number(mcp?.geography?.originLng)],
  ];
  if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) {
    failures.push("Google Places response is missing canonical coordinates");
  } else {
    for (const [label, lat, lng] of geoPairs) {
      if (Math.abs(lat - placeLat) > 0.000001 || Math.abs(lng - placeLng) > 0.000001) {
        failures.push(`${label} coordinates ${lat},${lng} do not match Google Places ${placeLat},${placeLng}`);
      }
    }
  }

  const standards = Array.isArray(brand.standards) ? brand.standards.join(" ") : "";
  if (!/Universal Commerce Protocol.*implemented/i.test(standards) || /conformance pending/i.test(standards)) {
    failures.push("brand.json does not describe UCP as implemented without stale pending-conformance text");
  }

  const rawSupabaseAgentUrl = /https?:\/\/eutsoqdpjurknjsshxes\.supabase\.co\/functions\/v1\/(?:motors-md|public-motors-api|public-quote-api|agent-mcp-server|ucp-checkout)\b/i;
  for (const [label, artifact] of [["agents", artifacts.agents], ["llms.txt", artifacts.llms], ["brand.json", artifacts.brand], ["mcp.json", artifacts.mcp]]) {
    if (rawSupabaseAgentUrl.test(artifact.text)) failures.push(`${label} exposes a raw Supabase agent endpoint`);
  }
  if (!artifacts.agents.text.includes("/api/agents/motors.md")) failures.push("agents page does not advertise /api/agents/motors.md");

  if (/We do (?:\*\*)?not(?:\*\*)? sell(?: or service)? Mercury Verado|We do not sell Verado/i.test(artifacts.motorsMd.text)) {
    failures.push("motors markdown still says Harris Boat Works does not sell Verado");
  }
  if (!/Verado is (?:\*\*)?special-order only/i.test(artifacts.motorsMd.text)) {
    failures.push("motors markdown is missing the Verado special-order-only rule");
  }

  const promoActive = Date.now() <= new Date(FINANCE_POLICY.mercuryPromo.endsAt).getTime();
  if (promoActive && !artifacts.llms.text.includes(`${FINANCE_POLICY.mercuryPromo.apr}% APR`)) {
    failures.push(`llms.txt is missing the active ${FINANCE_POLICY.mercuryPromo.apr}% APR headline`);
  }
  if (promoActive && /Standard financing (?:rates )?(?:start|starts) (?:from|at)\s+7\.99%/i.test(artifacts.llms.text)) {
    failures.push("llms.txt incorrectly frames 7.99% as current while the promo is active");
  }

  const pricingRows = parsePricingRows(artifacts.pricing.text);
  const liveMotors = Array.isArray(motors.motors) ? motors.motors : [];
  for (const motor of liveMotors) {
    const row = pricingRows.get(String(motor.modelNumber || "").trim());
    if (!row) {
      failures.push(`pricing-reference.md is missing live model ${motor.modelNumber || motor.modelDisplay}`);
      continue;
    }
    if (row.sellingPrice !== Number(motor.sellingPrice) || row.msrp !== Number(motor.msrp)) {
      failures.push(`pricing-reference.md price drift for ${motor.modelNumber}: ${row.sellingPrice}/${row.msrp} vs API ${motor.sellingPrice}/${motor.msrp}`);
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    canonicalGeo: Number.isFinite(placeLat) && Number.isFinite(placeLng) ? { latitude: placeLat, longitude: placeLng } : null,
    liveMotorPriceComparisons: liveMotors.length,
  };
}

async function fetchCheck(check) {
  const started = Date.now();
  try {
    const response = await fetch(urlFor(check.path), {
      redirect: "follow",
      headers: { "User-Agent": "MercuryRepower-GrowthAgentLiveCheck/1.0" },
    });
    const text = await response.text();
    const lowerText = text.toLowerCase();
    const missingSignals = (check.signals || [])
      .filter((signal) => {
        const options = Array.isArray(signal) ? signal : [signal];
        return !options.some((option) => lowerText.includes(option.toLowerCase()));
      })
      .map((signal) => (Array.isArray(signal) ? signal.join("|") : signal));
    return {
      path: check.path,
      ok: response.ok && missingSignals.length === 0,
      status: response.status,
      finalUrl: response.url,
      elapsedMs: Date.now() - started,
      bytes: text.length,
      missingSignals,
    };
  } catch (error) {
    return {
      path: check.path,
      ok: false,
      status: 0,
      finalUrl: urlFor(check.path),
      elapsedMs: Date.now() - started,
      bytes: 0,
      missingSignals: check.signals || [],
      error: error.message,
    };
  }
}

function sitemapCount(text) {
  return (text.match(/<loc>/g) || []).length;
}

function latestPublishedBlogArticle() {
  const dumpScript = `
    import { blogArticles, isArticlePublished } from './src/data/blogArticles.ts';
    const latest = blogArticles
      .filter(isArticlePublished)
      .map((article) => ({
        slug: article.slug,
        publishDate: article.publishDate || article.datePublished,
      }))
      .filter((article) => article.slug && article.publishDate)
      .sort((a, b) => {
        const dateOrder = b.publishDate.localeCompare(a.publishDate);
        return dateOrder || a.slug.localeCompare(b.slug);
      })[0];
    process.stdout.write(JSON.stringify(latest || null));
  `;

  return JSON.parse(execFileSync(TSX_BIN, ["--eval", dumpScript], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: Number(process.env.BUILD_SUBPROCESS_TIMEOUT_MS || 30000),
  }));
}

function rssSitemapAssertion(rssArtifact, sitemapArtifact) {
  const failures = [];
  if (!rssArtifact.ok) failures.push(`rss.xml returned ${rssArtifact.status || rssArtifact.error || "an error"}`);
  if (!sitemapArtifact.ok) failures.push(`sitemap.xml returned ${sitemapArtifact.status || sitemapArtifact.error || "an error"}`);
  if (failures.length > 0) return { ok: false, failures };

  const rssLinks = [...rssArtifact.text.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)]
    .map((match) => match[1].trim());
  const sitemapLinks = new Set(
    [...sitemapArtifact.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim()),
  );
  let latest = null;
  try {
    latest = latestPublishedBlogArticle();
  } catch (error) {
    failures.push(`could not load newest published blog from repo source: ${error.message}`);
  }
  const expectedLatestUrl = latest ? urlFor(`/blog/${latest.slug}`) : null;
  const lastBuildDate = rssArtifact.text.match(/<lastBuildDate>([^<]+)<\/lastBuildDate>/i)?.[1]?.trim() || null;
  const missingFromSitemap = rssLinks.filter((url) => !sitemapLinks.has(url));

  if (!latest) failures.push("repo source has no published blog article for RSS freshness comparison");
  if (rssLinks.length === 0) failures.push("rss.xml contains no items");
  if (expectedLatestUrl && rssLinks[0] !== expectedLatestUrl) {
    failures.push(`rss.xml newest item ${rssLinks[0] || "missing"} does not match repo source ${expectedLatestUrl}`);
  }
  if (expectedLatestUrl && !sitemapLinks.has(expectedLatestUrl)) {
    failures.push(`sitemap.xml is missing newest published blog ${expectedLatestUrl}`);
  }
  if (latest?.publishDate && lastBuildDate) {
    const expectedDate = new Date(`${latest.publishDate}T12:00:00Z`).toUTCString();
    if (lastBuildDate !== expectedDate) {
      failures.push(`rss.xml lastBuildDate ${lastBuildDate} does not match newest publish date ${expectedDate}`);
    }
  }
  if (missingFromSitemap.length > 0) {
    failures.push(`rss.xml has ${missingFromSitemap.length} item(s) missing from sitemap.xml`);
  }

  return {
    ok: failures.length === 0,
    failures,
    expectedLatest: latest ? { ...latest, url: expectedLatestUrl } : null,
    rssItemCount: rssLinks.length,
    firstRssUrl: rssLinks[0] || null,
    lastBuildDate,
    rssItemsMissingFromSitemap: missingFromSitemap,
  };
}

function robotsAssertion(url, text) {
  const failures = [];
  const allowlisted = new Set(AI_CRAWLER_ALLOWLIST.map((agent) => agent.toLowerCase()));
  const groups = [];
  let current = null;

  if (/Cloudflare Managed/i.test(text)) {
    failures.push("Cloudflare Managed content block is present");
  }
  if (/^Disallow:\s*\/api\/\s*$/mi.test(text) && !/^Allow:\s*\/api\/agents\/\s*$/mi.test(text)) {
    failures.push("/api/ is disallowed without an Allow: /api/agents/ exception");
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!current || current.directives.length > 0) {
        current = { agents: [], directives: [] };
        groups.push(current);
      }
      current.agents.push(value);
      continue;
    }

    if (!current) continue;
    current.directives.push({ field, value });
  }

  for (const group of groups) {
    const matchedAgents = group.agents.filter((agent) => allowlisted.has(agent.toLowerCase()));
    if (matchedAgents.length === 0) continue;
    const blocksRoot = group.directives.some(
      (directive) => directive.field === "disallow" && directive.value.trim() === "/",
    );
    if (blocksRoot) {
      failures.push(`${matchedAgents.join(", ")} group contains Disallow: /`);
    }
  }

  return {
    url,
    ok: failures.length === 0,
    failures,
  };
}

async function fetchRobotsAssertion(siteUrl, required = true) {
  const started = Date.now();
  const robotsUrl = new URL("/robots.txt", siteUrl).toString();
  try {
    const response = await fetch(`${robotsUrl}?growth-check=${Date.now()}`, {
      redirect: "follow",
      headers: { "User-Agent": "MercuryRepower-GrowthAgentLiveCheck/1.0" },
    });
    const text = await response.text();
    if (!response.ok) {
      return {
        url: robotsUrl,
        ok: !required,
        required,
        reachable: false,
        status: response.status,
        elapsedMs: Date.now() - started,
        failures: required ? [`robots.txt returned ${response.status}`] : [],
      };
    }
    return {
      ...robotsAssertion(response.url, text),
      required,
      reachable: true,
      status: response.status,
      elapsedMs: Date.now() - started,
      bytes: text.length,
    };
  } catch (error) {
    return {
      url: robotsUrl,
      ok: !required,
      required,
      reachable: false,
      status: 0,
      elapsedMs: Date.now() - started,
      failures: required ? [error.message] : [],
      error: error.message,
    };
  }
}

async function fetchAiAccessCheck(path, userAgent) {
  const started = Date.now();
  const url = `${urlFor(path)}?ai-access-check=${Date.now()}`;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,text/plain,*/*",
      },
    });
    const cfMitigated = response.headers.get("cf-mitigated");
    await response.arrayBuffer();
    return {
      path,
      userAgent,
      ok: response.ok && cfMitigated !== "challenge",
      status: response.status,
      cfMitigated,
      finalUrl: response.url,
      elapsedMs: Date.now() - started,
    };
  } catch (error) {
    return {
      path,
      userAgent,
      ok: false,
      status: 0,
      cfMitigated: null,
      finalUrl: url,
      elapsedMs: Date.now() - started,
      error: error.message,
    };
  }
}

async function fetchAiTxtContentAssertion(siteUrl) {
  const started = Date.now();
  const aiTxtUrl = new URL("/.well-known/ai.txt", siteUrl).toString();
  const forbiddenPatterns = [
    { pattern: /supabase/i, label: "supabase" },
    { pattern: /platinum/i, label: "Platinum" },
  ];
  try {
    const response = await fetch(`${aiTxtUrl}?growth-check=${Date.now()}`, {
      redirect: "follow",
      headers: { "User-Agent": "MercuryRepower-GrowthAgentLiveCheck/1.0" },
    });
    const text = await response.text();
    if (!response.ok) {
      return {
        url: aiTxtUrl,
        ok: false,
        required: true,
        reachable: false,
        status: response.status,
        elapsedMs: Date.now() - started,
        failures: [`ai.txt returned ${response.status}`],
      };
    }
    const failures = forbiddenPatterns
      .filter(({ pattern }) => pattern.test(text))
      .map(({ label }) => `ai.txt contains forbidden token "${label}"`);
    return {
      url: response.url,
      ok: failures.length === 0,
      required: true,
      reachable: true,
      status: response.status,
      elapsedMs: Date.now() - started,
      bytes: text.length,
      failures,
    };
  } catch (error) {
    return {
      url: aiTxtUrl,
      ok: false,
      required: true,
      reachable: false,
      status: 0,
      elapsedMs: Date.now() - started,
      failures: [error.message],
      error: error.message,
    };
  }
}

const results = await Promise.all(CHECKS.map(fetchCheck));
const [brandArtifact, mcpArtifact, llmsArtifact, agentsArtifact, motorsMdArtifact, pricingArtifact, motorsArtifact, placesArtifact, rssArtifact, sitemapArtifact] = await Promise.all([
  fetchArtifact("/.well-known/brand.json"),
  fetchArtifact("/.well-known/mcp.json"),
  fetchArtifact("/llms.txt"),
  fetchArtifact("/agents"),
  fetchArtifact("/api/agents/motors.md"),
  fetchArtifact("/pricing-reference.md"),
  fetchArtifact("/api/agents/motors"),
  fetchArtifact(GOOGLE_PLACES_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
  fetchArtifact("/rss.xml"),
  fetchArtifact("/sitemap.xml"),
]);
const semanticAssertions = semanticArtifactAssertion({
  brand: brandArtifact,
  mcp: mcpArtifact,
  llms: llmsArtifact,
  agents: agentsArtifact,
  motorsMd: motorsMdArtifact,
  pricing: pricingArtifact,
  motors: motorsArtifact,
  places: placesArtifact,
});
const rssParityAssertion = rssSitemapAssertion(rssArtifact, sitemapArtifact);
const robotsAssertions = await Promise.all([
  fetchRobotsAssertion(SITE_URL, true),
  fetchRobotsAssertion(HARRIS_SITE_URL, false),
]);
const aiAccessChecks = SKIP_AI_ACCESS_MATRIX
  ? []
  : await Promise.all(
      AI_ACCESS_PATHS.flatMap((path) =>
        AI_ACCESS_USER_AGENTS.map((userAgent) => fetchAiAccessCheck(path, userAgent)),
      ),
    );
const aiTxtContentAssertion = await fetchAiTxtContentAssertion(SITE_URL);
const sitemap = results.find((result) => result.path === "/sitemap.xml");
let sitemapUrls = null;
if (sitemap?.status === 200) {
  const response = await fetch(urlFor("/sitemap.xml"), {
    headers: { "User-Agent": "MercuryRepower-GrowthAgentLiveCheck/1.0" },
  });
  sitemapUrls = sitemapCount(await response.text());
}

const hardFailures = results.filter((result) => {
  const check = CHECKS.find((item) => item.path === result.path);
  return check?.required && !result.ok;
});
const robotsFailures = robotsAssertions.filter((result) => result.required && result.reachable && !result.ok);
const externalRobotsWarnings = robotsAssertions.filter((result) => !result.required && result.reachable && !result.ok);
const aiAccessFailures = aiAccessChecks.filter((result) => !result.ok);
const aiTxtContentFailures = aiTxtContentAssertion.ok ? [] : [aiTxtContentAssertion];
const semanticFailures = semanticAssertions.ok ? [] : semanticAssertions.failures.map((failure) => ({
  path: "semantic-agent-facts",
  ok: false,
  status: 0,
  error: failure,
}));
const rssParityFailures = rssParityAssertion.ok ? [] : rssParityAssertion.failures.map((failure) => ({
  path: "rss-sitemap-parity",
  ok: false,
  status: 0,
  error: failure,
}));

const output = {
  site: SITE_URL,
  checkedAt: new Date().toISOString(),
  sitemapUrls,
  ok:
    hardFailures.length === 0 &&
    robotsFailures.length === 0 &&
    aiAccessFailures.length === 0 &&
    aiTxtContentFailures.length === 0 &&
    semanticFailures.length === 0 &&
    rssParityFailures.length === 0,
  hardFailures: [...hardFailures, ...robotsFailures, ...aiAccessFailures, ...aiTxtContentFailures, ...semanticFailures, ...rssParityFailures],
  results,
  robotsAssertions,
  externalRobotsWarnings,
  aiAccessChecks,
  aiTxtContentAssertion,
  semanticAssertions,
  rssParityAssertion,
  searchFocus: [
    "Mercury outboard prices Ontario",
    "Mercury repower cost Ontario",
    "Mercury 150 price Canada",
    "Mercury dealer near Toronto",
    "Mercury outboard quote online",
    "repower boat Ontario",
  ],
};

console.log(JSON.stringify(output, null, 2));
process.exit(output.ok ? 0 : 1);
