/**
 * Get smart financing term based on price
 */
export const getFinancingTerm = (price: number): number => {
  if (price < 5000) return 36;          // Under $5k = 36 months
  if (price < 10000) return 48;         // $5k-10k = 48 months  
  if (price < 20000) return 60;         // $10k-20k = 60 months
  return 120;                           // Over $20k = 120 months
};

/**
 * Payment frequency options
 */
export type PaymentFrequency = 'monthly' | 'bi-weekly' | 'weekly';

/**
 * Get payment frequency multiplier (payments per year)
 */
export const getPaymentFrequencyMultiplier = (frequency: PaymentFrequency): number => {
  switch (frequency) {
    case 'weekly': return 52;
    case 'bi-weekly': return 26;
    case 'monthly': return 12;
    default: return 12;
  }
};

/**
 * Calculate payment for any frequency with smart term selection
 */
export const calculatePaymentWithFrequency = (
  price: number, 
  frequency: PaymentFrequency = 'monthly',
  promoRate: number | null = null
) => {
  const termMonths = getFinancingTerm(price);
  const rate = promoRate || 7.99;
  const paymentsPerYear = getPaymentFrequencyMultiplier(frequency);
  
  // Convert term to payment periods for the selected frequency
  const termPeriods = Math.round((termMonths / 12) * paymentsPerYear);
  
  const periodRate = rate / 100 / paymentsPerYear;
  const payment = price * 
    (periodRate * Math.pow(1 + periodRate, termPeriods)) / 
    (Math.pow(1 + periodRate, termPeriods) - 1);
  
  return {
    payment: Math.round(payment),
    termMonths: termMonths,
    termPeriods: termPeriods,
    rate: rate,
    frequency: frequency
  };
};

/**
 * Calculate monthly payment with smart term selection (backward compatibility)
 */
export const calculateMonthlyPayment = (price: number, promoRate: number | null = null) => {
  return calculatePaymentWithFrequency(price, 'monthly', promoRate);
};

/**
 * Get financing display text based on price and promo rate
 */
export const getFinancingDisplay = (price: number, currentPromoRate: number | null = null) => {
  const { payment, termMonths, rate } = calculateMonthlyPayment(price, currentPromoRate);
  
  // If there's a promo rate active (different from default 7.99%)
  if (currentPromoRate !== null && currentPromoRate < 7.99) {
    if (currentPromoRate === 0) {
      // 0% gets special treatment
      return `$${payment}/mo • ${termMonths} mo • 0% INTEREST`;
    } else if (currentPromoRate < 5) {
      // Low rates get shown
      return `$${payment}/mo • ${termMonths} mo • ${currentPromoRate}% APR`;
    }
  }
  
  // Standard display (no rate shown for regular 7.99%)
  if (termMonths === 120) {
    return `From $${payment}/mo • 10 years`;  // Cleaner than "120 months"
  } else {
    return `From $${payment}/mo • ${termMonths} mo`;
  }
};

/**
 * Legacy function for backward compatibility
 */
export const calculateMonthly = (amount: number, rate = 7.99, termMonths = 60) => {
  const r = rate / 100 / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r) / (1 - Math.pow(1 + r, -termMonths));
};

export const daysUntil = (iso: string | Date) => {
  const now = new Date();
  const end = new Date(iso);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
};

export type QuoteData = {
  msrp: number;
  discount: number;     // positive number (subtract from MSRP)
  promoValue: number;   // positive number (subtract from MSRP)
  subtotal: number;     // before tax
  tax: number;
  total: number;
};

export const computeTotals = (d: QuoteData) => {
  const savings = (d.discount || 0) + (d.promoValue || 0);
  return { ...d, savings };
};