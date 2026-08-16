export const STANDARD_WARRANTY_YEARS = 3;

export type AppliedWarrantyPromotion = {
  warranty_extra_years?: number | null;
};

/**
 * Same applied-promotion contract as the quote promotion UI:
 * `useActivePromotions` already returns only currently applicable rows,
 * ordered by priority descending. The quote UI applies `promotions[0]`.
 *
 * Do not Math.max or sum extra years across unrelated active rows.
 * Do not re-declare expiry here — inactive/expired promotions are already
 * excluded by that selection contract before they reach this helper.
 */
export function getAppliedPromotion<T>(promotions: readonly T[]): T | null {
  return promotions.length > 0 ? promotions[0] : null;
}

export function getAppliedWarrantyExtraYears(
  appliedPromotion: AppliedWarrantyPromotion | null | undefined,
): number {
  if (!appliedPromotion) return 0;
  return Math.max(0, Math.floor(Number(appliedPromotion.warranty_extra_years) || 0));
}

export function getWarrantyDisplay(extraYears: number) {
  const extra = Math.max(0, Math.floor(Number(extraYears) || 0));
  const totalYears = STANDARD_WARRANTY_YEARS + extra;
  const hasExtension = extra > 0;

  return {
    extraYears: extra,
    totalYears,
    hasExtension,
    badgeLabel: `${totalYears}-YEAR WARRANTY`,
    headline: `${totalYears} Years Warranty`,
    shortHeadline: `${totalYears} Years`,
    detail: hasExtension
      ? `${STANDARD_WARRANTY_YEARS} + ${extra} FREE years`
      : `${STANDARD_WARRANTY_YEARS}-year factory-backed warranty`,
  };
}

export function getWarrantyDisplayFromAppliedPromotion(
  appliedPromotion: AppliedWarrantyPromotion | null | undefined,
) {
  return getWarrantyDisplay(getAppliedWarrantyExtraYears(appliedPromotion));
}
