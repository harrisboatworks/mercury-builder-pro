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
        category: 'protection',
      },
    ]);
    expect(breakdown.reduce((sum, item) => sum + item.price, 0)).toBe(1748);
  });

  it('shows Gold upgrade and Platinum extension components once, including upgrade-only', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '60 FourStroke', hp: 60 },
      boatInfo: { hasCompatibleProp: true, controlsOption: 'compatible' },
      purchasePath: 'loose',
      warrantyConfig: {
        extendedYears: 3, warrantyPrice: 1057, totalYears: 8,
        promoGoldYears: 2, goldUpgradeYears: 2, goldUpgradePrice: 153,
        platinumExtensionYears: 3, platinumExtensionPrice: 904,
      },
    });
    const lines = breakdown.filter((i) => i.category === 'protection');
    expect(lines).toHaveLength(1);
    expect(lines[0].price).toBe(1057);
    expect(lines[0].description).toContain('Gold upgrade (2 yr): $153');
    expect(lines[0].description).toContain('Platinum extension (3 yr): $904');

    const upgradeOnly = buildAccessoryBreakdown({
      motor: { model: '60 FourStroke', hp: 60 },
      purchasePath: 'loose',
      warrantyConfig: { extendedYears: 0, warrantyPrice: 153, totalYears: 5, goldUpgradeYears: 2, goldUpgradePrice: 153, platinumExtensionYears: 0, platinumExtensionPrice: 0 },
    }).filter((i) => i.category === 'protection');
    expect(upgradeOnly).toHaveLength(1);
    expect(upgradeOnly[0].price).toBe(153);
  });

  it('preserves a manual custom item alongside protection without deduping it', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '60 FourStroke', hp: 60 },
      purchasePath: 'loose',
      adminCustomItems: [{ name: 'Manual Gold-to-Platinum upgrade', price: 153 }],
      warrantyConfig: { extendedYears: 3, warrantyPrice: 1057, totalYears: 8, goldUpgradePrice: 153, platinumExtensionPrice: 904 },
    });
    expect(breakdown.filter((i) => i.name.includes('Manual Gold'))).toHaveLength(1);
    expect(breakdown.filter((i) => i.category === 'protection')).toHaveLength(1);
    expect(breakdown.filter((i) => i.name.includes('Manual Gold'))[0].price).toBe(153);
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
