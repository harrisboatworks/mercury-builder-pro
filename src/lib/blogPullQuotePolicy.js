export const SUPPRESSED_BLOG_PULL_QUOTE_SLUGS = Object.freeze([
  'breaking-in-new-mercury-motor-guide',
  'complete-guide-boat-repower-kawarthas',
  'evinrude-to-mercury-repower-ontario-guide',
  'harris-boat-works-since-1947-rice-lake-institution',
  'mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026',
  'mercury-9-9-efi-review-ontario',
  'outboard-trade-in-value-ontario-hbw',
]);

const SUPPRESSED_SLUG_SET = new Set(SUPPRESSED_BLOG_PULL_QUOTE_SLUGS);

export function isBlogPullQuoteSuppressed(slug) {
  const bareSlug = String(slug || '').split('/').pop();
  return SUPPRESSED_SLUG_SET.has(bareSlug);
}

export function stripSuppressedBlogPullQuotes(content, slug) {
  const source = String(content || '');
  if (!source || !isBlogPullQuoteSuppressed(slug)) return source;

  const lines = source.split('\n');
  const output = [];
  let fence = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMarker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      output.push(line);
      if (
        fenceMarker
        && fenceMarker[1][0] === fence.char
        && fenceMarker[1].length >= fence.length
        && /^\s{0,3}(?:`+|~+)\s*$/.test(line)
      ) {
        fence = null;
      }
      continue;
    }
    if (fenceMarker) {
      fence = { char: fenceMarker[1][0], length: fenceMarker[1].length };
      output.push(line);
      continue;
    }

    const opening = line.match(/^\s*(:{2,3})pull-quote\s*$/i);
    if (!opening) {
      output.push(line);
      continue;
    }

    const closing = opening[1];
    while (index + 1 < lines.length) {
      index += 1;
      if (lines[index].trim() === closing) break;
    }
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n');
}
