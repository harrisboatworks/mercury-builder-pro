/**
 * Vercel image optimization helper.
 *
 * In production on Vercel, routes `/_vercel/image?url=...&w=...&q=...` through
 * Vercel's image pipeline, which auto-serves AVIF/WebP via Accept-header
 * content negotiation, resizes on the fly, and caches at the edge.
 *
 * In dev (or for non-relative URLs like external CDNs / data URIs), it
 * returns the original URL unchanged so the local dev server still works.
 *
 * Configured globally in vercel.json under "images".
 */

const isProd = typeof window !== 'undefined' && window.location.hostname.endsWith('mercuryrepower.ca')
  // Allow Vercel preview deploys too
  || (typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app'));

export function optimizeImage(src: string | undefined, width = 1280, quality = 75): string {
  if (!src) return '';
  // Skip external URLs, data URIs, and anything that isn't a same-origin path
  if (!src.startsWith('/')) return src;
  // Only optimize on Vercel-hosted production / preview
  if (!isProd) return src;
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** Build a comma-separated srcSet across the configured widths. */
export function buildSrcSet(
  src: string | undefined,
  widths: number[] = [640, 768, 1024, 1280, 1920],
  quality = 75,
): string | undefined {
  if (!src || !src.startsWith('/') || !isProd) return undefined;
  return widths
    .map((w) => `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality} ${w}w`)
    .join(', ');
}
