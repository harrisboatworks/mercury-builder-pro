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
      '5': { excellent: 880, good: 715, fair: 550, poor: 330 },
      '10': { excellent: 1540, good: 1265, fair: 990, poor: 605 },
      '15': { excellent: 2200, good: 1815, fair: 1430, poor: 880 },
      '20': { excellent: 2860, good: 2365, fair: 1870, poor: 1100 },
      '25': { excellent: 3520, good: 2860, fair: 2200, poor: 1320 },
      '40': { excellent: 4950, good: 4070, fair: 3190, poor: 1980 },
      '50': { excellent: 5720, good: 4730, fair: 3740, poor: 2310 },
      '60': { excellent: 6600, good: 5390, fair: 4180, poor: 2530 },
      '75': { excellent: 7920, good: 6490, fair: 5060, poor: 3080 },
      '90': { excellent: 9350, good: 7700, fair: 6050, poor: 3630 },
      '115': { excellent: 12100, good: 9900, fair: 7700, poor: 4620 },
      '150': { excellent: 15950, good: 13200, fair: 10450, poor: 6270 },
      '200': { excellent: 19800, good: 16280, fair: 12760, poor: 7700 },
      '250': { excellent: 24200, good: 19800, fair: 15400, poor: 9240 },
      '300': { excellent: 28600, good: 23100, fair: 18150, poor: 10890 }
    },
    '2020-2024': {
      '5': { excellent: 800, good: 650, fair: 500, poor: 300 },
      '10': { excellent: 1400, good: 1150, fair: 900, poor: 550 },
      '15': { excellent: 2000, good: 1650, fair: 1300, poor: 800 },
      '20': { excellent: 2600, good: 2150, fair: 1700, poor: 1000 },
      '25': { excellent: 3200, good: 2600, fair: 2000, poor: 1200 },
      '40': { excellent: 4500, good: 3700, fair: 2900, poor: 1800 },
      '50': { excellent: 5200, good: 4300, fair: 3400, poor: 2100 },
      '60': { excellent: 6000, good: 4900, fair: 3800, poor: 2300 },
      '75': { excellent: 7200, good: 5900, fair: 4600, poor: 2800 },
      '90': { excellent: 8500, good: 7000, fair: 5500, poor: 3300 },
      '115': { excellent: 11000, good: 9000, fair: 7000, poor: 4200 },
      '150': { excellent: 14500, good: 12000, fair: 9500, poor: 5700 },
      '200': { excellent: 18000, good: 14800, fair: 11600, poor: 7000 },
      '250': { excellent: 22000, good: 18000, fair: 14000, poor: 8400 },
      '300': { excellent: 26000, good: 21000, fair: 16500, poor: 9900 }
    },
    '2015-2019': {
      '5': { excellent: 700, good: 550, fair: 425, poor: 250 },
      '10': { excellent: 1200, good: 950, fair: 750, poor: 450 },
      '15': { excellent: 1700, good: 1350, fair: 1050, poor: 650 },
      '20': { excellent: 2200, good: 1750, fair: 1400, poor: 850 },
      '25': { excellent: 2800, good: 2200, fair: 1700, poor: 1000 },
      '40': { excellent: 3900, good: 3100, fair: 2400, poor: 1500 },
      '50': { excellent: 4500, good: 3600, fair: 2800, poor: 1700 },
      '60': { excellent: 5200, good: 4100, fair: 3200, poor: 1900 },
      '75': { excellent: 6200, good: 4900, fair: 3800, poor: 2300 },
      '90': { excellent: 7300, good: 5800, fair: 4500, poor: 2700 },
      '115': { excellent: 9500, good: 7500, fair: 5800, poor: 3500 },
      '150': { excellent: 12500, good: 10000, fair: 7800, poor: 4700 },
      '200': { excellent: 15500, good: 12400, fair: 9600, poor: 5800 },
      '250': { excellent: 19000, good: 15200, fair: 11800, poor: 7100 },
      '300': { excellent: 22500, good: 18000, fair: 14000, poor: 8400 }
    },
    '2010-2014': {
      '5': { excellent: 600, good: 475, fair: 375, poor: 225 },
      '10': { excellent: 1050, good: 825, fair: 650, poor: 400 },
      '15': { excellent: 1500, good: 1175, fair: 925, poor: 575 },
      '20': { excellent: 1950, good: 1525, fair: 1200, poor: 750 },
      '25': { excellent: 2450, good: 1900, fair: 1500, poor: 900 },
      '40': { excellent: 3400, good: 2700, fair: 2100, poor: 1300 },
      '50': { excellent: 3900, good: 3100, fair: 2400, poor: 1500 },
      '60': { excellent: 4500, good: 3600, fair: 2800, poor: 1700 },
      '75': { excellent: 5400, good: 4300, fair: 3300, poor: 2000 },
      '90': { excellent: 6400, good: 5100, fair: 3900, poor: 2400 },
      '115': { excellent: 8300, good: 6600, fair: 5100, poor: 3100 },
      '150': { excellent: 10900, good: 8700, fair: 6800, poor: 4100 },
      '200': { excellent: 13500, good: 10800, fair: 8400, poor: 5100 },
      '250': { excellent: 16600, good: 13300, fair: 10300, poor: 6200 },
      '300': { excellent: 19700, good: 15800, fair: 12200, poor: 7400 }
    },
    '2005-2009': {
      '5': { excellent: 500, good: 400, fair: 300, poor: 180 },
      '10': { excellent: 900, good: 700, fair: 550, poor: 325 },
      '15': { excellent: 1300, good: 1000, fair: 800, poor: 475 },
      '20': { excellent: 1700, good: 1300, fair: 1025, poor: 625 },
      '25': { excellent: 2100, good: 1650, fair: 1300, poor: 775 },
      '40': { excellent: 2900, good: 2300, fair: 1800, poor: 1100 },
      '50': { excellent: 3400, good: 2700, fair: 2100, poor: 1300 },
      '60': { excellent: 3900, good: 3100, fair: 2400, poor: 1450 },
      '75': { excellent: 4700, good: 3700, fair: 2900, poor: 1750 },
      '90': { excellent: 5500, good: 4400, fair: 3400, poor: 2050 },
      '115': { excellent: 7200, good: 5700, fair: 4400, poor: 2650 },
      '150': { excellent: 9500, good: 7600, fair: 5900, poor: 3550 },
      '200': { excellent: 11700, good: 9400, fair: 7300, poor: 4400 },
      '250': { excellent: 14400, good: 11500, fair: 8900, poor: 5400 },
      '300': { excellent: 17000, good: 13600, fair: 10600, poor: 6400 }
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
    const baseValue = horsepower * 40;
    const ageDepreciation = Math.max(0.3, 1 - ((currentYear - year) * 0.1));
    const conditionMultiplier = { excellent: 1.2, good: 1.0, fair: 0.75, poor: 0.45 }[condition];
    
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
    const baseValue = horsepower * 40;  // Increased from $25
    const ageDepreciation = Math.max(0.35, 1 - (motorAge - 20) * 0.03);  // Slower decline
    const conditionMultiplier = { excellent: 1.0, good: 0.8, fair: 0.6, poor: 0.35 }[condition];
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
  
  const preLow = finalValue * 0.85;
  const preHigh = finalValue * 1.15;
  const adj = applyBrandPenaltyToRange(preLow, preHigh, brand, factors, config, minTradeValue);
  
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
