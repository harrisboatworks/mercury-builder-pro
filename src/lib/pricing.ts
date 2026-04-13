import type { PriceStyle } from '@/config/pricingThemes';

export type PriceDisplayState = {
  callForPrice: boolean;
  hasSale: boolean;
  savingsRounded: number; // nearest dollar
  percent: number; // floored percent
  isArtificialDiscount?: boolean;
};

export function getPriceDisplayState(
  base_price?: number | null, 
  sale_price?: number | null, 
  inflateEqualPrices?: boolean,
  priceStyle?: PriceStyle
): PriceDisplayState {
  const base = typeof base_price === 'number' ? base_price : undefined;
  const sale = typeof sale_price === 'number' ? sale_price : undefined;

  const callForPrice = !(typeof base === 'number' && base > 0);

  if (callForPrice) {
    return { callForPrice: true, hasSale: false, savingsRounded: 0, percent: 0, isArtificialDiscount: false };
  }

  // Show real prices — no artificial inflation
  let adjustedBase = base as number;
  let effectiveSale = sale || base as number;
  let isArtificialDiscount = false;
  
  // If sale equals base or is missing, there's simply no discount to show
  // inflateEqualPrices param is kept for API compat but no longer inflates

  const hasSale = effectiveSale > 0 && effectiveSale < adjustedBase;

  const rawSavings = hasSale ? adjustedBase - effectiveSale : 0;
  const savingsRounded = Math.round(rawSavings);
  const percent = hasSale && adjustedBase > 0 ? Math.floor((savingsRounded / adjustedBase) * 100) : 0;

  // Only warn for significant price differences to reduce noise
  if (typeof sale === 'number' && typeof base === 'number' && sale > base) {
    console.warn('[pricing] sale_price is greater than base_price', { base_price: base, sale_price: sale });
  }

  return { callForPrice, hasSale, savingsRounded, percent, isArtificialDiscount };
}

/**
 * Shared display helper that resolves the MSRP, selling price, and whether to show the struck-through MSRP.
 * Uses inflate-equal-prices logic so motors where price == msrp still show "MSRP / Our Price".
 * This is DISPLAY-ONLY — never use these values for quote math or saved records.
 */
export type DisplayPrices = {
  displayMsrp: number | null;
  displayPrice: number | null;
  showMsrp: boolean;
  showSavings: boolean;
  savingsRounded: number;
  isArtificialDiscount: boolean;
  callForPrice: boolean;
};

export function getDisplayPrices(
  msrp?: number | null,
  sellingPrice?: number | null
): DisplayPrices {
  const hasPrice = typeof sellingPrice === 'number' && sellingPrice > 0;
  const hasMsrp = typeof msrp === 'number' && msrp > 0;

  if (!hasPrice) {
    return {
      displayMsrp: null,
      displayPrice: null,
      showMsrp: false,
      showSavings: false,
      savingsRounded: 0,
      isArtificialDiscount: false,
      callForPrice: true,
    };
  }

  // Real discount: msrp > price — show real MSRP struck through with real savings
  if (hasMsrp && msrp! > sellingPrice!) {
    const savings = Math.round(msrp! - sellingPrice!);
    return {
      displayMsrp: msrp!,
      displayPrice: sellingPrice!,
      showMsrp: true,
      showSavings: savings > 0,
      savingsRounded: savings,
      isArtificialDiscount: false,
      callForPrice: false,
    };
  }

  // Equal or no real discount: show MSRP but no savings badge
  if (hasMsrp) {
    return {
      displayMsrp: msrp!,
      displayPrice: sellingPrice!,
      showMsrp: true,
      showSavings: false,
      savingsRounded: 0,
      isArtificialDiscount: false,
      callForPrice: false,
    };
  }

  // No msrp at all — just show the price
  return {
    displayMsrp: null,
    displayPrice: sellingPrice!,
    showMsrp: false,
    showSavings: false,
    savingsRounded: 0,
    isArtificialDiscount: false,
    callForPrice: false,
  };
}
