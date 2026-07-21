import { describe, expect, it } from 'vitest';
import type { Motor } from '@/components/QuoteBuilder';
import { buildConsultationTradeInAuditFields } from '@/lib/consultation-payload';
import { initialState, quoteReducer, type QuoteState } from './QuoteContext';

const motor = (id: string, model: string, price: number): Motor => ({
  id,
  model,
  year: 2026,
  hp: id === 'motor-a' ? 90 : 115,
  price,
  image: '/test-motor.webp',
  stockStatus: 'In Stock',
  category: 'mid-range',
  type: 'FourStroke',
  specs: '',
});

describe('quoteReducer SET_MOTOR', () => {
  it('clears quote-dependent state and legacy consultation trade data when the customer changes motors', () => {
    const firstMotor = motor('motor-a', '90 ELPT', 12000);
    const nextMotor = motor('motor-b', '115 ELPT', 15000);
    const populatedState: QuoteState = {
      ...initialState,
      motor: firstMotor,
      purchasePath: 'installed',
      boatInfo: {
        type: 'pontoon',
        tradeIn: {
          hasTradeIn: true,
          estimatedValue: 4925,
          tradeinValuePrePenalty: 5794,
          tradeinValueFinal: 4925,
          penaltyApplied: true,
          penaltyFactor: 0.85,
        },
      } as QuoteState['boatInfo'],
      tradeInInfo: { hasTradeIn: true, estimatedValue: 2500 },
      fuelTankConfig: { size: 25 },
      installConfig: { propellerNeeded: true },
      looseMotorBattery: { wantsBattery: true, batteryCost: 179.99 },
      financing: { downPayment: 1000, term: 60, rate: 6.99 },
      warrantyConfig: { extendedYears: 5, warrantyPrice: 1000, totalYears: 8 },
      hasTradein: true,
      selectedOptions: [{
        optionId: 'battery',
        name: 'Battery',
        price: 179.99,
        category: 'electrical',
        assignmentType: 'available',
        isIncluded: false,
      }],
      selectedPackage: { id: 'complete', label: 'Complete', priceBeforeTax: 700 },
      selectedPromoOption: 'cash_rebate',
      selectedPromoRate: 2.99,
      selectedPromoTerm: 36,
      selectedPromoValue: '$750',
      selectedPaymentMethod: 'cash_purchase',
      completedSteps: [1, 2, 3, 4, 5],
      currentStep: 9,
      adminDiscount: 500,
      adminNotes: 'old motor note',
      customerNotes: 'old configuration note',
      adminCustomItems: [{ name: 'Old rigging', price: 400 }],
      customerName: 'Taylor Customer',
      customerEmail: 'taylor@example.com',
      customerPhone: '905-555-0100',
      isAdminQuote: true,
      editingQuoteId: 'quote-123',
      frozenPricing: {
        motorMSRP: 13000,
        motorDiscount: 1000,
        adminDiscount: 0,
        promoSavings: 0,
        subtotal: 12000,
        hst: 1560,
        total: 13560,
        savings: 1000,
      },
      pdfSnapshot: { version: 1, createdAt: '2026-07-19T12:00:00.000Z' } as QuoteState['pdfSnapshot'],
    };

    const result = quoteReducer(populatedState, { type: 'SET_MOTOR', payload: nextMotor });

    expect(result.motor).toEqual(nextMotor);
    expect(result.purchasePath).toBe('installed');
    expect(result.boatInfo).toEqual({ type: 'pontoon', hasCompatibleProp: false });
    expect(result.boatInfo).not.toHaveProperty('tradeIn');
    expect(result.tradeInInfo).toBeNull();
    expect(result.hasTradein).toBe(false);
    expect(result.installConfig).toBeNull();
    expect(result.looseMotorBattery).toBeNull();
    expect(result.selectedOptions).toEqual([]);
    expect(result.warrantyConfig).toBeNull();
    expect(result.selectedPromoOption).toBeNull();
    expect(result.selectedPaymentMethod).toBe('cash_purchase');
    expect(result.frozenPricing).toBeUndefined();
    expect(result.pdfSnapshot).toBeUndefined();
    expect(result.adminDiscount).toBe(0);
    expect(result.adminNotes).toBe('old motor note');
    expect(result.customerNotes).toBe('old configuration note');
    expect(result.adminCustomItems).toEqual([{ name: 'Old rigging', price: 400 }]);

    expect(result.customerName).toBe('Taylor Customer');
    expect(result.customerEmail).toBe('taylor@example.com');
    expect(result.customerPhone).toBe('905-555-0100');
    expect(result.isAdminQuote).toBe(true);
    expect(result.editingQuoteId).toBe('quote-123');

    expect(buildConsultationTradeInAuditFields(result.boatInfo)).toEqual({
      tradein_value_pre_penalty: null,
      tradein_value_final: null,
      penalty_applied: false,
      penalty_factor: null,
      penalty_reason: null,
    });
  });

  it('preserves the configuration when the same motor is refreshed', () => {
    const firstMotor = motor('motor-a', '90 ELPT', 12000);
    const refreshedMotor = { ...firstMotor, price: 11750 };
    const state: QuoteState = {
      ...initialState,
      motor: firstMotor,
      purchasePath: 'installed',
      boatInfo: {
        type: 'pontoon',
        tradeIn: {
          hasTradeIn: true,
          estimatedValue: 4925,
          tradeinValueFinal: 4925,
        },
      } as QuoteState['boatInfo'],
      tradeInInfo: { hasTradeIn: true, estimatedValue: 2500 },
      hasTradein: true,
      selectedOptions: [{
        optionId: 'controls',
        name: 'Controls',
        price: 400,
        category: 'rigging',
        assignmentType: 'available',
        isIncluded: false,
      }],
      frozenPricing: {
        motorMSRP: 13000,
        motorDiscount: 1000,
        adminDiscount: 0,
        promoSavings: 0,
        subtotal: 12000,
        hst: 1560,
        total: 13560,
        savings: 1000,
      },
    };

    const result = quoteReducer(state, { type: 'SET_MOTOR', payload: refreshedMotor });

    expect(result.motor?.price).toBe(11750);
    expect(result.purchasePath).toBe('installed');
    expect(result.boatInfo?.tradeIn?.tradeinValueFinal).toBe(4925);
    expect(result.tradeInInfo).toEqual({ hasTradeIn: true, estimatedValue: 2500 });
    expect(result.hasTradein).toBe(true);
    expect(result.selectedOptions).toHaveLength(1);
    expect(result.frozenPricing?.total).toBe(13560);
  });
});

describe('quoteReducer RESTORE_QUOTE', () => {
  it('restores the authoritative QR/PDF state in one action', () => {
    const savedMotor = motor('motor-a', '90 ELPT', 12000);
    const pdfSnapshot = {
      version: 1,
      createdAt: '2026-07-19T12:00:00.000Z',
      motor: { model: '90 ELPT', hp: 90, msrp: 13000, modelYear: 2026, category: 'mid-range' },
      pricing: { msrp: 13000, discount: 1000, promoValue: 500, motorSubtotal: 11500, subtotal: 12500, hst: 1625, totalCashPrice: 14125, savings: 1500 },
      accessoryBreakdown: [],
      purchasePath: 'installed' as const,
      includedCoverageYears: 3,
    };
    const frozenPricing = {
      motorMSRP: 13000,
      motorDiscount: 1000,
      adminDiscount: 0,
      promoSavings: 500,
      subtotal: 12500,
      hst: 1625,
      total: 14125,
      savings: 1500,
    };

    const restored = quoteReducer(initialState, {
      type: 'RESTORE_QUOTE',
      payload: {
        motor: savedMotor,
        purchasePath: 'installed',
        financing: { downPayment: 2500, term: 60, rate: 5.48 },
        tradeInInfo: { hasTradeIn: true, brand: 'Mercury', horsepower: 90 },
        hasTradein: true,
        customerName: 'Taylor Customer',
        customerEmail: 'taylor@example.com',
        customerPhone: '905-555-0100',
        frozenPricing,
        pdfSnapshot,
      },
    });

    expect(restored.motor).toEqual(savedMotor);
    expect(restored.financing).toEqual({ downPayment: 2500, term: 60, rate: 5.48 });
    expect(restored.hasTradein).toBe(true);
    expect(restored.customerName).toBe('Taylor Customer');
    expect(restored.customerEmail).toBe('taylor@example.com');
    expect(restored.frozenPricing).toEqual(frozenPricing);
    expect(restored.pdfSnapshot).toEqual(pdfSnapshot);
    expect(restored.isLoading).toBe(false);
  });

  it('does not merge a saved quote with stale browser quote state', () => {
    const staleState: QuoteState = {
      ...initialState,
      motor: motor('motor-b', '115 ELPT', 15000),
      financing: { downPayment: 5000, term: 84, rate: 9.99 },
      selectedPromoOption: 'cash_rebate',
      isAdminQuote: true,
      editingQuoteId: 'stale-admin-quote',
      uiFlags: { staleModal: true },
    };

    const restored = quoteReducer(staleState, {
      type: 'RESTORE_QUOTE',
      payload: { motor: motor('motor-a', '90 ELPT', 12000) },
    });

    expect(restored.financing).toEqual(initialState.financing);
    expect(restored.selectedPromoOption).toBeNull();
    expect(restored.isAdminQuote).toBe(false);
    expect(restored.editingQuoteId).toBeNull();
    expect(restored.uiFlags).toEqual({});
  });
});
