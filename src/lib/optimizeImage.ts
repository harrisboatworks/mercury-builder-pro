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

const FORCED_CROP_CLASS_RE =
  /^(?:(?:sm|md|lg|xl|2xl|hover|group-hover):)*(?:h-|min-h-|max-h-|object-|aspect-)/;

export function isSvgImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  return /\.svg$/i.test(src.split(/[?#]/, 1)[0] ?? '');
}

/** Drop fixed-height / object-fit / aspect classes so SVG diagrams keep their intrinsic ratio. */
export function stripForcedImageCropClasses(className?: string): string {
  return (className ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !FORCED_CROP_CLASS_RE.test(token))
    .join(' ');
}

export function optimizeImage(src: string | undefined, width = 1280, quality = 75): string {
  if (!src) return '';
  // Skip external URLs, data URIs, and anything that isn't a same-origin path
  if (!src.startsWith('/')) return src;
  // Serve SVG vectors directly; layout controls their intrinsic aspect ratio.
  if (isSvgImageSrc(src)) return src;
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
  if (!src || !src.startsWith('/') || !isProd || isSvgImageSrc(src)) return undefined;
  return widths
    .map((w) => `/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality} ${w}w`)
    .join(', ');
}
