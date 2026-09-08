export const HBW_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type HbwConfidence = (typeof HBW_CONFIDENCE_LEVELS)[number];

export const CANONICAL_HBW_ENGINE_TYPES = [
  "4-stroke",
  "2-stroke",
  "proxs",
  "optimax",
  "etec",
] as const;
export type CanonicalHbwEngineType = (typeof CANONICAL_HBW_ENGINE_TYPES)[number];

export interface CanonicalHbwValuationPayload {
  wholesale: number;
  listing: number;
  rangeLow: number;
  rangeHigh: number;
  listingRangeLow?: number;
  listingRangeHigh?: number;
  confidence: HbwConfidence;
  hstSavings: number;
  depreciation?: number;
  conditionFactor?: number;
  marketDemand?: string;
  seasonal?: string;
  factors: string[];
  reportUrl?: string;
  engineVersion?: string;
  referenceVersion?: string;
  effectiveInputs?: { brand: string; year: number; hp: number; stroke: string; condition: string; hours: number | null };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteNonNegativeMoney(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isPositiveMoney(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isSafeOptionalString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 2000;
}

function isSafeOptionalMetadataNumber(value: unknown): value is number {
  return isFiniteNonNegativeMoney(value);
}

/**
 * One client/server validator for canonical HBW valuation payloads.
 * Rejects non-finite money, inverted ranges, non-positive wholesale,
 * unsupported confidence, and non-string factors.
 */
export function parseCanonicalHbwValuation(
  data: unknown,
): CanonicalHbwValuationPayload | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const value = data as Record<string, unknown>;
  if (value.error) return null;

  if (!isPositiveMoney(value.wholesale)) return null;
  if (!isFiniteNonNegativeMoney(value.listing)) return null;
  if (!isFiniteNonNegativeMoney(value.rangeLow)) return null;
  if (!isFiniteNonNegativeMoney(value.rangeHigh)) return null;
  if (value.rangeHigh < value.rangeLow || value.wholesale < value.rangeLow || value.wholesale > value.rangeHigh) return null;
  if (value.listingRangeLow !== undefined && (!isFiniteNonNegativeMoney(value.listingRangeLow) || value.listing < value.listingRangeLow)) return null;
  if (value.listingRangeHigh !== undefined && (!isFiniteNonNegativeMoney(value.listingRangeHigh) || value.listing > value.listingRangeHigh)) return null;
  if (
    typeof value.confidence !== "string" ||
    !HBW_CONFIDENCE_LEVELS.includes(value.confidence as HbwConfidence)
  ) {
    return null;
  }

  const hstSavings = value.hstSavings === undefined ? 0 : value.hstSavings;
  if (!isFiniteNonNegativeMoney(hstSavings)) return null;

  if (value.factors !== undefined) {
    if (
      !Array.isArray(value.factors) ||
      !value.factors.every((factor) => typeof factor === "string")
    ) {
      return null;
    }
  }

  const parsed: CanonicalHbwValuationPayload = {
    wholesale: value.wholesale,
    listing: value.listing,
    rangeLow: value.rangeLow,
    rangeHigh: value.rangeHigh,
    confidence: value.confidence as HbwConfidence,
    hstSavings,
    factors: Array.isArray(value.factors) ? value.factors as string[] : [],
  };

  if (isSafeOptionalMetadataNumber(value.listingRangeLow)) {
    parsed.listingRangeLow = value.listingRangeLow;
  }
  if (isSafeOptionalMetadataNumber(value.listingRangeHigh)) {
    parsed.listingRangeHigh = value.listingRangeHigh;
  }
  if (isSafeOptionalMetadataNumber(value.depreciation)) {
    parsed.depreciation = value.depreciation;
  }
  if (isSafeOptionalMetadataNumber(value.conditionFactor)) {
    parsed.conditionFactor = value.conditionFactor;
  }
  if (isSafeOptionalString(value.marketDemand)) {
    parsed.marketDemand = value.marketDemand;
  }
  if (isSafeOptionalString(value.seasonal)) {
    parsed.seasonal = value.seasonal;
  }
  if (isSafeOptionalString(value.reportUrl)) {
    try { const url = new URL(value.reportUrl); if (url.origin === 'https://valuation.mercuryrepower.ca') parsed.reportUrl = url.href; } catch { /* Ignore malformed optional links. */ }
  }
  if (isSafeOptionalString(value.engineVersion)) {
    parsed.engineVersion = value.engineVersion;
  }
  const referenceVersion = value.referenceDataVersion ?? value.referenceVersion;
  if (isSafeOptionalString(referenceVersion)) parsed.referenceVersion = referenceVersion;
  const effective = value.effectiveInputs as CanonicalHbwValuationPayload['effectiveInputs'];
  if (effective && typeof effective === 'object' && typeof effective.brand === 'string'
    && Number.isInteger(effective.year) && isPositiveMoney(effective.hp)
    && typeof effective.stroke === 'string' && typeof effective.condition === 'string'
    && (effective.hours === null || isFiniteNonNegativeMoney(effective.hours))) parsed.effectiveInputs = effective;


  return parsed;
}

export function normalizeHbwStroke(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw Object.assign(new Error("engine_type must be text"), { code: "invalid_stroke", status: 400 });
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  const compact = normalized.replace(/[\s_-]+/g, "");
  if (compact === "4stroke" || compact === "fourstroke") return "4-stroke";
  if (compact === "2stroke" || compact === "twostroke") return "2-stroke";
  if (["proxs", "etec", "optimax"].includes(compact)) return compact;
  if ((CANONICAL_HBW_ENGINE_TYPES as readonly string[]).includes(normalized)) {
    return normalized;
  }
  throw Object.assign(
    new Error("engine_type must be one of: 4-stroke, 2-stroke, proxs, optimax, etec"),
    { code: "invalid_stroke", status: 400 },
  );
}
