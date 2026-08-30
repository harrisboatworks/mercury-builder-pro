import { describe, expect, it } from 'vitest';
import { getBlogOgImagePath } from '../blogOgImage.js';

describe('getBlogOgImagePath', () => {
  it.each([
    ['/lovable-uploads/hero.png', '/generated-og/lovable-uploads/hero.png.webp'],
    ['/lovable-uploads/nested/hero.JPG', '/generated-og/lovable-uploads/nested/hero.JPG.webp'],
    ['/lovable-uploads/diagram.svg', '/generated-og/lovable-uploads/diagram.svg.webp'],
    ['/images/hero.webp', '/generated-og/images/hero.webp.webp'],
  ])('maps a local blog image to its generated social card', (source, expected) => {
    expect(getBlogOgImagePath(source)).toBe(expected);
  });

  it('leaves an external image unchanged', () => {
    expect(getBlogOgImagePath('https://cdn.example.com/hero.jpg')).toBe('https://cdn.example.com/hero.jpg');
    expect(getBlogOgImagePath('//cdn.example.com/hero.jpg')).toBe('//cdn.example.com/hero.jpg');
  });

  it('leaves an unsupported local asset unchanged', () => {
    expect(getBlogOgImagePath('/lovable-uploads/hero.gif')).toBe('/lovable-uploads/hero.gif');
  });
});
