import { BLOG_SOCIAL_IMAGE_BY_SOURCE } from '../data/blogSocialImageSources.generated.js';

export const BLOG_SOCIAL_IMAGE_WIDTH = 1200;
export const BLOG_SOCIAL_IMAGE_HEIGHT = 630;

export function getBlogSocialImagePath(image) {
  if (!image || typeof image !== 'string') return image;
  return BLOG_SOCIAL_IMAGE_BY_SOURCE[image] || image;
}

export function resolveBlogSocialImage(image, siteUrl) {
  const resolved = getBlogSocialImagePath(image);
  if (!resolved || /^https?:\/\//i.test(resolved) || !siteUrl) return resolved;
  return `${String(siteUrl).replace(/\/$/, '')}/${resolved.replace(/^\//, '')}`;
}
