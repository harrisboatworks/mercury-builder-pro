/**
 * Strip markdown syntax from a string for use in plain-text contexts
 * (meta descriptions, OG tags, JSON-LD schema, page intros).
 */
export function stripMarkdown(input: string): string {
  if (!input) return '';
  let out = input;

  // Heading markers at line starts
  out = out.replace(/^#{1,6}\s+/gm, '');

  // Markdown links [label](url) -> label (drop URL entirely)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string) => label.trim());

  // Images ![alt](url) -> alt
  out = out.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Bold/italic/code
  out = out.replace(/\*\*(.+?)\*\*/g, '$1');
  out = out.replace(/__(.+?)__/g, '$1');
  out = out.replace(/\*(.+?)\*/g, '$1');
  out = out.replace(/`([^`]+)`/g, '$1');

  // Collapse whitespace
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

function truncateAtSentence(text: string, max = 170): string {
  if (text.length <= max) return text;
  const sub = text.slice(0, max + 1);
  // find last sentence terminator within range
  const matches = [...sub.matchAll(/[.!?](?:\s|$)/g)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    const end = (last.index ?? 0) + 1;
    return text.slice(0, end).trim();
  }
  // single long sentence: cut at word boundary
  const cut = text.slice(0, max);
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
 * OG/Twitter, and JSON-LD use. If the existing description is clean
 * (no markdown, <=170 chars), it's returned as-is. Otherwise derives
 * from the first body paragraph.
 */
export function getCleanDescription(article: ArticleLike): string {
  const raw = article.description || '';
  const hasMarkdown = /\[[^\]]+\]\([^)]+\)|\*\*|__|`|^#/m.test(raw);
  const stripped = stripMarkdown(raw);
  if (!hasMarkdown && stripped.length <= 170) {
    return stripped.replace(/\s*[—–]\s*/g, ' - ');
  }
  // Derive from the first real paragraph of body content.
  const body = (article.content || '').replace(/^\s*#\s+.+\n+/, '');
  const paragraphs = body.split(/\n\s*\n/);
  const firstPara = paragraphs.find((p) => {
    const t = p.trim();
    if (!t) return false;
    if (/^[#>!|`]/.test(t)) return false;
    if (/^[-*+]\s/.test(t)) return false;
    if (/^\d+\.\s/.test(t)) return false;
    return true;
  });
  const source = firstPara ? stripMarkdown(firstPara) : stripped;
  const truncated = truncateAtSentence(source, 170);
  return truncated.replace(/\s*[—–]\s*/g, ' - ');
}
