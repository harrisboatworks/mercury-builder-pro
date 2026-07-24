import { describe, expect, it } from 'vitest';
import { BLOG_SOCIAL_IMAGE_BY_SOURCE } from '@/data/blogSocialImageSources.generated.js';
import { getBlogSocialImagePath, resolveBlogSocialImage } from '@/lib/blog-social-image';

describe('blog social image resolver', () => {
  it('resolves a generated social image from the shared map', () => {
    const [source, output] = Object.entries(BLOG_SOCIAL_IMAGE_BY_SOURCE)[0];
    expect(source).toBeTruthy();
    expect(getBlogSocialImagePath(source)).toBe(output);
    expect(resolveBlogSocialImage(source, 'https://www.mercuryrepower.ca')).toBe(
      `https://www.mercuryrepower.ca${output}`,
    );
  });

  it('falls back without rewriting unregistered or external images', () => {
    expect(getBlogSocialImagePath('/images/not-in-the-generated-map.png')).toBe(
      '/images/not-in-the-generated-map.png',
    );
    expect(resolveBlogSocialImage('https://example.com/hero.jpg', 'https://www.mercuryrepower.ca')).toBe(
      'https://example.com/hero.jpg',
    );
  });
});
