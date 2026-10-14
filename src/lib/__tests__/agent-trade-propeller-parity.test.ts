import { describe, expect, it } from 'vitest';
import { buildPublicQuotePropeller } from '../../../supabase/functions/_shared/public-quote-propeller';
import { buildTradeInHandoffFields } from '../../../supabase/functions/_shared/trade-in-handoff';
import { resolveTradeInInput } from '../../../supabase/functions/_shared/trade-in-input';
import { buildAgentQuoteLink } from '../../../supabase/functions/_shared/agent-quote-link';
import { computePublicQuotePricing } from '../../../supabase/functions/_shared/public-quote-pricing';
import { buildAccessoryBreakdown } from '../build-accessory-breakdown';
import { calculateQuotePricing } from '../quote-utils';
import { applyAgentQuoteHandoff, parseAgentQuoteHandoff, stripConsumedAgentQuoteHandoffParams } from '../agent-quote-handoff';
import { initialState, quoteReducer } from '@/contexts/QuoteContext';
import type { CanonicalHbwValuationPayload } from '../../../supabase/functions/_shared/hbw-valuation-response';

const valuation: CanonicalHbwValuationPayload = { wholesale: 2400, listing: 3350, rangeLow: 2035, rangeHigh: 2753, confidence: 'low', hstSavings: 312, factors: [], effectiveInputs: { brand: 'Mercury', year: 2010, hp: 90, condition: 'good', stroke: '4-stroke', hours: null } };

for (const hp of [20, 25, 90, 150]) for (const path of ['installed', 'loose'] as const) for (const brand of [undefined, 'Mercury', 'Yamaha']) for (const hasProp of [undefined, false, true]) {
  it(`${hp} HP ${path}, ${brand ?? 'no'} trade, prop=${String(hasProp)} agrees after actual reducer handoff`, () => {
    const trade = brand ? resolveTradeInInput({ brand, year: 2010, horsepower: hp, engine_type: '4-stroke' }) : null;
    const fields = { purchase_path: path, customer_has_propeller: hasProp, ...buildTradeInHandoffFields(trade, valuation) };
    const params = new URL(buildAgentQuoteLink('synthetic-motor', fields)).searchParams;
    const state = applyAgentQuoteHandoff({ ...initialState, motor: { id: 'synthetic-motor', model: `${hp} ELPT FourStroke`, hp, price: 14000, year: 2026, image: '', stockStatus: 'In Stock' as const, category: 'mid-range' as const, type: 'FourStroke', specs: '' } }, quoteReducer, parseAgentQuoteHandoff(params));
    const api = buildPublicQuotePropeller({ hp, customerHasPropeller: hasProp, tradeIn: trade });
    const site = buildAccessoryBreakdown({ motor: state.motor, purchasePath: state.purchasePath, installConfig: state.installConfig, tradeInInfo: state.tradeInInfo });
    const prop = site.find(item => /propeller/i.test(item.name));
    expect(prop?.price).toBe(api.item.price);
    const apiAccessory = api.item.price + (path === 'installed' ? 450 : 0);
    expect(site.reduce((sum, item) => sum + item.price, 0)).toBe(apiAccessory);
    for (const rebate of [0, 350]) for (const estimate of [0, 2400, 20000]) {
      const rest = computePublicQuotePricing({ subtotal: 14000 + apiAccessory, rebateAmount: rebate, tradeEstimatedValue: estimate, hasTradeIn: true });
      const web = calculateQuotePricing({ motorMSRP: 16000, motorDiscount: 2000, accessoryTotal: apiAccessory, warrantyPrice: 0, promotionalSavings: rebate, tradeInValue: estimate });
      expect(web.subtotal).toBeCloseTo(rest.adjustedSubtotal, 2);
      expect(web.tax).toBeCloseTo(rest.hst, 2);
      expect(web.total).toBeCloseTo(rest.finalPrice, 2);
      expect(web.appliedTradeCredit).toBe(rest.tradeInCredit);
    }
  });
}

describe('canonical trade input continuity', () => {
  it('carries default condition, model-inferred HP and canonical stroke without carrying a valuation or serial', () => {
    const trade = resolveTradeInInput({ brand: ' mercury ', year: '2010', model: '90 ELPT FourStroke', engine_hours: 0, serial_number: 'not-public' });
    const fields = buildTradeInHandoffFields(trade, valuation);
    const url = new URL(buildAgentQuoteLink('synthetic-motor', fields));
    expect(url.searchParams.get('trade_hp')).toBe('90');
    expect(url.searchParams.get('trade_condition')).toBe('good');
    expect(url.searchParams.get('trade_model')).toBe('90 ELPT FourStroke');
    expect(url.href).not.toMatch(/2400|not-public|estimatedValue/);
    const parsed = parseAgentQuoteHandoff(url.searchParams);
    expect(parsed).toMatchObject({ tradeBrand: 'Mercury', tradeHp: 90, tradeModel: '90 ELPT FourStroke', tradeEngineType: '4-stroke', tradeEngineHours: 0, replaceTradeIn: true });
    const next = applyAgentQuoteHandoff(initialState, quoteReducer, parsed);
    expect(next.tradeInInfo).toMatchObject({ hasTradeIn: true, condition: 'good', model: '90 ELPT FourStroke', engineHours: 0, estimatedValue: 0 });
    const cleaned = stripConsumedAgentQuoteHandoffParams(url.searchParams, parsed);
    expect(Array.from(cleaned.keys()).some(key => key.startsWith('trade_'))).toBe(false);
  });

  it('replaces optional facts from a previous unfinished draft, invalidating its valuation', () => {
    const previous = { ...initialState, tradeInInfo: { hasTradeIn: true, brand: 'Mercury', year: 2010, horsepower: 90, condition: 'poor' as const, model: '90 OptiMax', serialNumber: 'old-serial', engineHours: 2000, engineType: 'optimax' as const, estimatedValue: 4000, valuedAt: Date.now(), engineVersion: 'old', referenceVersion: 'old', confidenceLevel: 'high' as const } };
    const fields = buildTradeInHandoffFields(resolveTradeInInput({ brand: 'Mercury', year: 2010, horsepower: 90, engine_type: '4-stroke' }), valuation);
    const parsed = parseAgentQuoteHandoff(new URL(buildAgentQuoteLink('synthetic-motor', fields)).searchParams);
    const next = applyAgentQuoteHandoff(previous, quoteReducer, parsed);
    expect(next.tradeInInfo).toMatchObject({ brand: 'Mercury', horsepower: 90, condition: 'good', model: '', serialNumber: '', engineType: '4-stroke', estimatedValue: 0 });
    expect(next.tradeInInfo?.engineHours).toBeUndefined();
    expect(next.tradeInInfo?.valuedAt).toBeUndefined();
    expect(next.tradeInInfo?.engineVersion).toBeUndefined();
    expect(next.tradeInInfo?.referenceVersion).toBeUndefined();
    expect(applyAgentQuoteHandoff({ ...previous, frozenPricing: { motorMSRP: 16000, motorDiscount: 2000, adminDiscount: 0, promoSavings: 0, subtotal: 8849.56, hst: 1150.44, total: 10000, savings: 2000 } }, quoteReducer, parsed)).toEqual({ ...previous, frozenPricing: { motorMSRP: 16000, motorDiscount: 2000, adminDiscount: 0, promoSavings: 0, subtotal: 8849.56, hst: 1150.44, total: 10000, savings: 2000 } });
  });

  it('preserves validated less common brands and all API-supported horsepower values', () => {
    const fields = buildTradeInHandoffFields(resolveTradeInInput({ brand: 'Nissan', year: 2010, horsepower: 750, engine_type: '2-stroke' }), null);
    expect(parseAgentQuoteHandoff(new URL(buildAgentQuoteLink('synthetic-motor', fields)).searchParams)).toMatchObject({ tradeBrand: 'Nissan', tradeHp: 750, replaceTradeIn: true });
  });

  it('requires a complete trade before honoring replacement and rejects malformed model input', () => {
    expect(parseAgentQuoteHandoff(new URLSearchParams('trade_replace=1&trade_model=90+FourStroke')).replaceTradeIn).toBeUndefined();
    expect(parseAgentQuoteHandoff(new URLSearchParams({ trade_model: 'X'.repeat(121) })).tradeModel).toBeUndefined();
    expect(parseAgentQuoteHandoff(new URLSearchParams({ trade_model: '90\nFourStroke' })).tradeModel).toBeUndefined();
    expect(() => resolveTradeInInput({ brand: 'Mercury', year: 2010, horsepower: 90, model: 'X'.repeat(121) })).toThrow(/120/);
  });
});
