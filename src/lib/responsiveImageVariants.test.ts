import { describe, expect, it, vi } from 'vitest';

vi.mock('@/data/imageVariantsManifest.json', () => ({
  default: {
    bases: [
      '/lovable-uploads/pontoon-family-rice-lake-hero',
      '/lovable-uploads/small-official-studio-image',
      '/images/shop/mercury-115-serial-model-label-transom',
    ],
    widths: {
      '/lovable-uploads/pontoon-family-rice-lake-hero': [640, 1024, 1376],
      '/lovable-uploads/small-official-studio-image': [514, 514, 514],
      '/images/shop/mercury-115-serial-model-label-transom': [640, 1024, 1600],
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

  it('deduplicates equal real widths instead of emitting repeated descriptors', () => {
    expect(
      getResponsiveWebpSrcSet('/lovable-uploads/small-official-studio-image.png'),
    ).toBe('/lovable-uploads/small-official-studio-image.webp 514w');
  });

  it('emits shop WebP variants when the article already references the .webp master', () => {
    const srcSet = getResponsiveWebpSrcSet(
      '/images/shop/mercury-115-serial-model-label-transom.webp',
    );

    expect(srcSet).toBe(
      '/images/shop/mercury-115-serial-model-label-transom-640.webp 640w, /images/shop/mercury-115-serial-model-label-transom-1024.webp 1024w, /images/shop/mercury-115-serial-model-label-transom.webp 1600w',
    );
  });

  it('does not treat a committed shop -640 file as its own master', () => {
    expect(
      getResponsiveWebpSrcSet(
        '/images/shop/mercury-115-serial-model-label-transom-640.webp',
      ),
    ).toBeNull();
  });
});
