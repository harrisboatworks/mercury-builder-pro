import { describe, expect, it } from 'vitest';

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
});
