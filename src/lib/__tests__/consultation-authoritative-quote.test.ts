import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_SAVED_QUOTE_SOURCE,
  buildConsultationSavedQuoteState,
  canMintConsultationDocumentFromPersistedQuote,
  consultationDetailsFromLeadPayload,
  consultationSnapshotFromAuthoritativeQuote,
  mergeConsultationDeliverySnapshot,
  parseConsultationCallerQuoteSnapshot,
} from '../../../supabase/functions/_shared/consultation-authoritative-quote.ts';
import { ConsultationDocumentRequestError, consultationSubmitDeliverySnapshot } from '../../../supabase/functions/_shared/consultation-document-policy.ts';

const QUOTE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MOTOR_MODEL = 'Mercury 150 FourStroke';
const EXPECTED = { total: 18458.55, motorModel: MOTOR_MODEL };

const SNAPSHOT = consultationSubmitDeliverySnapshot({
  customerName: 'Jay Harris',
  customerEmail: 'jay@example.com',
  customerPhone: '+19053766208',
  motorModel: MOTOR_MODEL,
  totalPrice: 18450,
});

const COMPLETE_CALLER_SNAPSHOT = {
  version: 1,
  createdAt: '2026-08-25T12:00:00.000Z',
  validUntil: '2026-09-24',
  motor: {
    model: MOTOR_MODEL,
    hp: 150,
    msrp: 18000,
    modelYear: 2026,
    category: 'FourStroke',
    imageUrl: 'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/mercury/heroes/150.jpg',
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
    { name: 'Professional Installation', price: 450, description: 'Shop rigging and Lake Test', category: 'installation' },
    { name: 'Propeller: Use Existing', price: 0, category: 'equipment' },
  ],
  purchasePath: 'installed',
  tradeInValue: 790,
  tradeInInfo: { brand: 'Mercury', year: 2014, horsepower: 115, model: 'ELPT' },
  includedCoverageYears: 3,
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
};

describe('authoritative consultation saved quote', () => {
  it('only permits minting after the complete caller snapshot has a persisted quote state', () => {
    expect(canMintConsultationDocumentFromPersistedQuote(true, { source: CONSULTATION_SAVED_QUOTE_SOURCE })).toBe(true);
    expect(canMintConsultationDocumentFromPersistedQuote(true, null)).toBe(false);
    expect(canMintConsultationDocumentFromPersistedQuote(true, [])).toBe(false);
    expect(canMintConsultationDocumentFromPersistedQuote(false, { source: CONSULTATION_SAVED_QUOTE_SOURCE })).toBe(false);
  });

  it('builds a server-owned snapshot and remints from the persisted row, not a caller email', () => {
    const state = buildConsultationSavedQuoteState({
      quoteNumber: 'HBW-123456',
      quoteId: QUOTE_ID,
      snapshot: SNAPSHOT,
    });
    expect(state.source).toBe(CONSULTATION_SAVED_QUOTE_SOURCE);
    expect(state.customerQuoteId).toBe(QUOTE_ID);
    expect(state.motor).toEqual({ model: MOTOR_MODEL });

    const minted = consultationSnapshotFromAuthoritativeQuote({
      persistedName: 'Jay Harris',
      persistedEmail: 'owner@example.com',
      persistedPhone: '+19053766208',
      quoteState: {
        ...state,
        customer: { ...SNAPSHOT, customerEmail: 'attacker@example.com' },
      },
      fallbackMotor: 'ignored',
      fallbackTotal: 1,
    });
    expect(minted.customerEmail).toBe('owner@example.com');
    expect(minted.motorModel).toBe(MOTOR_MODEL);
    expect(minted.totalPrice).toBe(18450);
  });

  it('accepts a normal motor.imageUrl and never persists or remints that URL', () => {
    const details = parseConsultationCallerQuoteSnapshot(COMPLETE_CALLER_SNAPSHOT, EXPECTED);
    expect(JSON.stringify(details)).not.toContain('imageUrl');
    expect(JSON.stringify(details)).not.toContain('/storage/v1/object/public');

    const complete = mergeConsultationDeliverySnapshot(consultationSubmitDeliverySnapshot({
      customerName: 'Jay Harris',
      customerEmail: 'jay@example.com',
      customerPhone: '+19053766208',
      motorModel: MOTOR_MODEL,
      totalPrice: 18459,
    }), details);
    const state = buildConsultationSavedQuoteState({
      quoteNumber: 'HBW-123456',
      quoteId: QUOTE_ID,
      snapshot: complete,
    });
    expect(JSON.stringify(state)).not.toContain('imageUrl');
    expect(JSON.stringify(state)).not.toContain('/storage/v1/');
    expect(state.motor).toEqual({
      model: MOTOR_MODEL,
      hp: 150,
      modelYear: 2026,
      category: 'FourStroke',
    });
  });

  it('round-trips every printable QuotePdfSnapshot field through saved quote state', () => {
    const details = parseConsultationCallerQuoteSnapshot(COMPLETE_CALLER_SNAPSHOT, EXPECTED);
    const complete = mergeConsultationDeliverySnapshot(consultationSubmitDeliverySnapshot({
      customerName: 'Jay Harris',
      customerEmail: 'jay@example.com',
      customerPhone: '+19053766208',
      motorModel: MOTOR_MODEL,
      totalPrice: 18459,
    }), details);
    const state = buildConsultationSavedQuoteState({
      quoteNumber: 'HBW-123456',
      quoteId: QUOTE_ID,
      snapshot: complete,
    });

    expect(state.createdAt).toBe('2026-08-25T12:00:00.000Z');
    expect(state.validUntil).toBe('2026-09-24');
    expect(state.purchasePath).toBe('installed');
    expect(state.includedCoverageYears).toBe(3);
    expect(state.paymentMethod).toBe('standard_financing');
    expect(state.customerNotes).toBe('Confirm mid-ship controls before the Lake Test.');
    expect(state.accessories).toEqual([
      { name: 'Control Adaptor Harness', price: 125, description: 'Keeps existing controls', category: 'equipment' },
      { name: 'Professional Installation', price: 450, description: 'Shop rigging and Lake Test', category: 'installation' },
      { name: 'Propeller: Use Existing', price: 0, category: 'equipment' },
    ]);
    expect(state.tradeIn).toMatchObject({ value: 790, brand: 'Mercury', year: 2014, horsepower: 115, model: 'ELPT' });
    expect(state.pricing).toMatchObject({
      totalPrice: 18459,
      subtotal: 16335,
      hst: 2123.55,
      motorSubtotal: 16550,
      savings: 1450,
    });
    expect(state.productProtection).toEqual({
      planYears: 2,
      totalCoverageYears: 5,
      priceBeforeTax: 1365,
      monthlyDelta: 29,
    });
    expect(state.financing).toMatchObject({
      monthlyPayment: 336,
      rate: 5.48,
      amortizationMonths: 60,
      contractTermMonths: 60,
      amountFinanced: 17621.05,
      dealerFee: 349,
      downPayment: 500,
      paymentMethod: 'standard_financing',
    });
    expect(state.promotion).toEqual({
      name: 'Summer Savings Rebate',
      endDate: '2026-08-31',
      combinationMode: 'choose_one',
      selectedOption: 'cash_rebate',
      selectedValue: '$250 rebate',
    });

    const reminted = consultationSnapshotFromAuthoritativeQuote({
      persistedName: 'Jay Harris',
      persistedEmail: 'owner@example.com',
      persistedPhone: '+19053766208',
      quoteState: state,
      fallbackMotor: 'ignored',
      fallbackTotal: 1,
    });
    expect(reminted.customerEmail).toBe('owner@example.com');
    expect(reminted.createdAt).toBe('2026-08-25T12:00:00.000Z');
    expect(reminted.validUntil).toBe('2026-09-24');
    expect(reminted.motorDetails).toEqual({
      model: MOTOR_MODEL,
      hp: 150,
      modelYear: 2026,
      category: 'FourStroke',
    });
    expect(reminted.accessories?.[0]).toMatchObject({
      name: 'Control Adaptor Harness',
      description: 'Keeps existing controls',
      category: 'equipment',
    });
    expect(reminted.purchasePath).toBe('installed');
    expect(reminted.includedCoverageYears).toBe(3);
    expect(reminted.productProtection).toEqual({
      planYears: 2,
      totalCoverageYears: 5,
      priceBeforeTax: 1365,
      monthlyDelta: 29,
    });
    expect(reminted.paymentMethod).toBe('standard_financing');
    expect(reminted.financing).toMatchObject({
      monthlyPayment: 336,
      downPayment: 500,
      dealerFee: 349,
      paymentMethod: 'standard_financing',
    });
    expect(reminted.promotion?.name).toBe('Summer Savings Rebate');
    expect(reminted.promotion?.endDate).toBe('2026-08-31');
    expect(reminted.promotion?.combinationMode).toBe('choose_one');
    expect(reminted.promotion?.selectedOption).toBe('cash_rebate');
    expect(reminted.promotion?.selectedValue).toBe('$250 rebate');
    expect(reminted.customerNotes).toBe('Confirm mid-ship controls before the Lake Test.');
    expect(reminted.priceBreakdown?.savings).toBe(1450);
    expect(reminted.totalPrice).toBe(18459);
    expect(JSON.stringify(reminted)).not.toContain('imageUrl');
  });

  it('rejects a caller snapshot whose total, motor, or accepted document fields do not match', () => {
    expect(() => parseConsultationCallerQuoteSnapshot(COMPLETE_CALLER_SNAPSHOT, {
      total: 9999,
      motorModel: MOTOR_MODEL,
    })).toThrow(/does not match the saved quote/);
    expect(() => parseConsultationCallerQuoteSnapshot(COMPLETE_CALLER_SNAPSHOT, {
      total: 18458.55,
      motorModel: 'Mercury 90 FourStroke',
    })).toThrow(/motor does not match the saved quote/);
    expect(() => parseConsultationCallerQuoteSnapshot({
      ...COMPLETE_CALLER_SNAPSHOT,
      pdfUrl: 'https://example.com/quote.pdf',
    }, EXPECTED)).toThrow(ConsultationDocumentRequestError);
    expect(() => parseConsultationCallerQuoteSnapshot({
      ...COMPLETE_CALLER_SNAPSHOT,
      customerNotes: `https://www.mercuryrepower.ca/quote/document#cd_${'ab'.repeat(32)}`,
    }, EXPECTED)).toThrow(ConsultationDocumentRequestError);
  });

  it('enforces the caller snapshot limit in bytes, including ignored fields', () => {
    expect(() => parseConsultationCallerQuoteSnapshot({
      ...COMPLETE_CALLER_SNAPSHOT,
      ignored: '🚤'.repeat(7_000),
    }, EXPECTED)).toThrow(/snapshot is invalid/);
  });

  it('fills financing and trade-in from the lead payload when no caller snapshot is present', () => {
    const details = consultationDetailsFromLeadPayload({
      basePrice: 16335,
      finalPrice: 18459,
      depositAmount: 500,
      loanAmount: 17621,
      monthlyPayment: 336,
      termMonths: 60,
      tradeInFinal: 790,
    });
    const merged = mergeConsultationDeliverySnapshot(SNAPSHOT, details);
    expect(merged.tradeIn?.value).toBe(790);
    expect(merged.priceBreakdown?.subtotal).toBe(16335);
    expect(merged.financing).toMatchObject({
      monthlyPayment: 336,
      amortizationMonths: 60,
      amountFinanced: 17621,
    });
  });
});
