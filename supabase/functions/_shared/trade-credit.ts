export const DEFAULT_HST_RATE = 0.13;

export interface ApplyTradeCreditInput {
  preTradeSubtotal: number;
  estimatedValue?: number | null;
  hasTradeIn?: boolean;
  taxRate?: number;
}

export interface AppliedTradeCredit {
  estimate: number;
  credit: number;
  subtotal: number;
  tax: number;
  taxSaving: number;
  total: number;
}

function finiteOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Apply trade credit once against the pre-trade taxable subtotal.
 * Credit is finite, nonnegative, and capped so tax/due cannot go negative.
 * The raw estimate is preserved separately from the applied credit.
 */
export function applyTradeCredit(input: ApplyTradeCreditInput): AppliedTradeCredit {
  const taxRate = Number.isFinite(input.taxRate) ? (input.taxRate as number) : DEFAULT_HST_RATE;
  const preTradeSubtotal = Math.max(0, finiteOrZero(input.preTradeSubtotal));
  const estimate = Math.max(0, finiteOrZero(input.estimatedValue));
  const credit = input.hasTradeIn === false
    ? 0
    : Math.min(estimate, preTradeSubtotal);
  const subtotal = Math.max(0, preTradeSubtotal - credit);
  const tax = subtotal * taxRate;
  const taxSaving = credit * taxRate;
  const total = subtotal + tax;

  return { estimate, credit, subtotal, tax, taxSaving, total };
}

export function resolveAppliedTradeValue(
  tradeInInfo?: { hasTradeIn?: boolean; estimatedValue?: number | null } | null,
): number {
  if (!tradeInInfo || tradeInInfo.hasTradeIn === false) return 0;
  return Math.max(0, finiteOrZero(tradeInInfo.estimatedValue));
}
