import { useCallback, useEffect, useRef } from 'react';
import { captureAgentAttribution } from './agent-attribution';
import type { Motor, BoatInfo } from '@/components/QuoteBuilder';
import type { QuoteAction, QuoteState } from '@/contexts/QuoteContext';
import { clearTradeInValuation, isSupportedTradeInYear, parseMotorHorsepowerInput } from '@/lib/trade-in-state';
import { EXPRESS_MOTOR_ID } from '../../supabase/functions/_shared/deposit-policy';
import type { TradeInInfo } from '@/lib/trade-valuation';

export const AGENT_QUOTE_HANDOFF_TEXT_MAX = 80;
export const AGENT_QUOTE_HANDOFF_MOTOR_ID_MAX = 80;
export const AGENT_QUOTE_HANDOFF_UCP_MAX = 128;
export const AGENT_QUOTE_HANDOFF_HP_MAX = 1000;
export const UCP_CHECKOUT_REF_FLAG = 'ucpCheckoutRef';
export const AGENT_UCP_PENDING_HANDOFF_FLAG = 'agentUcpHandoff';
export const AGENT_UCP_MOTOR_ID_FLAG = 'ucpHandoffMotorId';
export const AGENT_PROPELLER_HANDOFF_FLAG = 'agentPropellerHandoff';

export const AGENT_QUOTE_HANDOFF_CONSUMABLE_PARAMS = [
  'boat_make',
  'boat_model',
  'trade_brand',
  'trade_year',
  'trade_hp',
  'trade_model',
  'trade_replace',
  'trade_condition',
  'trade_engine_type',
  'trade_engine_hours',
  'purchase_path',
  'customer_has_propeller',
] as const;

export const TRADE_IN_FORM_BRANDS = [
  'Mercury',
  'Yamaha',
  'Honda',
  'Suzuki',
  'Tohatsu',
  'Evinrude',
  'Johnson',
  'OMC',
  'Mariner',
  'Force',
  'Other',
] as const;

export const BOAT_CURRENT_MOTOR_BRANDS = [
  'Mercury',
  'Yamaha',
  'Honda',
  'Suzuki',
  'Evinrude',
  'Other',
] as const;

const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;
const TRADE_HP_RE = /^\d+(?:\.\d+)?$/;
const TRADE_YEAR_RE = /^\d{4}$/;
const UCP_REF_RE = /^[A-Za-z0-9._-]+$/;

export const TRADE_IN_HANDOFF_CONDITIONS = ['excellent', 'good', 'fair', 'poor'] as const;
export const TRADE_IN_HANDOFF_ENGINE_TYPES = ['4-stroke', '2-stroke', 'proxs', 'optimax', 'etec'] as const;

export type TradeInHandoffCondition = typeof TRADE_IN_HANDOFF_CONDITIONS[number];
export type TradeInHandoffEngineType = typeof TRADE_IN_HANDOFF_ENGINE_TYPES[number];

export interface ParsedAgentQuoteHandoff {
  motorId?: string;
  boatMake?: string;
  boatModel?: string;
  tradeBrand?: string;
  tradeYear?: number;
  tradeHp?: number;
  tradeModel?: string;
  replaceTradeIn?: true;
  tradeCondition?: TradeInHandoffCondition;
  tradeEngineType?: TradeInHandoffEngineType;
  tradeEngineHours?: number;
  purchasePath?: 'installed' | 'loose';
  customerHasPropeller?: boolean;
  ucpCheckoutRef?: string;
  reservationPlanning?: true;
}

export interface AgentQuoteHandoffApplyOptions {
  skipBoatAndTrade?: boolean;
  declined?: boolean;
}

export interface AgentQuoteHandoffApplyInput {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams | ((current: URLSearchParams) => URLSearchParams), options?: { replace?: boolean }) => void;
  state: QuoteState;
  dispatch: (action: QuoteAction) => void;
}

function hasControlChars(value: string): boolean {
  return CONTROL_CHAR_RE.test(value);
}

function sanitizeBuyerText(
  raw: string | null,
  maxLength = AGENT_QUOTE_HANDOFF_TEXT_MAX,
): string | undefined {
  if (raw === null) return undefined;
  if (hasControlChars(raw)) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) return undefined;
  return trimmed;
}

function canonicalizeBrand(
  value: string,
  brands: readonly string[],
): string | undefined {
  const normalized = value.trim().toLowerCase();
  return brands.find((brand) => brand.toLowerCase() === normalized);
}

export function parseTradeYearParam(
  raw: string | null,
  currentYear = new Date().getFullYear(),
): number | undefined {
  if (raw === null) return undefined;
  if (hasControlChars(raw)) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (!TRADE_YEAR_RE.test(trimmed)) return undefined;
  const year = Number(trimmed);
  if (!isSupportedTradeInYear(year, currentYear)) return undefined;
  return year;
}

export function parseTradeHpParam(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  if (hasControlChars(raw)) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (!TRADE_HP_RE.test(trimmed)) return undefined;
  const horsepower = parseMotorHorsepowerInput(trimmed);
  if (horsepower <= 0 || horsepower > AGENT_QUOTE_HANDOFF_HP_MAX) return undefined;
  return horsepower;
}

export function parseTradeConditionParam(raw: string | null): TradeInHandoffCondition | undefined {
  if (raw === null) return undefined;
  if (hasControlChars(raw)) return undefined;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return undefined;
  return TRADE_IN_HANDOFF_CONDITIONS.find((condition) => condition === trimmed);
}

export function parseTradeEngineTypeParam(raw: string | null): TradeInHandoffEngineType | undefined {
  if (raw === null) return undefined;
  if (hasControlChars(raw)) return undefined;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return undefined;
  return TRADE_IN_HANDOFF_ENGINE_TYPES.find((engineType) => engineType === trimmed);
}

export function parseReservationHandoffFlag(raw: string | null): true | undefined {
  if (raw !== '1') return undefined;
  return true;
}

export function isReservationPlanningHandoff(handoff: ParsedAgentQuoteHandoff): boolean {
  return handoff.reservationPlanning === true && typeof handoff.ucpCheckoutRef === 'string' && UCP_REF_RE.test(handoff.ucpCheckoutRef);
}

export function parseTradeEngineHoursParam(raw: string | null): number | undefined {
  if (raw === null || !/^\d+(?:\.\d+)?$/.test(raw)) return undefined;
  const hours = Number(raw);
  return Number.isFinite(hours) && hours >= 0 && hours <= 100000 ? hours : undefined;
}

export function isProtectedQuoteHandoff(state: QuoteState): boolean {
  return Boolean(state.frozenPricing || state.pdfSnapshot || state.editingQuoteId || state.restoredReferenceNumber || state.isAdminQuote);
}

export function parseAgentQuoteHandoff(
  searchParams: URLSearchParams,
  currentYear = new Date().getFullYear(),
): ParsedAgentQuoteHandoff {
  const motorId = sanitizeBuyerText(
    searchParams.get('motor') ?? searchParams.get('select'),
    AGENT_QUOTE_HANDOFF_MOTOR_ID_MAX,
  );
  const purchasePath = searchParams.get('purchase_path');
  const propeller = searchParams.get('customer_has_propeller');
  const tradeEngineHours = parseTradeEngineHoursParam(searchParams.get('trade_engine_hours'));
  const boatMake = sanitizeBuyerText(searchParams.get('boat_make'));
  const boatModel = sanitizeBuyerText(searchParams.get('boat_model'));
  const rawTradeBrand = sanitizeBuyerText(searchParams.get('trade_brand'), 64);
  const tradeBrand = rawTradeBrand
    ? canonicalizeBrand(rawTradeBrand, TRADE_IN_FORM_BRANDS) ?? rawTradeBrand
    : undefined;
  const tradeYear = parseTradeYearParam(searchParams.get('trade_year'), currentYear);
  const tradeHp = parseTradeHpParam(searchParams.get('trade_hp'));
  const tradeModel = sanitizeBuyerText(searchParams.get('trade_model'), 120);
  const tradeCondition = parseTradeConditionParam(searchParams.get('trade_condition'));
  const tradeEngineType = parseTradeEngineTypeParam(searchParams.get('trade_engine_type'));
  const ucpCheckoutRef = sanitizeBuyerText(
    searchParams.get('ucp'),
    AGENT_QUOTE_HANDOFF_UCP_MAX,
  );
  const trustedUcp = ucpCheckoutRef && UCP_REF_RE.test(ucpCheckoutRef)
    ? ucpCheckoutRef
    : undefined;
  const reservationPlanning = parseReservationHandoffFlag(searchParams.get('reservation'));

  const parsed: ParsedAgentQuoteHandoff = {};
  if (motorId) parsed.motorId = motorId;
  if (purchasePath === 'installed' || purchasePath === 'loose') parsed.purchasePath = purchasePath;
  if (propeller === 'true' || propeller === 'false') parsed.customerHasPropeller = propeller === 'true';
  if (tradeEngineHours !== undefined) parsed.tradeEngineHours = tradeEngineHours;
  if (boatMake) parsed.boatMake = boatMake;
  if (boatModel) parsed.boatModel = boatModel;
  if (tradeBrand) parsed.tradeBrand = tradeBrand;
  if (tradeYear !== undefined) parsed.tradeYear = tradeYear;
  if (tradeHp !== undefined) parsed.tradeHp = tradeHp;
  if (tradeModel) parsed.tradeModel = tradeModel;
  if (searchParams.get('trade_replace') === '1' && tradeBrand && tradeYear !== undefined && tradeHp !== undefined && tradeCondition
    && (!searchParams.has('trade_model') || Boolean(tradeModel))
    && (!searchParams.has('trade_engine_type') || Boolean(tradeEngineType))
    && (!searchParams.has('trade_engine_hours') || tradeEngineHours !== undefined)) parsed.replaceTradeIn = true;
  if (tradeCondition) parsed.tradeCondition = tradeCondition;
  if (tradeEngineType) parsed.tradeEngineType = tradeEngineType;
  if (searchParams.get('trade_replace') === '1' && !parsed.replaceTradeIn) {
    // Never partially combine a complete API trade with stale draft facts.
    for (const key of ['tradeBrand', 'tradeYear', 'tradeHp', 'tradeModel', 'tradeCondition', 'tradeEngineType', 'tradeEngineHours'] as const) delete parsed[key];
  }
  if (trustedUcp) parsed.ucpCheckoutRef = trustedUcp;
  if (reservationPlanning && trustedUcp) parsed.reservationPlanning = reservationPlanning;
  return parsed;
}

export function isMotorOnlyExpressHandoff(searchParams: URLSearchParams): boolean {
  return searchParams.get('intent') === 'motor-only' && (searchParams.get('motor') ?? searchParams.get('select')) === EXPRESS_MOTOR_ID;
}

export function canOpenMotorFromHandoff(
  motorId: string | undefined,
  motorsLoaded: boolean,
): boolean {
  return Boolean(motorId && motorsLoaded);
}

function blankBoatInfo(): BoatInfo {
  return {
    type: '',
    make: '',
    model: '',
    length: '',
    currentMotorBrand: '',
    currentHp: 0,
    serialNumber: '',
    controlType: '',
    shaftLength: '',
  };
}

function blankTradeInInfo(): Partial<TradeInInfo> {
  return {
    hasTradeIn: false,
    brand: '',
    year: 0,
    horsepower: 0,
    model: '',
    serialNumber: '',
    estimatedValue: 0,
  };
}

function toBoatCurrentMotorBrand(tradeBrand: string): string {
  return canonicalizeBrand(tradeBrand, BOAT_CURRENT_MOTOR_BRANDS) ?? 'Other';
}

function hasExistingText(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

export function mergeBoatInfoFromHandoff(
  existing: BoatInfo | null | undefined,
  handoff: ParsedAgentQuoteHandoff,
): { next: BoatInfo; changed: boolean } | null {
  const hasBoatFields = Boolean(handoff.boatMake || handoff.boatModel);
  const hasTradeMirror = Boolean(
    handoff.tradeBrand || handoff.tradeYear !== undefined || handoff.tradeHp !== undefined,
  );
  if (!hasBoatFields && !hasTradeMirror && !existing) return null;
  if (!hasBoatFields && !hasTradeMirror && !(existing && handoff.customerHasPropeller !== undefined)) return null;

  const next: BoatInfo = existing ? { ...existing } : blankBoatInfo();
  let changed = false;

  if (handoff.customerHasPropeller !== undefined && next.hasCompatibleProp !== handoff.customerHasPropeller) {
    next.hasCompatibleProp = handoff.customerHasPropeller;
    changed = true;
  }
  if (handoff.boatMake && next.make !== handoff.boatMake) {
    next.make = handoff.boatMake;
    changed = true;
  }
  if (handoff.boatModel && next.model !== handoff.boatModel) {
    next.model = handoff.boatModel;
    changed = true;
  }
  if (handoff.tradeBrand && !hasExistingText(next.currentMotorBrand)) {
    next.currentMotorBrand = toBoatCurrentMotorBrand(handoff.tradeBrand);
    changed = true;
  }
  if (handoff.tradeYear !== undefined && !next.currentMotorYear) {
    next.currentMotorYear = handoff.tradeYear;
    changed = true;
  }
  if (handoff.tradeHp !== undefined && !next.currentHp) {
    next.currentHp = handoff.tradeHp;
    changed = true;
  }

  if (!changed && existing) return { next: existing, changed: false };
  if (!changed && !hasBoatFields) return null;
  return { next, changed };
}

export function mergeTradeInInfoFromHandoff(
  existing: Partial<TradeInInfo> | null | undefined,
  handoff: ParsedAgentQuoteHandoff,
): { next: Partial<TradeInInfo>; changed: boolean } | null {
  const hasTradeFields = Boolean(
    handoff.tradeBrand
    || handoff.tradeYear !== undefined
    || handoff.tradeHp !== undefined
    || handoff.tradeModel
    || handoff.tradeCondition
    || handoff.tradeEngineType
    || handoff.tradeEngineHours !== undefined,
  );
  if (!hasTradeFields) return null;

  const next: Partial<TradeInInfo> = existing ? { ...existing } : blankTradeInInfo();
  let changed = false;
  // A full API trade represents all quoted facts. Missing optional inputs mean
  // omitted, not values inherited from a different unfinished draft.
  if (handoff.replaceTradeIn) {
    for (const [key, value] of Object.entries({ model: handoff.tradeModel ?? '', engineType: handoff.tradeEngineType, engineHours: handoff.tradeEngineHours })) {
      if (next[key as keyof TradeInInfo] !== value) changed = true;
    }
    if (next.startType) { next.startType = undefined; changed = true; }
    next.model = handoff.tradeModel ?? '';
    next.engineType = handoff.tradeEngineType;
    next.engineHours = handoff.tradeEngineHours;
    if (next.serialNumber) { next.serialNumber = ''; changed = true; }
  }

  if (handoff.tradeBrand && next.brand !== handoff.tradeBrand) {
    next.brand = handoff.tradeBrand;
    changed = true;
  }
  if (handoff.tradeYear !== undefined && next.year !== handoff.tradeYear) {
    next.year = handoff.tradeYear;
    changed = true;
  }
  if (handoff.tradeHp !== undefined && next.horsepower !== handoff.tradeHp) {
    next.horsepower = handoff.tradeHp;
    changed = true;
  }
  if (handoff.tradeModel && next.model !== handoff.tradeModel) {
    next.model = handoff.tradeModel;
    changed = true;
  }
  if (handoff.tradeCondition && next.condition !== handoff.tradeCondition) {
    next.condition = handoff.tradeCondition;
    changed = true;
  }
  if (handoff.tradeEngineType && next.engineType !== handoff.tradeEngineType) {
    next.engineType = handoff.tradeEngineType;
    changed = true;
  }
  if (handoff.tradeEngineHours !== undefined && next.engineHours !== handoff.tradeEngineHours) {
    next.engineHours = handoff.tradeEngineHours;
    changed = true;
  }
  if (changed) {
    Object.assign(next, clearTradeInValuation(next as TradeInInfo));
  }
  if (!next.hasTradeIn) {
    next.hasTradeIn = true;
    changed = true;
  }

  return { next, changed };
}

export function consumedAgentQuoteHandoffParams(
  handoff: ParsedAgentQuoteHandoff,
  options: AgentQuoteHandoffApplyOptions = {},
): string[] {
  if (options.skipBoatAndTrade && !options.declined) return [];
  const consumed: string[] = [];
  if (handoff.boatMake) consumed.push('boat_make');
  if (handoff.boatModel) consumed.push('boat_model');
  if (handoff.tradeBrand) consumed.push('trade_brand');
  if (handoff.tradeYear !== undefined) consumed.push('trade_year');
  if (handoff.tradeHp !== undefined) consumed.push('trade_hp');
  if (handoff.tradeModel) consumed.push('trade_model');
  if (handoff.replaceTradeIn) consumed.push('trade_replace');
  if (handoff.tradeCondition) consumed.push('trade_condition');
  if (handoff.tradeEngineType) consumed.push('trade_engine_type');
  if (handoff.tradeEngineHours !== undefined) consumed.push('trade_engine_hours');
  if (handoff.purchasePath) consumed.push('purchase_path');
  if (handoff.customerHasPropeller !== undefined) consumed.push('customer_has_propeller');
  return consumed;
}

export function stripConsumedAgentQuoteHandoffParams(
  searchParams: URLSearchParams,
  handoff: ParsedAgentQuoteHandoff,
  options: AgentQuoteHandoffApplyOptions = {},
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (searchParams.get('trade_replace') === '1') {
    for (const key of AGENT_QUOTE_HANDOFF_CONSUMABLE_PARAMS) if (key.startsWith('trade_')) next.delete(key);
  }
  for (const key of consumedAgentQuoteHandoffParams(handoff, options)) {
    next.delete(key);
  }
  if (options.declined) {
    next.delete('ucp');
    next.delete('reservation');
    if (isMotorOnlyExpressHandoff(next)) {
      next.delete('motor');
      next.delete('select');
      next.delete('intent');
    }
  }
  return next;
}

function pendingPropellerHandoff(state: QuoteState): { motorId: string; customerHasPropeller: boolean } | undefined {
  const value = state.uiFlags?.[AGENT_PROPELLER_HANDOFF_FLAG];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.motorId !== 'string' || sanitizeBuyerText(record.motorId, AGENT_QUOTE_HANDOFF_MOTOR_ID_MAX) !== record.motorId || typeof record.customerHasPropeller !== 'boolean') return undefined;
  return { motorId: record.motorId, customerHasPropeller: record.customerHasPropeller };
}

function pendingUcpHandoff(state: QuoteState): { motorId: string; ucpRef: string } | undefined {
  const value = state.uiFlags?.[AGENT_UCP_PENDING_HANDOFF_FLAG];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.motorId !== 'string' || sanitizeBuyerText(record.motorId, AGENT_QUOTE_HANDOFF_MOTOR_ID_MAX) !== record.motorId || typeof record.ucpRef !== 'string' || record.ucpRef.length > AGENT_QUOTE_HANDOFF_UCP_MAX || !UCP_REF_RE.test(record.ucpRef)) return undefined;
  return { motorId: record.motorId, ucpRef: record.ucpRef };
}

export function buildAgentQuoteHandoffActions(
  state: QuoteState,
  handoff: ParsedAgentQuoteHandoff,
  options: AgentQuoteHandoffApplyOptions = {},
): QuoteAction[] {
  const actions: QuoteAction[] = [];
  if (isProtectedQuoteHandoff(state)) return actions;

  if (!options.skipBoatAndTrade) {
    const canApplyPropeller = !handoff.motorId || handoff.motorId === state.motor?.id;
    if (handoff.motorId && handoff.customerHasPropeller !== undefined && !canApplyPropeller) {
      const pending = pendingPropellerHandoff(state);
      if (pending?.motorId !== handoff.motorId || pending?.customerHasPropeller !== handoff.customerHasPropeller) {
        actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_PROPELLER_HANDOFF_FLAG, value: { motorId: handoff.motorId, customerHasPropeller: handoff.customerHasPropeller } } });
      }
    }
    const buyerHandoff = canApplyPropeller ? handoff : { ...handoff, customerHasPropeller: undefined };
    if (handoff.purchasePath && state.purchasePath !== handoff.purchasePath) {
      actions.push({ type: 'SET_PURCHASE_PATH', payload: handoff.purchasePath });
    }
    if (canApplyPropeller && handoff.customerHasPropeller !== undefined) {
      const decision = handoff.customerHasPropeller ? 'reuse_existing' : 'include_allowance';
      if (state.installConfig?.propellerDecision !== decision) {
        actions.push({ type: 'SET_INSTALL_CONFIG', payload: { ...state.installConfig, propellerDecision: decision } });
      }
    }
    const boat = mergeBoatInfoFromHandoff(state.boatInfo, buyerHandoff);
    if (boat?.changed) {
      actions.push({ type: 'SET_BOAT_INFO', payload: boat.next });
    }

    const trade = mergeTradeInInfoFromHandoff(state.tradeInInfo, handoff);
    if (trade?.changed) {
      actions.push({ type: 'PROMOTE_TRADE_IN', payload: trade.next });
    }
  }

  if (handoff.ucpCheckoutRef && handoff.motorId) {
    if (handoff.motorId && handoff.motorId !== state.motor?.id) {
      const pending = pendingUcpHandoff(state);
      if (pending?.motorId !== handoff.motorId || pending?.ucpRef !== handoff.ucpCheckoutRef) {
        actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_UCP_PENDING_HANDOFF_FLAG, value: { motorId: handoff.motorId, ucpRef: handoff.ucpCheckoutRef } } });
      }
    } else {
      if (state.uiFlags?.[UCP_CHECKOUT_REF_FLAG] !== handoff.ucpCheckoutRef) {
        actions.push({ type: 'SET_UI_FLAG', payload: { key: UCP_CHECKOUT_REF_FLAG, value: handoff.ucpCheckoutRef } });
      }
      if (handoff.motorId && state.uiFlags?.[AGENT_UCP_MOTOR_ID_FLAG] !== handoff.motorId) {
        actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_UCP_MOTOR_ID_FLAG, value: handoff.motorId } });
      }
    }
  }
  return actions;
}

export function buildExpressQuoteHandoffActions(state: QuoteState, params: URLSearchParams, motor: Motor, buyerChoseReplacement = false): QuoteAction[] {
  if (state.isLoading || (!buyerChoseReplacement && isProtectedQuoteHandoff(state)) || !isMotorOnlyExpressHandoff(params) || motor.id !== EXPRESS_MOTOR_ID) return [];
  const actions: QuoteAction[] = [{ type: 'START_MOTOR_ONLY_QUOTE', payload: motor }];
  const { ucpCheckoutRef } = parseAgentQuoteHandoff(params);
  if (ucpCheckoutRef) actions.push({ type: 'SET_UI_FLAG', payload: { key: UCP_CHECKOUT_REF_FLAG, value: ucpCheckoutRef } });
  return actions;
}

/** Select the motor first, then consume its deferred propeller answer exactly once. */
export function buildAgentMotorSelectionActions(
  state: QuoteState,
  motor: Motor,
  reduce: (state: QuoteState, action: QuoteAction) => QuoteState,
): QuoteAction[] {
  const select: QuoteAction = { type: 'SET_MOTOR', payload: motor };
  const next = reduce(state, select);
  const actions: QuoteAction[] = [select];
  const pendingUcp = pendingUcpHandoff(state);
  const scopedMotorId = state.uiFlags?.[AGENT_UCP_MOTOR_ID_FLAG];
  const attachedUcpRef = state.uiFlags?.[UCP_CHECKOUT_REF_FLAG];
  const ucpRef = pendingUcp?.motorId === motor.id ? pendingUcp.ucpRef
    : scopedMotorId === motor.id && typeof attachedUcpRef === 'string' ? attachedUcpRef : undefined;
  if (ucpRef && UCP_REF_RE.test(ucpRef) && ucpRef.length <= AGENT_QUOTE_HANDOFF_UCP_MAX) {
    if (next.uiFlags?.[UCP_CHECKOUT_REF_FLAG] !== ucpRef) {
      actions.push({ type: 'SET_UI_FLAG', payload: { key: UCP_CHECKOUT_REF_FLAG, value: ucpRef } });
    }
    if (next.uiFlags?.[AGENT_UCP_MOTOR_ID_FLAG] !== motor.id) {
      actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_UCP_MOTOR_ID_FLAG, value: motor.id } });
    }
  } else if (typeof scopedMotorId === 'string' && scopedMotorId !== motor.id && next.uiFlags?.[UCP_CHECKOUT_REF_FLAG]) {
    actions.push({ type: 'SET_UI_FLAG', payload: { key: UCP_CHECKOUT_REF_FLAG, value: null } });
    actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_UCP_MOTOR_ID_FLAG, value: null } });
  }
  if (pendingUcp && next.uiFlags?.[AGENT_UCP_PENDING_HANDOFF_FLAG]) {
    actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_UCP_PENDING_HANDOFF_FLAG, value: null } });
  }
  const pending = pendingPropellerHandoff(state);
  if (pending && pending.motorId === motor.id && typeof pending.customerHasPropeller === 'boolean') {
    actions.push(...buildAgentQuoteHandoffActions(next, { customerHasPropeller: pending.customerHasPropeller }));
  }
  if (pending && next.uiFlags?.[AGENT_PROPELLER_HANDOFF_FLAG]) {
    actions.push({ type: 'SET_UI_FLAG', payload: { key: AGENT_PROPELLER_HANDOFF_FLAG, value: null } });
  }
  return actions;
}

export function applyAgentQuoteHandoff(
  state: QuoteState,
  reduce: (state: QuoteState, action: QuoteAction) => QuoteState,
  handoff: ParsedAgentQuoteHandoff,
  options: AgentQuoteHandoffApplyOptions = {},
): QuoteState {
  return buildAgentQuoteHandoffActions(state, handoff, options).reduce(reduce, state);
}

export function useAgentQuoteHandoff({
  searchParams,
  setSearchParams,
  state,
  dispatch,
}: AgentQuoteHandoffApplyInput): (params: URLSearchParams) => URLSearchParams {
  const appliedRef = useRef(false);
  const cleanupRef = useRef<{ handoff: ParsedAgentQuoteHandoff; options: AgentQuoteHandoffApplyOptions } | null>(null);
  const cleanup = useCallback((params: URLSearchParams) => {
    const consumed = cleanupRef.current;
    return consumed ? stripConsumedAgentQuoteHandoffParams(params, consumed.handoff, consumed.options) : params;
  }, []);

  useEffect(() => {
    if (appliedRef.current || state.isLoading) return;

    appliedRef.current = true;
    captureAgentAttribution();
    const protectedQuote = isProtectedQuoteHandoff(state);
    const skipBoatAndTrade = isMotorOnlyExpressHandoff(searchParams);
    const handoff = parseAgentQuoteHandoff(searchParams);
    cleanupRef.current = { handoff, options: { skipBoatAndTrade, declined: protectedQuote && !skipBoatAndTrade } };
    const actions = buildAgentQuoteHandoffActions(state, handoff, { skipBoatAndTrade });
    for (const action of actions) {
      dispatch(action);
    }

    // All URL writers share the consumed-field cleanup, including router snapshots.
    if (cleanup(searchParams).toString() !== searchParams.toString()) {
      setSearchParams(cleanup, { replace: true });
    }
  }, [cleanup, dispatch, searchParams, setSearchParams, state]);
  return cleanup;
}
