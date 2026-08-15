import financePolicy from '@/data/finance-policy.json';

/**
 * Minimum amount eligible for financing
 */
export const FINANCING_MINIMUM = financePolicy.minimumCad;

/**
 * Dealerplan processing fee (mandatory for all financed purchases)
 */
export const DEALERPLAN_FEE = financePolicy.dealerplanFeeCad;

/**
 * Get default financing rate based on price tier
 * Under $10,000: 8.99% APR
 * $10,000 and up: 7.99% APR
 */
export const getDefaultFinancingRate = (price: number): number => {
  return price < 10000
    ? financePolicy.standardApr.under10000
    : financePolicy.standardApr.atLeast10000;
};

/**
 * Mercury Canada TD "Always On" promotional financing rate (APR, % units).
 * Headline rate quoted across the site. Update here to update everywhere.
 */
export const MERCURY_PROMO_APR = financePolicy.mercuryPromo.apr;

/**
 * Promo end date (local). After this instant, helpers below revert to the
 * standard tier rate (7.99% APR). Update on renewal.
 */
export const MERCURY_PROMO_END_ISO = financePolicy.mercuryPromo.endsAt;

/**
 * Current standing Mercury financing rate (APR, % units).
 * Single source of truth for content surfaces (blog tokens, marketing copy)
 * that need ONE headline rate, separate from per-quote promo lookup.
 * Returns the active promo while live, otherwise the post-promo standard rate.
 */
export const getCurrentMercuryFinancingRate = (): number => {
  const now = Date.now();
  const end = new Date(MERCURY_PROMO_END_ISO).getTime();
  return now <= end ? MERCURY_PROMO_APR : financePolicy.standardApr.atLeast10000;
};

/**
 * Resolve the APR shown by the motor-detail calculator. A financing option the
 * customer explicitly selected takes precedence; otherwise the current
 * standing Mercury offer is used until expiry, with the normal price tier as
 * the ceiling and post-promo fallback.
 */
export const getMotorCalculatorApr = (
  amount: number,
  selectedPromoRate: number | null = null,
): number => {
  const tieredRate = getDefaultFinancingRate(amount);
  if (selectedPromoRate !== null && selectedPromoRate < tieredRate) {
    return selectedPromoRate;
  }
  const standingOfferActive = Date.now() <= new Date(MERCURY_PROMO_END_ISO).getTime();
  return standingOfferActive
    ? Math.min(getCurrentMercuryFinancingRate(), tieredRate)
    : tieredRate;
};

/**
 * Format a financing rate for display, e.g. "5.48% APR".
 * Defaults to getCurrentMercuryFinancingRate().
 */
export const formatFinancingRate = (rate?: number): string => {
  const r = rate ?? getCurrentMercuryFinancingRate();
  return `${r.toFixed(2)}% APR`;
};

/**
 * Format a financing rate as just a percentage, e.g. "5.48%".
 * Defaults to getCurrentMercuryFinancingRate().
 */
export const formatFinancingRatePercent = (rate?: number): string => {
  const r = rate ?? getCurrentMercuryFinancingRate();
  return `${r.toFixed(2)}%`;
};

/**
 * Substitute live-rate tokens in arbitrary text. Single chokepoint that
 * any rendering surface (markdown content, plain-text descriptions, FAQ
 * answers) can call to inject the current Mercury financing rate.
 *
 *   {{LIVE_RATE}}      -> "5.48% APR"
 *   {{LIVE_RATE_PCT}}  -> "5.48%"
 */
export const substituteLiveRateTokens = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\{\{LIVE_RATE\}\}/g, formatFinancingRate())
    .replace(/\{\{LIVE_RATE_PCT\}\}/g, formatFinancingRatePercent());
};




/**
 * Get smart financing term based on price
 */
export const getFinancingTerm = (price: number): number => {
  if (price < 10000) return 48;          // Under $10k = 48 months (4 years)
  if (price < 20000) return 60;          // $10k-20k = 60 months (5 years)
  if (price < 30000) return 72;          // $20k-30k = 72 months (6 years)
  if (price < 50000) return 84;          // $30k-50k = 84 months (7 years)
  if (price < 100000) return 120;        // $50k-100k = 120 months (10 years)
  return 120;                            // $100k+ = 120 months (10-20 years available)
};

/**
 * Get 3 financing term options based on price (lower, recommended, higher)
 */
export const getFinancingTermOptions = (price: number): number[] => {
  const recommendedTerm = getFinancingTerm(price);
  
  // Define adjacent terms for each tier
  if (price < 10000) {
    return [36, 48, 60];  // 3, 4, 5 years
  } else if (price < 20000) {
    return [48, 60, 72];  // 4, 5, 6 years
  } else if (price < 30000) {
    return [60, 72, 84];  // 5, 6, 7 years
  } else if (price < 50000) {
    return [72, 84, 120]; // 6, 7, 10 years
  } else if (price < 100000) {
    return [84, 120, 180]; // 7, 10, 15 years
  } else {
    return [120, 180, 240]; // 10, 15, 20 years
  }
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
  promoRate: number | null = null,
  termMonthsOverride: number | null = null
) => {
  const termMonths = termMonthsOverride || getFinancingTerm(price);
  const defaultRate = getDefaultFinancingRate(price);
  const rate = promoRate || defaultRate;
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
 * Calculate monthly payment with smart term selection (backward compatibility).
 * Accepts an optional term override so a customer-selected promo term
 * (e.g. 2.99% for 24 months) drives the payment math instead of the
 * price-tier default.
 */
export const calculateMonthlyPayment = (
  price: number,
  promoRate: number | null = null,
  termMonthsOverride: number | null = null,
) => {
  return calculatePaymentWithFrequency(price, 'monthly', promoRate, termMonthsOverride);
};

/**
 * Get financing display text based on price and promo rate
 */
export const getFinancingDisplay = (price: number, currentPromoRate: number | null = null) => {
  const { payment, termMonths, rate } = calculateMonthlyPayment(price, currentPromoRate);
  const defaultRate = getDefaultFinancingRate(price);
  
  // If there's a promo rate active (different from tiered default)
  if (currentPromoRate !== null && currentPromoRate < defaultRate) {
    if (currentPromoRate === 0) {
      // 0% gets special treatment
      return `$${payment}/mo • ${termMonths} mo • 0% INTEREST`;
    } else if (currentPromoRate < 5) {
      // Low rates get shown
      return `$${payment}/mo • ${termMonths} mo • ${currentPromoRate}% APR`;
    }
  }
  
  // Standard display (no rate shown for regular 7.99%)
  if (termMonths === 180) {
    return `From $${payment}/mo • 15 years`;
  } else if (termMonths === 120) {
    return `From $${payment}/mo • 10 years`;
  } else if (termMonths === 84) {
    return `From $${payment}/mo • 7 years`;
  } else if (termMonths === 72) {
    return `From $${payment}/mo • 6 years`;
  } else {
    return `From $${payment}/mo • ${termMonths} mo`;
  }
};

/**
 * Legacy function for backward compatibility
 */
export const calculateMonthly = (amount: number, rate?: number, termMonths = 60) => {
  const effectiveRate = rate ?? getDefaultFinancingRate(amount);
  const r = effectiveRate / 100 / 12;
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
