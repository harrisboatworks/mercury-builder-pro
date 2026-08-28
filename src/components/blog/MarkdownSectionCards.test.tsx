// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownSectionCards } from './MarkdownSectionCards';

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
