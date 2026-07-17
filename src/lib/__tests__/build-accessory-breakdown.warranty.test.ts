import { describe, expect, it } from 'vitest';
import { buildAccessoryBreakdown } from '@/lib/build-accessory-breakdown';

describe('Product Protection quote breakdown', () => {
  it('uses the persisted Platinum plan once without re-pricing it', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '115 FourStroke', hp: 115 },
      boatInfo: { hasCompatibleProp: true, controlsOption: 'compatible' },
      purchasePath: 'loose',
      selectedPackage: 'better',
      warrantyConfig: {
        extendedYears: 4,
        warrantyPrice: 1748,
        totalYears: 7,
      },
    });

    const protectionLines = breakdown.filter((item) => item.name.includes('Product Protection'));
    expect(protectionLines).toEqual([
      {
        name: 'Mercury Platinum Product Protection (4 additional years)',
        price: 1748,
        description: 'Combined coverage: 7 years',
      },
    ]);
    expect(breakdown.reduce((sum, item) => sum + item.price, 0)).toBe(1748);
  });

  it('does not invent a price when no paid plan is selected', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '115 FourStroke', hp: 115 },
      boatInfo: { hasCompatibleProp: true, controlsOption: 'compatible' },
      purchasePath: 'loose',
      selectedPackage: 'good',
      warrantyConfig: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 },
    });

    expect(breakdown.some((item) => item.name.includes('Product Protection'))).toBe(false);
  });
});
