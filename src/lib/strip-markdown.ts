/**
 * Strip markdown syntax from a string for use in plain-text contexts
 * (meta descriptions, OG tags, JSON-LD schema, page intros).
 */
export function stripMarkdown(input: string): string {
  if (!input) return '';
  let out = String(input);

  // Unescape JS-style escape sequences that leak through when descriptions
  // were authored as JS string literals (\" -> ", \' -> ', \\ -> \, \n -> space).
  out = out.replace(/\\n/g, ' ');
  out = out.replace(/\\"/g, '"');
  out = out.replace(/\\'/g, "'");
  out = out.replace(/\\\\/g, '\\');

  // Remove author footer trailers like "---\nBy Jay Harris..." or "**By Jay Harris**..."
  out = out.replace(/\n?-{3,}\s*\n+\s*\*?\*?By Jay Harris[\s\S]*$/i, '');
  out = out.replace(/\n+\s*\*\*By Jay Harris\*\*[\s\S]*$/i, '');
  out = out.replace(/\n+\s*By Jay Harris[\s\S]*$/i, '');

  // Strip custom directive blocks (e.g. :::image-placeholder ... :::)
  out = out.replace(/^:::[a-zA-Z0-9_-]+[\s\S]*?^:::\s*$/gm, ' ');
  // Strip double-colon directive blocks (e.g. ::decision-card ... ::)
  out = out.replace(/^::[a-zA-Z0-9_-]+[\s\S]*?^::\s*$/gm, ' ');

  // Strip fenced code blocks
  out = out.replace(/```[\s\S]*?```/g, ' ');

  // Horizontal rules
  out = out.replace(/^\s*([-*_])\1{2,}\s*$/gm, ' ');

  // Heading markers at line starts
  out = out.replace(/^#{1,6}\s+/gm, '');

  // Blockquote markers
  out = out.replace(/^\s*>\s?/gm, '');

  // Markdown links [label](url) -> label (drop URL entirely)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string) => label.trim());

  // Images ![alt](url) -> alt
  out = out.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Bold/italic/code
  out = out.replace(/\*\*(.+?)\*\*/g, '$1');
  out = out.replace(/__(.+?)__/g, '$1');
  out = out.replace(/\*(.+?)\*/g, '$1');
  out = out.replace(/`([^`]+)`/g, '$1');

  // Em/en dash -> hyphen
  out = out.replace(/\s*[—–]\s*/g, ' - ');

  // Strip trailing markdown HR fragments (e.g. "... customers. ---")
  out = out.replace(/[\s\u00A0]*-{3,}[\s\u00A0]*$/g, '');

  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  // Belt-and-suspenders: also strip trailing dashes after whitespace collapse
  out = out.replace(/\s*-{3,}\s*$/, '').trim();
  return out;
}

/**
 * Sanitize a string for inclusion in JSON-LD schema or any plain-text SEO
 * field. Same rules as stripMarkdown but always safe to call on schema text.
 */
export function sanitizeForSchema(input: string | undefined | null): string {
  return stripMarkdown(input || '');
}

function truncateAtSentence(text: string, max = 170): string {
  if (text.length <= max) return text;
  const sub = text.slice(0, max + 1);
  const matches = [...sub.matchAll(/[.!?](?:\s|$)/g)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    const end = (last.index ?? 0) + 1;
    // If the nearest sentence end is too short (leaves >=40 chars unused),
    // prefer a word-boundary truncate closer to max for richer descriptions.
    if (end >= Math.floor(max * 0.75) && end <= max) {
      return text.slice(0, end).trim();
    }
  }
  const cut = text.slice(0, max - 3);
  const wb = cut.lastIndexOf(' ');
  const base = wb > 40 ? cut.slice(0, wb) : cut;
  return base.trim().replace(/[,;:.!?-]+$/, '') + '...';
}

interface ArticleLike {
  description: string;
  content: string;
}

/**
 * Returns a clean, plain-text description suitable for excerpt, meta,
 * OG/Twitter, and JSON-LD use. Always <= 170 chars and free of markdown.
 */
export function getCleanDescription(article: ArticleLike): string {
  const raw = article.description || '';
  const stripped = stripMarkdown(raw);
  // Prefer the article's own description (after stripping markdown) whenever it
  // exists. Falling back to body content was hitting italics-only lines like
  // "*Last reviewed: ...*" on cards.
  if (stripped.length >= 40) {
    return stripped.length <= 170 ? stripped : truncateAtSentence(stripped, 170);
  }
  // Derive from the first real paragraph of body content.
  let body = (article.content || '').replace(/^\s*#\s+.+\n+/, '');
  // Pre-strip directive blocks so we don't pick them as the firstPara source.
  body = body.replace(/^:::[a-zA-Z0-9_-]+[\s\S]*?^:::\s*$/gm, '');
  body = body.replace(/^::[a-zA-Z0-9_-]+[\s\S]*?^::\s*$/gm, '');
  const paragraphs = body.split(/\n\s*\n/);
  const firstPara = paragraphs.find((p) => {
    const t = p.trim();
    if (!t) return false;
    if (/^[#>!|`]/.test(t)) return false;
    if (/^[-*+]\s/.test(t)) return false;
    if (/^\d+\.\s/.test(t)) return false;
    // Skip italic-only lines (e.g. "*Last reviewed: 2026-05-07*")
    if (/^\*[^*]+\*\s*$/.test(t)) return false;
    if (/^_[^_]+_\s*$/.test(t)) return false;
    if (/last reviewed/i.test(t) && t.length < 80) return false;
    return true;
  });
  const source = firstPara ? stripMarkdown(firstPara) : stripped;
  return truncateAtSentence(source, 170);
}

/**
 * Convert markdown links [label](url) to real <a href="url">label</a> for
 * noscript HTML fallbacks. Other markdown is stripped to plain text.
 * Output is HTML-safe (input is escaped before link substitution).
 */
export function markdownToNoscriptHtml(input: string | undefined | null): string {
  if (!input) return '';
  let s = String(input);

  // Strip author footer
  s = s.replace(/\n?-{3,}\s*\n+\s*\*?\*?By Jay Harris[\s\S]*$/i, '');
  s = s.replace(/\n+\s*\*\*By Jay Harris\*\*[\s\S]*$/i, '');
  s = s.replace(/\n+\s*By Jay Harris[\s\S]*$/i, '');

  // Strip directive blocks (e.g. :::image-placeholder ... :::)
  s = s.replace(/^:::[a-zA-Z0-9_-]+[\s\S]*?^:::\s*$/gm, ' ');
  // Strip double-colon directive blocks (e.g. ::decision-card ... ::)
  s = s.replace(/^::[a-zA-Z0-9_-]+[\s\S]*?^::\s*$/gm, ' ');

  // Strip code fences and headings/HR/blockquotes
  s = s.replace(/```[\s\S]*?```/g, ' ');
  s = s.replace(/^\s*([-*_])\1{2,}\s*$/gm, ' ');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^\s*>\s?/gm, '');

  // Em/en dash -> hyphen
  s = s.replace(/\s*[—–]\s*/g, ' - ');

  // HTML-escape everything first
  s = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Re-create links from escaped markdown
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safeHref = href.replace(/"/g, '%22');
    return `<a href="${safeHref}">${label}</a>`;
  });

  // Images -> alt text only
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Bold/italic/code -> plain
  s = s.replace(/\*\*(.+?)\*\*/g, '$1');
  s = s.replace(/__(.+?)__/g, '$1');
  s = s.replace(/\*(.+?)\*/g, '$1');
  s = s.replace(/`([^`]+)`/g, '$1');

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Strip trailing markdown HR fragments
  s = s.replace(/\s*-{3,}\s*$/, '').trim();
  return s;
}
