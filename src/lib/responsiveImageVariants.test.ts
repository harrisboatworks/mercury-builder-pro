import { describe, expect, it, vi } from 'vitest';

vi.mock('@/data/imageVariantsManifest.json', () => ({
  default: {
    bases: ['/lovable-uploads/pontoon-family-rice-lake-hero'],
    widths: {
      '/lovable-uploads/pontoon-family-rice-lake-hero': [640, 1024, 1376],
    },
  },
}));

import { getResponsiveWebpSrcSet } from './responsiveImageVariants';

describe('getResponsiveWebpSrcSet', () => {
  it('uses the real master width instead of claiming every image is 1920 pixels wide', () => {
    const srcSet = getResponsiveWebpSrcSet(
      '/lovable-uploads/pontoon-family-rice-lake-hero.png',
    );

    expect(srcSet).toContain(
      '/lovable-uploads/pontoon-family-rice-lake-hero-640.webp 640w',
    );
    expect(srcSet).toContain(
      '/lovable-uploads/pontoon-family-rice-lake-hero-1024.webp 1024w',
    );
    expect(srcSet).toContain(
      '/lovable-uploads/pontoon-family-rice-lake-hero.webp 1376w',
    );
    expect(srcSet).not.toContain('1920w');
  });

  it('does not advertise variants that are absent from the manifest', () => {
    expect(
      getResponsiveWebpSrcSet('/lovable-uploads/not-a-real-blog-hero.png'),
    ).toBeNull();
  });
});
