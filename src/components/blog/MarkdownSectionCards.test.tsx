// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownSectionCards } from './MarkdownSectionCards';
import { extractHeaders, slugify } from '@/utils/slugify';

describe('MarkdownSectionCards contents anchors', () => {
  it('preserves targets when section headings are replaced with card labels', () => {
    const content = `## Quick answer
Measure the transom before choosing a shaft.

## Common shaft length mistakes we see every season
Do not guess from the old motor.

## Dealer note
Confirm the exact specification.

## Ontario context
Measure the specific hull.

## What we see at HBW
The ordinary heading remains visible.`;
    const { container } = render(
      <MarkdownSectionCards content={content} markdownComponents={{
        h2: ({ children }) => <h2 id={slugify(String(children))}>{children}</h2>,
      }} />,
    );

    for (const item of extractHeaders(content)) {
      expect(container.querySelectorAll(`[id="${item.id}"]`)).toHaveLength(1);
      expect(document.getElementById(item.id)).toBeInTheDocument();
    }
    expect(screen.getByRole('note', { name: 'Quick answer' })).toHaveAttribute('id', 'quick-answer');
    expect(screen.getByRole('note', { name: 'Common mistakes' })).toHaveAttribute(
      'id', 'common-shaft-length-mistakes-we-see-every-season',
    );
  });
});

describe('MarkdownSectionCards bilingual trust directives', () => {
  it('renders the legacy bilingual-trust-card alias instead of exposing directive source', () => {
    const content = `::bilingual-trust-card
eyebrow: Why HBW / 为什么选 HBW
heading: What HBW brings to GTA Chinese boaters
headingTranslated: HBW 为 GTA 华人船主提供的核心价值
item1En: Family-run since 1947
item1Zh: 1947 年至今, 三代家族经营
item2En: Mercury Premier Dealer
item2Zh: 水星 Premier 认证经销商
ctaEn: Get a real quote
ctaZh: 立即获取实际报价
ctaHref: https://www.mercuryrepower.ca
::`;

    render(<MarkdownSectionCards content={content} markdownComponents={{}} />);

    expect(screen.getByRole('heading', { name: 'What HBW brings to GTA Chinese boaters' })).toBeInTheDocument();
    expect(screen.getByText('1947 年至今, 三代家族经营')).toBeInTheDocument();
    expect(screen.queryByText(/::bilingual-trust-card/)).not.toBeInTheDocument();
  });
});

describe('MarkdownSectionCards Korean tilde ranges', () => {
  it('does not treat leftover Korean HP tildes as strikethrough', () => {
    const content = `| 마력대 | 2.5~300 | 115~300 | 250~600 (V8/V12) |`;

    const { container } = render(
      <MarkdownSectionCards content={content} markdownComponents={{}} />,
    );

    expect(container.querySelector('del')).not.toBeInTheDocument();
    expect(container.textContent).toContain('2.5~300');
    expect(container.textContent).toContain('115~300');
    expect(container.textContent).toContain('250~600');
  });
});

describe('MarkdownSectionCards YouTube directives', () => {
  it('renders the lazy Mercury facade before loading the sanitized iframe on click', () => {
    const title = 'How To Winterize Your Outboard | Winterization Checklist (Mercury Marine)';
    const content = `:::youtube-embed
id: YGuQjF6vuao
title: ${title}
:::`;

    const { container } = render(
      <MarkdownSectionCards content={content} markdownComponents={{}} />,
    );

    const facade = container.querySelector('[data-mercury-video="YGuQjF6vuao"]');
    expect(facade).toBeInTheDocument();
    expect(container.querySelector('iframe')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `Play: ${title}` }));

    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/YGuQjF6vuao?autoplay=1&rel=0',
    );
    expect(iframe).toHaveAttribute('title', title);
    expect(iframe).toHaveAttribute('allowfullscreen');
  });
});
