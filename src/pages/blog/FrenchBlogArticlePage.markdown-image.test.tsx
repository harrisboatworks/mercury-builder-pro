// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/helmet', () => ({
  Helmet: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/luxury-header', () => ({
  LuxuryHeader: () => <header />,
}));

vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer />,
}));

vi.mock('@/components/seo/BlogHreflangLinks', () => ({
  BlogHreflangLinks: () => null,
}));

vi.mock('@/components/blog/LanguageSwitcher', () => ({
  LanguageSwitcher: () => null,
}));

vi.mock('@/components/blog/AuthorByline', () => ({
  AuthorByline: () => null,
}));

vi.mock('@/components/blog/CategoryCTA', () => ({
  CategoryCTA: () => null,
  shouldSuppressAutoCTA: () => true,
}));

vi.mock('@/components/blog/TableOfContents', () => ({
  TableOfContents: () => null,
}));

vi.mock('@/data/frenchBlogArticles', () => ({
  getFrenchArticleBySlug: () => ({
    slug: 'test-image-article',
    title: 'Article de test',
    description: 'Description de test',
    content: [
      '![Carte de la zone de service HBW](/lovable-uploads/diagram-hbw-service-area-map.png)',
      '',
      'Texte avec **gras** et [soumission](/quote/motor-selection).',
    ].join('\n'),
    author: 'Harris Boat Works',
    datePublished: '2026-04-12',
    dateModified: '2026-09-06',
    category: 'Test',
    readTime: '5 min',
    keywords: ['test'],
  }),
  getPublishedFrenchArticles: () => [],
}));

import FrenchBlogArticlePage from './FrenchBlogArticlePage';

describe('FrenchBlogArticlePage Markdown images', () => {
  it('renders fixture Markdown images instead of a text-link substitute', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/blog/fr/test-image-article']}>
        <Routes>
          <Route path="/blog/fr/:slug" element={<FrenchBlogArticlePage />} />
        </Routes>
      </MemoryRouter>,
    );

    const image = screen.getByAltText('Carte de la zone de service HBW');
    expect(image).toHaveAttribute(
      'src',
      '/lovable-uploads/diagram-hbw-service-area-map.png',
    );
    expect(
      screen.queryByRole('link', { name: 'Carte de la zone de service HBW' }),
    ).toBeNull();
    expect(
      container.querySelector('a[href="/lovable-uploads/diagram-hbw-service-area-map.png"]'),
    ).toBeNull();
    expect(container.textContent ?? '').not.toContain('![');
    expect(screen.getByRole('link', { name: 'soumission' })).toHaveAttribute(
      'href',
      '/quote/motor-selection',
    );
  });
});
