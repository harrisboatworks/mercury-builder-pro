export interface WarrantyPromotionLike {
  warranty_extra_years?: unknown;
}

/** Rows must be in applied-promotion priority order; unrelated offers never stack. */
export function getAppliedPromotionWarrantyYears(
  promotions: readonly WarrantyPromotionLike[] = [],
): number {
  return getPromotionWarrantyYears(promotions[0]);
}

export function getPromotionWarrantyYears(promotion?: WarrantyPromotionLike | null): number {
  const years = Number(promotion?.warranty_extra_years ?? 0);
  return Number.isFinite(years) ? Math.max(0, Math.floor(years)) : 0;
}
