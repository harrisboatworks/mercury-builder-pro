import { useEffect, useRef } from 'react';
import type { BoatInfo } from '@/components/QuoteBuilder';
import type { QuoteAction, QuoteState } from '@/contexts/QuoteContext';
import { isSupportedTradeInYear, parseMotorHorsepowerInput } from '@/lib/trade-in-state';
import { EXPRESS_MOTOR_ID } from '../../supabase/functions/_shared/deposit-policy';
import type { TradeInInfo } from '@/lib/trade-valuation';

export const AGENT_QUOTE_HANDOFF_TEXT_MAX = 80;
export const AGENT_QUOTE_HANDOFF_MOTOR_ID_MAX = 80;
export const AGENT_QUOTE_HANDOFF_UCP_MAX = 128;
export const AGENT_QUOTE_HANDOFF_HP_MAX = 600;
export const UCP_CHECKOUT_REF_FLAG = 'ucpCheckoutRef';

export const AGENT_QUOTE_HANDOFF_CONSUMABLE_PARAMS = [
  'boat_make',
  'boat_model',
  'trade_brand',
  'trade_year',
  'trade_hp',
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

const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;
const TRADE_HP_RE = /^\d+(?:\.\d+)?$/;
const TRADE_YEAR_RE = /^\d{4}$/;
const UCP_REF_RE = /^[A-Za-z0-9._-]+$/;

export interface ParsedAgentQuoteHandoff {
  motorId?: string;
  boatMake?: string;
  boatModel?: string;
  tradeBrand?: string;
  tradeYear?: number;
  tradeHp?: number;
  ucpCheckoutRef?: string;
}

export interface AgentQuoteHandoffApplyOptions {
  skipBoatAndTrade?: boolean;
}

export interface AgentQuoteHandoffApplyInput {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void;
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

export function parseAgentQuoteHandoff(
  searchParams: URLSearchParams,
  currentYear = new Date().getFullYear(),
): ParsedAgentQuoteHandoff {
  const motorId = sanitizeBuyerText(
    searchParams.get('motor') ?? searchParams.get('select'),
    AGENT_QUOTE_HANDOFF_MOTOR_ID_MAX,
  );
  const boatMake = sanitizeBuyerText(searchParams.get('boat_make'));
  const boatModel = sanitizeBuyerText(searchParams.get('boat_model'));
  const rawTradeBrand = sanitizeBuyerText(searchParams.get('trade_brand'));
  const tradeBrand = rawTradeBrand
    ? canonicalizeBrand(rawTradeBrand, TRADE_IN_FORM_BRANDS)
    : undefined;
  const tradeYear = parseTradeYearParam(searchParams.get('trade_year'), currentYear);
  const tradeHp = parseTradeHpParam(searchParams.get('trade_hp'));
  const ucpCheckoutRef = sanitizeBuyerText(
    searchParams.get('ucp'),
    AGENT_QUOTE_HANDOFF_UCP_MAX,
  );
  const trustedUcp = ucpCheckoutRef && UCP_REF_RE.test(ucpCheckoutRef)
    ? ucpCheckoutRef
    : undefined;

  const parsed: ParsedAgentQuoteHandoff = {};
  if (motorId) parsed.motorId = motorId;
  if (boatMake) parsed.boatMake = boatMake;
  if (boatModel) parsed.boatModel = boatModel;
  if (tradeBrand) parsed.tradeBrand = tradeBrand;
  if (tradeYear !== undefined) parsed.tradeYear = tradeYear;
  if (tradeHp !== undefined) parsed.tradeHp = tradeHp;
  if (trustedUcp) parsed.ucpCheckoutRef = trustedUcp;
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
  if (!hasBoatFields && !hasTradeMirror) return null;

  const next: BoatInfo = existing ? { ...existing } : blankBoatInfo();
  let changed = false;

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
    handoff.tradeBrand || handoff.tradeYear !== undefined || handoff.tradeHp !== undefined,
  );
  if (!hasTradeFields) return null;

  const next: Partial<TradeInInfo> = existing ? { ...existing } : blankTradeInInfo();
  let changed = false;

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
  if (changed) {
    Object.assign(next, { estimatedValue: 0, confidenceLevel: undefined, rangePrePenaltyLow: undefined, rangePrePenaltyHigh: undefined, rangeFinalLow: undefined, rangeFinalHigh: undefined, tradeinValuePrePenalty: undefined, tradeinValueFinal: undefined, penaltyApplied: undefined, penaltyFactor: undefined, valuationReportUrl: undefined });
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
  if (options.skipBoatAndTrade) return [];
  const consumed: string[] = [];
  if (handoff.boatMake) consumed.push('boat_make');
  if (handoff.boatModel) consumed.push('boat_model');
  if (handoff.tradeBrand) consumed.push('trade_brand');
  if (handoff.tradeYear !== undefined) consumed.push('trade_year');
  if (handoff.tradeHp !== undefined) consumed.push('trade_hp');
  return consumed;
}

export function stripConsumedAgentQuoteHandoffParams(
  searchParams: URLSearchParams,
  handoff: ParsedAgentQuoteHandoff,
  options: AgentQuoteHandoffApplyOptions = {},
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  for (const key of consumedAgentQuoteHandoffParams(handoff, options)) {
    next.delete(key);
  }
  return next;
}

export function buildAgentQuoteHandoffActions(
  state: QuoteState,
  handoff: ParsedAgentQuoteHandoff,
  options: AgentQuoteHandoffApplyOptions = {},
): QuoteAction[] {
  const actions: QuoteAction[] = [];

  if (!options.skipBoatAndTrade) {
    const boat = mergeBoatInfoFromHandoff(state.boatInfo, handoff);
    if (boat?.changed) {
      actions.push({ type: 'SET_BOAT_INFO', payload: boat.next });
    }

    const trade = mergeTradeInInfoFromHandoff(state.tradeInInfo, handoff);
    if (trade?.changed) {
      actions.push({ type: 'PROMOTE_TRADE_IN', payload: trade.next });
    }
  }

  if (
    handoff.ucpCheckoutRef
    && state.uiFlags?.[UCP_CHECKOUT_REF_FLAG] !== handoff.ucpCheckoutRef
  ) {
    actions.push({
      type: 'SET_UI_FLAG',
      payload: { key: UCP_CHECKOUT_REF_FLAG, value: handoff.ucpCheckoutRef },
    });
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
}: AgentQuoteHandoffApplyInput): void {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current || state.isLoading) return;

    appliedRef.current = true;
    const skipBoatAndTrade = isMotorOnlyExpressHandoff(searchParams);
    const handoff = parseAgentQuoteHandoff(searchParams);
    const actions = buildAgentQuoteHandoffActions(state, handoff, { skipBoatAndTrade });
    for (const action of actions) {
      dispatch(action);
    }

    const nextParams = stripConsumedAgentQuoteHandoffParams(searchParams, handoff, {
      skipBoatAndTrade,
    });
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [dispatch, searchParams, setSearchParams, state]);
}
