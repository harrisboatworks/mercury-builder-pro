export interface PricedQuoteOption {
  id: string;
  base_price: number;
  price_override: number | null;
  is_included: boolean;
}

export function calculateQuoteOptionsTotal(
  options: PricedQuoteOption[],
  selectedIds: ReadonlySet<string>,
  batteryPrice = 0,
): number {
  const selectedOptionsTotal = options.reduce((sum, option) => {
    if (!selectedIds.has(option.id) || option.is_included) return sum;
    return sum + (option.price_override ?? option.base_price);
  }, 0);

  return selectedOptionsTotal + batteryPrice;
}
