// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readFileSync } from 'node:fs';

import { REVIEW_150_SLUG } from '@/lib/review150Article';

const OTHER_SLUG = 'mercury-115-hp-fourstroke-review-ontario';

const sharedContent = `
## FourStroke vs Pro XS: The Differences That Matter

![Current Mercury 150 FourStroke and 150 Pro XS shown side by side in official studio photography.](/lovable-uploads/inline/mercury-150-fourstroke-vs-pro-xs-official.webp)

| Feature | 150 FourStroke | 150 Pro XS | What it means on the boat |
|---|---|---|---|
| Rated power | 150 HP | 150 HP | Same advertised horsepower |

### Choose the standard 150 FourStroke when

- the boat is a family bowrider

| Boat and test load | Motor and propeller | Reported result | Useful cruise point |
|---|---|---|---|
| [2019 Nitro Z18](https://boattest.com/boats/nitro/z18-w-mercury-150-hp-pro-xs-2019) | 150 Pro XS | 60.2 mph | 25.7 mph |
`;

function article(slug: string) {
  return {
    slug,
    title: slug === REVIEW_150_SLUG ? 'Mercury 150 HP Review' : 'Mercury 115 HP Review',
    seoTitle: 'Test review',
    description: 'Fixture review for mobile affordance isolation.',
    image: '/lovable-uploads/blog-heroes-2026-07/batch-c/hero-mercury-150-fourstroke-pro-xs-review-2026-07.webp',
    imageAlt: 'Hero',
    author: 'Harris Boat Works',
    datePublished: '2026-07-26',
    dateModified: '2026-09-11',
    publishDate: '2026-07-26',
    category: 'Mercury Buying Guides',
    readTime: '5 min read',
    keywords: ['test'],
    content: sharedContent,
  };
}

vi.mock('@/data/blogArticles', async () => {
  const actual = await vi.importActual<typeof import('@/data/blogArticles')>('@/data/blogArticles');
  return {
    ...actual,
    getArticleBySlug: (slug: string) => {
      if (slug === REVIEW_150_SLUG || slug === OTHER_SLUG) return article(slug);
      return undefined;
    },
    getRelatedArticles: () => [],
  };
});

vi.mock('@/data/blogTopicHubs', async () => {
  const actual = await vi.importActual<typeof import('@/data/blogTopicHubs')>('@/data/blogTopicHubs');
  return {
    ...actual,
    getMoreInHub: () => undefined,
  };
});

vi.mock('@/lib/helmet', () => ({
  Helmet: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/seo/BlogSEO', () => ({
  BlogSEO: () => null,
}));

vi.mock('@/components/repower/RepowerHeader', () => ({
  RepowerHeader: () => <header />,
}));

vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer />,
}));

vi.mock('@/components/blog/BlogShareButtons', () => ({
  BlogShareButtons: () => null,
}));

vi.mock('@/components/blog/BlogCTA', () => ({
  BlogCTA: () => null,
}));

vi.mock('@/components/blog/BlogHeroPicture', () => ({
  BlogHeroPicture: () => <div />,
}));

vi.mock('@/components/blog/LanguageSwitcher', () => ({
  LanguageSwitcher: () => null,
}));

vi.mock('@/components/blog/DealerConfidenceStrip', () => ({
  DealerConfidenceStrip: () => null,
}));

vi.mock('@/hooks/useOverheatInteractions', () => ({
  useOverheatInteractions: () => ({ current: null }),
}));

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

import BlogArticle from './BlogArticle';

function mockTableOverflow(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
    return this.classList.contains('blog-table-scroll') ? scrollWidth : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
    return this.classList.contains('blog-table-scroll') ? clientWidth : 0;
  });
}

function renderArticle(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogArticle />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BlogArticle review 150 mobile affordances', () => {
  beforeEach(() => {
    mockTableOverflow(640, 332);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('gates the 150 review affordances in BlogArticle source and leaves other article pages unchanged', () => {
    const page = readFileSync('src/pages/BlogArticle.tsx', 'utf8');
    const toc = readFileSync('src/components/blog/TableOfContents.tsx', 'utf8');

    expect(page).toContain("import { usesReview150MobileAffordances } from '@/lib/review150Article'");
    expect(page).toContain('const review150Affordances = usesReview150MobileAffordances(article.slug)');
    expect(page).toContain('mobileAffordances={review150Affordances}');
    expect(page).toContain('visibleExpandLabel={review150Affordances}');
    expect(page).toContain('overflowHint={review150Affordances}');
    expect(page).not.toContain('review150_');
    expect(toc).toContain('href={`#${group.h2.id}`}');
    expect(readFileSync('src/pages/blog/FrenchBlogArticlePage.tsx', 'utf8')).not.toContain('mobileAffordances');
    expect(readFileSync('src/pages/blog/SpanishBlogArticlePage.tsx', 'utf8')).not.toContain('overflowHint');
  });

  it('turns on table, image, and contents affordances only on the 150 review route', () => {
    const { unmount } = renderArticle(REVIEW_150_SLUG);

    expect(screen.getByRole('heading', { level: 1, name: 'Mercury 150 HP Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show table of contents' })).toBeInTheDocument();
    expect(screen.getAllByText('Scroll sideways for more columns').length).toBeGreaterThan(0);
    expect(screen.getByText('Expand image')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '2019 Nitro Z18' }),
    ).toHaveAttribute(
      'href',
      'https://boattest.com/boats/nitro/z18-w-mercury-150-hp-pro-xs-2019',
    );
    expect(
      screen.getByRole('link', { name: 'Choose the standard 150 FourStroke when' }).className,
    ).toContain('min-h-11');

    unmount();
    renderArticle(OTHER_SLUG);

    expect(screen.getByRole('heading', { level: 1, name: 'Mercury 115 HP Review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table of Contents' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show table of contents' })).not.toBeInTheDocument();
    expect(screen.queryByText('Scroll sideways for more columns')).not.toBeInTheDocument();
    expect(screen.queryByText('Expand image')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Choose the standard 150 FourStroke when' }).className,
    ).not.toContain('min-h-11');
    expect(
      screen.getByRole('link', { name: '2019 Nitro Z18' }),
    ).toHaveAttribute(
      'href',
      'https://boattest.com/boats/nitro/z18-w-mercury-150-hp-pro-xs-2019',
    );
  });

  it('preserves contents navigation and comparison-image dialog behavior on the 150 route', async () => {
    renderArticle(REVIEW_150_SLUG);

    const toggle = screen.getByRole('button', { name: 'Show table of contents' });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide table of contents' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    const comparisonLink = screen.getByRole('link', {
      name: 'FourStroke vs Pro XS: The Differences That Matter',
    });
    expect(comparisonLink).toHaveAttribute(
      'href',
      '#fourstroke-vs-pro-xs-the-differences-that-matter',
    );
    fireEvent.click(comparisonLink);
    expect(screen.getByRole('button', { name: 'Show table of contents' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    const trigger = screen.getByRole('button', {
      name: 'Expand image: Current Mercury 150 FourStroke and 150 Pro XS shown side by side in official studio photography.',
    });
    fireEvent.click(trigger);
    expect(
      screen.getByRole('dialog', {
        name: 'Expanded image: Current Mercury 150 FourStroke and 150 Pro XS shown side by side in official studio photography.',
      }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    const tableRegion = screen.getAllByRole('region', { name: 'Scrollable table' })[0];
    tableRegion.focus();
    expect(tableRegion).toHaveFocus();
    expect(fireEvent.keyDown(tableRegion, { key: 'ArrowRight' })).toBe(true);
  });
});
