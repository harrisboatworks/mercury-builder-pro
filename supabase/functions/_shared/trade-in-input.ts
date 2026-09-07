import { normalizeHbwStroke } from "./hbw-valuation-response.ts";

export class TradeInInputError extends Error {
  readonly status = 400;
  readonly code = "invalid_trade_in";

  constructor(message: string) {
    super(message);
    this.name = "TradeInInputError";
  }
}

const CONDITIONS = new Set(["excellent", "good", "fair", "poor"]);

export interface ResolvedTradeInInput {
  brand: string;
  year: number;
  horsepower: number;
  condition: string;
  engineType?: string;
  engineHours?: number;
  model?: string;
  serialNumber?: string;
  overrideValue?: number;
}

function isPresentTradeObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/** True when a caller sent a trade object that must be accepted or rejected. */
export function isPresentTradeIn(value: unknown): boolean {
  return value !== undefined && value !== null;
}

/**
 * Validated HP from an explicit number or a model string.
 * Accepts a single plausible 2–450 HP token; ambiguous multi-number text fails.
 */
export function inferValidatedTradeInHorsepower(model?: string): number | null {
  const trimmed = (model || "").trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (/\b(?:OR|TO)\b|\d\s*\/\s*\d/.test(upper)) return null;

  const leadingStrokeHp = upper.match(
    /^(?:2|4|TWO|FOUR)[\s-]?(?:S|STROKES?)\s+(\d{1,3}(?:\.\d)?)(?!\d)/,
  );
  if (leadingStrokeHp) {
    const horsepower = parseFloat(leadingStrokeHp[1]);
    return horsepower >= 2 && horsepower <= 450 ? horsepower : null;
  }

  const strong = upper.match(/^(?:F|DF|BF|DT)?(\d{1,3}(?:\.\d)?)(?!\d)/);
  if (strong) {
    const horsepower = parseFloat(strong[1]);
    return horsepower >= 2 && horsepower <= 450 ? horsepower : null;
  }

  const embedded = Array.from(upper.matchAll(/\b(\d{1,3}(?:\.\d)?)\b/g))
    .map((match) => parseFloat(match[1]))
    .filter((n) => n >= 2 && n <= 450 && !(n >= 1950 && n <= 2050));

  if (embedded.length === 1) return embedded[0];
  return null;
}

export function resolveTradeInHorsepower(input: {
  horsepower?: unknown;
  model?: unknown;
}): number | null {
  if (input.horsepower !== undefined && input.horsepower !== null && input.horsepower !== '') {
    const hp = typeof input.horsepower === 'number' || typeof input.horsepower === 'string' ? Number(input.horsepower) : NaN;
    return Number.isFinite(hp) && hp > 0 && hp <= 1000 ? hp : null;
  }
  if (typeof input.model === "string") {
    return inferValidatedTradeInHorsepower(input.model);
  }
  return null;
}

export function resolveTradeInInput(
  value: unknown,
  options: { allowOverride?: boolean } = {},
): ResolvedTradeInInput {
  if (!isPresentTradeObject(value)) {
    throw new TradeInInputError("trade_in must be an object");
  }

  const brand = typeof value.brand === "string" ? value.brand.trim() : "";
  const year = typeof value.year === "number" ? value.year : Number(value.year);
  const model = typeof value.model === "string" && value.model.trim()
    ? value.model.trim()
    : undefined;
  const horsepower = resolveTradeInHorsepower({
    horsepower: value.horsepower ?? value.hp,
    model,
  });
  const condition = String(value.condition || "good").toLowerCase();

  if (!brand) throw new TradeInInputError("trade_in.brand is required");
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()) {
    throw new TradeInInputError("trade_in.year must be a supported whole year");
  }
  if (horsepower == null) {
    throw new TradeInInputError(
      "trade_in.horsepower is required, or supply a model that infers a single validated HP",
    );
  }
  if (!CONDITIONS.has(condition)) {
    throw new TradeInInputError("trade_in.condition must be excellent, good, fair, or poor");
  }

  let engineType: string | undefined;
  try {
    engineType = normalizeHbwStroke(value.engine_type ?? value.engineType);
  } catch {
    throw new TradeInInputError(
      "trade_in.engine_type must be 4-stroke, 2-stroke, proxs, optimax, or etec",
    );
  }

  const hoursRaw = value.engine_hours ?? value.engineHours ?? value.hours;
  const engineHours = hoursRaw === undefined || hoursRaw === null || hoursRaw === '' ? undefined
    : typeof hoursRaw === 'number' || typeof hoursRaw === 'string' ? Number(hoursRaw) : NaN;
  if (engineHours !== undefined && (!Number.isFinite(engineHours) || engineHours < 0 || engineHours > 100000)) throw new TradeInInputError('trade_in.engine_hours must be between 0 and 100000');

  const overrideRaw = value.override_value ?? value.overrideValue;
  const overrideValue = options.allowOverride &&
      typeof overrideRaw === "number" &&
      Number.isFinite(overrideRaw) &&
      overrideRaw > 0
    ? overrideRaw
    : undefined;

  return {
    brand,
    year,
    horsepower,
    condition,
    engineType,
    engineHours,
    model,
    serialNumber: typeof value.serial_number === "string"
      ? value.serial_number
      : typeof value.serialNumber === "string"
        ? value.serialNumber
        : undefined,
    overrideValue,
  };
}
