export interface PromotionFinancingMinimum {
  minimum_amount?: number;
  minimum_amount_exclusive?: boolean;
}

export function meetsPromotionFinancingMinimum(option: PromotionFinancingMinimum | undefined, amount: number): boolean {
  if (!Number.isFinite(amount)) return false;
  const minimum = option?.minimum_amount;
  if (minimum == null) return true;
  return option?.minimum_amount_exclusive ? amount > minimum : amount >= minimum;
}
