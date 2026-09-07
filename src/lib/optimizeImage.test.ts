import { describe, expect, it } from 'vitest';

import {
  buildSrcSet,
  isSvgImageSrc,
  optimizeImage,
  stripForcedImageCropClasses,
} from './optimizeImage';

describe('optimizeImage SVG handling', () => {
  it('detects SVG paths with query or hash suffixes', () => {
    expect(isSvgImageSrc('/lovable-uploads/weight.svg')).toBe(true);
    expect(isSvgImageSrc('/lovable-uploads/weight.SVG?v=2')).toBe(true);
    expect(isSvgImageSrc('/lovable-uploads/hero.webp')).toBe(false);
  });

  it('strips locale crop classes so intrinsic SVG sizing can win', () => {
    expect(
      stripForcedImageCropClasses('w-full h-64 md:h-80 object-cover aspect-[16/9]'),
    ).toBe('w-full');
  });

  it('never routes SVGs through the raster optimizer helpers', () => {
    const svg = '/lovable-uploads/diagram-no-start.svg';
    expect(optimizeImage(svg, 1280)).toBe(svg);
    expect(buildSrcSet(svg)).toBeUndefined();
  });
});
