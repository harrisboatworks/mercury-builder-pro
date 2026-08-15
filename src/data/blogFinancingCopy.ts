import financePolicy from './finance-policy.json';

const { minimumCad, dealerplanFeeCad, mercuryPromo } = financePolicy;

/**
 * Canonical customer-facing financing copy for blog articles and FAQ schema.
 * Keep dynamic terms in finance-policy.json and update the review date here
 * whenever the lender program changes or is re-verified.
 */
export const canonicalBlogFinancingCopy =
  `HBW arranges Canadian financing through DealerPlan, primarily with TD Auto Finance. As of August 8, 2026, the TD "Always On" offer is ${mercuryPromo.apr.toFixed(2)}% APR on approved credit through December 31, 2026. ` +
  `The contract term is up to ${financePolicy.contractTermMonths} months, with amortization up to ${financePolicy.maximumAmortizationMonths} months; a balance may remain due at contract maturity when the amortization is longer. ` +
  `The minimum financed amount is $${minimumCad.toLocaleString('en-CA')} CAD, and a $${dealerplanFeeCad} DealerPlan fee applies after HST. Check [current financing terms](/promotions) before relying on any rate or payment estimate.`;

// FAQ schema must remain plain text. Markdown links would leak into FAQPage JSON-LD.
export const canonicalBlogFinancingFaqCopy =
  `Yes. HBW arranges Canadian financing through DealerPlan, primarily with TD Auto Finance. As of August 8, 2026, the TD "Always On" offer is ${mercuryPromo.apr.toFixed(2)}% APR on approved credit through December 31, 2026. ` +
  `The contract term is up to ${financePolicy.contractTermMonths} months, with amortization up to ${financePolicy.maximumAmortizationMonths} months; a balance may remain due at contract maturity when the amortization is longer. ` +
  `The minimum financed amount is $${minimumCad.toLocaleString('en-CA')} CAD, and a $${dealerplanFeeCad} DealerPlan fee applies after HST. Check mercuryrepower.ca/promotions for current terms.`;
