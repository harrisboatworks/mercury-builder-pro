// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';

/**
 * Direct unit tests for the rebate matrix resolution logic used by the
 * "Mercury Summer Savings Rebate" promotion. Mirrors the pure algorithm
 * inside useActivePromotions.getRebateForHP so we can assert every tier
 * boundary without spinning up the hook.
 */

const MATRIX = [
  { hp_min: 2.5, hp_max: 3.5, rebate: 50 },
  { hp_min: 4, hp_max: 8, rebate: 75 },
  { hp_min: 9.9, hp_max: 25, rebate: 100 },
  { hp_min: 30, hp_max: 115, rebate: 250 },
  { hp_min: 150, hp_max: 200, rebate: 350 },
  { hp_min: 225, hp_max: 425, rebate: 700 },
];

function resolveRebate(hp: number): number | null {
  const exact = MATRIX.find(r => hp >= r.hp_min && hp <= r.hp_max);
  if (exact) return exact.rebate;
  const sorted = [...MATRIX].sort((a, b) => {
    const distA = Math.min(Math.abs(hp - a.hp_min), Math.abs(hp - a.hp_max));
    const distB = Math.min(Math.abs(hp - b.hp_min), Math.abs(hp - b.hp_max));
    return distA - distB;
  });
  return sorted[0]?.rebate ?? null;
}

// Mirrors useActivePromotions.getTotalPromotionalSavings guard: promos that
// carry a matrix must NEVER add discount_fixed_amount on top of the matrix
// rebate. This is the double-count prevention.
function totalPromoSavings(promos: Array<{
  discount_fixed_amount?: number;
  discount_percentage?: number;
  promo_options?: { options?: Array<{ id: string; matrix?: unknown }> } | null;
}>, basePrice: number): number {
  return promos.reduce((total, promo) => {
    const hasMatrix = !!promo.promo_options?.options?.find(
      (o) => o.id === 'cash_rebate' && Array.isArray((o as any).matrix) && (o as any).matrix.length > 0,
    );
    if (hasMatrix) return total;
    const fixed = promo.discount_fixed_amount || 0;
    const pct = promo.discount_percentage ? (basePrice * promo.discount_percentage / 100) : 0;
    return total + fixed + pct;
  }, 0);
}

describe('Summer Savings rebate matrix', () => {
  it.each([
    [3.5, 50],
    [9.9, 100],
    [25, 100],
    [60, 250],
    [115, 250],
    [150, 350],
    [200, 350],
    [225, 700],
    [425, 700],
  ])('HP %s -> $%s', (hp, expected) => {
    expect(resolveRebate(hp)).toBe(expected);
  });
});

describe('Double-count guard', () => {
  it('ignores discount_fixed_amount when the promo carries a matrix', () => {
    const summerSavings = {
      discount_fixed_amount: 700, // hostile / stale value
      promo_options: {
        options: [{ id: 'cash_rebate', matrix: MATRIX }],
      },
    };
    // Base price is irrelevant here — the guard should return 0 regardless.
    expect(totalPromoSavings([summerSavings], 15000)).toBe(0);
  });

  it('still applies discount_fixed_amount for non-matrix promos', () => {
    const legacyPromo = { discount_fixed_amount: 200, promo_options: null };
    expect(totalPromoSavings([legacyPromo], 15000)).toBe(200);
  });

  it('a 60 HP quote nets exactly $250 total promo discount, even if a stale $700 fixed amount lingers', () => {
    const summerSavings = {
      discount_fixed_amount: 700,
      promo_options: { options: [{ id: 'cash_rebate', matrix: MATRIX }] },
    };
    const base = totalPromoSavings([summerSavings], 15000);
    const rebate = resolveRebate(60) || 0;
    expect(base + rebate).toBe(250);
  });
});
