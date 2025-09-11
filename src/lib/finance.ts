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
 * Calculate monthly payment with smart term selection
 */
export const calculateMonthlyPayment = (price: number, promoRate: number | null = null) => {
  const term = getFinancingTerm(price);
  const rate = promoRate || 7.99;  // Use promo rate if exists, otherwise default
  
  const monthlyRate = rate / 100 / 12;
  const payment = price * 
    (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
    (Math.pow(1 + monthlyRate, term) - 1);
  
  return {
    payment: Math.round(payment),
    term: term,
    rate: rate
  };
};

/**
 * Get financing display text based on price and promo rate
 */
export const getFinancingDisplay = (price: number, currentPromoRate: number | null = null) => {
  const { payment, term, rate } = calculateMonthlyPayment(price, currentPromoRate);
  
  // If there's a promo rate active (different from default 7.99%)
  if (currentPromoRate !== null && currentPromoRate < 7.99) {
    if (currentPromoRate === 0) {
      // 0% gets special treatment
      return `$${payment}/mo • ${term} mo • 0% INTEREST`;
    } else if (currentPromoRate < 5) {
      // Low rates get shown
      return `$${payment}/mo • ${term} mo • ${currentPromoRate}% APR`;
    }
  }
  
  // Standard display (no rate shown for regular 7.99%)
  if (term === 120) {
    return `From $${payment}/mo • 10 years`;  // Cleaner than "120 months"
  } else {
    return `From $${payment}/mo • ${term} mo`;
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