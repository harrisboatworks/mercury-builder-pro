import { applyTradeCredit } from '@/lib/trade-credit';
import { getFinanceableAmount } from '@/lib/quote-utils';
import { calculateQuoteFinancingEstimate } from '@/lib/quote-financing-estimate';

export const FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE = 'all_in_after_trade' as const;
export type FinancingPriceBasis = typeof FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE;
export interface FinancingPurchaseInput {
  afterTradeSubtotal?: number; preTradeSubtotal?: number; estimatedValue?: number | null;
  hasTradeIn?: boolean; taxRate?: number; dealerFee?: number; downPayment?: number;
  frozenTotal?: number; frozenSubtotal?: number;
}
const finiteOrZero = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const cents = (value: number) => Math.round(value * 100) / 100;

/** Preserve the quote's tax basis and the credit already included in its total. */
export function calculateFinancingPurchase(input: FinancingPurchaseInput) {
  const taxRate = Number.isFinite(input.taxRate) ? Math.max(0, input.taxRate!) : 0.13;
  const dealerFee = Math.max(0, finiteOrZero(input.dealerFee));
  const downPayment = Math.max(0, finiteOrZero(input.downPayment));
  const net = input.frozenSubtotal ?? input.afterTradeSubtotal;
  const hasNet = typeof net === 'number' && Number.isFinite(net);
  const estimate = Math.max(0, finiteOrZero(input.estimatedValue));
  const preTradeSubtotal = Math.max(0, input.preTradeSubtotal ?? (hasNet
    ? net! + (input.hasTradeIn === false ? 0 : estimate) : 0));
  const applied = applyTradeCredit({preTradeSubtotal,estimatedValue:estimate,hasTradeIn:input.hasTradeIn,taxRate});
  const afterTradeSubtotal = hasNet ? Math.max(0, net!) : applied.subtotal;
  const motorPrice = cents(Number.isFinite(input.frozenTotal)
    ? Math.max(0, input.frozenTotal! + dealerFee)
    : getFinanceableAmount(afterTradeSubtotal, taxRate, dealerFee));
  return {afterTradeSubtotal,preTradeSubtotal,appliedCredit:applied.credit,tradeEstimate:applied.estimate,
    tax:afterTradeSubtotal*taxRate,taxSaving:applied.taxSaving,dealerFee,motorPrice,
    tradeInValue:applied.credit,includedTradeInValue:applied.credit,downPayment,
    amountToFinance:Math.max(0,cents(motorPrice-downPayment)),priceBasis:FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE};
}
export type FinancingPurchase = ReturnType<typeof calculateFinancingPurchase>;

/** Recalculate an editable trade relative to the credit included in the handoff. */
export function financingAmountToFinance(motorPrice: number, downPayment: number, tradeInValue: number,
  priceBasis?: FinancingPriceBasis | string | null,
  included?: {includedTradeInValue?: number; preTradeSubtotal?: number; dealerFee?: number}): number {
  const price=Math.max(0,finiteOrZero(motorPrice)), down=Math.max(0,finiteOrZero(downPayment));
  if (priceBasis !== FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE) return Math.max(0,cents(price-down-Math.max(0,finiteOrZero(tradeInValue))));
  const originalCredit=Math.max(0,finiteOrZero(included?.includedTradeInValue ?? tradeInValue));
  const preTradeSubtotal=included?.preTradeSubtotal ?? Math.max(0,(price-(included?.dealerFee ?? 349))/1.13+originalCredit);
  const current=applyTradeCredit({preTradeSubtotal,estimatedValue:tradeInValue});
  return Math.max(0,cents(price+(originalCredit-current.credit)*1.13-down));
}

/** The same accessory/discount reconstruction serves both saved and live quote handoffs. */
export function financingPurchaseFromQuote(quote: any, dealerFee = 349): FinancingPurchase {
  const frozen=quote.frozenPricing;
  const trade=quote.tradeInInfo;
  const handoff=quote.financingAmount;
  const cashRebate=quote.selectedPromoOption==='cash_rebate'
    ? Number(String(quote.selectedPromoValue || '').match(/\$?([\d,]+)/)?.[1]?.replace(/,/g,'')) || 0 : 0;
  const estimate=calculateQuoteFinancingEstimate({
    motor:quote.motor || quote.selectedMotor,selectedOptions:quote.selectedOptions,
    boatInfo:quote.boatInfo,purchasePath:quote.purchasePath,installConfig:quote.installConfig,
    looseMotorBattery:quote.looseMotorBattery,selectedPackage:quote.selectedPackage?.key || quote.selectedPackage?.id || quote.selectedPackage,
    adminCustomItems:quote.adminCustomItems,warrantyConfig:quote.warrantyConfig || quote.warranty,
    tradeInInfo:trade,adminDiscount:frozen?.adminDiscount ?? quote.adminDiscount ?? 0,
    promotionalSavings:frozen?.promoSavings ?? cashRebate,motorMSRPOverride:frozen?.motorMSRP,motorDiscountOverride:frozen?.motorDiscount,
  });
  // Older quote_state handoffs already stored the correct after-trade packageSubtotal,
  // but totalWithFees incorrectly added the trade back before tax. Use the net basis.
  const net=frozen?.subtotal ?? handoff?.packageSubtotal ?? estimate.pricing.subtotal;
  const credit=handoff?.includedTradeInValue ?? frozen?.appliedTradeCredit ?? estimate.pricing.appliedTradeCredit ?? 0;
  return calculateFinancingPurchase({
    afterTradeSubtotal:net,preTradeSubtotal:handoff?.preTradeSubtotal ?? net+credit,
    frozenTotal:frozen?.total ?? (handoff?.priceBasis===FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE && Number.isFinite(handoff?.totalWithFees) ? handoff.totalWithFees-dealerFee : undefined),
    estimatedValue:trade?.hasTradeIn===false ? 0 : handoff?.tradeInValue ?? trade?.estimatedValue ?? credit,
    hasTradeIn:trade?.hasTradeIn,dealerFee,
  });
}

/** Unversioned motorPrice links carried tax/fee before trade; price links are pre-tax. */
export function financingPurchaseFromLink(input: {
  price:number; allInPrice:boolean; priceBasis?:string | null; tradeInValue:number;
  downPayment?:number; includedTradeInValue?:number; preTradeSubtotal?:number;
}, dealerFee=349): FinancingPurchase {
  const afterTrade=input.priceBasis===FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE;
  const subtotal=input.allInPrice ? Math.max(0,(input.price-dealerFee)/1.13) : input.price;
  const credit=input.includedTradeInValue ?? input.tradeInValue;
  return calculateFinancingPurchase({
    ...(afterTrade ? {afterTradeSubtotal:subtotal,...(input.allInPrice ? {frozenTotal:input.price-dealerFee}:{})}:{}),
    preTradeSubtotal:input.preTradeSubtotal ?? subtotal+(afterTrade ? credit:0),
    estimatedValue:input.tradeInValue,dealerFee,downPayment:input.downPayment,
  });
}
