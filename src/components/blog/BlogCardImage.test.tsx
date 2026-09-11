import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BlogCardImage } from './BlogCardImage';

vi.mock('@/lib/optimizeImage', async () => {
  const actual = await vi.importActual<typeof import('@/lib/optimizeImage')>(
    '@/lib/optimizeImage',
  );
  return {
    ...actual,
    optimizeImage: (src: string) => `/_vercel/image?url=${encodeURIComponent(src)}`,
    buildSrcSet: (src: string) => `/_vercel/image?url=${encodeURIComponent(src)} 640w`,
  };
});

describe('BlogCardImage', () => {
  it('keeps the full SVG in the thumbnail wrapper and skips the raster optimizer', () => {
    render(
      <div className="aspect-[16/9] overflow-hidden">
        <BlogCardImage
          src="/lovable-uploads/inline/how-to-choose-horsepower.svg"
          alt="Mercury HP table"
          className="w-full h-full object-cover group-hover:scale-105"
        />
      </div>,
    );

    const image = screen.getByAltText('Mercury HP table');
    expect(image).toHaveAttribute(
      'src',
      '/lovable-uploads/inline/how-to-choose-horsepower.svg',
    );
    expect(image).not.toHaveAttribute('srcset');
    expect(image.className).toMatch(/\bobject-contain\b/);
    expect(image.className).not.toMatch(/\bobject-cover\b/);
    expect(image.getAttribute('src')).not.toContain('/_vercel/image');
    expect(image.closest('picture')).toBeNull();
  });

  it('still optimizes raster card images', () => {
    const src = '/lovable-uploads/blog-card.webp';
    render(<BlogCardImage src={src} alt="Pontoon on Rice Lake" />);

    const image = screen.getByAltText('Pontoon on Rice Lake');
    expect(image).toHaveAttribute(
      'src',
      `/_vercel/image?url=${encodeURIComponent(src)}`,
    );
    expect(image).toHaveAttribute(
      'srcSet',
      `/_vercel/image?url=${encodeURIComponent(src)} 640w`,
    );
  });
});
