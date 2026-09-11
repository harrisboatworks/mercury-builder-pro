/**
 * Quote Summary Utilities
 * Calculations and formatting for the enhanced quote summary experience
 */

import { calculateMercuryPlatinumExtensionCost } from '@/data/mercuryProductProtection';
import { applyTradeCredit } from '@/lib/trade-credit';
import {
  activePromotionDateOrFilters,
  daysUntil,
  dealerToday,
  formatPromoCalendarDate,
  formatPromoDaysLeft,
  isPromotionLive,
  promoEndOfDay,
  promoStartOfDay,
} from '../../supabase/functions/_shared/promo-dates';

export {
  activePromotionDateOrFilters,
  daysUntil,
  dealerToday,
  formatPromoCalendarDate,
  formatPromoDaysLeft,
  isPromotionLive,
  promoEndOfDay,
  promoStartOfDay,
};

export interface PricingBreakdown {
  msrp: number;
  discount: number;
  adminDiscount: number;
  promoValue: number;
  subtotal: number;
  tax: number;
  total: number;
  savings: number;
  appliedTradeCredit?: number;
  tradeEstimate?: number;
  tradeTaxSaving?: number;
}

export interface MonthlyPayment {
  amount: number;
  rate: number;
  termMonths: number;
  totalAmount: number;
  totalInterest: number;
}

/**
 * Format currency values consistently
 */
export function money(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate monthly payment for financing with smart term selection
 */
export function calculateMonthly(
  amount: number, 
  rate: number = 7.99, 
  termMonths: number = 60
): MonthlyPayment {
  const monthlyRate = rate / 100 / 12;
  // Same convention as finance.calculatePaymentWithFrequency: a 0% period
  // rate is principal / periods. The amortization formula is 0/0 at 0%.
  const monthlyPayment = monthlyRate === 0
    ? amount / termMonths
    : amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalAmount = monthlyPayment * termMonths;
  const totalInterest = totalAmount - amount;
  
  return {
    amount: Math.round(monthlyPayment),
    rate,
    termMonths,
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest)
  };
}

/**
 * Compute comprehensive pricing totals from quote data
 */
export function computeTotals(data: {
  motorPrice: number;
  accessoryTotal: number;
  promotionalSavings?: number;
  tradeInValue?: number;
  taxRate?: number;
}): PricingBreakdown {
  const {
    motorPrice,
    accessoryTotal,
    promotionalSavings = 0,
    tradeInValue = 0,
    taxRate = 0.13 // 13% HST for Canada
  } = data;

  const discount = 0;
  const msrp = motorPrice;
  const preTradeSubtotal = motorPrice + accessoryTotal;
  const applied = applyTradeCredit({
    preTradeSubtotal,
    estimatedValue: tradeInValue,
    taxRate,
  });
  const savings = discount + promotionalSavings + applied.credit;

  return {
    msrp,
    discount,
    adminDiscount: 0,
    promoValue: promotionalSavings,
    subtotal: applied.subtotal,
    tax: applied.tax,
    total: applied.total,
    savings,
    appliedTradeCredit: applied.credit,
    tradeEstimate: applied.estimate,
    tradeTaxSaving: applied.taxSaving,
  };
}

/**
 * Calculate complete quote pricing with proper MSRP, discounts, and accessories
 */
export function calculateQuotePricing(data: {
  motorMSRP: number;
  motorDiscount: number;
  adminDiscount?: number;
  accessoryTotal: number;
  warrantyPrice: number;
  promotionalSavings: number;
  tradeInValue: number;
  financingFee?: number;
  taxRate?: number;
}): PricingBreakdown {
  const {
    motorMSRP,
    motorDiscount,
    adminDiscount = 0,
    accessoryTotal,
    warrantyPrice,
    promotionalSavings,
    tradeInValue,
    financingFee = 0,
    taxRate = 0.13
  } = data;

  const msrp = motorMSRP;
  const discount = motorDiscount;
  const promoValue = promotionalSavings;
  const preTradeSubtotal = (msrp - discount - adminDiscount) + accessoryTotal + warrantyPrice + financingFee - promoValue;
  const applied = applyTradeCredit({
    preTradeSubtotal,
    estimatedValue: tradeInValue,
    taxRate,
  });
  const savings = discount + adminDiscount + promoValue + applied.credit;

  return {
    msrp,
    discount,
    adminDiscount,
    promoValue,
    subtotal: applied.subtotal,
    tax: applied.tax,
    total: applied.total,
    savings,
    appliedTradeCredit: applied.credit,
    tradeEstimate: applied.estimate,
    tradeTaxSaving: applied.taxSaving,
  };
}

/**
 * Format expiry countdown message. 0 remaining days means the last
 * America/Toronto calendar day — still live, not expired.
 */
export function formatExpiry(endDate: Date | string): string {
  const days = daysUntil(endDate);
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `Expires in ${days} days`;
  if (days <= 30) return `Expires in ${Math.ceil(days / 7)} weeks`;
  return `Expires ${formatPromoCalendarDate(endDate)}`;
}

/**
 * Calculate the Mercury Platinum Product Protection price needed to move from
 * the currently included coverage to the requested combined total.
 *
 * The shared rate card is deliberately local and deterministic: quote totals
 * must not turn into a guessed price when a database request fails.
 */
export function calculateWarrantyExtensionCost(
  motorHP: number,
  currentYears: number,
  targetYears: number
): number | null {
  return calculateMercuryPlatinumExtensionCost(motorHP, currentYears, targetYears);
}

/**
 * Calculate the financeable amount (subtotal + tax + dealer fee)
 * Used by both the summary page and PDF generation to prevent drift.
 */
export function getFinanceableAmount(
  subtotal: number,
  taxRate: number = 0.13,
  dealerFee: number = 0
): number {
  return subtotal * (1 + taxRate) + dealerFee;
}

/**
 * Package configurations for Good/Better/Best
 */
export interface PackageConfig {
  id: 'good' | 'better' | 'best';
  name: string;
  description: string;
  inclusions: string[];
  recommended?: boolean;
  additionalCost: number;
}

export const PACKAGE_CONFIGS: PackageConfig[] = [
  {
    id: 'good',
    name: 'Essential',
    description: 'Everything you need to get on the water',
    inclusions: [
      'Mercury motor',
      'Standard controls & rigging',
      'Basic installation'
    ],
    additionalCost: 0
  },
  {
    id: 'better',
    name: 'Complete',
    description: 'Our most popular package',
    inclusions: [
      'Mercury motor',
      'Premium controls & rigging', 
      'Marine starting battery',
      'Standard propeller',
      'Priority installation'
    ],
    recommended: true,
    additionalCost: 179.99 // Battery cost
  },
  {
    id: 'best',
    name: 'Premium',
    description: 'Full peace of mind package',
    inclusions: [
      'Mercury motor',
      'Premium controls & rigging',
      'Marine starting battery',
      'Performance propeller upgrade',
      'White-glove installation'
    ],
    additionalCost: 179.99 + 299.99 // Battery + propeller upgrade
  }
];
