import type { TradeValuationBracket } from '@/hooks/useTradeValuationData';

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
}

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

// Database-driven config interface
export interface TradeValuationConfig {
  BRAND_PENALTY_JOHNSON?: { factor: number };
  BRAND_PENALTY_EVINRUDE?: { factor: number };
  BRAND_PENALTY_OMC?: { factor: number };
  MERCURY_BONUS_YEARS?: { max_age: number; factor: number };
  MIN_TRADE_VALUE?: { value: number };
  HP_CLASS_FLOORS?: Record<string, number>;
  TWO_STROKE_PENALTY?: { factor: number };
  HOURS_ADJUSTMENT?: {
    low_max_hours: number;
    low_bonus: number;
    high_min_hours: number;
    high_penalty_moderate: number;
    high_threshold: number;
    high_penalty_severe: number;
  };
}

// Fallback config (used when database is unavailable)
export const TRADEIN_BRAND_PENALTIES: Record<string, number> = {
  JOHNSON: 0.5,
  EVINRUDE: 0.5,
  OMC: 0.5,
};
export const TRADEIN_MIN_VALUE = 100;
const FALLBACK_MERCURY_BONUS_MAX_AGE = 3;
const FALLBACK_MERCURY_BONUS_FACTOR = 1.1;

export function normalizeBrand(input?: string): string {
  return (input || '').trim().toUpperCase();
}

export function getBrandPenaltyFactor(brand?: string, config?: TradeValuationConfig): number {
  const b = normalizeBrand(brand);
  if (!b) return 1;
  
  // Build penalties from config or use fallback
  const penalties: Record<string, number> = {};
  if (config?.BRAND_PENALTY_JOHNSON?.factor !== undefined) {
    penalties['JOHNSON'] = config.BRAND_PENALTY_JOHNSON.factor;
  } else {
    penalties['JOHNSON'] = TRADEIN_BRAND_PENALTIES.JOHNSON;
  }
  if (config?.BRAND_PENALTY_EVINRUDE?.factor !== undefined) {
    penalties['EVINRUDE'] = config.BRAND_PENALTY_EVINRUDE.factor;
  } else {
    penalties['EVINRUDE'] = TRADEIN_BRAND_PENALTIES.EVINRUDE;
  }
  if (config?.BRAND_PENALTY_OMC?.factor !== undefined) {
    penalties['OMC'] = config.BRAND_PENALTY_OMC.factor;
  } else {
    penalties['OMC'] = TRADEIN_BRAND_PENALTIES.OMC;
  }
  
  // If the brand string contains any penalized brand name, apply the most severe (lowest factor)
  let factor = 1;
  for (const key of Object.keys(penalties)) {
    if (b.includes(key)) {
      factor = Math.min(factor, penalties[key]);
    }
  }
  return factor;
}

// Fallback trade value database (used when Supabase is unavailable)
const fallbackTradeValues: Record<string, Record<string, Record<string, { excellent: number; good: number; fair: number; poor: number }>>> = {
  'Mercury': {
    '2025-2029': {
      '5': { excellent: 660, good: 500, fair: 385, poor: 230 },
      '10': { excellent: 1155, good: 885, fair: 695, poor: 425 },
      '15': { excellent: 1650, good: 1270, fair: 1000, poor: 615 },
      '20': { excellent: 2145, good: 1655, fair: 1310, poor: 770 },
      '25': { excellent: 2640, good: 2000, fair: 1540, poor: 925 },
      '40': { excellent: 3715, good: 2850, fair: 2235, poor: 1385 },
      '50': { excellent: 4290, good: 3310, fair: 2620, poor: 1615 },
      '60': { excellent: 4950, good: 3775, fair: 2925, poor: 1770 },
      '75': { excellent: 5940, good: 4545, fair: 3545, poor: 2155 },
      '90': { excellent: 7010, good: 5390, fair: 4235, poor: 2540 },
      '115': { excellent: 9075, good: 6930, fair: 5390, poor: 3235 },
      '150': { excellent: 11960, good: 9240, fair: 7315, poor: 4390 },
      '200': { excellent: 14850, good: 11395, fair: 8930, poor: 5390 },
      '250': { excellent: 18150, good: 13860, fair: 10780, poor: 6470 },
      '300': { excellent: 21450, good: 16170, fair: 12710, poor: 7625 }
    },
    '2020-2024': {
      '5': { excellent: 600, good: 455, fair: 350, poor: 210 },
      '10': { excellent: 1050, good: 805, fair: 630, poor: 385 },
      '15': { excellent: 1500, good: 1155, fair: 910, poor: 560 },
      '20': { excellent: 1950, good: 1505, fair: 1190, poor: 700 },
      '25': { excellent: 2400, good: 1820, fair: 1400, poor: 840 },
      '40': { excellent: 3375, good: 2590, fair: 2030, poor: 1260 },
      '50': { excellent: 3900, good: 3010, fair: 2380, poor: 1470 },
      '60': { excellent: 4500, good: 3430, fair: 2660, poor: 1610 },
      '75': { excellent: 5400, good: 4130, fair: 3220, poor: 1960 },
      '90': { excellent: 6375, good: 4900, fair: 3850, poor: 2310 },
      '115': { excellent: 8250, good: 6300, fair: 4900, poor: 2940 },
      '150': { excellent: 10875, good: 8400, fair: 6650, poor: 3990 },
      '200': { excellent: 13500, good: 10360, fair: 8120, poor: 4900 },
      '250': { excellent: 16500, good: 12600, fair: 9800, poor: 5880 },
      '300': { excellent: 19500, good: 14700, fair: 11550, poor: 6930 }
    },
    '2015-2019': {
      '5': { excellent: 525, good: 385, fair: 300, poor: 175 },
      '10': { excellent: 900, good: 665, fair: 525, poor: 315 },
      '15': { excellent: 1275, good: 945, fair: 735, poor: 455 },
      '20': { excellent: 1650, good: 1225, fair: 980, poor: 595 },
      '25': { excellent: 2100, good: 1540, fair: 1190, poor: 700 },
      '40': { excellent: 2925, good: 2170, fair: 1680, poor: 1050 },
      '50': { excellent: 3375, good: 2520, fair: 1960, poor: 1190 },
      '60': { excellent: 3900, good: 2870, fair: 2240, poor: 1330 },
      '75': { excellent: 4650, good: 3430, fair: 2660, poor: 1610 },
      '90': { excellent: 5475, good: 4060, fair: 3150, poor: 1890 },
      '115': { excellent: 7125, good: 5250, fair: 4060, poor: 2450 },
      '150': { excellent: 9375, good: 7000, fair: 5460, poor: 3290 },
      '200': { excellent: 11625, good: 8680, fair: 6720, poor: 4060 },
      '250': { excellent: 14250, good: 10640, fair: 8260, poor: 4970 },
      '300': { excellent: 16875, good: 12600, fair: 9800, poor: 5880 }
    },
    '2010-2014': {
      '5': { excellent: 450, good: 335, fair: 265, poor: 160 },
      '10': { excellent: 790, good: 580, fair: 455, poor: 280 },
      '15': { excellent: 1125, good: 825, fair: 650, poor: 400 },
      '20': { excellent: 1465, good: 1070, fair: 840, poor: 525 },
      '25': { excellent: 1840, good: 1330, fair: 1050, poor: 630 },
      '40': { excellent: 2550, good: 1890, fair: 1470, poor: 910 },
      '50': { excellent: 2925, good: 2170, fair: 1680, poor: 1050 },
      '60': { excellent: 3375, good: 2520, fair: 1960, poor: 1190 },
      '75': { excellent: 4050, good: 3010, fair: 2310, poor: 1400 },
      '90': { excellent: 4800, good: 3570, fair: 2730, poor: 1680 },
      '115': { excellent: 6225, good: 4620, fair: 3570, poor: 2170 },
      '150': { excellent: 8175, good: 6090, fair: 4760, poor: 2870 },
      '200': { excellent: 10125, good: 7560, fair: 5880, poor: 3570 },
      '250': { excellent: 12450, good: 9310, fair: 7210, poor: 4340 },
      '300': { excellent: 14775, good: 11060, fair: 8540, poor: 5180 }
    },
    '2005-2009': {
      '5': { excellent: 375, good: 280, fair: 210, poor: 125 },
      '10': { excellent: 675, good: 490, fair: 385, poor: 230 },
      '15': { excellent: 975, good: 700, fair: 560, poor: 335 },
      '20': { excellent: 1275, good: 910, fair: 720, poor: 440 },
      '25': { excellent: 1575, good: 1155, fair: 910, poor: 545 },
      '40': { excellent: 2175, good: 1610, fair: 1260, poor: 770 },
      '50': { excellent: 2550, good: 1890, fair: 1470, poor: 910 },
      '60': { excellent: 2925, good: 2170, fair: 1680, poor: 1015 },
      '75': { excellent: 3525, good: 2590, fair: 2030, poor: 1225 },
      '90': { excellent: 4125, good: 3080, fair: 2380, poor: 1435 },
      '115': { excellent: 5400, good: 3990, fair: 3080, poor: 1855 },
      '150': { excellent: 7125, good: 5320, fair: 4130, poor: 2485 },
      '200': { excellent: 8775, good: 6580, fair: 5110, poor: 3080 },
      '250': { excellent: 10800, good: 8050, fair: 6230, poor: 3780 },
      '300': { excellent: 12750, good: 9520, fair: 7420, poor: 4480 }
    }
  }
};

// Convert database brackets to the tradeValues format
function convertBracketsToTradeValues(brackets: TradeValuationBracket[]): typeof fallbackTradeValues {
  const result: typeof fallbackTradeValues = {};
  
  for (const bracket of brackets) {
    if (!result[bracket.brand]) {
      result[bracket.brand] = {};
    }
    if (!result[bracket.brand][bracket.year_range]) {
      result[bracket.brand][bracket.year_range] = {};
    }
    result[bracket.brand][bracket.year_range][bracket.horsepower.toString()] = {
      excellent: Number(bracket.excellent),
      good: Number(bracket.good),
      fair: Number(bracket.fair),
      poor: Number(bracket.poor)
    };
  }
  
  return result;
}

export interface EstimateTradeValueOptions {
  brackets?: TradeValuationBracket[];
  config?: TradeValuationConfig;
}

export function estimateTradeValue(
  tradeInfo: Partial<TradeInInfo>,
  options?: EstimateTradeValueOptions
): TradeValueEstimate {
  const { brand = '', year = 0, horsepower = 0, condition = 'fair' } = tradeInfo;
  const config = options?.config;
  
  // Use database values if provided, otherwise fallback
  const tradeValues = options?.brackets && options.brackets.length > 0
    ? convertBracketsToTradeValues(options.brackets)
    : fallbackTradeValues;
  
  // Get config values or use fallbacks
  const minTradeValue = config?.MIN_TRADE_VALUE?.value ?? TRADEIN_MIN_VALUE;
  const mercuryMaxAge = config?.MERCURY_BONUS_YEARS?.max_age ?? FALLBACK_MERCURY_BONUS_MAX_AGE;
  const mercuryBonusFactor = config?.MERCURY_BONUS_YEARS?.factor ?? FALLBACK_MERCURY_BONUS_FACTOR;
  
  const currentYear = new Date().getFullYear();
  
  // Find the closest brand match
  const brandData = tradeValues[brand as keyof typeof tradeValues];
  
  if (!brandData) {
    // Generic estimate for unknown brands
    const baseValue = horsepower * 30;
    const ageDepreciation = Math.max(0.3, 1 - ((currentYear - year) * 0.1));
    const conditionMultiplier = { excellent: 1.0, good: 0.75, fair: 0.55, poor: 0.3 }[condition];
    
    const estimatedValue = baseValue * ageDepreciation * conditionMultiplier;
    let low = estimatedValue * 0.85;
    let high = estimatedValue * 1.15;
    const factors: string[] = ['Unknown brand', 'Estimated depreciation'];
    const adj = applyBrandPenaltyToRange(low, high, brand, factors, config, minTradeValue);
    
    return {
      low: adj.low,
      high: adj.high,
      average: (adj.low + adj.high) / 2,
      confidence: 'low',
      source: 'Generic estimate',
      factors: adj.factors,
      prePenaltyLow: low,
      prePenaltyHigh: high,
      penaltyApplied: adj.penaltyApplied,
      penaltyFactor: adj.factor
    };
  }
  
  // Determine year range - UPDATED to include 2025-2029
  let yearRange = '';
  if (year >= 2025) {
    yearRange = '2025-2029';
  } else if (year >= 2020) {
    yearRange = '2020-2024';
  } else if (year >= 2015) {
    yearRange = '2015-2019';
  } else if (year >= 2010) {
    yearRange = '2010-2014';
  } else if (year >= 2005) {
    yearRange = '2005-2009';
  } else {
    // Very old motor (pre-2005) - improved formula
    const motorAge = currentYear - year;
    const baseValue = horsepower * 30;
    const ageDepreciation = Math.max(0.3, 1 - (motorAge - 20) * 0.03);
    const conditionMultiplier = { excellent: 0.85, good: 0.65, fair: 0.45, poor: 0.25 }[condition];
    const estimatedValue = baseValue * ageDepreciation * conditionMultiplier;
    let low = estimatedValue * 0.8;
    let high = estimatedValue * 1.2;
    const factors = ['Motor age over 20 years', 'Value based on condition and market demand'];
    const adj = applyBrandPenaltyToRange(low, high, brand, factors, config, minTradeValue);
    
    return {
      low: adj.low,
      high: adj.high,
      average: (adj.low + adj.high) / 2,
      confidence: 'low',
      source: 'Age-based estimate',
      factors: adj.factors,
      prePenaltyLow: low,
      prePenaltyHigh: high,
      penaltyApplied: adj.penaltyApplied,
      penaltyFactor: adj.factor
    };
  }
  
  const yearData = brandData[yearRange as keyof typeof brandData];
  if (!yearData) {
    return estimateTradeValue({ ...tradeInfo, brand: 'Generic' }, options);
  }
  
  // Find closest HP match
  const availableHPs = Object.keys(yearData).map(Number).sort((a, b) => a - b);
  const closestHP = availableHPs.reduce((prev, curr) => 
    Math.abs(curr - horsepower) < Math.abs(prev - horsepower) ? curr : prev
  );
  
  const hpData = yearData[closestHP.toString() as keyof typeof yearData];
  if (!hpData) {
    return estimateTradeValue({ ...tradeInfo, brand: 'Generic' }, options);
  }
  
  const baseValue = hpData[condition];
  
  // Apply Mercury bonus for newer motors - UPDATED to use max_age from config
  let mercuryBonus = 1;
  const motorAge = currentYear - year;
  if (brand === 'Mercury' && motorAge < mercuryMaxAge) {
    mercuryBonus = mercuryBonusFactor;
  }
  
  const finalValue = baseValue * mercuryBonus;
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'high';
  const factors: string[] = [];
  
  if (Math.abs(closestHP - horsepower) > 15) {
    confidence = 'medium';
    factors.push(`Estimated from ${closestHP}HP value`);
  }
  
  if (brand === 'Mercury' && motorAge < mercuryMaxAge) {
    factors.push('Mercury trade bonus applied');
  }
  
  if (year < 2015) {
    confidence = 'low';
    factors.push('Older motor age estimate');
  }
  
  let preLow = finalValue * 0.85;
  let preHigh = finalValue * 1.15;
  
  // Apply 2-stroke/OptiMax haircut
  const engineType = tradeInfo.engineType;
  if (engineType === '2-stroke' || engineType === 'optimax') {
    const strokeFactor = config?.TWO_STROKE_PENALTY?.factor ?? 0.825;
    preLow *= strokeFactor;
    preHigh *= strokeFactor;
    factors.push(`${engineType === 'optimax' ? 'OptiMax' : '2-Stroke'} engine (-${Math.round((1 - strokeFactor) * 100)}%)`);
  }
  
  // Apply engine hours adjustment
  const hours = tradeInfo.engineHours;
  if (hours !== undefined && hours > 0) {
    const ha = config?.HOURS_ADJUSTMENT ?? {
      low_max_hours: 100, low_bonus: 0.075,
      high_min_hours: 500, high_penalty_moderate: 0.10,
      high_threshold: 1000, high_penalty_severe: 0.175
    };
    if (hours <= ha.low_max_hours) {
      const bonus = 1 + ha.low_bonus;
      preLow *= bonus;
      preHigh *= bonus;
      factors.push(`Low hours (${hours}h) bonus +${Math.round(ha.low_bonus * 100)}%`);
    } else if (hours >= ha.high_threshold) {
      const penalty = 1 - ha.high_penalty_severe;
      preLow *= penalty;
      preHigh *= penalty;
      factors.push(`High hours (${hours}h) penalty -${Math.round(ha.high_penalty_severe * 100)}%`);
    } else if (hours >= ha.high_min_hours) {
      const penalty = 1 - ha.high_penalty_moderate;
      preLow *= penalty;
      preHigh *= penalty;
      factors.push(`Moderate hours (${hours}h) penalty -${Math.round(ha.high_penalty_moderate * 100)}%`);
    }
  }
  
  // HP-class floor
  const hpFloors = config?.HP_CLASS_FLOORS ?? { under_25: 200, '25_75': 1000, '90_150': 1500, '200_plus': 2500 };
  let hpFloor = minTradeValue;
  if (horsepower >= 200) hpFloor = hpFloors['200_plus'] ?? 2500;
  else if (horsepower >= 90) hpFloor = hpFloors['90_150'] ?? 1500;
  else if (horsepower >= 25) hpFloor = hpFloors['25_75'] ?? 1000;
  else hpFloor = hpFloors['under_25'] ?? 200;
  
  const effectiveFloor = Math.max(hpFloor, minTradeValue);
  const adj = applyBrandPenaltyToRange(preLow, preHigh, brand, factors, config, effectiveFloor);
  
  return {
    low: adj.low,
    high: adj.high,
    average: (adj.low + adj.high) / 2,
    confidence,
    source: 'Harris Boat Works trade database',
    factors: adj.factors.length > 0 ? adj.factors : ['Exact model match found'],
    prePenaltyLow: preLow,
    prePenaltyHigh: preHigh,
    penaltyApplied: adj.penaltyApplied,
    penaltyFactor: adj.factor
  };
}

// Compute the median of a low/high range and round to the nearest $25 (with min floor)
export function medianRoundedTo25(low: number, high: number, minValue: number = TRADEIN_MIN_VALUE): number {
  const median = (low + high) / 2;
  let rounded = Math.round(median / 25) * 25;
  if (rounded < minValue) rounded = minValue;
  return rounded;
}

export function getTradeValueFactors(): string[] {
  return [
    'Hours of use',
    'Service history',
    'Physical condition',
    'Control compatibility',
    'Local demand',
    'Seasonal timing'
  ];
}

// Apply brand penalty and floors to a low/high range
export function applyBrandPenaltyToRange(
  low: number, 
  high: number, 
  brand?: string, 
  factors: string[] = [],
  config?: TradeValuationConfig,
  minValue: number = TRADEIN_MIN_VALUE
) {
  const originalLow = low;
  const originalHigh = high;
  const factor = getBrandPenaltyFactor(brand, config);
  let adjustedLow = low;
  let adjustedHigh = high;
  let penaltyApplied = false;

  if (factor < 1) {
    adjustedLow = Math.max(originalLow * factor, minValue);
    adjustedHigh = Math.max(originalHigh * factor, minValue);
    penaltyApplied = true;
    const note = 'Adjusted for brand (-50%) — Manufacturer out of business; parts & service availability limited.';
    if (!factors.includes(note)) factors.push(note);

    const chosen = medianRoundedTo25(adjustedLow, adjustedHigh, minValue);
    console.log(
      `tradein_penalty_applied penalty_reason="brand_out_of_business" brand=${normalizeBrand(brand)} factor=${factor} original_low=${originalLow} original_high=${originalHigh} adjusted_low=${adjustedLow} adjusted_high=${adjustedHigh} chosen=${chosen}`
    );
  }

  // Enforce floors even when no penalty
  adjustedLow = Math.max(adjustedLow, minValue);
  adjustedHigh = Math.max(adjustedHigh, minValue);

  return { low: adjustedLow, high: adjustedHigh, factors, penaltyApplied, factor } as const;
}

// Helper for tests and utilities
export function computeRoundedTradeIn(low: number, high: number, brand?: string, config?: TradeValuationConfig) {
  const minValue = config?.MIN_TRADE_VALUE?.value ?? TRADEIN_MIN_VALUE;
  const { low: l2, high: h2 } = applyBrandPenaltyToRange(low, high, brand, [], config, minValue);
  return { low: l2, high: h2, rounded: medianRoundedTo25(l2, h2, minValue) } as const;
}
