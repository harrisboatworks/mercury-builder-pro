import { describe, expect, it } from 'vitest';
import { getProductProtectionPackagePrices } from '@/lib/product-protection-packages';

describe('Product Protection package pricing safety', () => {
  it('prices the exact paid term after verified included coverage', () => {
    expect(getProductProtectionPackagePrices(115, 3, true)).toEqual({
      complete: 1748,
      premium: 2077,
    });
    expect(getProductProtectionPackagePrices(115, 5, true)).toEqual({
      complete: 971,
      premium: 1376,
    });
  });

  it('fails closed while promotions are unverified', () => {
    expect(getProductProtectionPackagePrices(115, 3, false)).toEqual({
      complete: null,
      premium: null,
    });
  });

  it('does not offer a target below included coverage', () => {
    expect(getProductProtectionPackagePrices(115, 7, true)).toEqual({
      complete: null,
      premium: 539,
    });
    expect(getProductProtectionPackagePrices(115, 8, true)).toEqual({
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
