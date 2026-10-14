import { describe, expect, it } from 'vitest';
import { buildPublicQuotePropeller } from '../../../supabase/functions/_shared/public-quote-propeller';
import { buildTradeInHandoffFields } from '../../../supabase/functions/_shared/trade-in-handoff';
import { resolveTradeInInput } from '../../../supabase/functions/_shared/trade-in-input';
import { buildAgentQuoteLink } from '../../../supabase/functions/_shared/agent-quote-link';
import { computePublicQuotePricing } from '../../../supabase/functions/_shared/public-quote-pricing';
import { buildAccessoryBreakdown } from '../build-accessory-breakdown';
import { resolvePropellerDecision } from '../propeller-selection';
import { calculateQuotePricing } from '../quote-utils';
import { applyAgentQuoteHandoff, buildAgentMotorSelectionActions, parseAgentQuoteHandoff, stripConsumedAgentQuoteHandoffParams } from '../agent-quote-handoff';
import { initialState, quoteReducer } from '@/contexts/QuoteContext';
import type { CanonicalHbwValuationPayload } from '../../../supabase/functions/_shared/hbw-valuation-response';

const valuation: CanonicalHbwValuationPayload = { wholesale: 2400, listing: 3350, rangeLow: 2035, rangeHigh: 2753, confidence: 'low', hstSavings: 312, factors: [], effectiveInputs: { brand: 'Mercury', year: 2010, hp: 90, condition: 'good', stroke: '4-stroke', hours: null } };

for (const hp of [20, 25, 90, 150]) for (const path of ['installed', 'loose'] as const) for (const brand of [undefined, 'Mercury', 'Yamaha']) for (const hasProp of [undefined, false, true]) {
  it(`${hp} HP ${path}, ${brand ?? 'no'} trade, prop=${String(hasProp)} agrees after actual reducer handoff`, () => {
    const trade = brand ? resolveTradeInInput({ brand, year: 2010, horsepower: hp, engine_type: '4-stroke' }) : null;
    const api = buildPublicQuotePropeller({ hp, customerHasPropeller: hasProp, tradeIn: trade });
    const fields = { purchase_path: path, customer_has_propeller: api.handoffCustomerHasPropeller, ...buildTradeInHandoffFields(trade, valuation) };
    const params = new URL(buildAgentQuoteLink('synthetic-motor', fields)).searchParams;
    const state = applyAgentQuoteHandoff({ ...initialState, motor: { id: 'synthetic-motor', model: `${hp} ELPT FourStroke`, hp, price: 14000, year: 2026, image: '', stockStatus: 'In Stock' as const, category: 'mid-range' as const, type: 'FourStroke', specs: '' } }, quoteReducer, parseAgentQuoteHandoff(params));
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
  it('overrides stale draft propeller defaults with the actual quoted decision', () => {
    for (const prior of ['include_allowance', 'reuse_existing'] as const) for (const trade of [null, { brand: 'Mercury', horsepower: 90 }]) {
      const quote = buildPublicQuotePropeller({ hp: 90, tradeIn: trade });
      const params = new URL(buildAgentQuoteLink('synthetic-motor', { customer_has_propeller: quote.handoffCustomerHasPropeller, ...buildTradeInHandoffFields(trade ? resolveTradeInInput({ ...trade, year: 2010, engine_type: '4-stroke' }) : null, valuation) })).searchParams;
      const base = { ...initialState, motor: { id: 'synthetic-motor', model: '90 ELPT FourStroke', hp: 90 } as any, installConfig: { propellerDecision: prior }, boatInfo: { hasCompatibleProp: true } as any };
      const next = applyAgentQuoteHandoff(base, quoteReducer, parseAgentQuoteHandoff(params));
      expect(next.installConfig?.propellerDecision).toBeUndefined();
      expect(next.boatInfo?.hasCompatibleProp).toBe(false);
      expect(resolvePropellerDecision({ hp: 90, installConfig: next.installConfig, boatInfo: next.boatInfo, tradeInInfo: next.tradeInInfo })).toBe(quote.decision);
    }
    expect(buildPublicQuotePropeller({ hp: 20, customerHasPropeller: true })).toMatchObject({ decision: 'included', handoffCustomerHasPropeller: undefined, item: { price: 0 } });
  });

  it('recalculates loose-path defaults after trade edits but preserves explicit answers', () => {
    const motor = { id: 'synthetic-motor', model: '90 ELPT FourStroke', hp: 90 } as any;
    for (const callerFlag of [undefined, true, false]) {
      const quote = buildPublicQuotePropeller({ hp: 90, customerHasPropeller: callerFlag, tradeIn: { brand: 'Mercury', horsepower: 90 } });
      const params = new URL(buildAgentQuoteLink(motor.id, { customer_has_propeller: quote.handoffCustomerHasPropeller, purchase_path: 'loose', ...buildTradeInHandoffFields(resolveTradeInInput({ brand: 'Mercury', year: 2010, horsepower: 90, engine_type: '4-stroke' }), valuation) })).searchParams;
      const state = applyAgentQuoteHandoff({ ...initialState, motor }, quoteReducer, parseAgentQuoteHandoff(params));
      const changed = quoteReducer(state, { type: 'SET_TRADE_IN_INFO', payload: { ...state.tradeInInfo, hasTradeIn: false, estimatedValue: 0 } });
      const prop = buildAccessoryBreakdown({ motor, purchasePath: 'loose', installConfig: changed.installConfig, boatInfo: changed.boatInfo, tradeInInfo: changed.tradeInInfo }).find(x => /Propeller/.test(x.name));
      expect(prop?.price).toBe(callerFlag === true ? 0 : 350);
    }
  });

  it('defers a dynamic default until its target motor is selected', () => {
    const motor = { id: 'target', model: '90 ELPT FourStroke', hp: 90 } as any;
    const params = new URL(buildAgentQuoteLink(motor.id, { customer_has_propeller: 'default', ...buildTradeInHandoffFields(null, null) })).searchParams;
    const original = { ...initialState, motor: { ...motor, id: 'old' }, installConfig: { propellerDecision: 'reuse_existing' as const }, boatInfo: { hasCompatibleProp: true } as any };
    const waiting = applyAgentQuoteHandoff(original, quoteReducer, parseAgentQuoteHandoff(params));
    expect(waiting.installConfig?.propellerDecision).toBe('reuse_existing');
    const selected = buildAgentMotorSelectionActions(waiting, motor, quoteReducer).reduce(quoteReducer, waiting);
    expect(selected.installConfig?.propellerDecision).toBeUndefined();
    expect(selected.boatInfo?.hasCompatibleProp).toBe(false);
    expect(buildAccessoryBreakdown({ motor, installConfig: selected.installConfig, boatInfo: selected.boatInfo }).find(x => /Propeller/.test(x.name))?.price).toBe(350);
  });

  it('clears stale trades only for an explicit complete API no-trade handoff', () => {
    const previous = { ...initialState, tradeInInfo: { hasTradeIn: true, brand: 'Mercury', year: 2010, horsepower: 90, estimatedValue: 4000 } as any };
    const handoff = parseAgentQuoteHandoff(new URL(buildAgentQuoteLink('synthetic-motor', buildTradeInHandoffFields(null, null))).searchParams);
    expect(handoff.clearTradeIn).toBe(true);
    const next = applyAgentQuoteHandoff(previous, quoteReducer, handoff);
    expect(next.tradeInInfo).toMatchObject({ hasTradeIn: false, estimatedValue: 0, brand: '' });
    expect(applyAgentQuoteHandoff(previous, quoteReducer, {})).toBe(previous);
    expect(applyAgentQuoteHandoff({ ...previous, pdfSnapshot: {} as any }, quoteReducer, handoff)).toEqual({ ...previous, pdfSnapshot: {} });
  });

  it('drops incomplete replacement trades as a whole and consumes their URL fields', () => {
    for (const invalid of [{ trade_year: '2010.5' }, { trade_model: 'X'.repeat(121) }, { trade_engine_hours: '1e-7' }, { trade_engine_type: 'diesel' }]) {
      const params = new URLSearchParams({ trade_replace: '1', trade_brand: 'Mercury', trade_year: '2010', trade_hp: '90', trade_condition: 'good', ...invalid });
      const parsed = parseAgentQuoteHandoff(params);
      expect(parsed).toEqual({});
      expect(Array.from(stripConsumedAgentQuoteHandoffParams(params, parsed).keys())).toEqual([]);
    }
  });

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
    expect(() => resolveTradeInInput({ brand: 'Mercury', year: 2010, horsepower: 0.5 })).toThrow();
    expect(() => resolveTradeInInput({ brand: 'Mercury', year: 2010, horsepower: 90, engine_hours: 1e-7 })).toThrow();
    expect(parseAgentQuoteHandoff(new URLSearchParams({ trade_brand: 'Mer\u202ecur y', trade_model: '90\u0085FourStroke' }))).toEqual({});
  });
});
