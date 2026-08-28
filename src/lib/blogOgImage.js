const LOCAL_BLOG_IMAGE_RE = /^\/(?!\/)(.+\.(?:png|jpe?g|webp|svg))$/i;

/**
 * Return the build-generated social image for a local blog image.
 *
 * Article hero images remain untouched for the page and image sitemap. Social
 * cards use a dedicated 1200x630 WebP generated during prebuild so crawlers do
 * not download multi-megabyte source artwork.
 *
 * @param {string | null | undefined} imagePath
 * @returns {string | null | undefined}
 */
export function getBlogOgImagePath(imagePath) {
  if (!imagePath || /^https?:\/\//i.test(imagePath)) return imagePath;
  const match = imagePath.match(LOCAL_BLOG_IMAGE_RE);
  if (!match) return imagePath;
  return `/generated-og/${match[1]}.webp`;
}
