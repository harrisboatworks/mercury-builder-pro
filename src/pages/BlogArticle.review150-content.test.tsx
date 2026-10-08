// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { BlogTable } from '@/components/blog/BlogTable';
import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
import { ExpandableImage } from '@/components/ui/expandable-image';
import { getArticleBySlug } from '@/data/blogArticles';
import { cleanBlogContent } from '@/lib/cleanBlogContent.js';
import { REVIEW_150_SLUG } from '@/lib/review150Article';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('150 review published content affordances', () => {
  it('keeps published-test links and the comparison image while showing opted-in chrome', async () => {
    const article = getArticleBySlug(REVIEW_150_SLUG);
    expect(article).toBeDefined();

    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
      return this.classList.contains('blog-table-scroll') ? 640 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
      return this.classList.contains('blog-table-scroll') ? 332 : 0;
    });

    const cleaned = cleanBlogContent(article!.content, {
      hasStructuredFaqs: Boolean(article!.faqs?.length),
    });

    render(
      <MemoryRouter>
        <MarkdownSectionCards
          articleSlug={article!.slug}
          content={cleaned}
          markdownComponents={{
            img: ({ src, alt, title }) => (
              <ExpandableImage
                src={src || ''}
                alt={alt || ''}
                caption={title}
                visibleExpandLabel
              />
            ),
            table: ({ children }) => <BlogTable overflowHint>{children}</BlogTable>,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Scroll sideways for more columns')).toHaveLength(2);
    expect(
      screen.getByRole('link', {
        name: /2020 Barletta C22QC pontoon/,
      }),
    ).toHaveAttribute('href', 'https://performancedata.mercurymarine.com/performance-test/19');
    expect(
      screen.getByRole('link', {
        name: /2023 Crestliner 1850 Fish Hawk/,
      }),
    ).toHaveAttribute('href', 'https://performancedata.mercurymarine.com/performance-test/141');
    expect(
      screen.getByRole('link', {
        name: /2019 Nitro Z18/,
      }),
    ).toHaveAttribute(
      'href',
      'https://boattest.com/boats/nitro/z18-w-mercury-150-hp-pro-xs-2019',
    );

    const trigger = screen.getByRole('button', {
      name: 'Expand image: Current Mercury 150 FourStroke and 150 Pro XS shown side by side in official studio photography.',
    });
    expect(screen.getByText('Expand image')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(
      screen.getByRole('dialog', {
        name: 'Expanded image: Current Mercury 150 FourStroke and 150 Pro XS shown side by side in official studio photography.',
      }),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
