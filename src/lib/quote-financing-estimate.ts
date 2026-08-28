import {
  buildAccessoryBreakdown,
  type AccessoryBreakdownItem,
  type BuildAccessoryBreakdownParams,
} from '@/lib/build-accessory-breakdown';
import { calculateQuotePricing, getFinanceableAmount, type PricingBreakdown } from '@/lib/quote-utils';

export interface QuoteFinancingEstimateParams extends BuildAccessoryBreakdownParams {
  adminDiscount?: number;
  promotionalSavings?: number;
  motorMSRPOverride?: number;
  motorDiscountOverride?: number;
  frozenSubtotal?: number;
  taxRate?: number;
  dealerFee?: number;
}

export interface QuoteFinancingEstimate {
  accessoryBreakdown: AccessoryBreakdownItem[];
  pricing: PricingBreakdown;
  financeableAmount: number;
}

/**
 * Calculate the amount used by financing previews from the same quote inputs
 * as the final summary. Keeping this outside the page makes promo tiles,
 * eligibility checks and the summary use one ordering for trade-in, tax,
 * accessories, rebates and DealerPlan fees.
 */
export function calculateQuoteFinancingEstimate({
  adminDiscount = 0,
  promotionalSavings = 0,
  motorMSRPOverride,
  motorDiscountOverride,
  frozenSubtotal,
  taxRate = 0.13,
  dealerFee = 0,
  ...accessoryInputs
}: QuoteFinancingEstimateParams): QuoteFinancingEstimate {
  const motor = accessoryInputs.motor || {};
  const motorMSRP = motorMSRPOverride ?? (motor.msrp || motor.basePrice || motor.price || 0);
  const motorSalePrice = motor.salePrice || motor.price || motorMSRP;
  const motorDiscount = motorDiscountOverride ?? (motorMSRP - motorSalePrice);
  const accessoryBreakdown = buildAccessoryBreakdown(accessoryInputs);
  const accessoryTotal = accessoryBreakdown.reduce((sum, item) => sum + item.price, 0);
  const tradeInValue = accessoryInputs.tradeInInfo?.estimatedValue || 0;

  const pricing = calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    adminDiscount,
    accessoryTotal,
    warrantyPrice: 0,
    promotionalSavings,
    tradeInValue,
    taxRate,
  });
  const subtotal = frozenSubtotal ?? pricing.subtotal;

  return {
    accessoryBreakdown,
    pricing,
    financeableAmount: getFinanceableAmount(subtotal, taxRate, dealerFee),
  };
}
