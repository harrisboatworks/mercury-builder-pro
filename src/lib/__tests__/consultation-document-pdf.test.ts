import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_PDF_FINANCING_DISCLAIMER,
  buildConsultationQuotePdfLines,
  consultationFinancingTermsLine,
  consultationInspectionCaveat,
  formatConsultationCad,
  renderConsultationQuotePdf,
} from '../../../supabase/functions/_shared/consultation-document-pdf.ts';
import { consultationSubmitDeliverySnapshot, validateQuotePdf } from '../../../supabase/functions/_shared/consultation-document-policy.ts';
import {
  buildConsultationSavedQuoteState,
  consultationSnapshotFromAuthoritativeQuote,
  mergeConsultationDeliverySnapshot,
  parseConsultationCallerQuoteSnapshot,
} from '../../../supabase/functions/_shared/consultation-authoritative-quote.ts';

const MOTOR_MODEL = 'Mercury 150 FourStroke';

const IDENTITY = consultationSubmitDeliverySnapshot({
  customerName: 'Jay Harris',
  customerEmail: 'jay@example.com',
  customerPhone: '+19053766208',
  motorModel: MOTOR_MODEL,
  totalPrice: 18459,
});

const COMPLETE = mergeConsultationDeliverySnapshot(IDENTITY, {
  createdAt: '2026-08-25T12:00:00.000Z',
  validUntil: '2026-09-24',
  motorDetails: { model: MOTOR_MODEL, hp: 150, modelYear: 2026, category: 'FourStroke' },
  purchasePath: 'installed',
  includedCoverageYears: 3,
  priceBreakdown: {
    msrp: 18000,
    discount: 1200,
    promoValue: 250,
    promoName: 'Summer Savings Rebate',
    motorSubtotal: 16550,
    subtotal: 16335,
    hst: 2123.55,
    savings: 1450,
    purchasePath: 'installed',
  },
  accessories: [
    { name: 'Control Adaptor Harness', price: 125, description: 'Keeps existing controls', category: 'equipment' },
    { name: 'Professional Installation', price: 450, description: 'Shop rigging and Lake Test', category: 'installation' },
    { name: 'Propeller: Use Existing', price: 0, category: 'equipment' },
  ],
  tradeIn: { value: 790, brand: 'Mercury', year: 2014, horsepower: 115, model: 'ELPT' },
  productProtection: {
    planYears: 2,
    totalCoverageYears: 5,
    priceBeforeTax: 1365,
    monthlyDelta: 29,
  },
  financing: {
    monthlyPayment: 336,
    rate: 5.48,
    amortizationMonths: 60,
    contractTermMonths: 60,
    amountFinanced: 17621.05,
    dealerFee: 349,
    downPayment: 500,
    paymentMethod: 'standard_financing',
  },
  paymentMethod: 'standard_financing',
  promotion: {
    name: 'Summer Savings Rebate',
    endDate: '2026-08-31',
    combinationMode: 'choose_one',
    selectedOption: 'cash_rebate',
    selectedValue: '$250 rebate',
  },
  customerNotes: 'Confirm mid-ship controls before the Lake Test.',
});

describe('consultation quote PDF renderer', () => {
  it('prints the complete saved-quote breakdown with customer-facing labels', () => {
    const lines = buildConsultationQuotePdfLines({
      quoteNumber: 'HBW-123456',
      snapshot: COMPLETE,
    });
    const text = lines.join('\n');

    expect(lines[0]).toBe('Harris Boat Works');
    expect(text).toContain('Private Mercury quote');
    expect(text).toContain('MERCURY OUTBOARD QUOTE');
    expect(text).toContain('Issued August 25, 2026');
    expect(text).toContain('Valid until September 24, 2026');
    expect(text).toContain('FourStroke | 150HP | 2026');
    expect(text).toContain('You save $1,450.00 vs MSRP');
    expect(text).toContain('TRANSPARENT PRICE BREAKDOWN');
    expect(text).toContain('Mercury outboard MSRP');
    expect(text).toContain('HBW dealer discount');
    expect(text).toContain('Summer Savings Rebate');
    expect(text).toContain('Motor price after discounts');
    expect(text).toContain('Configured installation and setup');
    expect(text).toContain('Equipment and Rigging');
    expect(text).toContain('Control Adaptor Harness');
    expect(text).toContain('Keeps existing controls');
    expect(text).toContain('Installation and Setup');
    expect(text).toContain('Professional Installation');
    expect(text).toContain('Shop rigging and Lake Test');
    expect(text).toContain('Estimated trade-in value');
    expect(text).toContain('2014 Mercury 115 HP ELPT');
    expect(text).toContain('HST savings from trade-in');
    expect(text).toContain('$102.70 saved');
    expect(text).toContain('HST (13%)');
    expect(text).toContain('TOTAL CASH PRICE');
    expect(text).toContain('MERCURY COVERAGE');
    expect(text).toContain('5 years total');
    expect(text).toContain('3 years of combined Mercury factory and applicable promotional coverage are included.');
    expect(text).toContain('2 additional years of Platinum Product Protection');
    expect(text).toContain('$1,365.00 before HST');
    expect(text).toContain('Approximately +$29/month with this financing estimate');
    expect(text).toContain('Promotion ends August 31, 2026');
    expect(text).toContain('Selected promotion: $250 rebate');
    expect(text).toContain('FINANCING ESTIMATE');
    expect(text).toContain('$336/month');
    expect(text).toContain('Amount financed:');
    expect(text).toContain('Down payment: $500.00 CAD');
    expect(text).toContain('DealerPlan administration fee');
    expect(text).toContain('On approved credit.');
    expect(text).toContain(CONSULTATION_PDF_FINANCING_DISCLAIMER);
    expect(text).toContain('Final trade-in value and propeller fit remain subject to final inspection and Lake Test.');
    expect(text).toContain('A note from Harris Boat Works');
    expect(text).toContain('Confirm mid-ship controls before the Lake Test.');
    expect(text).not.toContain('water testing');
    expect(text).not.toContain('water-tested');
    expect(text).not.toContain('spec-sheets');
    expect(text).not.toContain('cd_');
  });

  it('prints Lake Test caveats and never uses water-testing wording', () => {
    expect(consultationInspectionCaveat({
      ...IDENTITY,
      accessories: [{ name: 'Propeller Allowance', price: 350 }],
    })).toBe('Propeller fit remains subject to final inspection and Lake Test.');
    expect(consultationInspectionCaveat({
      ...IDENTITY,
      tradeIn: { value: 790 },
    })).toBe('Final trade-in value remains subject to final inspection and verification.');
  });

  it('keeps professional-PDF financing copy and CAD formatting', () => {
    expect(CONSULTATION_PDF_FINANCING_DISCLAIMER).toBe(
      'Payment figures are estimates and may change with the final financed amount, rate, term or lender approval.',
    );
    expect(consultationFinancingTermsLine({
      rate: 5.48,
      contractTermMonths: 60,
      amortizationMonths: 72,
    })).toBe('5.48% APR | up to 60-month contract | payment based on 72-month amortization');
    expect(formatConsultationCad(18459)).toBe('$18,459.00');
  });

  it('renders reminted saved-quote fields into the PDF text', () => {
    const details = parseConsultationCallerQuoteSnapshot({
      version: 1,
      createdAt: '2026-08-25T12:00:00.000Z',
      validUntil: '2026-09-24',
      motor: {
        model: MOTOR_MODEL,
        hp: 150,
        msrp: 18000,
        modelYear: 2026,
        category: 'FourStroke',
        imageUrl: 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/150.jpg',
      },
      pricing: {
        msrp: 18000,
        discount: 1200,
        promoValue: 250,
        motorSubtotal: 16550,
        subtotal: 16335,
        hst: 2123.55,
        totalCashPrice: 18458.55,
        savings: 1450,
      },
      accessoryBreakdown: [
        { name: 'Control Adaptor Harness', price: 125, description: 'Keeps existing controls', category: 'equipment' },
        { name: 'Professional Installation', price: 450, category: 'installation' },
        { name: 'Propeller: Use Existing', price: 0, category: 'equipment' },
      ],
      purchasePath: 'installed',
      tradeInValue: 790,
      tradeInInfo: { brand: 'Mercury', year: 2014, horsepower: 115, model: 'ELPT' },
      includedCoverageYears: 3,
      productProtection: { planYears: 2, totalCoverageYears: 5, priceBeforeTax: 1365, monthlyDelta: 29 },
      financing: {
        monthlyPayment: 336,
        rate: 5.48,
        amortizationMonths: 60,
        contractTermMonths: 60,
        amountFinanced: 17621.05,
        dealerFee: 349,
        downPayment: 500,
      },
      paymentMethod: 'standard_financing',
      promotion: {
        name: 'Summer Savings Rebate',
        endDate: '2026-08-31',
        combinationMode: 'choose_one',
        selectedOption: 'cash_rebate',
        selectedValue: '$250 rebate',
      },
      customerNotes: 'Confirm mid-ship controls before the Lake Test.',
    }, { total: 18458.55, motorModel: MOTOR_MODEL });
    const state = buildConsultationSavedQuoteState({
      quoteNumber: 'HBW-123456',
      quoteId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      snapshot: mergeConsultationDeliverySnapshot(IDENTITY, details),
    });
    const reminted = consultationSnapshotFromAuthoritativeQuote({
      persistedName: 'Jay Harris',
      persistedEmail: 'owner@example.com',
      persistedPhone: '+19053766208',
      quoteState: state,
      fallbackMotor: MOTOR_MODEL,
      fallbackTotal: 18459,
    });
    const pdf = renderConsultationQuotePdf({
      quoteNumber: 'HBW-123456',
      snapshot: reminted,
    });
    expect(() => validateQuotePdf(pdf, 'application/pdf')).not.toThrow();
    const text = new TextDecoder().decode(pdf);
    expect(text.startsWith('%PDF-1.7')).toBe(true);
    expect(text).toContain('Issued August 25, 2026');
    expect(text).toContain('Valid until September 24, 2026');
    expect(text).toContain('FourStroke | 150HP | 2026');
    expect(text).toContain('You save $1,450.00 vs MSRP');
    expect(text).toContain('Keeps existing controls');
    expect(text).toContain('Configured installation and setup');
    expect(text).toContain('2014 Mercury 115 HP ELPT');
    expect(text).toContain('MERCURY COVERAGE');
    expect(text).toContain('2 additional years of Platinum Product Protection');
    expect(text).toContain('Selected promotion: $250 rebate');
    expect(text).toContain('Down payment: $500.00 CAD');
    expect(text).toContain('A note from Harris Boat Works');
    expect(text).toContain('Lake Test');
    expect(text).not.toContain('water testing');
    expect(text).not.toContain('water-tested');
    expect(text).not.toContain('/storage/v1/');
    expect(text).toContain('HST \\(13%\\)');
    expect(text).toContain('18459');
  });
});
