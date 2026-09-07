import financePolicy from './finance-policy.json';
import {
  formatFinancingRate,
  getDefaultFinancingRate,
  isMercuryPromoActive,
  MERCURY_PROMO_APR,
  MERCURY_PROMO_END_ISO,
} from '../lib/finance';

const { minimumCad, dealerplanFeeCad } = financePolicy;

const financingRateSentence = (now: number | Date): string => {
  if (isMercuryPromoActive(now)) {
    const promoEnd = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Toronto',
    }).format(new Date(MERCURY_PROMO_END_ISO));
    return `As of August 8, 2026, the TD "Always On" offer is ${formatFinancingRate(MERCURY_PROMO_APR)} on approved credit through ${promoEnd}.`;
  }

  return `Standard financing rates are tiered by amount: ${formatFinancingRate(getDefaultFinancingRate(minimumCad))} below $10,000 and ${formatFinancingRate(getDefaultFinancingRate(10_000))} at $10,000 or more (OAC).`;
};

/**
 * Canonical customer-facing financing copy for blog articles and FAQ schema.
 * Keep dynamic terms in finance-policy.json and update the review date here
 * whenever the lender program changes or is re-verified.
 */
export const buildCanonicalBlogFinancingCopy = (
  now: number | Date = Date.now(),
): string =>
  `HBW arranges Canadian financing through DealerPlan, primarily with TD Auto Finance. ${financingRateSentence(now)} ` +
  `The contract term is up to ${financePolicy.contractTermMonths} months, with amortization up to ${financePolicy.maximumAmortizationMonths} months; a balance may remain due at contract maturity when the amortization is longer. ` +
  `The minimum financed amount is $${minimumCad.toLocaleString('en-CA')} CAD, and a $${dealerplanFeeCad} DealerPlan fee applies after HST. Check [current financing terms](/promotions) before relying on any rate or payment estimate.`;

// FAQ schema must remain plain text. Markdown links would leak into FAQPage JSON-LD.
export const buildCanonicalBlogFinancingFaqCopy = (
  now: number | Date = Date.now(),
): string =>
  `Yes. HBW arranges Canadian financing through DealerPlan, primarily with TD Auto Finance. ${financingRateSentence(now)} ` +
  `The contract term is up to ${financePolicy.contractTermMonths} months, with amortization up to ${financePolicy.maximumAmortizationMonths} months; a balance may remain due at contract maturity when the amortization is longer. ` +
  `The minimum financed amount is $${minimumCad.toLocaleString('en-CA')} CAD, and a $${dealerplanFeeCad} DealerPlan fee applies after HST. Check mercuryrepower.ca/promotions for current terms.`;

export const canonicalBlogFinancingCopy = buildCanonicalBlogFinancingCopy();
export const canonicalBlogFinancingFaqCopy = buildCanonicalBlogFinancingFaqCopy();
