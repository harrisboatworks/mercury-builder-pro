import { describe, expect, it } from 'vitest';
import { draftMatchesQuote, prepareFinancingResume } from './financing-draft';
import { financingPurchaseFromQuote } from './financing-purchase';

describe('financing draft resumption', () => {
  it('returns to applicant details after private fields were removed from local storage', () => {
    const draft = prepareFinancingResume({ currentStep: 7, completedSteps: [1, 2, 3, 4, 6], applicant: { firstName: 'Test' } });
    expect(draft.currentStep).toBe(2);
    expect(draft.completedSteps).toEqual([1, 3, 4, 6]);
  });
  it('revives JSON dates and requires a server draft SIN to be entered again', () => {
    const draft = prepareFinancingResume({ currentStep: 7, completedSteps: [1, 2, 3, 4, 5, 6], applicant: { dateOfBirth: '1980-01-01' }, financial: { bankruptcyDetails: { date: '2015-01-01' } } });
    expect(draft.applicant.dateOfBirth).toBeInstanceOf(Date);
    expect(draft.financial.bankruptcyDetails.date).toBeInstanceOf(Date);
    expect(draft.currentStep).toBe(2);
  });
  it('requires co-applicant re-entry after the primary applicant is complete', () => {
    const draft = prepareFinancingResume({ currentStep: 7, completedSteps: [1, 2, 3, 4, 5, 6], applicant: { dateOfBirth: new Date('1980-01-01'), sin: '000000000' }, hasCoApplicant: true, coApplicant: { dateOfBirth: '1982-01-01' } });
    expect(draft.currentStep).toBe(5);
    expect(draft.completedSteps).not.toContain(5);
  });
  it('preserves a matching quote draft down payment but rejects a changed quote', () => {
    const quote = { motor: { model: 'Synthetic tiller', msrp: 10000, price: 10000 }, frozenPricing: { subtotal: 10000, total: 11300.25, dealerFee: 199.50, financingRate: 0, financingAmortizationMonths: 48 } };
    const purchase = { ...financingPurchaseFromQuote(quote), motorModel: 'Synthetic tiller (Configured Quote)', downPayment: 200, promoRate: 0, promoTerm: 48 };
    expect(draftMatchesQuote(purchase, quote)).toBe(true);
    expect(draftMatchesQuote(purchase, { ...quote, frozenPricing: { ...quote.frozenPricing, total: 11301.25 } })).toBe(false);
  });
});
