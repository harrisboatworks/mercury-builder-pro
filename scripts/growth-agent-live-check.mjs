const SITE_URL = process.env.MERCURY_SITE_URL || "https://www.mercuryrepower.ca";
const HARRIS_SITE_URL = process.env.HARRIS_SITE_URL || "https://harrisboatworks.ca";

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
  { path: "/agents", required: true, signals: ["agent", "MCP", "public-motors-api", "build_quote", "pickup", ["install", "installation"]] },
  { path: "/llms.txt", required: true, signals: ["Ontario", "CAD", "pickup", "Gores Landing"] },
  { path: "/catalog.md", required: true, signals: ["CAD", "pickup", "Gores Landing", ["public-motors-api", "build_quote"]] },
  { path: "/.well-known/mcp.json", required: true, signals: ["build_quote"] },
  { path: "/.well-known/brand.json", required: true, signals: ["Harris Boat Works"] },
  { path: "/.well-known/ai.txt", required: true, signals: [["MCP", "agent-mcp-server"], ["public-motors-api", "build_quote"], "CAD", "Ontario", "Gores Landing", "pickup", ["install", "installation"]] },
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
  "/repower",
  "/blog/best-mercury-dealer-ontario-hbw-difference",
  "/zh",
];

function urlFor(path) {
  return new URL(path, SITE_URL).toString();
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

function robotsAssertion(url, text) {
  const failures = [];
  const allowlisted = new Set(AI_CRAWLER_ALLOWLIST.map((agent) => agent.toLowerCase()));
  const groups = [];
  let current = null;

  if (/Cloudflare Managed/i.test(text)) {
    failures.push("Cloudflare Managed content block is present");
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

const results = await Promise.all(CHECKS.map(fetchCheck));
const robotsAssertions = await Promise.all([
  fetchRobotsAssertion(SITE_URL, true),
  fetchRobotsAssertion(HARRIS_SITE_URL, false),
]);
const aiAccessChecks = await Promise.all(
  AI_ACCESS_PATHS.flatMap((path) =>
    AI_ACCESS_USER_AGENTS.map((userAgent) => fetchAiAccessCheck(path, userAgent)),
  ),
);
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

const output = {
  site: SITE_URL,
  checkedAt: new Date().toISOString(),
  sitemapUrls,
  ok: hardFailures.length === 0 && robotsFailures.length === 0 && aiAccessFailures.length === 0,
  hardFailures: [...hardFailures, ...robotsFailures, ...aiAccessFailures],
  results,
  robotsAssertions,
  externalRobotsWarnings,
  aiAccessChecks,
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
