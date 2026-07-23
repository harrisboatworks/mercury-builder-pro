interface FinancingApplicationLinkData {
  price: number;
  motorModel?: string;
}

export function getFinancingApplicationUrl(
  data: FinancingApplicationLinkData,
  dealerplanFee: number,
): string {
  const financingParams = new URLSearchParams();
  if (data.motorModel) financingParams.set('motorModel', data.motorModel);
  if (data.price > 0) {
    const allInTotal = Math.round((data.price * 1.13 + dealerplanFee) * 100) / 100;
    financingParams.set('motorPrice', allInTotal.toString());
  }

  const query = financingParams.toString();
  return `/financing-application${query ? `?${query}` : ''}`;
}
