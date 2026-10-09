/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('quote payment surfaces share the special-financing minimum helper', () => {
  const surfaces = [
    'src/pages/quote/QuoteSummaryPage.tsx',
    'src/components/quote/GlobalStickyQuoteBar.tsx',
    'src/components/quote-builder/MobileQuoteDrawer.tsx',
    'src/components/quote-builder/PackageCards.tsx',
    'src/pages/quote/PackageSelectionPage.tsx',
    'src/components/motors/FinanceCalculatorDrawer.tsx',
  ];

  it.each(surfaces)('uses resolveSelectedPromotionFinancing in %s', (path) => {
    const source = read(path);
    expect(source).toContain('resolveSelectedPromotionFinancing');
  });
});
