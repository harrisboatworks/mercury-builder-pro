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
  const { brand, year } = ctx;
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
  const strong = upper.match(/^(?:F|DF|BF|DT)?(\d{1,3}(?:\.\d)?)/);
  const embedded = Array.from(upper.matchAll(/\b(\d{1,3}(?:\.\d)?)\b/g))
    .map((m) => parseFloat(m[1]))
    .filter((n) => n >= 2 && n <= 450 && !(n >= 1950 && n <= 2050));

  if (strong) {
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
    result.hpReasons.push(`${embedded.length} numbers found (${embedded.join(', ')}) — picked first`);
    result.warnings.push(`Multiple numbers found — using ${embedded[0]} HP`);
  }

  // ---- Stroke detection ----
  // Match natural phrasings users actually type:
  //   "4S", "4-S", "4 STROKE", "4-STROKE", "4STROKE", "FOUR STROKE", "FOURSTROKE", "FOUR-STROKE"
  //   plus brand prefixes that imply 4-stroke (F<digit>, DF<digit>, BF<digit>).
  const fourStrokeHit = upper.match(/\b4[\s-]?S(?:TROKES?)?\b|\bFOUR[\s-]?STROKES?\b|^(?:DF|F|BF)\d/);
  const optiHit = upper.match(/OPTIMAX|OPTI\b/);
  // "2S", "2-S", "2 STROKE", "2-STROKE", "2STROKE", "TWO STROKE", "TWOSTROKE", "TWO-STROKE", or DT<digit>.
  const twoStrokeHit = upper.match(/\b2[\s-]?S(?:TROKES?)?\b|\bTWO[\s-]?STROKES?\b|^DT\d/);

  if (fourStrokeHit) {
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
    // Bare number — try to use year as a tiebreaker
    if (year && year >= 2007) {
      result.stroke = '4-Stroke';
      result.strokeConfidence = 'medium';
      result.strokeReasons.push(`Bare HP + year ${year} (≥ 2007) → likely 4-Stroke (modern Mercury era)`);
    } else if (year && year < 2000) {
      result.stroke = '2-Stroke';
      result.strokeConfidence = 'medium';
      result.strokeReasons.push(`Bare HP + year ${year} (< 2000) → likely 2-Stroke era`);
    } else {
      result.stroke = null;
      result.strokeConfidence = 'low';
      result.strokeReasons.push('Bare HP with no year — stroke ambiguous');
      result.warnings.push("Stroke unclear from bare HP — enter year to refine, or add '4S' / '2S'");
    }
  }

  // ---- Unrecognized ----
  if (!result.hp && !result.stroke) {
    result.warnings.push('Couldn\'t recognize this code — try "F115", "150 ELPT", or just the HP number');
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
