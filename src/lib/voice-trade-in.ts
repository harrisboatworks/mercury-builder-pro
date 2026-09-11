import { decodeTradeInModel } from '@/components/quote-builder/tradeInModelDecoder';
import {
  buildHBWReportUrl,
  fetchHBWValuation,
  type HBWValuationFetchResult,
  type TradeInInfo,
} from '@/lib/trade-valuation';
import { normalizeHbwStroke } from '@/lib/hbw-valuation-response';
import { TRADE_IN_VALUATION_FRESH_MS } from '@/lib/trade-in-state';
import {
  mapVoiceTradeCondition,
  resolveVoiceArchitecture,
} from '@/lib/voice-trade-in-input';

export { mapVoiceTradeCondition };

export type VoiceTradeCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'rough';

export interface VoiceTradeInParams {
  brand?: string;
  year?: number;
  horsepower?: number;
  condition?: VoiceTradeCondition | string;
  engine_type?: string;
  model?: string;
  hours?: number;
}

export interface VoiceTradeInCard {
  brand: string;
  year: number;
  horsepower: number;
  condition: TradeInInfo['condition'];
  engineType: NonNullable<TradeInInfo['engineType']>;
  model?: string;
  engineHours?: number;
  estimatedValue: number;
  wholesale: number;
  valueRange: { low: number; high: number };
  architecture: string;
  valuedAt: number;
  engineVersion?: string;
  referenceVersion?: string;
  valuationReportUrl?: string;
  confidenceLevel: TradeInInfo['confidenceLevel'];
}

export type VoiceTradeInEstimateResult =
  | { ok: true; card: VoiceTradeInCard; message: string }
  | { ok: false; reason: 'need_condition' | 'need_architecture' | 'unavailable' | 'rate_limited' | 'input_rejected'; message: string };

export function resolveVoiceEngineType(params: {
  engine_type?: string;
  model?: string;
  brand?: string;
  year?: number;
}): NonNullable<TradeInInfo['engineType']> | null {
  const fromShared = resolveVoiceArchitecture({
    engine_type: params.engine_type,
    model: params.model,
  });
  if (
    fromShared === '4-stroke' ||
    fromShared === '2-stroke' ||
    fromShared === 'optimax' ||
    fromShared === 'proxs' ||
    fromShared === 'etec'
  ) {
    return fromShared;
  }

  if (params.engine_type) return null;
  const decoded = decodeTradeInModel(params.model || '', {
    brand: params.brand,
    year: params.year,
  });
  if (decoded.stroke === '4-Stroke') return '4-stroke';
  if (decoded.stroke === '2-Stroke') return '2-stroke';
  if (decoded.stroke === 'OptiMax') return 'optimax';
  return null;
}

export async function estimateVoiceTradeIn(
  params: VoiceTradeInParams,
  fetchValuation: typeof fetchHBWValuation = fetchHBWValuation,
): Promise<VoiceTradeInEstimateResult> {
  const condition = mapVoiceTradeCondition(params.condition);
  if (!condition) {
    return {
      ok: false,
      reason: 'need_condition',
      message: 'I need the motor condition before I can value a trade-in. Is it excellent, good, fair, or poor? Rough condition is valued as poor.',
    };
  }

  const engineType = resolveVoiceEngineType({
    engine_type: params.engine_type,
    model: params.model,
    brand: params.brand,
    year: params.year,
  });
  if (!engineType) {
    return {
      ok: false,
      reason: 'need_architecture',
      message: 'I need the engine type before I can value that trade-in. Is it a 4-stroke, 2-stroke, OptiMax, Pro XS, or E-TEC?',
    };
  }

  const brand = typeof params.brand === 'string' ? params.brand.trim() : '';
  const year = Number(params.year);
  const horsepower = Number(params.horsepower);
  if (!brand || !Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() || !Number.isFinite(horsepower) || horsepower <= 0 || horsepower > 1000) {
    return {
      ok: false,
      reason: 'input_rejected',
      message: 'I need the brand, year, and horsepower before I can request a trade-in value.',
    };
  }

  const rawHours = params.hours;
  const hours = rawHours === undefined || rawHours === null || (rawHours as unknown) === '' ? undefined : typeof rawHours === 'number' || typeof rawHours === 'string' ? Number(rawHours) : NaN;
  if (hours !== undefined && (!Number.isFinite(hours) || hours < 0 || hours > 100000)) return {ok:false,reason:'input_rejected',message:'Engine hours must be a number from 0 to 100000.'};
  const result: HBWValuationFetchResult = await fetchValuation({
    brand,
    year,
    horsepower,
    condition,
    stroke: engineType,
    hours: hours !== undefined && Number.isFinite(hours) ? hours : undefined,
    model: params.model,
  });

  if (result.ok === false) {
    const message = result.reason === 'rate_limited'
      ? 'The valuation service asked us to wait a few minutes before another estimate.'
      : result.reason === 'input_rejected'
        ? 'The valuation service rejected those motor details.'
        : 'The live trade-in valuation is unavailable right now.';
    return { ok: false, reason: result.reason, message };
  }

  const valuedAt = Date.now();
  const reportUrl = result.value.reportUrl || buildHBWReportUrl({
    brand,
    year,
    hp: horsepower,
    condition,
    stroke: engineType,
    hours: hours !== undefined && Number.isFinite(hours) ? hours : undefined,
    model: params.model,
  });

  const card: VoiceTradeInCard = {
    brand,
    year,
    horsepower,
    condition,
    engineType,
    model: params.model,
    engineHours: hours !== undefined && Number.isFinite(hours) ? hours : undefined,
    estimatedValue: result.value.average,
    wholesale: result.value.average,
    valueRange: { low: result.value.low, high: result.value.high },
    architecture: engineType,
    valuedAt,
    engineVersion: result.value.engineVersion,
    referenceVersion: result.value.referenceVersion,
    valuationReportUrl: reportUrl,
    confidenceLevel: result.value.confidence,
  };

  return {
    ok: true,
    card,
    message: `A ${year} ${brand} ${horsepower} horsepower ${engineType} in ${condition} condition trades at $${result.value.average.toLocaleString()} wholesale, range $${result.value.low.toLocaleString()} to $${result.value.high.toLocaleString()}. Final value requires an in-person inspection.`,
  };
}

export function isUsableVoiceTradeInCard(
  data: Partial<VoiceTradeInCard> | null | undefined,
  now = Date.now(),
): data is VoiceTradeInCard {
  if (!data || typeof data.brand !== 'string' || !data.brand.trim()) return false;
  if (!Number.isInteger(data.year) || data.year! < 1950 || data.year! > new Date(now).getFullYear()) return false;
  if (!Number.isFinite(data.horsepower) || data.horsepower! <= 0 || data.horsepower! > 1000) return false;
  if (!mapVoiceTradeCondition(data.condition) || data.condition === ('rough' as string)) return false;
  if (!data.engineType || data.architecture !== data.engineType) return false;
  try { if (normalizeHbwStroke(data.engineType) !== data.engineType) return false; } catch { return false; }
  if (!Number.isFinite(data.estimatedValue) || data.estimatedValue! <= 0 || data.wholesale !== data.estimatedValue) return false;
  if (!data.valueRange || !Number.isFinite(data.valueRange.low) || !Number.isFinite(data.valueRange.high)
    || data.valueRange.low < 0 || data.estimatedValue! < data.valueRange.low || data.estimatedValue! > data.valueRange.high) return false;
  if (!['high','medium','low'].includes(data.confidenceLevel || '')) return false;
  if (!Number.isFinite(data.valuedAt) || now-data.valuedAt! < 0 || now-data.valuedAt! > TRADE_IN_VALUATION_FRESH_MS) return false;
  return true;
}

export function buildPromoteTradeInFromVoiceCard(card: VoiceTradeInCard): TradeInInfo {
  return {
    hasTradeIn: true,
    brand: card.brand,
    year: card.year,
    horsepower: card.horsepower,
    model: card.model || '',
    serialNumber: '',
    condition: card.condition,
    estimatedValue: card.estimatedValue,
    confidenceLevel: card.confidenceLevel,
    engineType: card.engineType,
    engineHours: card.engineHours,
    rangeFinalLow: card.valueRange.low,
    rangeFinalHigh: card.valueRange.high,
    tradeinValueFinal: card.wholesale,
    valuedAt: card.valuedAt,
    engineVersion: card.engineVersion,
    referenceVersion: card.referenceVersion,
    valuationReportUrl: card.valuationReportUrl,
  };
}
