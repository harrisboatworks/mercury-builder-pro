const FAQ_HEADING_RE =
  /^##\s+(?:(?:Frequently Asked Questions|FAQs?|Common Questions|Aksar puchhe jaande sawaal)\b|(?:Questions fréquentes|Preguntas frecuentes|常见问题|常見問題|자주 묻는 질문|Mga Madalas Itanong|ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ|اکثر پوچھے جانے والے سوالات|अक्सर पूछे जाने वाले सवाल)(?:\s|$|[|(]))/i;
const INTERNAL_LINKS_HEADING_RE = /^##\s+Internal Links\s*$/i;
const RELATED_HEADING_RE =
  /^##\s+(?:Related Guides?|Related Posts?|Related Articles?|Related at HBW)\s*$/i;
const CTA_HEADING_RE = /^##\s+CTA\s*$/i;
const LAST_REVIEWED_RE =
  /^[*_\s]*\**\s*Last\s+(?:updated|reviewed)\b[^\n]*$/i;
const LANGUAGE_RE =
  /^[\t *_-]*Language[\t *_-]*[:：][\t *_-]*English[\t *_-]*$/i;
const BOLD_RELATED_RE =
  /^\s*\*\*\s*Related(?:\s+(?:guides?|posts?|articles?))?\s*:?\s*\*\*\s*$/i;
const ITALIC_RELATED_RE =
  /^\s*\*\s*Related(?:\s+(?:guides?|posts?|articles?))?\s*:[^*]*\*\s*$/i;
const INJECTED_REPOWER_CTA_RE =
  /^(?:Ready to price it out\? Build|You can build) a live CAD quote for your repower online at (?:the )?\[Mercury Repower Centre\]\(https:\/\/www\.mercuryrepower\.ca\/quote\/motor-selection\)\.\s*$/i;
const CANONICAL_URL_LINE_RE =
  /^\s*\*\*Canonical URL:\*\*(?:\s+\S.*)?\s*$/i;

/**
 * Remove legacy authoring scaffolding before blog content reaches readers,
 * crawlers, or Markdown twins. Structured faqs[] and relatedSlugs are the
 * canonical sources for those two terminal sections.
 */
export function cleanBlogContent(
  content,
  {
    hasStructuredFaqs = false,
    stripInlineRelated = true,
    stripInternalLinks = true,
  } = {},
) {
  const lines = String(content || '').split('\n');
  const out = [];
  let skipSection = false;
  let skipRelatedList = false;

  for (const line of lines) {
    const isH2 = /^##\s+/.test(line);

    if (skipSection) {
      if (!isH2) continue;
      skipSection = false;
    }

    if (skipRelatedList) {
      if (/^\s*[-*]\s+/.test(line) || line.trim() === '') continue;
      skipRelatedList = false;
    }

    if (
      LAST_REVIEWED_RE.test(line) ||
      LANGUAGE_RE.test(line) ||
      CANONICAL_URL_LINE_RE.test(line) ||
      INJECTED_REPOWER_CTA_RE.test(line.trim())
    ) continue;

    if (CTA_HEADING_RE.test(line)) continue;

    if (hasStructuredFaqs && FAQ_HEADING_RE.test(line)) {
      skipSection = true;
      continue;
    }

    if (stripInternalLinks && INTERNAL_LINKS_HEADING_RE.test(line)) {
      skipSection = true;
      continue;
    }

    if (stripInlineRelated && RELATED_HEADING_RE.test(line)) {
      skipSection = true;
      continue;
    }

    if (
      stripInlineRelated &&
      (BOLD_RELATED_RE.test(line) || ITALIC_RELATED_RE.test(line))
    ) {
      skipRelatedList = true;
      continue;
    }

    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
