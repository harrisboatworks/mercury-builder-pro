import { describe, expect, it } from 'vitest';
import type { Motor } from '@/components/QuoteBuilder';
import { initialState, quoteReducer, type QuoteState } from './QuoteContext';
import { getTotalPromotionDiscount } from '@/lib/promotion-discounts';
import { calculateQuotePricing, isPromotionLive } from '@/lib/quote-utils';
import { getAppliedPromotion, getAppliedWarrantyExtraYears } from '@/lib/warranty-display';

const motor: Motor = {
  id: 'e920cfdf-223a-408a-850b-6f112e15c4d7', model: '9.9 MH FourStroke',
  hp: 9.9, year: 2026, price: 2999, msrp: 3860, image: '/test-motor.webp',
  stockStatus: 'In Stock', category: 'portable', type: 'FourStroke', specs: '',
};
const promotion = {
  start_date: '2026-09-14', end_date: '2026-10-30', warranty_extra_years: 2,
  discount_fixed_amount: 0, discount_percentage: 0,
  promo_options: { options: [{ id: 'cash_rebate', matrix: [{ hp_min: 4, hp_max: 9.9, rebate: 300 }] }] },
};
const express = () => quoteReducer(initialState, { type: 'START_MOTOR_ONLY_QUOTE', payload: motor });

// Exercise the production arithmetic and applied-promotion helpers with the
// reducer's actual state. Rendered summary checks verify the component wiring.
function price(state: QuoteState, now: string, rows = [promotion]) {
  const applicable = rows.filter(row => isPromotionLive({ startDate: row.start_date, endDate: row.end_date, now: new Date(now) }));
  const applied = state.uiFlags.suppressAdditionalPromoSavings ? [] : applicable;
  const savings = getTotalPromotionDiscount(applied, { basePrice: 3860, horsepower: state.motor!.hp });
  return {
    ...calculateQuotePricing({ motorMSRP: 3860, motorDiscount: 861, accessoryTotal: 0, warrantyPrice: 0, promotionalSavings: savings, tradeInValue: 0 }),
    coverageYears: 3 + getAppliedWarrantyExtraYears(getAppliedPromotion(applied)),
  };
}

describe('express reservation promotional parity', () => {
  it('matches a bare cash custom quote while the eligible promotion is live', () => {
    const custom = { ...initialState, motor, uiFlags: {} };
    const reserved = price(express(), '2026-10-13T12:00:00Z');
    expect(reserved).toEqual(price(custom, '2026-10-13T12:00:00Z'));
    expect(reserved).toMatchObject({ promoValue: 300, subtotal: 2699, tax: 350.87, total: 3049.87, coverageYears: 5 });
  });

  it.each(['2026-10-31T04:01:00Z', '2026-09-13T12:00:00Z'])('does not include out-of-window benefits at %s', now => {
    expect(price(express(), now)).toMatchObject({ promoValue: 0, subtotal: 2999, total: 3388.87, coverageYears: 3 });
  });

  it('keeps base price and coverage when no promotion is available', () => {
    expect(price(express(), '2026-10-13T12:00:00Z', [])).toMatchObject({ promoValue: 0, subtotal: 2999, total: 3388.87, coverageYears: 3 });
  });

  it('updates a retained unfrozen express session from the old suppression policy', () => {
    const previous = { ...express(), uiFlags: { motorOnlyExpress: true, suppressAdditionalPromoSavings: true, retainedFlag: true } };
    const restored = quoteReducer(initialState, { type: 'LOAD_FROM_STORAGE', payload: previous });
    expect(restored.uiFlags).toEqual({ motorOnlyExpress: true, suppressAdditionalPromoSavings: false, retainedFlag: true });
    expect(price(restored, '2026-10-13T12:00:00Z').total).toBe(3049.87);
  });

  it('preserves a frozen historical express quote and its recorded suppression', () => {
    const historical: QuoteState = {
      ...express(), uiFlags: { motorOnlyExpress: true, suppressAdditionalPromoSavings: true },
      frozenPricing: { motorMSRP: 3860, motorDiscount: 861, adminDiscount: 0, promoSavings: 0, subtotal: 2999, hst: 389.87, total: 3388.87, savings: 861 },
      warrantyConfig: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 },
    };
    const restored = quoteReducer(initialState, { type: 'LOAD_FROM_STORAGE', payload: historical });
    expect(restored.frozenPricing).toEqual(historical.frozenPricing);
    expect(restored.warrantyConfig).toEqual(historical.warrantyConfig);
    expect(restored.uiFlags.suppressAdditionalPromoSavings).toBe(true);
  });

  it('does not change a non-express quote suppression flag', () => {
    const previous = { ...initialState, uiFlags: { suppressAdditionalPromoSavings: true } };
    expect(quoteReducer(initialState, { type: 'LOAD_FROM_STORAGE', payload: previous }).uiFlags).toEqual(previous.uiFlags);
  });
});
