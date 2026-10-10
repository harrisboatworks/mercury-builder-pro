import { financingPurchaseFromQuote } from '@/lib/financing-purchase';

/** Dates cross JSON boundaries, while sensitive fields must be entered again. */
export function prepareFinancingResume<T extends Record<string, any>>(draft: T): T {
  const revivePerson = (person: any) => person && ({
    ...person,
    ...(typeof person.dateOfBirth === 'string' ? { dateOfBirth: new Date(person.dateOfBirth) } : {}),
    ...(person.bankruptcyDetails ? { bankruptcyDetails: reviveBankruptcy(person.bankruptcyDetails) } : {}),
  });
  const reviveBankruptcy = (details: any) => ({ ...details,
    ...(typeof details.date === 'string' ? { date: new Date(details.date) } : {}),
  });
  const applicant = revivePerson(draft.applicant);
  const coApplicant = revivePerson(draft.coApplicant);
  const needsApplicant = !applicant?.sin || !(applicant.dateOfBirth instanceof Date) || !Number.isFinite(applicant.dateOfBirth.getTime());
  const needsCoApplicant = draft.hasCoApplicant && !coApplicant?.sin;
  const requestedStep = draft.currentStep || 1;
  const currentStep = needsApplicant && requestedStep > 2 ? 2 : needsCoApplicant && requestedStep > 5 ? 5 : requestedStep;
  return { ...draft, applicant, coApplicant,
    financial: draft.financial?.bankruptcyDetails
      ? { ...draft.financial, bankruptcyDetails: reviveBankruptcy(draft.financial.bankruptcyDetails) } : draft.financial,
    currentStep,
    completedSteps: (draft.completedSteps || []).filter((step: number) => !(needsApplicant && step === 2) && !(needsCoApplicant && step === 5)),
  };
}

/** A down payment is editable progress; the quote's purchase basis is not. */
export function draftMatchesQuote(purchaseDetails: any, quote: any): boolean {
  if (!purchaseDetails) return false;
  const purchase = financingPurchaseFromQuote(quote);
  const model = quote.motor?.model || quote.selectedMotor?.model || '';
  const draftModel = String(purchaseDetails.motorModel || '').replace(/\s+\([^)]*\)$/, '');
  return draftModel === model
    && purchaseDetails.motorPrice === purchase.motorPrice
    && purchaseDetails.priceBasis === purchase.priceBasis
    && purchaseDetails.includedTradeInValue === purchase.includedTradeInValue
    && purchaseDetails.preTradeSubtotal === purchase.preTradeSubtotal
    && (purchaseDetails.dealerFee ?? purchase.dealerFee) === purchase.dealerFee
    && (purchaseDetails.promoRate ?? null) === (quote.financingAmount?.promoRate ?? quote.frozenPricing?.financingRate ?? quote.selectedPromoRate ?? null)
    && (purchaseDetails.promoTerm ?? null) === (quote.financingAmount?.promoTerm ?? quote.frozenPricing?.financingAmortizationMonths ?? quote.selectedPromoTerm ?? null);
}
