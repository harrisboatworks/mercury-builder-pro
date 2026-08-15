export type Confidence = 'high' | 'medium' | 'low' | 'unknown';

export interface DecodeResult {
  hp: number | null;
  stroke: string | null;
  hpConfidence: Confidence;
  strokeConfidence: Confidence;
  hpReasons: string[];
  strokeReasons: string[];
  warnings: string[];
  suggestions: string[];
}

export interface DecodeContext {
  brand?: string;
  year?: number;
}

export type DecodedTradeInEngineType = '4-stroke' | '2-stroke' | 'optimax' | undefined;

const BRAND_FROM_PREFIX: Record<string, string> = {
  F: 'Yamaha',
  DF: 'Suzuki',
  BF: 'Honda',
  DT: 'Suzuki 2-stroke',
};

/**
 * Decodes a trade-in motor model string with confidence + suggestions.
 * Pattern-based heuristics only (no DB lookup).
 */
export function decodeTradeInModel(raw: string, ctx: DecodeContext = {}): DecodeResult {
  const { brand } = ctx;
  const result: DecodeResult = {
    hp: null,
    stroke: null,
    hpConfidence: 'unknown',
    strokeConfidence: 'unknown',
    hpReasons: [],
    strokeReasons: [],
    warnings: [],
    suggestions: [],
  };
  const trimmed = (raw || '').trim();
  if (!trimmed) return result;
  const upper = trimmed.toUpperCase();

  // ---- HP extraction ----
  const leadingStrokeHp = upper.match(/^(?:2|4|TWO|FOUR)[\s-]?(?:S|STROKES?)\s+(\d{1,3}(?:\.\d)?)(?!\d)/);
  const strong = leadingStrokeHp ? null : upper.match(/^(?:F|DF|BF|DT)?(\d{1,3}(?:\.\d)?)(?!\d)/);
  const embedded = Array.from(upper.matchAll(/\b(\d{1,3}(?:\.\d)?)\b/g))
    .map((m) => parseFloat(m[1]))
    .filter((n) => n >= 2 && n <= 450 && !(n >= 1950 && n <= 2050));

  if (leadingStrokeHp) {
    result.hp = parseFloat(leadingStrokeHp[1]);
    result.hpConfidence = 'high';
    result.hpReasons.push(`HP "${leadingStrokeHp[1]}" follows an explicit stroke marker`);
  } else if (strong) {
    const n = parseFloat(strong[1]);
    if (n >= 2 && n <= 450) {
      result.hp = n;
      const prefixMatch = upper.match(/^(F|DF|BF|DT)\d/);
      if (prefixMatch) {
        result.hpConfidence = 'high';
        result.hpReasons.push(`"${prefixMatch[1]}${n}" prefix is a standard ${BRAND_FROM_PREFIX[prefixMatch[1]]} HP code`);
      } else if (/^\d/.test(upper)) {
        result.hpConfidence = 'high';
        result.hpReasons.push(`Leading number "${n}" parsed as HP`);
      } else {
        result.hpConfidence = 'medium';
        result.hpReasons.push(`Number "${n}" found near start of model text`);
      }
    } else {
      result.hp = n;
      result.hpConfidence = 'low';
      result.hpReasons.push(`Number "${n}" found but outside plausible HP range`);
      result.warnings.push(`HP "${n}" outside typical 2–450 range`);
    }
  } else if (embedded.length === 1) {
    result.hp = embedded[0];
    result.hpConfidence = 'medium';
    result.hpReasons.push(`Single number "${embedded[0]}" embedded in model text`);
  } else if (embedded.length > 1) {
    result.hp = embedded[0];
    result.hpConfidence = 'low';
    result.hpReasons.push(`${embedded.length} numbers found (${embedded.join(', ')}), picked first`);
    result.warnings.push(`Multiple numbers found, using ${embedded[0]} HP`);
  }

  // ---- Stroke detection ----
  // Match natural phrasings users actually type:
  //   "4S", "4-S", "4 STROKE", "4-STROKE", "4STROKE", "FOUR STROKE", "FOURSTROKE", "FOUR-STROKE"
  //   plus brand prefixes that imply 4-stroke (F<digit>, DF<digit>, BF<digit>).
  const fourStrokeHit = upper.match(/\b4[\s-]?S(?:TROKES?)?\b|\bFOUR[\s-]?STROKES?\b|^(?:DF|F|BF)\d/);
  const optiHit = upper.match(/OPTIMAX|OPTI\b/);
  const proXsHit = upper.match(/\bPRO[\s-]*XS\b/);
  // "2S", "2-S", "2 STROKE", "2-STROKE", "2STROKE", "TWO STROKE", "TWOSTROKE", "TWO-STROKE", or DT<digit>.
  const twoStrokeHit = upper.match(/\b2[\s-]?S(?:TROKES?)?\b|\bTWO[\s-]?STROKES?\b|^DT\d/);

  // HBW intake rule: a Pro XS model name plus year is enough to determine the
  // architecture. Pre-2018 resolves to OptiMax; 2018+ resolves to FourStroke.
  // This keeps customers from having to know the combustion platform behind
  // Mercury's product-line name.
  if (proXsHit && ctx.year) {
    const isOptiMax = ctx.year < 2018;
    result.stroke = isOptiMax ? 'OptiMax' : '4-Stroke';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`${ctx.year} Pro XS automatically resolves to ${isOptiMax ? 'OptiMax' : 'FourStroke'}`);
  } else if (proXsHit) {
    result.stroke = null;
    result.strokeConfidence = 'low';
    result.strokeReasons.push('Pro XS architecture is determined by model year');
    result.warnings.push('Enter the model year so Pro XS can resolve automatically to OptiMax or FourStroke');
  } else if (fourStrokeHit) {
    result.stroke = '4-Stroke';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`Matched "${fourStrokeHit[0]}" in model text → 4-Stroke marker`);
  } else if (optiHit) {
    result.stroke = 'OptiMax';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`Matched "${optiHit[0]}" → Mercury OptiMax`);
  } else if (twoStrokeHit) {
    result.stroke = '2-Stroke';
    result.strokeConfidence = 'high';
    result.strokeReasons.push(`Matched "${twoStrokeHit[0]}" → 2-Stroke marker`);
  } else if (/^\d/.test(upper) && result.hp) {
    // A year and HP are not enough to distinguish Mercury's overlapping
    // two-stroke, OptiMax, and FourStroke lineups. Configuration suffixes such
    // as ELPT describe rigging, not combustion architecture. Fail closed until
    // the customer supplies an explicit marker or confirms the stroke picker.
    const isMercury = brand?.trim().toLowerCase() === 'mercury';
    result.stroke = null;
    result.strokeConfidence = 'low';
    result.strokeReasons.push(isMercury
      ? 'Mercury HP/configuration text without an explicit architecture marker is ambiguous'
      : 'Bare HP without a brand-specific model marker is ambiguous');
    result.warnings.push("Stroke unclear; add '4S' / '2S' / 'OptiMax' or pick the stroke manually");
  }

  // ---- Unrecognized ----
  if (!result.hp && !result.stroke) {
    result.warnings.push('Couldn\'t recognize this code, try "F115", "150 ELPT", or just the HP number');
  }

  // ---- Suggestions ----
  const numericOnly = /^\d+(\.\d+)?$/.test(trimmed);
  if (numericOnly && result.hp) {
    const n = result.hp;
    const brandLower = (brand || '').toLowerCase();
    const all = [
      { tag: 'mercury', text: `${n} ELPT` },
      { tag: 'yamaha', text: `F${n}` },
      { tag: 'suzuki', text: `DF${n}` },
      { tag: 'honda', text: `BF${n}` },
    ];
    if (brandLower) {
      const matched = all.find((s) => s.tag === brandLower);
      if (matched) result.suggestions = [matched.text];
      else result.suggestions = all.slice(0, 3).map((s) => s.text);
    } else {
      result.suggestions = all.slice(0, 3).map((s) => s.text);
    }
  } else if (/^F[\s-]+\d/.test(upper) || /^DF[\s-]+\d/.test(upper) || /^BF[\s-]+\d/.test(upper)) {
    const normalized = upper.replace(/[\s-]+/g, '');
    result.suggestions = [normalized];
  }

  return result;
}

export function decodeTradeInModelFields(raw: string, ctx: DecodeContext = {}): {
  horsepower: number;
  engineType: DecodedTradeInEngineType;
} {
  const decoded = decodeTradeInModel(raw, ctx);
  const engineType = decoded.stroke === '4-Stroke'
    ? '4-stroke'
    : decoded.stroke === '2-Stroke'
      ? '2-stroke'
      : decoded.stroke === 'OptiMax'
        ? 'optimax'
        : undefined;

  return {
    horsepower: decoded.hp ?? 0,
    engineType,
  };
}
