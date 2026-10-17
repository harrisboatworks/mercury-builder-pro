import { describe, expect, it } from 'vitest';
import { getProductProtectionPackagePrices } from '@/lib/product-protection-packages';

describe('Product Protection package pricing safety', () => {
  it('prices the exact paid term after verified included coverage', () => {
    expect(getProductProtectionPackagePrices(115, 3, true)).toEqual({
      complete: 1748,
      premium: 2077,
    });
    expect(getProductProtectionPackagePrices(115, 5, true)).toEqual({
      complete: 1204,
      premium: 1609,
    });
    expect(getProductProtectionPackagePrices(60, 5, true)).toEqual({
      complete: 792,
      premium: 1057,
    });
  });

  it('fails closed while promotions are unverified', () => {
    expect(getProductProtectionPackagePrices(115, 3, false)).toEqual({
      complete: null,
      premium: null,
    });
  });

  it('offers upgrade-only at an included target and nothing below it', () => {
    expect(getProductProtectionPackagePrices(115, 7, true)).toEqual({
      complete: 420,
      premium: 959,
    });
    expect(getProductProtectionPackagePrices(115, 8, true)).toEqual({
      complete: null,
      premium: 498,
    });
  });

  it('fails closed for an unsupported promo upgrade', () => {
    expect(getProductProtectionPackagePrices(500, 5, true)).toEqual({
      complete: null,
      premium: null,
    });
  });

  it('does not invent a price for an unsupported horsepower', () => {
    expect(getProductProtectionPackagePrices(450, 3, true)).toEqual({
      complete: null,
      premium: null,
    });
  });
});
