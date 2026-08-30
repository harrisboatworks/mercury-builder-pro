// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { MarkdownSectionCards } from '@/components/blog/MarkdownSectionCards';
import { MandarinMarkdownLink } from '@/components/blog/MandarinMarkdownLink';

afterEach(cleanup);

function renderLink(href: string, label: string) {
  return render(
    <MemoryRouter>
      <MandarinMarkdownLink href={href}>{label}</MandarinMarkdownLink>
    </MemoryRouter>,
  );
}

describe('MandarinMarkdownLink', () => {
  it('keeps harrisboatworks rate-sheet links as exact external anchors', () => {
    renderLink(
      'https://www.harrisboatworks.ca/winter-storage',
      'HBW 当前 2026–27 冬储价格表',
    );

    const link = screen.getByRole('link', { name: 'HBW 当前 2026–27 冬储价格表' });
    expect(link).toHaveAttribute('href', 'https://www.harrisboatworks.ca/winter-storage');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('treats same-site absolute URLs as in-app router links', () => {
    renderLink(
      'https://www.mercuryrepower.ca/pricing-reference',
      'Mercury 加元定价参考',
    );

    const link = screen.getByRole('link', { name: 'Mercury 加元定价参考' });
    expect(link).toHaveAttribute('href', '/pricing-reference');
    expect(link).not.toHaveAttribute('target');
  });

  it('does not make unsafe Markdown URLs clickable', () => {
    renderLink("javascript:alert('xss')", '不安全链接');

    expect(screen.queryByRole('link', { name: '不安全链接' })).toBeNull();
    expect(screen.getByText('不安全链接')).toBeInTheDocument();
  });

  it('preserves the winter-storage rate card href in article-body markdown', () => {
    render(
      <MemoryRouter>
        <MarkdownSectionCards
          content="请查看 [HBW 当前 2026–27 冬储价格表](https://www.harrisboatworks.ca/winter-storage)。"
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

    expect(
      screen.getByRole('link', { name: 'HBW 当前 2026–27 冬储价格表' }),
    ).toHaveAttribute('href', 'https://www.harrisboatworks.ca/winter-storage');
  });
});
