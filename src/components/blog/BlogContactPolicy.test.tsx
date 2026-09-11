// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { BlogCTA } from './BlogCTA';
import { CategoryCTA } from './CategoryCTA';
import { MarkdownSectionCards } from './MarkdownSectionCards';
import { getArticleBySlug } from '@/data/blogArticles';

afterEach(cleanup);

describe('blog contact boundaries', () => {
  it.each(['Service', 'Buying Guide', 'Lifestyle', undefined])(
    'offers self-service next steps without an automatic call button for %s',
    (category) => {
      const { container } = render(<MemoryRouter><CategoryCTA category={category} /></MemoryRouter>);
      expect(container.querySelector('a[href^="tel:"]')).toBeNull();
      expect(container.querySelector('a[href]')).not.toBeNull();
    },
  );

  it('does not append a phone invitation to editorial next-step guidance', () => {
    const { container } = render(<MarkdownSectionCards
      content={'## When to call HBW\n\nUse the quote builder to compare prices.'}
      markdownComponents={{}}
    />);
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(screen.getByText('Use the quote builder to compare prices.')).toBeInTheDocument();
  });

  it('preserves explicitly authored rental-customer support phone links', () => {
    const { container } = render(<MarkdownSectionCards
      content={'## Rental customer support\n\n[Call HBW for help with your rental](tel:+19053422153).'}
      markdownComponents={{}}
    />);
    expect(container.querySelector('a[href="tel:+19053422153"]')).not.toBeNull();
    expect(getArticleBySlug('first-time-boat-rental-rice-lake-guide')?.content)
      .toContain('call us and stay put');
  });

  it('keeps Product Protection sales and qualified local service paths', () => {
    render(<MemoryRouter>
      <BlogCTA slug="mercury-extended-warranty-platinum-ontario" />
      <BlogCTA slug="mercury-outboard-overheating-at-idle-fix-ontario" category="Diagnostics" />
    </MemoryRouter>);
    expect(screen.getByRole('link', { name: 'View Product Protection' }))
      .toHaveAttribute('href', '/mercury-product-protection');
    expect(screen.getByRole('link', { name: 'Request Service in Gores Landing' }))
      .toHaveAttribute('href', 'https://hbw.wiki/service');
    expect(getArticleBySlug('mercury-extended-warranty-platinum-ontario')?.content)
      .toContain('then contact HBW for confirmation');
  });
});

describe('article and FAQ advice invitations', () => {
  it.each([
    ['mercury-command-thrust-complete-guide-2026', /email.*(?:fit check|fit assessment|one reply)|send us details/i],
    ['mercury-dts-retrofit-eligibility-2026', /email.*(?:eligibility check|for confirmation)/i],
    ['mercury-75-vs-90-vs-115-comparison', /call us and we.ll size|give us a call/i],
    ['outboard-shaft-length-guide', /send.*photo.*confirm|measure with you on the phone|call us.*look it up/i],
    ['how-to-read-mercury-outboard-serial-number', /send us.*(?:serial|model)|ask HBW to confirm the exact engine/i],
    ['mercury-40-vs-60-hp-outboard-ontario', /five minutes of conversation|have a specific boat situation/i],
  ] as const)('does not offer remote personal advice in %s', (slug, unwanted) => {
    const article = getArticleBySlug(slug)!;
    expect(article).toBeDefined();
    const text = [article.content, ...(article.faqs || []).map(faq => faq.answer)].join('\n');
    expect(text).not.toMatch(unwanted);
  });
});
