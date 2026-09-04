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
 * Ontario HST applied to the motor price before the DealerPlan fee.
 */
export const ONTARIO_HST_RATE = 0.13;

/**
 * Lender contract and maximum amortization limits disclosed to customers.
 */
export const FINANCING_CONTRACT_TERM_MONTHS = financePolicy.contractTermMonths;
export const FINANCING_MAXIMUM_AMORTIZATION_MONTHS = financePolicy.maximumAmortizationMonths;

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
 * Promo end date, including the Ontario UTC offset. After this instant,
 * helpers below revert to the standard tier rate. Update on renewal.
 */
export const MERCURY_PROMO_END_ISO = financePolicy.mercuryPromo.endsAt;

const toTimestamp = (value: number | Date): number =>
  value instanceof Date ? value.getTime() : value;

/**
 * Whether the standing Mercury promotion is still active at a given instant.
 * The optional instant keeps expiry behavior deterministic in tests and build
 * tooling without duplicating the policy deadline.
 */
export const isMercuryPromoActive = (
  now: number | Date = Date.now(),
): boolean => toTimestamp(now) <= new Date(MERCURY_PROMO_END_ISO).getTime();

/**
 * Current standing Mercury financing rate (APR, % units).
 * Single source of truth for content surfaces (blog tokens, marketing copy)
 * that need ONE headline rate, separate from per-quote promo lookup.
 * Returns the active promo while live, otherwise the post-promo standard rate.
 */
export const getCurrentMercuryFinancingRate = (): number => {
  return isMercuryPromoActive()
    ? MERCURY_PROMO_APR
    : financePolicy.standardApr.atLeast10000;
};

/**
 * Build the financing FAQ answer used by compact knowledge indexes. After the
 * promotion expires, describe both standard tiers instead of inserting one
 * fallback APR into dated promotional copy.
 */
export const getFinancingHeadlineFaqAnswer = (
  now: number | Date = Date.now(),
): string => {
  const lenderDisclosure =
    'HBW arranges applications through DealerPlan, primarily with TD Auto Finance; the signed lender disclosure controls the actual approval and terms.';

  if (isMercuryPromoActive(now)) {
    const promoEnd = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Toronto',
    }).format(new Date(MERCURY_PROMO_END_ISO));
    return `The current headline rate is ${formatFinancingRate(MERCURY_PROMO_APR)} through ${promoEnd} on eligible purchases (OAC). ${lenderDisclosure}`;
  }

  return `Standard financing rates are tiered by amount: ${formatFinancingRate(financePolicy.standardApr.under10000)} below $10,000 and ${formatFinancingRate(financePolicy.standardApr.atLeast10000)} at $10,000 or more (OAC). ${lenderDisclosure}`;
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
  return isMercuryPromoActive()
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

const PRICING_ASOF_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format an ISO "YYYY-MM-DD" date as an English month and year, e.g.
 * "2026-07-14" -> "July 2026". Built from the string parts so the result
 * never shifts with the runtime timezone. Non-ISO input passes through
 * unchanged.
 */
export const formatPricingAsOf = (dateModified: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateModified || ''));
  if (!match) return dateModified;
  const month = PRICING_ASOF_MONTHS[Number(match[2]) - 1];
  if (!month) return dateModified;
  return `${month} ${match[1]}`;
};

/**
 * Substitute live tokens in arbitrary text. Single chokepoint that
 * any rendering surface (markdown content, plain-text descriptions, FAQ
 * answers) can call to inject the current Mercury financing rate.
 *
 *   {{LIVE_RATE}}      -> "5.48% APR"
 *   {{LIVE_RATE_PCT}}  -> "5.48%"
 *   {{PRICING_ASOF}}   -> "July 2026" (from the article's dateModified)
 */
export const substituteLiveRateTokens = (
  text: string,
  options: { dateModified?: string } = {},
): string => {
  if (!text) return text;
  let out = text
    .replace(/\{\{LIVE_RATE\}\}/g, formatFinancingRate())
    .replace(/\{\{LIVE_RATE_PCT\}\}/g, formatFinancingRatePercent());
  if (options.dateModified) {
    out = out.replace(/\{\{PRICING_ASOF\}\}/g, formatPricingAsOf(options.dateModified));
  }
  return out;
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
  const rate = promoRate !== null && Number.isFinite(promoRate) && promoRate >= 0
    ? promoRate
    : defaultRate;
  const paymentsPerYear = getPaymentFrequencyMultiplier(frequency);
  
  // Convert term to payment periods for the selected frequency
  const termPeriods = Math.round((termMonths / 12) * paymentsPerYear);
  
  const periodRate = rate / 100 / paymentsPerYear;
  const payment = periodRate === 0
    ? price / termPeriods
    : price
      * (periodRate * Math.pow(1 + periodRate, termPeriods))
      / (Math.pow(1 + periodRate, termPeriods) - 1);
  
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

export type MotorFinancingEstimate = ReturnType<typeof calculateMonthlyPayment> & {
  amountFinanced: number;
};

/**
 * Build the monthly estimate shown beside a bare-motor price.
 *
 * Eligibility is checked against the before-tax motor price. The payment is
 * then amortized on the motor price plus Ontario HST and the mandatory
 * DealerPlan fee. A finite, non-negative supplied APR keeps the card and its
 * page disclosure aligned; otherwise the current standing/tiered rate applies.
 */
export const calculateMotorFinancingEstimate = (
  motorPrice: number,
  annualRate: number | null = null,
): MotorFinancingEstimate | null => {
  if (!Number.isFinite(motorPrice) || motorPrice < FINANCING_MINIMUM) {
    return null;
  }

  const amountFinanced = motorPrice * (1 + ONTARIO_HST_RATE) + DEALERPLAN_FEE;
  const effectiveRate = annualRate !== null && Number.isFinite(annualRate) && annualRate >= 0
    ? annualRate
    : getMotorCalculatorApr(amountFinanced);

  return {
    ...calculateMonthlyPayment(amountFinanced, effectiveRate),
    amountFinanced,
  };
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
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const dateOnly = typeof iso === 'string'
    ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    : null;
  let end: Date;

  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const monthIndex = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    end = new Date(0);
    end.setFullYear(year, monthIndex, day);
    end.setHours(23, 59, 59, 999);

    // Date normalizes impossible values (for example, February 30) into a
    // different day. Preserve the previous invalid-input behavior instead of
    // turning a malformed promotion date into a future countdown.
    if (
      end.getFullYear() !== year
      || end.getMonth() !== monthIndex
      || end.getDate() !== day
    ) {
      return Number.NaN;
    }

    // A date-only deadline represents an inclusive local calendar day. Convert
    // the local date parts to UTC day numbers so 23/25-hour DST days still count
    // exactly once.
    const endDay = new Date(0);
    endDay.setUTCFullYear(year, monthIndex, day);
    endDay.setUTCHours(0, 0, 0, 0);
    const nowDay = new Date(0);
    nowDay.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    nowDay.setUTCHours(0, 0, 0, 0);

    return Math.max(0, ((endDay.getTime() - nowDay.getTime()) / millisecondsPerDay) + 1);
  } else {
    end = new Date(iso);
  }

  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / millisecondsPerDay));
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
