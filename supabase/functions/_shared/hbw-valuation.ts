const DEFAULT_HBW_VALUATION_URL =
  "https://hbw-valuation-hbw.vercel.app/api/motor-valuation";

export const ALLOWED_HBW_STROKES = new Set([
  "4-stroke",
  "2-stroke",
  "proxs",
  "optimax",
  "etec",
]);

export interface CanonicalHbwValuationInput {
  brand: string;
  year: number;
  hp?: number;
  condition: string;
  stroke?: string;
  hours?: number;
  model?: string;
}

export interface CanonicalHbwValuation {
  wholesale: number;
  listing: number;
  rangeLow: number;
  rangeHigh: number;
  listingRangeLow?: number;
  listingRangeHigh?: number;
  confidence: "high" | "medium" | "low";
  hstSavings: number;
  depreciation?: number;
  conditionFactor?: number;
  marketDemand?: string;
  seasonal?: string;
  factors: string[];
  reportUrl?: string;
  engineVersion?: string;
  referenceVersion?: string;
}

export class HbwValuationError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "HbwValuationError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeHbwStroke(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  const compact = normalized.replace(/[\s_-]+/g, "");
  if (compact === "4stroke" || compact === "fourstroke") return "4-stroke";
  if (compact === "2stroke" || compact === "twostroke") return "2-stroke";
  if (ALLOWED_HBW_STROKES.has(normalized)) return normalized;
  throw new HbwValuationError(
    "engine_type must be one of: 4-stroke, 2-stroke, proxs, optimax, etec",
    400,
    "invalid_stroke",
  );
}

function safeUpstreamMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const candidate = (data as { error?: unknown; message?: unknown }).error ??
    (data as { message?: unknown }).message;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : fallback;
}

/**
 * Server-side adapter for the one canonical motor valuation engine.
 * Undefined hp/stroke fields are deliberately omitted so the HBW model decoder
 * can infer them; ambiguous architecture is allowed to fail closed upstream.
 */
export async function fetchCanonicalHbwValuation(
  input: CanonicalHbwValuationInput,
  timeoutMs = 8000,
): Promise<CanonicalHbwValuation> {
  const apiKey = Deno.env.get("HBW_API_KEY");
  if (!apiKey) {
    throw new HbwValuationError(
      "Trade-in valuation service is not configured",
      500,
      "not_configured",
    );
  }

  const modelArchitecture = (input.model || "").toLowerCase();
  const modelSaysTwoStroke = /\boptimax\b|\b(?:2|two)[\s-]*stroke\b/.test(modelArchitecture);
  const modelSaysFourStroke = /\b(?:4|four)[\s-]*stroke\b/.test(modelArchitecture);
  if (
    (input.stroke === "4-stroke" && modelSaysTwoStroke) ||
    ((input.stroke === "2-stroke" || input.stroke === "optimax") && modelSaysFourStroke)
  ) {
    throw new HbwValuationError(
      "engine_type conflicts with the supplied model description",
      400,
      "stroke_model_conflict",
    );
  }

  const upstreamBody: Record<string, unknown> = {
    brand: input.brand,
    year: input.year,
    condition: input.condition,
  };
  if (input.hp !== undefined) upstreamBody.hp = input.hp;
  if (input.stroke !== undefined) upstreamBody.stroke = input.stroke;
  if (input.hours !== undefined) upstreamBody.hours = input.hours;
  if (input.model) upstreamBody.model = input.model;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      Deno.env.get("HBW_VALUATION_URL") || DEFAULT_HBW_VALUATION_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(upstreamBody),
        signal: controller.signal,
      },
    );

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const status = response.status === 401 || response.status === 403
        ? 502
        : response.status;
      const upstreamCode = data && typeof data === "object" &&
          typeof (data as { code?: unknown }).code === "string"
        ? (data as { code: string }).code
        : undefined;
      throw new HbwValuationError(
        safeUpstreamMessage(data, "Trade-in valuation service rejected the request"),
        status,
        upstreamCode || (response.status === 422 ? "unprocessable_valuation" : "upstream_error"),
        data,
      );
    }

    const value = data as Partial<CanonicalHbwValuation> | null;
    if (
      !value ||
      !Number.isFinite(value.wholesale) ||
      !Number.isFinite(value.rangeLow) ||
      !Number.isFinite(value.rangeHigh) ||
      (value.wholesale as number) <= 0 ||
      (value.rangeLow as number) < 0 ||
      (value.rangeHigh as number) < (value.rangeLow as number)
    ) {
      throw new HbwValuationError(
        "Trade-in valuation service returned an invalid response",
        502,
        "invalid_upstream_response",
      );
    }

    return {
      ...value,
      listing: typeof value.listing === "number" ? value.listing : value.wholesale,
      confidence: value.confidence === "high" || value.confidence === "medium"
        ? value.confidence
        : "low",
      hstSavings: typeof value.hstSavings === "number" ? value.hstSavings : 0,
      factors: Array.isArray(value.factors) ? value.factors : [],
    } as CanonicalHbwValuation;
  } catch (error) {
    if (error instanceof HbwValuationError) throw error;
    console.error("HBW valuation fetch failed:", error);
    throw new HbwValuationError(
      "Trade-in valuation service is temporarily unavailable",
      502,
      "unavailable",
    );
  } finally {
    clearTimeout(timer);
  }
}
