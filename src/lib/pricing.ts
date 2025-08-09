export type PriceDisplayState = {
  callForPrice: boolean;
  hasSale: boolean;
  savingsRounded: number; // nearest dollar
  percent: number; // floored percent
};

export function getPriceDisplayState(base_price?: number | null, sale_price?: number | null): PriceDisplayState {
  const base = typeof base_price === 'number' ? base_price : undefined;
  const sale = typeof sale_price === 'number' ? sale_price : undefined;

  const callForPrice = !(typeof base === 'number' && base > 0);

  if (callForPrice) {
    return { callForPrice: true, hasSale: false, savingsRounded: 0, percent: 0 };
  }

  const hasSale = typeof sale === 'number' && sale > 0 && sale < (base as number);

  const rawSavings = hasSale ? (base as number) - (sale as number) : 0;
  const savingsRounded = Math.round(rawSavings);
  const percent = hasSale && base! > 0 ? Math.floor((savingsRounded / base!) * 100) : 0;

  // Structured warning when sale provided but not a discount
  if (typeof sale === 'number' && typeof base === 'number' && sale >= base) {
    console.warn('[pricing] sale_price is not less than base_price', { base_price: base, sale_price: sale });
  }

  return { callForPrice, hasSale, savingsRounded, percent };
}
