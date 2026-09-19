import { describe, expect, it } from 'vitest';

import imageVariantsManifest from '@/data/imageVariantsManifest.json';
import { getResponsiveWebpSrcSet } from './responsiveImageVariants';

describe('shop hero variants against the generated manifest', () => {
  it('selects the committed /images/shop -640 and -1024 files for a .webp master', () => {
    const srcSet = getResponsiveWebpSrcSet(
      '/images/shop/hbw-parts-counter-gores-landing.webp',
    );

    expect(srcSet).toContain('/images/shop/hbw-parts-counter-gores-landing-640.webp 640w');
    expect(srcSet).toContain('/images/shop/hbw-parts-counter-gores-landing-1024.webp 1024w');
    expect(srcSet).toContain('/images/shop/hbw-parts-counter-gores-landing.webp');
  });

  it('keeps unique lovable-uploads bases after adding shop triples', () => {
    const bases = imageVariantsManifest.bases ?? [];
    expect(new Set(bases).size).toBe(bases.length);
    expect(imageVariantsManifest.count).toBe(bases.length);
    expect(bases.filter((base) => base.startsWith('/images/shop/'))).toHaveLength(10);
    expect(
      bases.filter((base) => base === '/lovable-uploads/hero-best-marina-rice-lake-ontario'),
    ).toHaveLength(1);
  });
});
