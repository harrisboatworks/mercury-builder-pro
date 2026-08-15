export const STANDARD_WARRANTY_YEARS = 3;

export type WarrantyPromotionInput = {
  warranty_extra_years?: number | null;
  is_active?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function isWarrantyPromotionActive(
  promo: WarrantyPromotionInput,
  now: Date = new Date(),
): boolean {
  if (promo.is_active === false) {
    return false;
  }

  const nowMs = now.getTime();

  if (promo.start_date) {
    const start = new Date(promo.start_date);
    if (!Number.isNaN(start.getTime()) && nowMs < start.getTime()) {
      return false;
    }
  }

  if (promo.end_date) {
    const rawEnd = promo.end_date.includes('T')
      ? promo.end_date
      : `${promo.end_date}T23:59:59`;
    const end = new Date(rawEnd);
    if (!Number.isNaN(end.getTime()) && nowMs > end.getTime()) {
      return false;
    }
  }

  return true;
}

/**
 * Extra years from currently active promotions only (`is_active !== false`
 * and inside the start/end window).
 *
 * When more than one active promo has extra years, this helper uses
 * Math.max. That is not a proven stacking rule: `useActivePromotions`
 * `getTotalWarrantyBonusYears` and `agent-quote-api` sum extra years,
 * while `PromoSelectionPage` / `Promotions.tsx` use a single promo's
 * `warranty_extra_years`. `promotions.stackable` is applied to discounts
 * in MotorSelection, not to warranty years.
 */
export function getActiveWarrantyExtraYears(
  promotions: WarrantyPromotionInput[],
  now: Date = new Date(),
): number {
  return promotions
    .filter((promo) => isWarrantyPromotionActive(promo, now))
    .reduce((max, promo) => Math.max(max, Number(promo.warranty_extra_years) || 0), 0);
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
