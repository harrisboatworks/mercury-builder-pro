export interface TradeInInfo {
  hasTradeIn: boolean;
  brand: string;
  year: number;
  horsepower: number;
  model: string;
  serialNumber: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  engineType?: '4-stroke' | '2-stroke' | 'optimax';
  startType?: 'manual' | 'electric';
  engineHours?: number;
  // Optional audit fields for pre/post penalty values
  rangePrePenaltyLow?: number;
  rangePrePenaltyHigh?: number;
  rangeFinalLow?: number;
  rangeFinalHigh?: number;
  tradeinValuePrePenalty?: number;
  tradeinValueFinal?: number;
  penaltyApplied?: boolean;
  penaltyFactor?: number;
  valuationReportUrl?: string;
}

export const CANONICAL_HBW_VALUATION_ORIGIN = 'https://valuation.mercuryrepower.ca';

export interface TradeValueEstimate {
  low: number;
  high: number;
  average: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  factors: string[];
  // Audit fields
  prePenaltyLow?: number;
  prePenaltyHigh?: number;
  penaltyApplied?: boolean;
  penaltyFactor?: number;
}

// These factors are display-only audit metadata. Values themselves always come
// from the canonical HBW API below.
const TRADE_BRAND_FACTORS: Record<string, number> = {
  MERCURY: 1,
  YAMAHA: 1,
  HONDA: 0.8,
  SUZUKI: 0.8,
  NISSAN: 0.8,
  TOHATSU: 0.8,
  JOHNSON: 0.5,
  EVINRUDE: 0.5,
  OMC: 0.5,
  MARINER: 0.5,
  FORCE: 0.5,
  OTHER: 0.5,
};
const TRADEIN_MIN_VALUE = 100;

export function normalizeBrand(input?: string): string {
  return (input || '').trim().toUpperCase();
}

export function getBrandPenaltyFactor(brand?: string): number {
  const normalized = normalizeBrand(brand);
  for (const [candidate, factor] of Object.entries(TRADE_BRAND_FACTORS)) {
    if (normalized.includes(candidate)) return factor;
  }
  return TRADE_BRAND_FACTORS.OTHER;
}

// Compute the median of a canonical low/high range and round to $25.
export function medianRoundedTo25(
  low: number,
  high: number,
  minValue = TRADEIN_MIN_VALUE,
): number {
  return Math.max(Math.round(((low + high) / 2) / 25) * 25, minValue);
}

// ─── HBW Motor Valuation API ───────────────────────────────────────────────────

export interface HBWValuationResponse {
  wholesale: number;
  listing: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: 'high' | 'medium' | 'low';
  hstSavings: number;
  depreciation: number;
  conditionFactor: number;
  marketDemand: string;
  seasonal: string;
  factors: string[];
}

export interface HBWValuationResult extends TradeValueEstimate {
  /** HBW listing (private-sale) value */
  listingValue: number;
  /** HST savings from trading in vs private sale */
  hstSavings: number;
  /** Whether this came from HBW API (true) or local fallback (false) */
  fromHBW: boolean;
}

/**
 * Why a valuation call failed. 'rate_limited' is materially different from the
 * others: nothing is broken, the visitor has simply run more estimates than the
 * proxy allows in its window (20 per 10 minutes per IP). Telling them the
 * service is down is both untrue and alarming — shared/NAT IPs on marina wifi
 * or a busy show day will hit this with no fault of their own.
 */
export type HBWValuationFailure = 'rate_limited' | 'input_rejected' | 'unavailable';
export type HBWValuationFetchResult =
  | { ok: true; value: HBWValuationResult }
  | { ok: false; reason: HBWValuationFailure };

export interface HBWValuationParams {
  brand: string;
  year: number;
  horsepower?: number;
  condition: TradeInInfo['condition'];
  stroke: NonNullable<TradeInInfo['engineType']>;
  hours?: number;
  model?: string;
}

/** Pull an HTTP status off a supabase.functions.invoke error, which wraps the
 *  Response rather than exposing the status directly. */
async function statusFromInvokeError(error: unknown): Promise<number | null> {
  const res = (error as { context?: { response?: Response; status?: number } })?.context;
  if (typeof res?.status === 'number') return res.status;
  if (res?.response && typeof res.response.status === 'number') return res.response.status;
  return null;
}

/**
 * Normalize one Supabase Edge Function invocation into an explicit result.
 * Keeping the failure reason in the return value avoids a shared mutable
 * module global that concurrent callers could overwrite.
 */
export async function fetchHBWValuationFromInvoker(
  params: HBWValuationParams,
  invoke: (name: string, options: { body: Record<string, unknown> }) => Promise<{ data: unknown; error: unknown }>,
): Promise<HBWValuationFetchResult> {
  // Build body with only the fields we have. The canonical service can decode HP
  // and stroke from the model code, so omit empty values rather than sending
  // defaults that would override the decoder.
  const body: Record<string, unknown> = {
    brand: params.brand,
    year: params.year,
    condition: params.condition,
  };
  if (params.horsepower && params.horsepower > 0) body.hp = params.horsepower;
  if (params.model && params.model.trim()) body.model = params.model.trim();
  if (params.stroke) body.stroke = params.stroke;
  if (params.hours !== undefined) body.hours = params.hours;

  try {
    const { data, error } = await invoke('hbw-valuation-proxy', { body });

    if (error) {
      const status = await statusFromInvokeError(error);
      const reason = status === 429 ? 'rate_limited'
        : status === 400 || status === 422 ? 'input_rejected'
        : 'unavailable';
      console.warn(`HBW valuation proxy error (status ${status ?? 'unknown'}):`, error);
      return { ok: false, reason };
    }
    const payload = data as { error?: unknown; code?: string } | null;
    if (!payload || typeof payload !== 'object' || payload.error) {
      const reason = payload?.code === 'rate_limited' ? 'rate_limited'
        : payload?.code === 'invalid_input' || payload?.code === 'stroke_required' ? 'input_rejected'
        : 'unavailable';
      console.warn('HBW valuation proxy returned error payload:', data);
      return { ok: false, reason };
    }

    const v = data as HBWValuationResponse;
    if (typeof v.rangeLow !== 'number' || typeof v.rangeHigh !== 'number') {
      console.warn('HBW valuation proxy returned unexpected shape:', data);
      return { ok: false, reason: 'unavailable' };
    }

    return {
      ok: true,
      value: {
        low: v.rangeLow,
        high: v.rangeHigh,
        average: v.wholesale,
        confidence: v.confidence,
        source: 'HBW Motor Valuation API',
        factors: v.factors || [],
        listingValue: v.listing,
        hstSavings: v.hstSavings,
        fromHBW: true,
      },
    };
  } catch (err) {
    console.warn('HBW valuation API failed:', err);
    return { ok: false, reason: 'unavailable' };
  }
}

/** Fetch a motor valuation from the canonical HBW API through Supabase. */
export async function fetchHBWValuation(params: HBWValuationParams): Promise<HBWValuationFetchResult> {
  try {
    // Lazy import to avoid pulling the supabase client into non-React contexts
    const { supabase } = await import('@/integrations/supabase/client');
    return await fetchHBWValuationFromInvoker(params, (name, options) =>
      supabase.functions.invoke(name, options),
    );
  } catch (err) {
    console.warn('HBW valuation API failed:', err);
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Build the URL for the HBW valuation report with pre-filled params.
 */
export function buildHBWReportUrl(params: {
  brand: string;
  year: number;
  hp: number;
  condition: string;
  stroke: string;
  hours?: number;
  model?: string;
}): string {
  const base = `${CANONICAL_HBW_VALUATION_ORIGIN}/`;
  const query = new URLSearchParams();
  query.set('brand', params.brand);
  query.set('year', String(params.year));
  query.set('hp', String(params.hp));
  query.set('condition', params.condition);
  if (!params.stroke?.trim()) throw new Error('Confirmed stroke is required to build a valuation report URL');
  query.set('stroke', params.stroke);
  if (params.hours) query.set('hours', String(params.hours));
  if (params.model) query.set('model', params.model);
  query.set('auto', 'true');
  return `${base}?${query.toString()}`;
}
