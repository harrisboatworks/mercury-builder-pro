import { describe, expect, it } from 'vitest';
import {
  buildPublicQuoteData,
  buildPublicQuoteResponse,
} from '../../supabase/functions/get-shared-quote/public-quote';

/**
 * Top-level keys an anonymous shared-quote probe is allowed to see on
 * quote_data for a consultation-shaped receipt.
 *
 * Intentional strictness: widening this allowlist should require editing
 * this test so a human decides whether the new key is public.
 */
const PUBLIC_CONSULTATION_QUOTE_DATA_KEYS = [
  'accessoryBreakdown',
  'financing',
  'isConsultationSubmitted',
  'motor',
  'pricing',
  'purchasePath',
  'tradeIn',
] as const;

/**
 * Every top-level key buildPublicQuoteData may emit when the stored quote
 * also carries legacy / agent / saved-builder fields. Same strictness as
 * the consultation allowlist: adding a key is a deliberate public-API change.
 */
const PUBLIC_QUOTE_DATA_KEYS = [
  ...PUBLIC_CONSULTATION_QUOTE_DATA_KEYS,
  'accessoryCost',
  'adjustedSubtotal',
  'adminCustomItems',
  'adminDiscount',
  'boatInfo',
  'completedSteps',
  'currentStep',
  'customerName',
  'customerNotes',
  'finalPrice',
  'frozenPricing',
  'fuelTankConfig',
  'hasTradein',
  'hst',
  'installConfig',
  'looseMotorBattery',
  'motorHp',
  'motorId',
  'motorModel',
  'motorMsrp',
  'motorPrice',
  'package',
  'pdfSnapshot',
  'promoId',
  'promoName',
  'promoOption',
  'rebateAmount',
  'rebateCredit',
  'selectedMotor',
  'selectedOptions',
  'selectedPackage',
  'selectedPaymentMethod',
  'selectedPromoOption',
  'selectedPromoRate',
  'selectedPromoTerm',
  'selectedPromoValue',
  'subtotal',
  'totalBeforeDiscount',
  'tradeInCredit',
  'tradeInInfo',
  'uiFlags',
  'warrantyConfig',
  'warrantyCost',
  'warrantyYears',
  'warrantyYearsExtra',
] as const;

/**
 * tradeIn keys copyPrimitives actually keeps (TRADE_KEYS in public-quote.ts).
 * `value` is never re-emitted; consultation receipts map it onto estimatedValue.
 */
const PUBLIC_TRADE_IN_KEYS = [
  'hasTradeIn',
  'brand',
  'year',
  'horsepower',
  'model',
  'condition',
  'estimatedValue',
  'confidenceLevel',
  'engineType',
  'startType',
  'engineHours',
] as const;

const SENTINEL = {
  email: 'LEAK-email@example.com',
  name: 'LEAK-name',
  phone: 'LEAK-phone-5550199',
  quoteNumber: 'LEAK-quoteNumber',
  source: 'LEAK-source',
  adminNotes: 'LEAK-adminNotes',
  conversationId: 'LEAK-conversationId',
  serial: 'LEAK-serial-BOAT',
  dealer: 'LEAK-dealer-cost',
  editingId: 'LEAK-editingQuoteId',
  reportUrl: 'https://LEAK-valuation.example.test/report',
};

const SENTINEL_VALUES = Object.values(SENTINEL);

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value === null || typeof value !== 'object') return keys;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

function leakFields() {
  return {
    email: SENTINEL.email,
    name: SENTINEL.name,
    phone: SENTINEL.phone,
    quoteNumber: SENTINEL.quoteNumber,
    customer: {
      name: SENTINEL.name,
      email: SENTINEL.email,
      phone: SENTINEL.phone,
    },
    customerEmail: SENTINEL.email,
    customerPhone: SENTINEL.phone,
    adminNotes: SENTINEL.adminNotes,
    conversationId: SENTINEL.conversationId,
    editingQuoteId: SENTINEL.editingId,
    isAdminQuote: true,
    customerQuoteId: SENTINEL.editingId,
    valuationReportUrl: SENTINEL.reportUrl,
    unknownFutureField: { secret: SENTINEL.adminNotes },
    dealerCost: SENTINEL.dealer,
    internalCost: SENTINEL.dealer,
  };
}

function leakyMotor() {
  return {
    id: 'motor-1',
    model: 'Mercury 150 FourStroke',
    hp: 150,
    modelYear: 2026,
    serialNumber: SENTINEL.serial,
    dealerPrice: SENTINEL.dealer,
    dealer_price: SENTINEL.dealer,
  };
}

function leakyPricing() {
  return {
    msrp: 19000,
    motorSubtotal: 18000,
    subtotal: 16100,
    hst: 2093,
    totalCashPrice: 18193,
    totalPrice: 18193,
    // Distinctive numbers so a renamed or nested copy still fails the JSON check.
    adminDiscount: 900001,
    discount: 900002,
    savings: 900003,
  };
}

function leakyTradeIn() {
  return {
    hasTradeIn: true,
    brand: 'Mercury',
    year: 2018,
    horsepower: 90,
    model: '90 ELPT',
    condition: 'good',
    estimatedValue: 2500,
    confidenceLevel: 'high',
    engineType: '4-stroke',
    startType: 'electric',
    engineHours: 321,
    value: 900004,
    serialNumber: SENTINEL.serial,
    rangeFinalHigh: 900005,
    rangePrePenaltyLow: 900006,
    penaltyFactor: 0.8,
    valuationReportUrl: SENTINEL.reportUrl,
  };
}

function leakyFinancing() {
  return {
    monthlyPayment: 329,
    amountFinanced: 18193,
    dealerFee: 349,
    rate: 5.99,
    amortizationMonths: 60,
    contractTermMonths: 60,
  };
}

function leakyLineItem() {
  return {
    name: 'Stainless steering kit',
    price: 600,
    description: 'Installed with the repower',
    category: 'equipment',
    internalCost: SENTINEL.dealer,
  };
}

/**
 * Consultation-shaped stored quote plus every identifying / internal field
 * the original share-link incident exposed.
 */
function fullyPopulatedConsultationQuote() {
  return {
    ...leakFields(),
    source: 'consultation-submit',
    purchasePath: 'installed',
    motor: leakyMotor(),
    pricing: leakyPricing(),
    accessoryBreakdown: [leakyLineItem()],
    accessories: [{ name: SENTINEL.adminNotes, price: 1, internalCost: SENTINEL.dealer }],
    financing: leakyFinancing(),
    tradeIn: leakyTradeIn(),
  };
}

function fullyPopulatedInternalQuote() {
  return {
    ...fullyPopulatedConsultationQuote(),
    customerName: 'Pat Boater',
    customerNotes: 'Call before pickup',
    motorId: 'motor-1',
    motorModel: 'Mercury 150 FourStroke',
    motorHp: 150,
    motorMsrp: 19000,
    motorPrice: 18000,
    hasTradein: true,
    selectedPromoOption: 'cash_rebate',
    selectedPromoRate: 0,
    selectedPromoTerm: 0,
    selectedPromoValue: 500,
    selectedPaymentMethod: 'cash',
    promoOption: 'cash_rebate',
    promoName: 'Spring rebate',
    promoId: 'promo-1',
    rebateAmount: 500,
    warrantyYears: 3,
    warrantyYearsExtra: 0,
    package: 'installed',
    currentStep: 4,
    adminDiscount: 250,
    subtotal: 16100,
    warrantyCost: 0,
    accessoryCost: 600,
    tradeInCredit: 2500,
    rebateCredit: 500,
    adjustedSubtotal: 16100,
    hst: 2093,
    totalBeforeDiscount: 18600,
    finalPrice: 18193,
    selectedMotor: leakyMotor(),
    boatInfo: {
      type: 'Fishing',
      make: 'Example',
      model: 'Pro',
      serialNumber: SENTINEL.serial,
      tradeIn: leakyTradeIn(),
    },
    tradeInInfo: leakyTradeIn(),
    fuelTankConfig: { externalTank: true, secret: SENTINEL.adminNotes },
    installConfig: { controls: 'existing', installationCost: 450 },
    looseMotorBattery: { wantsBattery: false, batteryCost: 0, decision: 'skip' },
    warrantyConfig: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 },
    selectedOptions: [{
      id: 'opt-1',
      optionId: 'controls',
      name: 'Controls',
      price: 1200,
      category: 'controls',
      assignmentType: 'required',
      isIncluded: false,
      internalCost: SENTINEL.dealer,
    }],
    selectedPackage: { id: 'installed', label: 'Installed', priceBeforeTax: 450 },
    adminCustomItems: [leakyLineItem()],
    frozenPricing: {
      motorMSRP: 19000,
      adminDiscount: 250,
      total: 18193,
      adminNotes: SENTINEL.adminNotes,
    },
    pdfSnapshot: {
      version: 1,
      createdAt: '2026-08-09T12:00:00.000Z',
      purchasePath: 'installed',
      customerNotes: 'Call before pickup',
      customerEmail: SENTINEL.email,
      motor: leakyMotor(),
      pricing: leakyPricing(),
      accessoryBreakdown: [leakyLineItem()],
      tradeInInfo: leakyTradeIn(),
    },
    uiFlags: { motorOnlyExpress: false, suppressAdditionalPromoSavings: false, secret: SENTINEL.adminNotes },
    completedSteps: [1, 2, 3, 'bad'],
  };
}

function assertNoSentinels(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const sentinel of SENTINEL_VALUES) {
    expect(serialized).not.toContain(sentinel);
  }
}

describe('public shared quote sentinel contract', () => {
  it('strips identifying sentinels and pins the consultation quote_data allowlist', () => {
    const result = buildPublicQuoteData(fullyPopulatedConsultationQuote());

    expect(Object.keys(result).sort()).toEqual([...PUBLIC_CONSULTATION_QUOTE_DATA_KEYS].sort());
    expect(result.isConsultationSubmitted).toBe(true);
    expect(result.purchasePath).toBe('installed');

    const publicKeys = collectKeys(result);
    for (const forbidden of [
      'email',
      'phone',
      'customer',
      'customerEmail',
      'customerPhone',
      'customerName',
      'quoteNumber',
      'source',
      'adminNotes',
      'conversationId',
      'editingQuoteId',
      'isAdminQuote',
      'customerQuoteId',
      'serialNumber',
      'dealerPrice',
      'dealer_price',
      'internalCost',
      'unknownFutureField',
      'accessories',
      'totalPrice',
      'value',
      'valuationReportUrl',
      'rangeFinalHigh',
      'rangePrePenaltyLow',
      'penaltyFactor',
    ]) {
      expect(publicKeys).not.toContain(forbidden);
    }

    // These were the internal money keys from the original share-link incident.
    // They must not reappear as top-level quote_data fields. Nested pricing
    // still allowlists them as customer-visible receipt figures (PRICING_KEYS).
    expect(result).not.toHaveProperty('adminDiscount');
    expect(result).not.toHaveProperty('discount');
    expect(result).not.toHaveProperty('savings');

    // tradeIn: pin what public-quote.ts actually keeps. `value` is internal
    // and is never re-emitted; estimatedValue is the customer-visible credit.
    expect(result.tradeIn).toEqual({
      hasTradeIn: true,
      brand: 'Mercury',
      year: 2018,
      horsepower: 90,
      model: '90 ELPT',
      condition: 'good',
      estimatedValue: 2500,
      confidenceLevel: 'high',
      engineType: '4-stroke',
      startType: 'electric',
      engineHours: 321,
    });
    expect(Object.keys(result.tradeIn as object).sort()).toEqual([...PUBLIC_TRADE_IN_KEYS].sort());

    const serialized = JSON.stringify(result);
    assertNoSentinels(result);
    expect(serialized).not.toContain('900004');
    expect(serialized).not.toContain('900005');
    expect(serialized).not.toContain('900006');
  });

  it('keeps the HTTP wrapper on an exact key set and never serializes sentinels', () => {
    const response = buildPublicQuoteResponse({
      id: '11111111-1111-4111-8111-111111111111',
      quoteData: fullyPopulatedConsultationQuote(),
    });

    // Intentional strictness: adding a wrapper key is a public-API change.
    expect(Object.keys(response).sort()).toEqual([
      'customer_name',
      'customer_notes',
      'id',
      'quote_data',
    ]);
    expect(Object.keys(response.quote_data).sort()).toEqual(
      [...PUBLIC_CONSULTATION_QUOTE_DATA_KEYS].sort(),
    );
    expect(response.customer_name).toBe('');
    expect(response.customer_notes).toBe('');
    assertNoSentinels(response);
  });

  it('pins every key buildPublicQuoteData may emit from a fully populated quote', () => {
    const result = buildPublicQuoteData(fullyPopulatedInternalQuote());

    expect(Object.keys(result).sort()).toEqual([...PUBLIC_QUOTE_DATA_KEYS].sort());
    assertNoSentinels(result);

    const publicKeys = collectKeys(result);
    for (const forbidden of [
      'email',
      'phone',
      'customer',
      'customerEmail',
      'customerPhone',
      'quoteNumber',
      'source',
      'adminNotes',
      'conversationId',
      'serialNumber',
      'dealerPrice',
      'value',
      'unknownFutureField',
    ]) {
      expect(publicKeys).not.toContain(forbidden);
    }

    expect(result.customerName).toBe('Pat Boater');
    expect(result.tradeIn).not.toHaveProperty('value');
    expect((result.tradeIn as { estimatedValue?: unknown }).estimatedValue).toBe(2500);
  });
});
