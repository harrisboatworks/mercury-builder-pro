import { McpInvalidParamsError, mcpToolResult } from "./public-agent-mcp.ts";

export const PUBLIC_SITE_ORIGIN = "https://www.mercuryrepower.ca";
export const PUBLIC_BLOG_INDEX_PATH = "/agent-blog-index.json";
export const ARTICLE_TEXT_LIMIT = 12_000;
export const ARTICLE_INDEX_BYTE_LIMIT = 1_500_000;
export const ARTICLE_EXCERPT_LIMIT = 280;
export const ARTICLE_QUERY_MAX = 120;
export const ARTICLE_SLUG_MAX = 160;
export const ARTICLE_SEARCH_MAX_LIMIT = 10;
export const ARTICLE_SEARCH_DEFAULT_LIMIT = 5;

/** Traditional Chinese pilot stays noindex and out of public search listings. */
export const NOINDEX_PILOT_LANGUAGES = ["zh-Hant"] as const;

export const LISTED_ARTICLE_LANGUAGES = [
  "en-CA",
  "fr-CA",
  "ko-KR",
  "zh-CN",
  "es",
  "pa",
  "ur",
  "tl",
  "hi",
] as const;

const LANGUAGE_PREFIX: Record<string, string> = {
  "en-CA": "",
  "fr-CA": "fr",
  "ko-KR": "ko",
  "zh-CN": "zh",
  es: "es",
  pa: "pa",
  ur: "ur",
  tl: "tl",
  hi: "hi",
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CALLER_URL_KEYS = ["url", "href", "markdown_url", "markdown_path", "path", "citation_url", "source_url"];

export type PublicBlogCatalogEntry = {
  slug?: unknown;
  language?: unknown;
  title?: unknown;
  excerpt?: unknown;
  keywords?: unknown;
  author?: unknown;
  publisher?: unknown;
  date_published?: unknown;
  date_modified?: unknown;
  html_url?: unknown;
  markdown_url?: unknown;
  markdown_path?: unknown;
  hidden?: unknown;
  draft?: unknown;
  noindex?: unknown;
  visible?: unknown;
};

export type ArticleFetch = (url: string, init?: RequestInit) => Promise<Response>;

export function publicationToday(now = new Date()): string {
  // Match the existing public article visibility gate (UTC calendar date).
  return now.toISOString().slice(0, 10);
}

export function catalogPaths(slug: string, language: string): {
  htmlPath: string;
  markdownPath: string;
  htmlUrl: string;
  markdownUrl: string;
} | null {
  if (!LISTED_ARTICLE_LANGUAGES.includes(language as typeof LISTED_ARTICLE_LANGUAGES[number])) return null;
  if (!SLUG_RE.test(slug) || slug.length > ARTICLE_SLUG_MAX) return null;
  const prefix = LANGUAGE_PREFIX[language];
  const htmlPath = prefix ? `/blog/${prefix}/${slug}` : `/blog/${slug}`;
  const markdownPath = `${htmlPath}.md`;
  if (!isAllowlistedMarkdownPath(markdownPath)) return null;
  return {
    htmlPath,
    markdownPath,
    htmlUrl: `${PUBLIC_SITE_ORIGIN}${htmlPath}`,
    markdownUrl: `${PUBLIC_SITE_ORIGIN}${markdownPath}`,
  };
}

export function isAllowlistedMarkdownPath(path: string): boolean {
  if (typeof path !== "string" || path.length > 220) return false;
  if (path !== path.trim() || path.includes("\\") || path.includes("..")) return false;
  if (/[?#]|:\/\/|%2e|%2f|@/i.test(path)) return false;
  if (path.toLowerCase().includes("zh-hant")) return false;
  return /^\/blog\/(?:fr|ko|zh|es|pa|ur|tl|hi)\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(path)
    || /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(path);
}

export function publicFetchUrl(path: string): string | null {
  if (path === PUBLIC_BLOG_INDEX_PATH) return `${PUBLIC_SITE_ORIGIN}${path}`;
  if (!isAllowlistedMarkdownPath(path)) return null;
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}

function rejectCallerSelectedUrl(args: Record<string, unknown>) {
  for (const key of CALLER_URL_KEYS) {
    if (args[key] != null) {
      throw new McpInvalidParamsError(
        "Article tools do not accept a URL or path. Pass a catalog slug and optional language. The server fetches only the allowlisted Markdown twin for that catalog item.",
      );
    }
  }
}

function optionalQuery(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw new McpInvalidParamsError(`query must be a nonempty string of at most ${ARTICLE_QUERY_MAX} characters.`);
  }
  const query = value.trim();
  if (!query || query.length > ARTICLE_QUERY_MAX) {
    throw new McpInvalidParamsError(`query must be a nonempty string of at most ${ARTICLE_QUERY_MAX} characters.`);
  }
  return query;
}

function optionalLanguage(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw new McpInvalidParamsError("language must be a supported public article language.");
  }
  const language = value.trim();
  if ((NOINDEX_PILOT_LANGUAGES as readonly string[]).includes(language) || language.toLowerCase() === "zh-hant") {
    throw new McpInvalidParamsError(
      "zh-Hant is a noindex pilot and is not listed by search_articles or get_article.",
    );
  }
  if (!LISTED_ARTICLE_LANGUAGES.includes(language as typeof LISTED_ARTICLE_LANGUAGES[number])) {
    throw new McpInvalidParamsError("language must be a supported public article language.");
  }
  return language;
}

function optionalLimit(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > ARTICLE_SEARCH_MAX_LIMIT) {
    throw new McpInvalidParamsError(`limit must be an integer from 1 to ${ARTICLE_SEARCH_MAX_LIMIT}.`);
  }
  return value;
}

export function parseSearchArticlesArgs(args: Record<string, unknown>) {
  rejectCallerSelectedUrl(args);
  return {
    query: optionalQuery(args.query),
    language: optionalLanguage(args.language),
    limit: optionalLimit(args.limit) ?? ARTICLE_SEARCH_DEFAULT_LIMIT,
  };
}

export function parseGetArticleArgs(args: Record<string, unknown>) {
  rejectCallerSelectedUrl(args);
  const slug = args.slug;
  if (typeof slug !== "string" || !SLUG_RE.test(slug.trim()) || slug.trim().length > ARTICLE_SLUG_MAX) {
    throw new McpInvalidParamsError("slug must be a published catalog slug.");
  }
  return {
    slug: slug.trim().toLowerCase(),
    language: optionalLanguage(args.language) ?? "en-CA",
  };
}

export function isListedCatalogEntry(entry: PublicBlogCatalogEntry, todayYmd: string): boolean {
  if (!entry || typeof entry !== "object") return false;
  if (entry.hidden === true || entry.draft === true || entry.noindex === true || entry.visible === false) return false;
  const language = typeof entry.language === "string" ? entry.language : "";
  if ((NOINDEX_PILOT_LANGUAGES as readonly string[]).includes(language)) return false;
  const slug = typeof entry.slug === "string" ? entry.slug : "";
  const paths = catalogPaths(slug, language);
  if (!paths) return false;
  const date = typeof entry.date_published === "string" ? entry.date_published : "";
  if (!DATE_RE.test(date) || date > todayYmd) return false;
  if (entry.html_url !== paths.htmlUrl) return false;
  if (entry.markdown_url !== paths.markdownUrl) return false;
  if (entry.markdown_path !== paths.markdownPath) return false;
  if (typeof entry.title !== "string" || !entry.title.trim()) return false;
  return true;
}

function boundedExcerpt(value: unknown): string {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (text.length <= ARTICLE_EXCERPT_LIMIT) return text;
  return `${text.slice(0, ARTICLE_EXCERPT_LIMIT - 1).trimEnd()}…`;
}

export function searchPublicCatalog(
  entries: PublicBlogCatalogEntry[],
  args: { query?: string; language?: string; limit: number },
  todayYmd: string,
) {
  const words = (args.query || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const ranked = entries.filter((entry) => isListedCatalogEntry(entry, todayYmd))
    .filter((entry) => !args.language || entry.language === args.language)
    .map((entry) => {
      const title = String(entry.title).toLowerCase();
      const haystack = [entry.title, entry.excerpt, entry.slug, ...(Array.isArray(entry.keywords) ? entry.keywords : [])].join(" ").toLowerCase();
      const matches = words.filter(word => haystack.includes(word));
      return { entry, score: matches.length * 10 + words.filter(word => title.includes(word)).length, matched: matches.length === words.length };
    }).filter(item => item.matched)
    .sort((a, b) => b.score - a.score || String(b.entry.date_published).localeCompare(String(a.entry.date_published)) || String(a.entry.slug).localeCompare(String(b.entry.slug)));
  const articles = ranked.slice(0, args.limit).map(({ entry }) => ({
    title: String(entry.title), excerpt: boundedExcerpt(entry.excerpt), slug: String(entry.slug),
    citation_url: String(entry.html_url), source_url: String(entry.html_url), html_url: String(entry.html_url),
    language: String(entry.language), author: entry.author || "Harris Boat Works", publisher: entry.publisher || "Harris Boat Works",
    date_published: String(entry.date_published), date_modified: entry.date_modified, markdown_url: String(entry.markdown_url),
  }));
  return { count: articles.length, total_matches: ranked.length, has_more: ranked.length > articles.length, articles };
}

export function safeHeadingAnchor(text: string): string | null {
  const anchor = text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!anchor || anchor.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(anchor)) return null;
  return anchor;
}

export function headingCitations(markdown: string, _htmlUrl: string) {
  // Markdown includes generated sections that need not have HTML fragment IDs.
  // Report headings without inventing fragment citations; cite the verified HTML URL.
  return markdown.split("\n").flatMap((line) => {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    return match ? [{ heading: match[2].replace(/[*_`]/g, "").trim(), level: match[1].length }] : [];
  });
}

export function boundArticleText(text: string, limit = ARTICLE_TEXT_LIMIT) {
  if (text.length <= limit) return { text, truncated: false, text_limit: limit };
  return {
    text: text.slice(0, limit),
    truncated: true,
    text_limit: limit,
  };
}

async function readBounded(response: Response, byteLimit: number) {
  const reader = response.body?.getReader();
  if (!reader) return { text: "", truncated: false };
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return { text: text + decoder.decode(), truncated: false };
    const remaining = byteLimit - bytes;
    if (value.byteLength > remaining) {
      text += decoder.decode(value.subarray(0, remaining), { stream: true });
      await reader.cancel().catch(() => {});
      return { text, truncated: true };
    }
    bytes += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
}

async function fetchPublicPath(path: string, fetchImpl: ArticleFetch, byteLimit: number) {
  const url = publicFetchUrl(path);
  if (!url) {
    return mcpToolResult({
      error: "Refusing to fetch a URL that is not an allowlisted same-site public path.",
    }, true);
  }
  try {
    const response = await fetchImpl(url, { redirect: "error" });
    if (!response.ok) {
      return mcpToolResult({
        error: "Public article source request failed.",
        status: response.status,
      }, true);
    }
    const bounded = await readBounded(response, byteLimit);
    if (/<!doctype html/i.test(bounded.text) || /<html[\s>]/i.test(bounded.text)) {
      return mcpToolResult({ error: "Public Markdown twin was not available." }, true);
    }
    return { url, ...bounded };
  } catch {
    return mcpToolResult({ error: "Public article source request failed." }, true);
  }
}

function asToolError(result: unknown): result is { isError: true } {
  return Boolean(result && typeof result === "object" && "isError" in result && (result as { isError?: boolean }).isError);
}

export async function loadPublicBlogCatalog(fetchImpl: ArticleFetch, todayYmd = publicationToday()) {
  const fetched = await fetchPublicPath(PUBLIC_BLOG_INDEX_PATH, fetchImpl, ARTICLE_INDEX_BYTE_LIMIT);
  if (asToolError(fetched) || !("text" in fetched)) return fetched;
  if (fetched.truncated) {
    return mcpToolResult({ error: "Public article index exceeded the size limit." }, true);
  }
  try {
    const parsed = JSON.parse(fetched.text) as { articles?: unknown };
    const articles = Array.isArray(parsed.articles) ? parsed.articles as PublicBlogCatalogEntry[] : null;
    if (!articles) return mcpToolResult({ error: "Public article index was unreadable." }, true);
    return { entries: articles.filter((entry) => isListedCatalogEntry(entry, todayYmd)), todayYmd };
  } catch {
    return mcpToolResult({ error: "Public article index was unreadable." }, true);
  }
}

export async function searchPublicArticles(
  args: { query?: string; language?: string; limit: number },
  fetchImpl: ArticleFetch,
  todayYmd = publicationToday(),
) {
  const loaded = await loadPublicBlogCatalog(fetchImpl, todayYmd);
  if (asToolError(loaded) || !("entries" in loaded)) return loaded;
  return mcpToolResult(searchPublicCatalog(loaded.entries, args, todayYmd));
}

export async function getPublicArticle(
  args: { slug: string; language: string },
  fetchImpl: ArticleFetch,
  todayYmd = publicationToday(),
) {
  const paths = catalogPaths(args.slug, args.language);
  if (!paths) {
    return mcpToolResult({ error: "slug must resolve to a published public catalog item." }, true);
  }
  const loaded = await loadPublicBlogCatalog(fetchImpl, todayYmd);
  if (asToolError(loaded) || !("entries" in loaded)) return loaded;
  const entry = loaded.entries.find((item) => item.slug === args.slug && item.language === args.language);
  if (!entry) {
    return mcpToolResult({ error: "No published public article matches that slug and language." }, true);
  }
  const markdown = await fetchPublicPath(paths.markdownPath, fetchImpl, ARTICLE_TEXT_LIMIT * 4);
  if (asToolError(markdown) || !("text" in markdown)) return markdown;
  const bounded = boundArticleText(markdown.text);
  return mcpToolResult({
    title: String(entry.title),
    author: typeof entry.author === "string" ? entry.author : "Harris Boat Works",
    publisher: typeof entry.publisher === "string" && entry.publisher.trim() ? entry.publisher : "Harris Boat Works",
    language: args.language,
    date_published: String(entry.date_published),
    date_modified: entry.date_modified,
    citation_url: paths.htmlUrl,
    source_url: paths.htmlUrl,
    html_url: paths.htmlUrl,
    markdown_url: paths.markdownUrl,
    headings: headingCitations(bounded.text, paths.htmlUrl),
    text: bounded.text,
    truncated: markdown.truncated || bounded.truncated,
    text_limit: ARTICLE_TEXT_LIMIT,
  });
}

export async function runPublicArticleTool(
  name: "search_articles" | "get_article", rawArgs: unknown, fetchImpl: ArticleFetch,
) {
  const args = rawArgs ?? {};
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new McpInvalidParamsError("Article arguments must be an object.");
  }
  return name === "search_articles"
    ? searchPublicArticles(parseSearchArticlesArgs(args as Record<string, unknown>), fetchImpl)
    : getPublicArticle(parseGetArticleArgs(args as Record<string, unknown>), fetchImpl);
}
