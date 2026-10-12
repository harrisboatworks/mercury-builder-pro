import { BLOG_PUBLISHER_NAME, visibleBlogAuthorName } from "../../src/lib/blogCitation.js";

export const PUBLIC_BLOG_INDEX_PATH = "/agent-blog-index.json";
export const ARTICLE_EXCERPT_LIMIT = 280;
export const NOINDEX_PILOT_PREFIXES = ["zh-hant"];
export const NOINDEX_PILOT_LANGUAGES = ["zh-Hant"];

const LANGUAGE_PREFIX = {
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

export function publicationToday(now = new Date()) {
  // Match the existing public article visibility gate (UTC calendar date).
  return now.toISOString().slice(0, 10);
}

export function blogCitationFields(article, { htmlUrl, translated = false } = {}) {
  return [
    `author: ${JSON.stringify(visibleBlogAuthorName(article?.author, { translated }))}`,
    `publisher: ${JSON.stringify(BLOG_PUBLISHER_NAME)}`,
    `citation_url: ${htmlUrl}`,
    `source_url: ${htmlUrl}`,
  ];
}

export function isSearchListedArticle(article, { todayYmd, prefix = "", language = "en-CA" } = {}) {
  if (!article || article.hidden === true || article.visible === false || article.draft === true || article.noindex === true) return false;
  if (NOINDEX_PILOT_PREFIXES.includes(prefix) || NOINDEX_PILOT_LANGUAGES.includes(language)) return false;
  if (!SLUG_RE.test(String(article.slug || ""))) return false;
  const date = String(article.publishDate || article.datePublished || "").slice(0, 10);
  if (!DATE_RE.test(date) || date > todayYmd) return false;
  return true;
}

function excerpt(article) {
  const text = String(article?.description || "").replace(/\s+/g, " ").trim();
  if (text.length <= ARTICLE_EXCERPT_LIMIT) return text;
  return `${text.slice(0, ARTICLE_EXCERPT_LIMIT - 1).trimEnd()}…`;
}

function pathsFor(slug, language) {
  const prefix = LANGUAGE_PREFIX[language];
  if (prefix === undefined) return null;
  const htmlPath = prefix ? `/blog/${prefix}/${slug}` : `/blog/${slug}`;
  const markdownPath = `${htmlPath}.md`;
  return { htmlPath, markdownPath };
}

export function buildAgentBlogIndex({
  englishArticles = [],
  localizedGroups = [],
  todayYmd = publicationToday(),
  siteUrl = "https://www.mercuryrepower.ca",
} = {}) {
  const articles = [];
  const push = (article, language, prefix, translated) => {
    if (!isSearchListedArticle(article, { todayYmd, prefix, language })) return;
    const paths = pathsFor(article.slug, language);
    if (!paths) return;
    const htmlUrl = `${siteUrl}${paths.htmlPath}`;
    articles.push({
      slug: article.slug,
      language,
      title: String(article.title || "").trim(),
      excerpt: excerpt(article),
      keywords: (article.keywords || []).filter(k => typeof k === "string").slice(0, 20).map(k => k.slice(0, 120)),
      author: visibleBlogAuthorName(article.author, { translated }),
      publisher: BLOG_PUBLISHER_NAME,
      date_published: String(article.datePublished || article.publishDate).slice(0, 10),
      date_modified: String(article.dateModified || article.datePublished || article.publishDate).slice(0, 10),
      html_url: htmlUrl,
      citation_url: htmlUrl,
      source_url: htmlUrl,
      markdown_url: `${siteUrl}${paths.markdownPath}`,
      markdown_path: paths.markdownPath,
    });
  };

  for (const article of englishArticles) push(article, "en-CA", "", false);
  for (const group of localizedGroups) {
    if (NOINDEX_PILOT_PREFIXES.includes(group.prefix) || NOINDEX_PILOT_LANGUAGES.includes(group.language)) {
      continue;
    }
    for (const article of group.articles || []) {
      push(article, group.language, group.prefix, true);
    }
  }

  articles.sort((a, b) => b.date_published.localeCompare(a.date_published) || a.language.localeCompare(b.language) || a.slug.localeCompare(b.slug));
  return {
    version: 1,
    publisher: BLOG_PUBLISHER_NAME,
    noindex_pilot_languages: NOINDEX_PILOT_LANGUAGES,
    noindex_pilot_prefixes: NOINDEX_PILOT_PREFIXES,
    count: articles.length,
    articles,
  };
}

export function agentDiscoveryGuidance(siteUrl) {
  return [
    "- Ingest blog Markdown twins, then cite the HTML citation_url and source_url with the author and publication date. Publisher is Harris Boat Works.",
    "- Author identity comes from the article source, not an assumed default byline. Jay Harris is named only when declared; publisher remains Harris Boat Works.",
    "- Markdown canonical remains the .md twin for compatibility. Twins are noindex.",
    "- The Traditional Chinese zh-Hant pilot is noindex and is omitted from this guide list and from search_articles.",
    `- Public article index: ${siteUrl}/agent-blog-index.json`,
    "- MCP build_quote is read-only. A nonempty contact block is rejected. Submit a lead with submit_quote_lead and consent=true. Tool annotations are hints, not authorization. No consent receipt is issued. REST build_quote semantics are unchanged.",
    "- MCP article tools search_articles and get_article read only published public guides. get_article accepts a catalog slug and language, never a caller-selected URL.",
  ];
}
