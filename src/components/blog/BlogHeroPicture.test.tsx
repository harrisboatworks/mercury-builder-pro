import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BlogHeroPicture } from './BlogHeroPicture';

vi.mock('@/lib/optimizeImage', () => ({
  optimizeImage: (src: string) => `/_vercel/image?url=${encodeURIComponent(src)}`,
  buildSrcSet: (src: string) => `/_vercel/image?url=${encodeURIComponent(src)} 1280w`,
}));

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
});
