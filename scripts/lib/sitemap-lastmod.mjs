/**
 * Return the YYYY-MM-DD portion of a page-specific source timestamp.
 * Missing timestamps stay missing: build time is not page modification time.
 */
export function normalizeAuthoritativeDate(value) {
  if (!value) return undefined;
  return String(value).split('T')[0] || undefined;
}

/** Render an optional sitemap lastmod element at the requested indentation. */
export function renderSitemapLastmod(value, indent = '    ') {
  const normalized = normalizeAuthoritativeDate(value);
  return normalized ? `\n${indent}<lastmod>${normalized}</lastmod>` : '';
}
