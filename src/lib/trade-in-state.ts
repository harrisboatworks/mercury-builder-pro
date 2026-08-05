import type { BoatInfo } from '@/components/QuoteBuilder';
import type { TradeInInfo } from '@/lib/trade-valuation';

export const TRADE_IN_MIN_YEAR = 1950;
export const TRADE_IN_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const TRADE_IN_VALUATION_FRESH_MS = 30 * 60 * 1000;

export function clearTradeInValuation(
  info: TradeInInfo,
  changes: Partial<TradeInInfo> = {},
): TradeInInfo {
  return {
    ...info,
    ...changes,
    estimatedValue: 0,
    confidenceLevel: 'medium',
    rangePrePenaltyLow: undefined,
    rangePrePenaltyHigh: undefined,
    rangeFinalLow: undefined,
    rangeFinalHigh: undefined,
    tradeinValuePrePenalty: undefined,
    tradeinValueFinal: undefined,
    penaltyApplied: undefined,
    penaltyFactor: undefined,
    valuationReportUrl: undefined,
  };
}

export function serializeTradeInDraft(info: TradeInInfo, savedAt = Date.now()): string {
  return JSON.stringify({ version: 2, savedAt, data: info });
}

export function parseTradeInDraft(raw: string, now = Date.now()): Partial<TradeInInfo> | null {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  // Version 1 stored the TradeInInfo object directly. Preserve the customer's
  // inputs, but never trust an undated valuation amount.
  if (parsed.version !== 2 || !parsed.data || typeof parsed.data !== 'object') {
    return clearTradeInValuation(parsed as TradeInInfo);
  }

  const age = now - Number(parsed.savedAt);
  if (!Number.isFinite(age) || age < 0) return null;
  const data = parsed.data as TradeInInfo;
  if (age > TRADE_IN_DRAFT_MAX_AGE_MS) return clearTradeInValuation(data);
  return age > TRADE_IN_VALUATION_FRESH_MS ? clearTradeInValuation(data) : data;
}

export function parseMotorHorsepowerInput(value: string): number {
  const horsepower = Number(value);
  return Number.isFinite(horsepower) && horsepower > 0 ? horsepower : 0;
}

export function isSupportedTradeInYear(year: number, currentYear = new Date().getFullYear()): boolean {
  return year >= TRADE_IN_MIN_YEAR && year <= currentYear;
}

export function buildInitialTradeInInfo(
  existing: TradeInInfo | null | undefined,
  boatInfo: BoatInfo | null | undefined,
): TradeInInfo {
  if (existing) return { ...existing };

  return {
    hasTradeIn: false,
    brand: boatInfo?.currentMotorBrand || '',
    year: boatInfo?.currentMotorYear || 0,
    horsepower: boatInfo?.currentHp || 0,
    model: '',
    serialNumber: '',
    condition: 'good',
    estimatedValue: 0,
    confidenceLevel: 'medium',
  };
}
