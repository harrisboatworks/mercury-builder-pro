import { describe, expect, it } from 'vitest';
import {
  cashPurchasePaymentDescription,
  formatFactoryRebateBadgeValue,
  formatFactoryRebateDisplayAmount,
  formatFactoryRebateSelectionValue,
  formatFactoryRebateStickyLabel,
  persistFactoryRebatePromoDetails,
  specialFinancingPaymentDescription,
  standardFinancingPaymentDescription,
} from '../factory-rebate-copy';
import { hasEligibleFactoryRebate } from '../promotion-discounts';

describe('factory rebate applied copy', () => {
  it.each([null, undefined, 0, -1, Number.NaN])(
    'does not treat %s as an eligible factory rebate',
    (amount) => {
      expect(hasEligibleFactoryRebate(amount)).toBe(false);
      expect(cashPurchasePaymentDescription(amount)).toBe('Pay without financing.');
      expect(specialFinancingPaymentDescription(amount)).toBe(
        'Pick promo financing to lock in a low promotional rate, or keep standard TD financing.',
      );
      expect(standardFinancingPaymentDescription(amount)).toBe(
        'Use the standard TD "Always On" program.',
      );
      expect(formatFactoryRebateSelectionValue(amount)).toBeNull();
      expect(formatFactoryRebateDisplayAmount(amount)).toBe('');
      expect(formatFactoryRebateStickyLabel(amount)).toBeNull();
      expect(formatFactoryRebateBadgeValue(amount)).toBe('');
      expect(persistFactoryRebatePromoDetails(amount)).toEqual({
        option: null,
        rate: null,
        term: null,
        value: null,
      });
      expect(cashPurchasePaymentDescription(amount)).not.toMatch(/rebate/i);
      expect(specialFinancingPaymentDescription(amount)).not.toMatch(/rebate/i);
      expect(standardFinancingPaymentDescription(amount)).not.toMatch(/rebate/i);
    },
  );

  it('keeps applied-rebate copy and the exact amount for a published tier', () => {
    expect(hasEligibleFactoryRebate(400)).toBe(true);
    expect(cashPurchasePaymentDescription(400)).toContain(
      'eligible factory rebate remains fully applied',
    );
    expect(specialFinancingPaymentDescription(400)).toContain('your rebate');
    expect(standardFinancingPaymentDescription(400)).toContain(
      'eligible factory rebate remains fully applied',
    );
    expect(formatFactoryRebateSelectionValue(400)).toBe('$400 rebate');
    expect(formatFactoryRebateDisplayAmount(400)).toBe('$400');
    expect(formatFactoryRebateStickyLabel(400)).toBe('$400 Rebate');
    expect(formatFactoryRebateBadgeValue(400)).toBe('$400 Back');
    expect(persistFactoryRebatePromoDetails(400)).toEqual({
      option: 'cash_rebate',
      rate: null,
      term: null,
      value: '$400 rebate',
    });
  });
});
