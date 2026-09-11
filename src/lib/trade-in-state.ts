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
    valuedAt: undefined,
    engineVersion: undefined,
    referenceVersion: undefined,
  };
}

export function serializeTradeInDraft(info: TradeInInfo, savedAt = Date.now()): string {
  return JSON.stringify({ version: 2, savedAt, data: info });
}

export function parseTradeInDraft(raw: string, now = Date.now()): Partial<TradeInInfo> | null {
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!parsed || typeof parsed !== 'object') return null;

  // Version 1 stored the TradeInInfo object directly. Preserve the customer's
  // inputs, but never trust an undated valuation amount.
  if (parsed.version !== 2 || !parsed.data || typeof parsed.data !== 'object') {
    return clearTradeInValuation(parsed as TradeInInfo);
  }

  const age = now - Number(parsed.savedAt);
  if (!Number.isFinite(age) || age < 0) return null;
  const data = sanitizeTradeInDraftData(parsed.data as TradeInInfo);
  if (age > TRADE_IN_DRAFT_MAX_AGE_MS) return clearTradeInValuation(data);
  // Date an old v2 estimate once; autosaving it must not extend its valuation age.
  const valuedAt = typeof data.valuedAt === 'number' ? data.valuedAt : Number(parsed.savedAt);
  const valuationAge = now - valuedAt;
  if (!Number.isFinite(valuationAge) || valuationAge < 0 || valuationAge > TRADE_IN_VALUATION_FRESH_MS) return clearTradeInValuation(data);
  return { ...data, valuedAt };
}

function sanitizeDraftMoney(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function sanitizeTradeInDraftData(data: TradeInInfo): TradeInInfo {
  return {
    ...data,
    year: Number.isInteger(data.year) ? data.year : 0,
    horsepower: typeof data.horsepower === 'number' && Number.isFinite(data.horsepower) && data.horsepower > 0
      ? data.horsepower
      : 0,
    estimatedValue: sanitizeDraftMoney(data.estimatedValue),
    rangeFinalLow: typeof data.rangeFinalLow === 'number' && Number.isFinite(data.rangeFinalLow) && data.rangeFinalLow >= 0
      ? data.rangeFinalLow
      : undefined,
    rangeFinalHigh: typeof data.rangeFinalHigh === 'number' && Number.isFinite(data.rangeFinalHigh) && data.rangeFinalHigh >= 0
      ? data.rangeFinalHigh
      : undefined,
    tradeinValueFinal: sanitizeDraftMoney(data.tradeinValueFinal ?? 0) || undefined,
  };
}

export function parseMotorHorsepowerInput(value: string): number {
  const horsepower = Number(value);
  return Number.isFinite(horsepower) && horsepower > 0 ? horsepower : 0;
}

export function isSupportedTradeInYear(year: number, currentYear = new Date().getFullYear()): boolean {
  return Number.isInteger(year) && year >= TRADE_IN_MIN_YEAR && year <= currentYear;
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

/** Snapshot identity excludes audit timestamps so an unchanged restore stays frozen. */
export function tradeInPricingIdentity(info: Partial<TradeInInfo> | null | undefined): string {
  return JSON.stringify(['hasTradeIn','brand','year','horsepower','model','condition','engineType','engineHours','estimatedValue'].map(key=>info?.[key as keyof TradeInInfo] ?? null));
}
