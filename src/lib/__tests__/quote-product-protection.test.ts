import { describe, expect, it } from 'vitest';
import {
  createBaselineWarrantyConfig,
  getPlatinumQuoteOptions,
  reconcileWarrantyConfig,
} from '@/lib/quote-product-protection';

describe('quote Product Protection options', () => {
  it('offers every one- through five-year Platinum term from base coverage', () => {
    expect(getPlatinumQuoteOptions(115, 3)).toEqual([
      { planYears: 1, totalYears: 4, price: 539 },
      { planYears: 2, totalYears: 5, price: 971 },
      { planYears: 3, totalYears: 6, price: 1376 },
      { planYears: 4, totalYears: 7, price: 1748 },
      { planYears: 5, totalYears: 8, price: 2077 },
    ]);
  });

  it('reduces the paid term when promotional coverage is already included', () => {
    expect(getPlatinumQuoteOptions(115, 5)).toEqual([
      { planYears: 1, totalYears: 6, price: 539 },
      { planYears: 2, totalYears: 7, price: 971 },
      { planYears: 3, totalYears: 8, price: 1376 },
    ]);
  });

  it('offers nothing beyond eight years or for an unsupported horsepower', () => {
    expect(getPlatinumQuoteOptions(115, 8)).toEqual([]);
    expect(getPlatinumQuoteOptions(0, 3)).toEqual([]);
  });

  it('preserves the requested total while repricing against promotion years', () => {
    const priorSelection = {
      extendedYears: 5,
      warrantyPrice: 2077,
      totalYears: 8,
    };

    expect(reconcileWarrantyConfig(115, 5, priorSelection)).toEqual({
      extendedYears: 3,
      warrantyPrice: 1376,
      totalYears: 8,
    });
    expect(reconcileWarrantyConfig(115, 8, priorSelection)).toEqual(
      createBaselineWarrantyConfig(8),
    );
  });

  it('fails closed to included coverage when a price is unavailable', () => {
    expect(reconcileWarrantyConfig(0, 3, {
      extendedYears: 5,
      warrantyPrice: 999,
      totalYears: 8,
    })).toEqual(createBaselineWarrantyConfig(3));
  });
});
