// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
import { MandarinMarkdownLink } from '@/components/blog/MandarinMarkdownLink';
import { getTraditionalChineseArticleBySlug } from '@/data/traditionalChineseBlogArticles';
import { cleanBlogContent } from '@/lib/cleanBlogContent.js';
import { substituteLiveRateTokens } from '@/lib/finance';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);
afterAll(() => vi.unstubAllGlobals());

const PAGE_SOURCE = readFileSync(
  'src/pages/blog/TraditionalChineseBlogArticlePage.tsx',
  'utf8',
);

const WINTER_STORAGE_HREF = 'https://www.harrisboatworks.ca/winter-storage';
const WINTER_STORAGE_SLUG = 'ontario-boat-winterization-guide-chinese';

describe('TraditionalChineseBlogArticlePage markdown links', () => {
  it('wires MandarinMarkdownLink for Markdown body anchors', () => {
    expect(PAGE_SOURCE).toContain(
      "import { MandarinMarkdownLink } from '@/components/blog/MandarinMarkdownLink'",
    );
    expect(PAGE_SOURCE).toContain(
      '<MandarinMarkdownLink href={href} className="text-primary hover:underline">',
    );
    expect(PAGE_SOURCE).not.toContain("href.includes('harrisboatworks')");
  });

  it('preserves the winter-storage rate card as an exact external href', () => {
    const article = getTraditionalChineseArticleBySlug(WINTER_STORAGE_SLUG);
    expect(article).toBeDefined();
    expect(article!.content).toContain(`[現行冬儲價目](${WINTER_STORAGE_HREF})`);

    const cleanedContent = substituteLiveRateTokens(
      cleanBlogContent(article!.content, {
        hasStructuredFaqs: Boolean(article!.faqs?.length),
      }),
    );

    render(
      <MemoryRouter>
        <MarkdownSectionCards
          articleSlug={article!.slug}
          content={cleanedContent.replace(/^\s*#\s+.+\n+/, '')}
          markdownComponents={{
            a: ({ href, children }) => (
              <MandarinMarkdownLink href={href} className="text-primary hover:underline">
                {children}
              </MandarinMarkdownLink>
            ),
          }}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: '現行冬儲價目' });
    expect(link).toHaveAttribute('href', WINTER_STORAGE_HREF);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
