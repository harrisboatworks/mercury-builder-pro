// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { readFileSync } from 'node:fs';
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

vi.mock('@/components/seo/BlogOgImageMeta', () => ({
  BlogOgImageMeta: () => null,
}));

vi.mock('@/components/seo/BlogHreflangLinks', () => ({
  BlogHreflangLinks: () => null,
}));

vi.mock('@/components/blog/BlogHeroPicture', () => ({
  BlogHeroPicture: () => <div />,
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

import SpanishBlogArticlePage from './SpanishBlogArticlePage';

const source = readFileSync('src/pages/blog/SpanishBlogArticlePage.tsx', 'utf8');
const backNavSource = source.split('{/* Back nav */}', 2)[1]?.split('{/* Hero image', 1)[0];

function renderSpanishComparisonArticle() {
  return render(
    <MemoryRouter initialEntries={['/blog/es/mercury-115-vs-150-comparacion']}>
      <Routes>
        <Route path="/blog/es/:slug" element={<SpanishBlogArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Spanish blog back-link contract', () => {
  it('renders one decorative arrow with a plain accessible label', () => {
    renderSpanishComparisonArticle();

    const backLink = screen.getByRole('link', { name: 'Volver al blog' });

    expect(backLink).toHaveAttribute('href', '/blog');
    expect(backLink).toHaveAccessibleName('Volver al blog');
    expect(backLink.textContent ?? '').not.toMatch(/←/);

    const icons = backLink.querySelectorAll('svg');
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');

    expect(backNavSource).toBeDefined();
    expect(backNavSource).toContain('<ArrowLeft className="w-4 h-4" aria-hidden="true" />');
    expect(backNavSource).toMatch(/<ArrowLeft[^>]+\/>\s*Volver al blog/);
    expect(backNavSource).not.toContain('←');
  });
});
