import { isUsableFinancingRate } from '@/lib/finance';

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

export interface SelectedPromotionFinancingInput {
  selectedPromoOption?: string | null;
  selectedPromoRate?: number | null;
  selectedPromoTerm?: number | null;
  specialFinancingOption?: PromotionFinancingMinimum;
  amount: number;
  standingRate?: number | null;
}

export interface ResolvedPromotionFinancing {
  rate: number | null;
  term: number | null;
  usesSpecialFinancing: boolean;
}

/**
 * Same gate QuoteSummaryPage uses: apply the selected special-financing
 * rate and term only when the financed amount meets that option's minimum.
 * Otherwise fall back to the standing TD Always On rate and no promo term.
 */
export function resolveSelectedPromotionFinancing({
  selectedPromoOption,
  selectedPromoRate,
  selectedPromoTerm,
  specialFinancingOption,
  amount,
  standingRate,
}: SelectedPromotionFinancingInput): ResolvedPromotionFinancing {
  const usesSpecialFinancing =
    selectedPromoOption === 'special_financing' &&
    selectedPromoRate != null &&
    selectedPromoTerm != null &&
    meetsPromotionFinancingMinimum(specialFinancingOption, amount);

  if (usesSpecialFinancing) {
    return {
      rate: selectedPromoRate,
      term: selectedPromoTerm,
      usesSpecialFinancing: true,
    };
  }

  return {
    rate: isUsableFinancingRate(standingRate) ? standingRate : null,
    term: null,
    usesSpecialFinancing: false,
  };
}
