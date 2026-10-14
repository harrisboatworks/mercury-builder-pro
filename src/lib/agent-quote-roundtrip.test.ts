import { describe, expect, it, vi } from 'vitest';
import { buildAgentQuoteLink, attributeMcpQuotePayload } from '../../supabase/functions/_shared/agent-quote-link';
import { runPublicQuoteTool } from '../../supabase/functions/_shared/public-agent-mcp';
import { applyAgentQuoteHandoff, buildAgentQuoteHandoffActions, parseAgentQuoteHandoff, selectedMotorPropellerHandoffActions, stripConsumedAgentQuoteHandoffParams } from './agent-quote-handoff';
import { initialState, quoteReducer } from '@/contexts/QuoteContext';
import { resolvePropellerDecision } from './propeller-selection';
import { resolveAgentAttribution } from './agent-attribution';
const id = 'b16ac296-e506-4357-ad69-18a0aa347cbf';
const motor = { id, hp: 90, model: '90 ELPT FourStroke', price: 14960 } as any;
const fields = { purchase_path: 'installed', customer_has_propeller: false, boat_make: 'Lund', trade_brand: 'Mercury', trade_year: 2010, trade_hp: 90, trade_engine_hours: 0 };
describe('public quote handoff roundtrip', () => {
  it.each(['agent_rest', 'agent_mcp'] as const)('keeps all choices, including false and zero, on %s', async surface => {
    const rest = { deep_link: buildAgentQuoteLink(id, fields), pricing: { final_price: 17000 }, lead_captured: false };
    const payload = surface === 'agent_rest' ? rest : JSON.parse((await runPublicQuoteTool('build_quote', { motor_id: id }, vi.fn().mockResolvedValue(rest))).content[0].text);
    const params = new URL(payload.deep_link).searchParams;
    expect(params.get('src')).toBe(surface);
    expect(payload.pricing).toEqual(rest.pricing);
    expect(payload.lead_captured).toBe(false);
    const parsed = parseAgentQuoteHandoff(params, 2026);
    let state = applyAgentQuoteHandoff(initialState, quoteReducer, parsed);
    // A different previously selected motor clears motor-relative selections.
    state = quoteReducer({ ...state, motor: { ...motor, id: 'old' } }, { type: 'SET_MOTOR', payload: motor });
    state = selectedMotorPropellerHandoffActions(state, parsed).reduce(quoteReducer, state);
    expect(state.purchasePath).toBe('installed');
    expect(state.boatInfo).toMatchObject({ make: 'Lund', hasCompatibleProp: false });
    expect(state.tradeInInfo.engineHours).toBe(0);
    expect(resolvePropellerDecision({ hp: 90, installConfig: state.installConfig, boatInfo: state.boatInfo, tradeInInfo: state.tradeInInfo })).toBe('include_allowance');
    expect(state.completedSteps).toEqual([]);
    expect(stripConsumedAgentQuoteHandoffParams(params, parsed).get('src')).toBe(surface);
    expect(resolveAgentAttribution(params).surface).toBe(surface);
    expect(buildAgentQuoteHandoffActions(state, parsed)).toEqual([]);
  });
  it('continues a UCP motor-merchandise quote as loose pickup without granting payment approval', () => {
    const params = new URL(buildAgentQuoteLink(id, { ucp: 'chk_synthetic', purchase_path: 'loose' }, 'agent_ucp')).searchParams;
    const state = applyAgentQuoteHandoff(initialState, quoteReducer, parseAgentQuoteHandoff(params));
    expect(state.purchasePath).toBe('loose');
    expect(state.uiFlags).toEqual({ ucpCheckoutRef: 'chk_synthetic' });
    expect(state.completedSteps).toEqual([]);
    expect(state.motor).toBeNull();
  });
  it('rejects malformed values and preserves missing defaults', () => {
    for (const hours of ['-1', '1e3', '0x10', 'Infinity', 'NaN', '100001', '2 hours', ' 42', '']) {
      expect(parseAgentQuoteHandoff(new URLSearchParams({ trade_engine_hours: hours })).tradeEngineHours).toBeUndefined();
    }
    const parsed = parseAgentQuoteHandoff(new URLSearchParams('purchase_path=ship&customer_has_propeller=1'));
    expect(parsed).toEqual({});
    expect(applyAgentQuoteHandoff(initialState, quoteReducer, parsed)).toBe(initialState);
    expect(parseAgentQuoteHandoff(new URLSearchParams('trade_engine_hours=125.5')).tradeEngineHours).toBe(125.5);
  });
  it('resets a stale trade valuation when hours change and preserves it on idempotent application', () => {
    const state = { ...initialState, hasTradein: true, tradeInInfo: { hasTradeIn: true, engineHours: 100, estimatedValue: 2000, valuationReportUrl: '/old' } };
    const parsed = parseAgentQuoteHandoff(new URLSearchParams('trade_engine_hours=200'));
    const next = applyAgentQuoteHandoff(state, quoteReducer, parsed);
    expect(next.tradeInInfo).toMatchObject({ engineHours: 200, estimatedValue: 0 });
    expect(next.tradeInInfo.valuationReportUrl).toBeUndefined();
    expect(applyAgentQuoteHandoff(next, quoteReducer, parsed)).toBe(next);
  });
  it.each(['frozenPricing', 'pdfSnapshot', 'editingQuoteId', 'restoredReferenceNumber', 'isAdminQuote'])('protects existing %s from all URL changes', key => {
    const state = { ...initialState, [key]: key === 'isAdminQuote' ? true : 'saved' } as any;
    expect(applyAgentQuoteHandoff(state, quoteReducer, parseAgentQuoteHandoff(new URLSearchParams('purchase_path=loose&customer_has_propeller=true&boat_make=Lund&trade_engine_hours=200&ucp=chk_other')))).toBe(state);
  });
  it('does not restore a linked propeller choice for another selected motor', () => {
    expect(selectedMotorPropellerHandoffActions({ ...initialState, motor }, { motorId: 'other', customerHasPropeller: true })).toEqual([]);
  });
  it('preserves express intent and supports editable ordinary prefills', () => {
    const parsed = parseAgentQuoteHandoff(new URLSearchParams('purchase_path=installed&customer_has_propeller=true&trade_engine_hours=20'));
    expect(applyAgentQuoteHandoff(initialState, quoteReducer, parsed, { skipBoatAndTrade: true })).toBe(initialState);
    const state = applyAgentQuoteHandoff(initialState, quoteReducer, parsed);
    expect(state.installConfig.propellerDecision).toBe('reuse_existing');
    expect(quoteReducer(state, { type: 'SET_PURCHASE_PATH', payload: 'loose' }).purchasePath).toBe('loose');
  });
  it('leaves unrelated upstream links and errors untouched', () => {
    for (const payload of [{ deep_link: 'https://example.invalid/quote/motor-selection' }, { error: 'not available' }, { deep_link: 'not-url' }]) expect(attributeMcpQuotePayload(payload)).toBe(payload);
  });
});
