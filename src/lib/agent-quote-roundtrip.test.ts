import { describe, expect, it, vi } from 'vitest';
import { buildAgentQuoteLink, attributeMcpQuotePayload } from '../../supabase/functions/_shared/agent-quote-link';
import { runPublicQuoteTool } from '../../supabase/functions/_shared/public-agent-mcp';
import { applyAgentQuoteHandoff, buildExpressQuoteHandoffActions, buildAgentQuoteHandoffActions, parseAgentQuoteHandoff, buildAgentMotorSelectionActions, stripConsumedAgentQuoteHandoffParams } from './agent-quote-handoff';
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
    expect(state.installConfig).toBeNull();
    const existing = { ...state, motor: { ...motor, id: 'old' } };
    state = buildAgentMotorSelectionActions(existing, motor, quoteReducer).reduce(quoteReducer, existing);
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
    expect(state.uiFlags).toEqual({ agentUcpHandoff: { motorId: id, ucpRef: 'chk_synthetic' } });
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
    const handoffState = applyAgentQuoteHandoff(initialState, quoteReducer, { motorId: 'other', customerHasPropeller: true });
    const selected = buildAgentMotorSelectionActions(handoffState, motor, quoteReducer).reduce(quoteReducer, handoffState);
    expect(selected.installConfig).toBeNull();
    expect(selected.boatInfo?.hasCompatibleProp).not.toBe(true);
    expect(selected.uiFlags.agentPropellerHandoff).toBeNull();
  });
  it('preserves express intent and supports editable ordinary prefills', () => {
    const parsed = parseAgentQuoteHandoff(new URLSearchParams('purchase_path=installed&customer_has_propeller=true&trade_engine_hours=20'));
    expect(applyAgentQuoteHandoff(initialState, quoteReducer, parsed, { skipBoatAndTrade: true })).toBe(initialState);
    const state = applyAgentQuoteHandoff(initialState, quoteReducer, parsed);
    expect(state.installConfig.propellerDecision).toBe('reuse_existing');
    expect(quoteReducer(state, { type: 'SET_PURCHASE_PATH', payload: 'loose' }).purchasePath).toBe('loose');
  });
  it.each([null, { ...motor, id: 'old' }])('keeps a deferred answer scoped across reload with prior motor %s', prior => {
    const parsed = parseAgentQuoteHandoff(new URLSearchParams({ motor: id, customer_has_propeller: 'true' }));
    const pending = applyAgentQuoteHandoff({ ...initialState, motor: prior }, quoteReducer, parsed);
    const reloaded = JSON.parse(JSON.stringify(pending));
    const selected = buildAgentMotorSelectionActions(reloaded, motor, quoteReducer).reduce(quoteReducer, reloaded);
    expect(selected.installConfig.propellerDecision).toBe('reuse_existing');
    expect(selected.boatInfo).toBeNull();
    const edited = quoteReducer(selected, { type: 'SET_INSTALL_CONFIG', payload: { propellerDecision: 'include_allowance' } });
    expect(buildAgentMotorSelectionActions(edited, motor, quoteReducer).reduce(quoteReducer, edited).installConfig.propellerDecision).toBe('include_allowance');
  });
  it.each([null, { ...motor, id: 'old' }])('retains UCP context only for its linked motor with prior motor %s', prior => {
    const state = applyAgentQuoteHandoff({ ...initialState, motor: prior }, quoteReducer, { motorId: id, ucpCheckoutRef: 'chk_synthetic' });
    expect(state.uiFlags.ucpCheckoutRef).toBeUndefined();
    expect(buildAgentMotorSelectionActions(state, motor, quoteReducer).reduce(quoteReducer, state).uiFlags.ucpCheckoutRef).toBe('chk_synthetic');
    expect(buildAgentMotorSelectionActions(state, { ...motor, id: 'other' }, quoteReducer).reduce(quoteReducer, state).uiFlags.ucpCheckoutRef).toBeUndefined();
  });
  it('protects saved quotes from express replacement and preserves a fresh express UCP handoff', () => {
    const express = { ...motor, id: 'e920cfdf-223a-408a-850b-6f112e15c4d7' };
    const params = new URLSearchParams({ motor: express.id, intent: 'motor-only', ucp: 'chk_synthetic' });
    const protectedState = { ...initialState, isLoading: false, restoredReferenceNumber: 'HBW-SYNTHETIC' };
    expect(buildExpressQuoteHandoffActions(protectedState, params, express)).toEqual([]);
    expect(stripConsumedAgentQuoteHandoffParams(params, parseAgentQuoteHandoff(params), { declined: true }).toString()).toBe('');
    const replaced = buildExpressQuoteHandoffActions(protectedState, params, express, true).reduce(quoteReducer, protectedState);
    expect(replaced.motor?.id).toBe(express.id);
    expect(replaced.restoredReferenceNumber).toBeUndefined();
    const fresh = { ...initialState, isLoading: false };
    const next = buildExpressQuoteHandoffActions(fresh, params, express).reduce(quoteReducer, fresh);
    expect(next.purchasePath).toBe('loose');
    expect(next.uiFlags.ucpCheckoutRef).toBe('chk_synthetic');
  });
  it('updates a stale UCP motor scope even when the pending parent reference matches the attached string', () => {
    const state = { ...initialState, uiFlags: { ucpCheckoutRef: 'chk_synthetic', ucpHandoffMotorId: 'other', agentUcpHandoff: { motorId: id, ucpRef: 'chk_synthetic' } } };
    const selected = buildAgentMotorSelectionActions(state, motor, quoteReducer).reduce(quoteReducer, state);
    expect(selected.uiFlags.ucpHandoffMotorId).toBe(id);
    expect(selected.uiFlags.agentUcpHandoff).toBeNull();
  });
  it('keeps motorless legacy UCP references as planning hints without attaching them to a different selected motor', () => {
    const state = { ...initialState, motor: { ...motor, id: 'other' } };
    const parsed = parseAgentQuoteHandoff(new URLSearchParams('ucp=chk_synthetic&src=agent_ucp'));
    expect(applyAgentQuoteHandoff(state, quoteReducer, parsed)).toBe(state);
  });
  it('does not serialize null or empty optional boat fields as buyer answers', () => {
    const params = new URL(buildAgentQuoteLink(id, { boat_make: 'Lund', boat_model: null, trade_year: undefined, trade_brand: '' })).searchParams;
    expect(params.has('boat_model')).toBe(false);
    expect(params.has('trade_year')).toBe(false);
    expect(params.has('trade_brand')).toBe(false);
    expect(params.get('boat_make')).toBe('Lund');
  });
  it('leaves unrelated upstream links and errors untouched', () => {
    for (const payload of [{ deep_link: 'https://example.invalid/quote/motor-selection' }, { error: 'not available' }, { deep_link: 'not-url' }]) expect(attributeMcpQuotePayload(payload)).toBe(payload);
  });
});
