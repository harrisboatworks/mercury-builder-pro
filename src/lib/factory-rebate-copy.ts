import { hasEligibleFactoryRebate } from '@/lib/promotion-discounts';

export { hasEligibleFactoryRebate };

export function cashPurchasePaymentDescription(
  rebateAmount: number | null | undefined,
): string {
  return hasEligibleFactoryRebate(rebateAmount)
    ? 'Pay without financing. Your eligible factory rebate remains fully applied to the quote.'
    : 'Pay without financing.';
}

export function specialFinancingPaymentDescription(
  rebateAmount: number | null | undefined,
): string {
  return hasEligibleFactoryRebate(rebateAmount)
    ? 'Layered on top of your rebate. Pick promo financing to lock in a low promotional rate, or keep standard TD financing.'
    : 'Pick promo financing to lock in a low promotional rate, or keep standard TD financing.';
}

export function standardFinancingPaymentDescription(
  rebateAmount: number | null | undefined,
): string {
  return hasEligibleFactoryRebate(rebateAmount)
    ? 'Use the standard TD "Always On" program. Your eligible factory rebate remains fully applied.'
    : 'Use the standard TD "Always On" program.';
}

export function formatFactoryRebateSelectionValue(
  rebateAmount: number | null | undefined,
): string | null {
  return hasEligibleFactoryRebate(rebateAmount)
    ? `$${rebateAmount.toLocaleString()} rebate`
    : null;
}

export function formatFactoryRebateDisplayAmount(
  rebateAmount: number | null | undefined,
): string {
  return hasEligibleFactoryRebate(rebateAmount)
    ? `$${rebateAmount.toLocaleString()}`
    : '';
}

export function persistFactoryRebatePromoDetails(
  rebateAmount: number | null | undefined,
): {
  option: 'cash_rebate' | null;
  rate: null;
  term: null;
  value: string | null;
} {
  return {
    option: hasEligibleFactoryRebate(rebateAmount) ? 'cash_rebate' : null,
    rate: null,
    term: null,
    value: formatFactoryRebateSelectionValue(rebateAmount),
  };
}

export function formatFactoryRebateStickyLabel(
  rebateAmount: number | null | undefined,
): string | null {
  return hasEligibleFactoryRebate(rebateAmount)
    ? `$${rebateAmount} Rebate`
    : null;
}

export function formatFactoryRebateBadgeValue(
  rebateAmount: number | null | undefined,
): string {
  return hasEligibleFactoryRebate(rebateAmount)
    ? `$${rebateAmount.toLocaleString()} Back`
    : '';
}
