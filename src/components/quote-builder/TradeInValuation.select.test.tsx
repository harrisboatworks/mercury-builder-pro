import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('TradeInValuation brand select', () => {
  it('keeps brand options off the popper ResizeObserver positioning path', () => {
    const source = readFileSync(
      'src/components/quote-builder/TradeInValuation.tsx',
      'utf8',
    );
    const brandField = source.match(
      /\{\/\* Required fields: Brand, Year, HP, Engine Type \*\/\}([\s\S]*?)htmlFor="trade-year"/,
    )?.[1];

    expect(brandField).toBeDefined();
    expect(brandField).toContain('<SelectContent position="item-aligned">');
    expect(brandField).toContain('brandOptions.map');
  });
});
