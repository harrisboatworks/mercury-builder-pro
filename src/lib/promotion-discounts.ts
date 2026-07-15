export interface RebateTier {
  hp_min: number;
  hp_max: number;
  rebate: number;
}

export interface PromotionDiscountOption {
  id?: string | null;
  matrix?: RebateTier[] | null;
}

export interface PromotionDiscountSource {
  discount_fixed_amount?: number | null;
  discount_percentage?: number | null;
  promo_options?: {
    options?: PromotionDiscountOption[] | null;
  } | null;
}

interface PromotionDiscountContext {
  basePrice?: number;
  horsepower?: number | null;
}

function positiveNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

/**
 * Return the HP rebate matrix carried by a promotion, if present.
 * A matrix is authoritative: universal fixed/percentage discounts on the
 * same row must never be added to it.
 */
export function getPromotionRebateMatrix(
  promotion: PromotionDiscountSource,
): RebateTier[] | null {
  const rebateOption = promotion.promo_options?.options?.find(
    (option) => option.id === 'cash_rebate' && Array.isArray(option.matrix) && option.matrix.length > 0,
  );

  return rebateOption?.matrix ?? null;
}

export function hasPromotionRebateMatrix(
  promotion: PromotionDiscountSource,
): boolean {
  return getPromotionRebateMatrix(promotion) !== null;
}

/**
 * Resolve only explicit matrix eligibility. Gaps and out-of-range HP values
 * are ineligible rather than inheriting the nearest tier.
 */
export function resolveRebateForHP(
  matrix: RebateTier[],
  horsepower: number,
): number | null {
  const match = getRebateTierForHP(matrix, horsepower);
  if (!match) return null;

  const rebate = positiveNumber(match.rebate);
  return rebate > 0 ? rebate : null;
}

export function getRebateTierForHP(
  matrix: RebateTier[],
  horsepower: number,
): RebateTier | null {
  if (!Number.isFinite(horsepower) || horsepower <= 0) return null;

  return matrix.find((tier) => (
    horsepower >= Number(tier.hp_min) && horsepower <= Number(tier.hp_max)
  )) ?? null;
}

export function getPromotionRebateForHP(
  promotion: PromotionDiscountSource,
  horsepower: number,
): number | null {
  const matrix = getPromotionRebateMatrix(promotion);
  return matrix ? resolveRebateForHP(matrix, horsepower) : null;
}

/**
 * Calculate one promotion's actual price discount.
 *
 * Matrix promotion: HP rebate only (fixed/percentage fields ignored).
 * Legacy promotion: fixed amount plus percentage of the supplied base price.
 */
export function getPromotionDiscountAmount(
  promotion: PromotionDiscountSource,
  context: PromotionDiscountContext = {},
): number {
  const matrix = getPromotionRebateMatrix(promotion);
  if (matrix) {
    return context.horsepower == null
      ? 0
      : resolveRebateForHP(matrix, context.horsepower) ?? 0;
  }

  const fixedAmount = positiveNumber(promotion.discount_fixed_amount);
  const percentage = positiveNumber(promotion.discount_percentage);
  const basePrice = positiveNumber(context.basePrice);
  return fixedAmount + (basePrice * percentage / 100);
}

export function getTotalPromotionDiscount(
  promotions: PromotionDiscountSource[],
  context: PromotionDiscountContext = {},
): number {
  return promotions.reduce(
    (total, promotion) => total + getPromotionDiscountAmount(promotion, context),
    0,
  );
}

export function getFirstPromotionRebateForHP(
  promotions: PromotionDiscountSource[],
  horsepower: number,
): number | null {
  for (const promotion of promotions) {
    const rebate = getPromotionRebateForHP(promotion, horsepower);
    if (rebate !== null) return rebate;
  }
  return null;
}
