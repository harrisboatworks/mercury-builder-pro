import { describe, expect, it } from 'vitest';
import { blogArticles, isArticlePublished } from '@/data/blogArticles';
import { getMotorRelatedBlogSlugs } from './motor-related-blog-posts';

describe('getMotorRelatedBlogSlugs', () => {
  it('prioritizes current Pro XS and exact-horsepower guidance for a 115 Pro XS', () => {
    const slugs = getMotorRelatedBlogSlugs({
      hp: 115,
      family: 'Pro XS',
      model: '115 ELPT ProXS',
      model_display: '115 ELPT ProXS',
    });

    expect(slugs).toContain('mercury-pro-xs-buyer-guide-ontario');
    expect(slugs).toContain('fourstroke-vs-pro-xs');
    expect(slugs).toContain('mercury-75-vs-90-vs-115-comparison');
    expect(slugs[0]).toBe('mercury-pro-xs-buyer-guide-ontario');
    expect(slugs).not.toContain('best-mercury-outboard-pontoon-boats');
  });

  it('keeps kicker and tiller recommendations away from high-horsepower guides', () => {
    const slugs = getMotorRelatedBlogSlugs({
      hp: 9.9,
      family: 'FourStroke',
      model: '9.9 MH FourStroke',
      model_display: '9.9 MH FourStroke',
    });

    expect(slugs).toContain('mercury-9-9-efi-review-ontario');
    expect(slugs).toContain('tiller-vs-remote-steering-outboard-guide');
    expect(slugs).not.toContain('mercury-150-300hp-pro-xs-performance-guide');
    expect(slugs).not.toContain('mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026');
  });

  it('only returns published, known articles and caps the modal at six guides', () => {
    const slugs = getMotorRelatedBlogSlugs({
      hp: 200,
      family: 'Pro XS',
      model: '200 ELPT ProXS DTS',
    });

    expect(slugs.length).toBeLessThanOrEqual(6);
    for (const slug of slugs) {
      const article = blogArticles.find((candidate) => candidate.slug === slug);
      expect(article, slug).toBeDefined();
      expect(isArticlePublished(article!), slug).toBe(true);
    }
  });
});
