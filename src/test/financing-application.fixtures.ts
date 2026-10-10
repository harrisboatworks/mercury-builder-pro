// Synthetic local test data. Never submit this fixture to a live lender service.
export const completeFinancingFixture = () => ({
  purchaseDetails: { motorModel: 'Synthetic 60 HP tiller', motorPrice: 17252.23, downPayment: 0, tradeInValue: 0, amountToFinance: 17252.23, preferredTerm: '60' as const },
  applicant: { firstName: 'Test', lastName: 'Applicant', dateOfBirth: new Date('1980-01-01T12:00:00Z'), sin: '000000000', email: 'applicant@example.invalid', primaryPhone: '9055550100', currentAddress: { street: '123 Test Street', city: 'Test Town', province: 'Ontario', postalCode: 'K1A0B1', timeAtAddress: '5+' as const }, housingStatus: 'own' as const, monthlyHousingPayment: 1000 },
  employment: { status: 'retired' as const, annualIncome: 60000 },
  financial: { creditScoreEstimate: 'good' as const, monthlyHousingPayment: 1000, bankName: 'Test Bank', accountType: 'chequing' as const, timeWithBank: '5+' as const, hasBankruptcy: false },
  coApplicant: null,
  references: { reference1: { fullName: 'First Reference', relationship: 'Friend', phone: '9055550101', howLongKnown: '10+' as const }, reference2: { fullName: 'Second Reference', relationship: 'Friend', phone: '9055550102', howLongKnown: '10+' as const } },
  consent: { creditCheckConsent: true, accuracyConfirmation: true, termsAgreement: true, signature: 'Test Applicant', signatureDate: new Date() },
});
