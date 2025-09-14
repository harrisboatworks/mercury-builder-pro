export type PriceDisplayState = {
  callForPrice: boolean;
  hasSale: boolean;
  savingsRounded: number; // nearest dollar
  percent: number; // floored percent
  isArtificialDiscount?: boolean;
};

export function getPriceDisplayState(base_price?: number | null, sale_price?: number | null, inflateEqualPrices?: boolean): PriceDisplayState {
  const base = typeof base_price === 'number' ? base_price : undefined;
  const sale = typeof sale_price === 'number' ? sale_price : undefined;

  const callForPrice = !(typeof base === 'number' && base > 0);

  if (callForPrice) {
    return { callForPrice: true, hasSale: false, savingsRounded: 0, percent: 0, isArtificialDiscount: false };
  }

  // Inflate base price if it equals sale price OR if sale is missing and inflateEqualPrices is enabled
  let adjustedBase = base as number;
  let effectiveSale = sale || base as number; // Use base as sale if sale is missing
  let isArtificialDiscount = false;
  
  if (inflateEqualPrices && (
    (typeof sale === 'number' && sale > 0 && base === sale) || // Explicit equal prices
    ((!sale || sale <= 0) && typeof base === 'number' && base > 0) // Missing sale price
  )) {
    adjustedBase = (base as number) * 1.1; // Inflate by 10%
    effectiveSale = base as number; // Use original base as the sale price
    isArtificialDiscount = true;
  }

  const hasSale = effectiveSale > 0 && effectiveSale < adjustedBase;

  const rawSavings = hasSale ? adjustedBase - effectiveSale : 0;
  const savingsRounded = Math.round(rawSavings);
  const percent = hasSale && adjustedBase > 0 ? Math.floor((savingsRounded / adjustedBase) * 100) : 0;

  // Structured warning when sale provided but not a discount
  if (typeof sale === 'number' && typeof base === 'number' && sale >= base) {
    console.warn('[pricing] sale_price is not less than base_price', { base_price: base, sale_price: sale });
  }

  return { callForPrice, hasSale, savingsRounded, percent, isArtificialDiscount };
}
