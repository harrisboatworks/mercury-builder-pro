import { CONSULTATION_SUBMITTED_QUOTE_SOURCE } from '@/lib/submitted-quote';

const cad = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

export const SUBMITTED_QUOTE_CAD = cad;

/** Exact stored receipt: 150HP, MSRP 19000, motor 18000, prop 0, accessory 600, trade-in 2500. */
export function exactSubmittedConsultationQuote() {
  return {
    source: CONSULTATION_SUBMITTED_QUOTE_SOURCE,
    quoteNumber: 'HBW-150193',
    customerQuoteId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    validUntil: '2026-10-05',
    motor: {
      model: 'Mercury 150 FourStroke',
      hp: 150,
      modelYear: 2026,
      category: 'FourStroke',
    },
    pricing: {
      msrp: 19000,
      discount: 1000,
      motorSubtotal: 18000,
      subtotal: 16100,
      hst: 2093,
      totalPrice: 18193,
    },
    accessories: [
      { name: 'Propeller: Use Existing', price: 0, description: 'Keep the current propeller', category: 'equipment' },
      { name: 'Stainless steering kit', price: 600, description: 'Installed with the repower', category: 'equipment' },
    ],
    tradeIn: {
      value: 2500,
      year: 2018,
      brand: 'Mercury',
      model: '90 ELPT',
    },
    financing: {
      monthlyPayment: 329,
      amountFinanced: 18193,
      dealerFee: 349,
      rate: 5.99,
      amortizationMonths: 60,
      contractTermMonths: 60,
    },
    customer: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+19055550193' },
    customerNotes: 'Keep the existing gauges.',
  };
}

/** Stored receipt whose cash total was rounded to the nearest dollar. */
export function roundedSubmittedConsultationQuote() {
  return {
    source: CONSULTATION_SUBMITTED_QUOTE_SOURCE,
    quoteNumber: 'HBW-184559',
    customerQuoteId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    validUntil: '2026-09-24',
    motor: {
      model: 'Mercury 150 FourStroke',
      hp: 150,
      modelYear: 2026,
    },
    pricing: {
      msrp: 18000,
      discount: 1200,
      motorSubtotal: 16550,
      subtotal: 16335,
      hst: 2123.55,
      totalPrice: 18459,
    },
    accessories: [
      { name: 'Control Adaptor Harness', price: 125, description: 'Keeps existing controls', category: 'equipment' },
      { name: 'Professional Installation', price: 450, description: 'Shop rigging and Lake Test', category: 'installation' },
      { name: 'Propeller: Use Existing', price: 0, category: 'equipment' },
    ],
    tradeIn: {
      value: 790,
      year: 2014,
      brand: 'Mercury',
      model: 'ELPT',
    },
    customer: { name: 'Jay Harris', email: 'jay@example.com', phone: '+19053766208' },
  };
}

export function legacySavedQuote() {
  return {
    motor: {
      id: 'motor-90',
      model: '90 ELPT FourStroke',
      hp: 90,
      price: 12400,
      msrp: 13200,
    },
    selectedPackage: { id: 'installed', label: 'Installed', priceBeforeTax: 450 },
    customerName: 'Pat Boater',
    customerEmail: 'pat@example.com',
    customerPhone: '905-555-0100',
  };
}
