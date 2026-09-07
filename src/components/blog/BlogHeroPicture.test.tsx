import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlogHeroPicture } from './BlogHeroPicture';

vi.mock('@/lib/optimizeImage', async () => {
  const actual = await vi.importActual<typeof import('@/lib/optimizeImage')>(
    '@/lib/optimizeImage',
  );
  return {
    ...actual,
    optimizeImage: (src: string) => `/_vercel/image?url=${encodeURIComponent(src)}`,
    buildSrcSet: (src: string) => `/_vercel/image?url=${encodeURIComponent(src)} 1280w`,
  };
});

afterEach(cleanup);

describe('BlogHeroPicture', () => {
  it('tries the original image before showing the branded fallback', () => {
    const image = '/lovable-uploads/blog-hero.webp';

    render(<BlogHeroPicture image={image} alt="Mercury outboard on fresh water" />);

    const optimizedImage = screen.getByAltText('Mercury outboard on fresh water');
    expect(optimizedImage).toHaveAttribute(
      'src',
      `/_vercel/image?url=${encodeURIComponent(image)}`,
    );

    fireEvent.error(optimizedImage);

    const originalImage = screen.getByAltText('Mercury outboard on fresh water');
    expect(originalImage).toHaveAttribute('src', image);
    expect(screen.queryByText('Harris Boat Works')).not.toBeInTheDocument();

    fireEvent.error(originalImage);

    expect(screen.getByText('Harris Boat Works')).toBeInTheDocument();
  });

  it('keeps SVG intrinsic aspect when locale classes try to crop the hero', () => {
    render(
      <BlogHeroPicture
        image="/lovable-uploads/diagram-mercury-weight.svg"
        alt="French weight diagram"
        className="w-full h-64 md:h-80 object-cover"
        wrapperClassName="mb-8 rounded-xl overflow-hidden aspect-[16/9]"
      />,
    );

    const image = screen.getByAltText('French weight diagram');
    expect(image).toHaveAttribute('src', '/lovable-uploads/diagram-mercury-weight.svg');
    expect(image).not.toHaveAttribute('srcset');
    expect(image).not.toHaveAttribute('sizes');
    expect(image.className).toMatch(/\bh-auto\b/);
    expect(image.className).not.toMatch(/\bh-64\b/);
    expect(image.className).not.toMatch(/\bmd:h-80\b/);
    expect(image.className).not.toMatch(/\bobject-cover\b/);
    expect(image.getAttribute('src')).not.toContain('/_vercel/image');
    expect(image.parentElement?.querySelector('source')).toBeNull();
    expect(image.closest('div')?.className ?? '').not.toMatch(/aspect-\[16\/9\]/);
  });

  it('preserves raster optimizer srcset and crop classes', () => {
    const image = '/lovable-uploads/blog-hero.webp';

    render(
      <BlogHeroPicture
        image={image}
        alt="Raster blog hero"
        className="w-full h-64 md:h-80 object-cover"
      />,
    );

    const raster = screen.getByAltText('Raster blog hero');
    expect(raster).toHaveAttribute(
      'src',
      `/_vercel/image?url=${encodeURIComponent(image)}`,
    );
    expect(raster).toHaveAttribute(
      'srcSet',
      `/_vercel/image?url=${encodeURIComponent(image)} 1280w`,
    );
    expect(raster.className).toMatch(/\bh-64\b/);
    expect(raster.className).toMatch(/\bobject-cover\b/);
  });
});
