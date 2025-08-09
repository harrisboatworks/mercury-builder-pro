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
}

export interface TradeValueEstimate {
  low: number;
  high: number;
  average: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  factors: string[];
}

// Trade value database with common outboard values (in CAD)
const tradeValues = {
  'Mercury': {
    '2020-2024': {
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
    }
  },
  'Yamaha': {
    '2020-2024': {
      '25': { excellent: 3000, good: 2400, fair: 1800, poor: 1100 },
      '40': { excellent: 4200, good: 3400, fair: 2600, poor: 1600 },
      '50': { excellent: 4800, good: 3900, fair: 3000, poor: 1800 },
      '60': { excellent: 5500, good: 4400, fair: 3400, poor: 2000 },
      '75': { excellent: 6600, good: 5300, fair: 4100, poor: 2500 },
      '90': { excellent: 7800, good: 6200, fair: 4800, poor: 2900 },
      '115': { excellent: 10000, good: 8000, fair: 6200, poor: 3700 },
      '150': { excellent: 13200, good: 10600, fair: 8200, poor: 4900 },
      '200': { excellent: 16400, good: 13100, fair: 10200, poor: 6100 },
      '250': { excellent: 20000, good: 16000, fair: 12400, poor: 7400 },
      '300': { excellent: 23600, good: 18900, fair: 14700, poor: 8800 }
    },
    '2015-2019': {
      '25': { excellent: 2600, good: 2100, fair: 1600, poor: 950 },
      '40': { excellent: 3600, good: 2900, fair: 2200, poor: 1350 },
      '50': { excellent: 4100, good: 3300, fair: 2500, poor: 1500 },
      '60': { excellent: 4700, good: 3800, fair: 2900, poor: 1750 },
      '75': { excellent: 5700, good: 4600, fair: 3500, poor: 2100 },
      '90': { excellent: 6700, good: 5400, fair: 4100, poor: 2500 },
      '115': { excellent: 8600, good: 6900, fair: 5300, poor: 3200 },
      '150': { excellent: 11400, good: 9100, fair: 7000, poor: 4200 },
      '200': { excellent: 14100, good: 11300, fair: 8700, poor: 5200 },
      '250': { excellent: 17200, good: 13800, fair: 10600, poor: 6400 },
      '300': { excellent: 20300, good: 16200, fair: 12600, poor: 7600 }
    }
  },
  'Honda': {
    '2020-2024': {
      '25': { excellent: 2900, good: 2300, fair: 1800, poor: 1100 },
      '40': { excellent: 4000, good: 3200, fair: 2500, poor: 1500 },
      '50': { excellent: 4600, good: 3700, fair: 2900, poor: 1750 },
      '60': { excellent: 5300, good: 4200, fair: 3300, poor: 2000 },
      '75': { excellent: 6300, good: 5000, fair: 3900, poor: 2350 },
      '90': { excellent: 7400, good: 5900, fair: 4600, poor: 2750 },
      '115': { excellent: 9600, good: 7700, fair: 6000, poor: 3600 },
      '150': { excellent: 12600, good: 10100, fair: 7800, poor: 4700 },
      '200': { excellent: 15600, good: 12500, fair: 9700, poor: 5800 },
      '250': { excellent: 19000, good: 15200, fair: 11800, poor: 7100 }
    },
    '2015-2019': {
      '25': { excellent: 2500, good: 2000, fair: 1500, poor: 900 },
      '40': { excellent: 3400, good: 2700, fair: 2100, poor: 1300 },
      '50': { excellent: 3900, good: 3100, fair: 2400, poor: 1450 },
      '60': { excellent: 4500, good: 3600, fair: 2800, poor: 1700 },
      '75': { excellent: 5400, good: 4300, fair: 3300, poor: 2000 },
      '90': { excellent: 6300, good: 5000, fair: 3900, poor: 2350 },
      '115': { excellent: 8200, good: 6600, fair: 5100, poor: 3100 },
      '150': { excellent: 10800, good: 8600, fair: 6700, poor: 4000 },
      '200': { excellent: 13400, good: 10700, fair: 8300, poor: 5000 },
      '250': { excellent: 16300, good: 13000, fair: 10100, poor: 6100 }
    }
  },
  'Suzuki': {
    '2020-2024': {
      '25': { excellent: 2700, good: 2200, fair: 1700, poor: 1000 },
      '40': { excellent: 3700, good: 3000, fair: 2300, poor: 1400 },
      '50': { excellent: 4200, good: 3400, fair: 2600, poor: 1600 },
      '60': { excellent: 4800, good: 3900, fair: 3000, poor: 1800 },
      '75': { excellent: 5700, good: 4600, fair: 3500, poor: 2100 },
      '90': { excellent: 6700, good: 5400, fair: 4100, poor: 2500 },
      '115': { excellent: 8700, good: 7000, fair: 5400, poor: 3250 },
      '150': { excellent: 11400, good: 9100, fair: 7000, poor: 4200 },
      '200': { excellent: 14100, good: 11300, fair: 8700, poor: 5200 },
      '250': { excellent: 17200, good: 13800, fair: 10600, poor: 6400 }
    }
  },
  'Evinrude': {
    '2015-2019': {
      '25': { excellent: 2200, good: 1800, fair: 1400, poor: 850 },
      '40': { excellent: 3000, good: 2400, fair: 1900, poor: 1150 },
      '50': { excellent: 3400, good: 2700, fair: 2100, poor: 1300 },
      '60': { excellent: 3900, good: 3100, fair: 2400, poor: 1450 },
      '75': { excellent: 4600, good: 3700, fair: 2900, poor: 1750 },
      '90': { excellent: 5400, good: 4300, fair: 3300, poor: 2000 },
      '115': { excellent: 7000, good: 5600, fair: 4300, poor: 2600 },
      '150': { excellent: 9200, good: 7400, fair: 5700, poor: 3400 },
      '200': { excellent: 11400, good: 9100, fair: 7000, poor: 4200 },
      '250': { excellent: 13900, good: 11100, fair: 8600, poor: 5200 }
    }
  }
};

export function estimateTradeValue(tradeInfo: Partial<TradeInInfo>): TradeValueEstimate {
  const { brand = '', year = 0, horsepower = 0, condition = 'fair' } = tradeInfo;
  
  // Find the closest brand match
  const brandData = tradeValues[brand as keyof typeof tradeValues];
  
  if (!brandData) {
    // Generic estimate for unknown brands
    const baseValue = horsepower * 40;
    const ageDepreciation = Math.max(0.3, 1 - ((new Date().getFullYear() - year) * 0.1));
    const conditionMultiplier = { excellent: 1.2, good: 1.0, fair: 0.75, poor: 0.45 }[condition];
    
    const estimatedValue = baseValue * ageDepreciation * conditionMultiplier;
    
    return {
      low: estimatedValue * 0.85,
      high: estimatedValue * 1.15,
      average: estimatedValue,
      confidence: 'low',
      source: 'Generic estimate',
      factors: ['Unknown brand', 'Estimated depreciation']
    };
  }
  
  // Determine year range
  let yearRange = '';
  if (year >= 2020) {
    yearRange = '2020-2024';
  } else if (year >= 2015) {
    yearRange = '2015-2019';
  } else {
    // Very old motor
    const baseValue = horsepower * 25;
    const conditionMultiplier = { excellent: 1.0, good: 0.8, fair: 0.6, poor: 0.35 }[condition];
    const estimatedValue = baseValue * conditionMultiplier;
    
    return {
      low: estimatedValue * 0.8,
      high: estimatedValue * 1.2,
      average: estimatedValue,
      confidence: 'low',
      source: 'Age-based estimate',
      factors: ['Motor age over 10 years']
    };
  }
  
  const yearData = brandData[yearRange as keyof typeof brandData];
  if (!yearData) {
    return estimateTradeValue({ ...tradeInfo, brand: 'Generic' });
  }
  
  // Find closest HP match
  const availableHPs = Object.keys(yearData).map(Number).sort((a, b) => a - b);
  const closestHP = availableHPs.reduce((prev, curr) => 
    Math.abs(curr - horsepower) < Math.abs(prev - horsepower) ? curr : prev
  );
  
  const hpData = yearData[closestHP.toString() as keyof typeof yearData];
  if (!hpData) {
    return estimateTradeValue({ ...tradeInfo, brand: 'Generic' });
  }
  
  const baseValue = hpData[condition];
  
  // Apply Mercury bonus for newer motors
  let mercuryBonus = 1;
  if (brand === 'Mercury' && year >= 2020) {
    mercuryBonus = 1.1; // 10% bonus
  }
  
  const finalValue = baseValue * mercuryBonus;
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'high';
  const factors: string[] = [];
  
  if (Math.abs(closestHP - horsepower) > 15) {
    confidence = 'medium';
    factors.push(`Estimated from ${closestHP}HP value`);
  }
  
  if (brand === 'Mercury' && year >= 2020) {
    factors.push('Mercury trade bonus applied');
  }
  
  if (year < 2015) {
    confidence = 'low';
    factors.push('Older motor age estimate');
  }
  
  return {
    low: finalValue * 0.85,
    high: finalValue * 1.15,
    average: finalValue,
    confidence,
    source: 'Harris Boat Works trade database',
    factors: factors.length > 0 ? factors : ['Exact model match found']
  };
}

// Compute the median of a low/high range and round to the nearest $25
export function medianRoundedTo25(low: number, high: number): number {
  const median = (low + high) / 2;
  return Math.round(median / 25) * 25;
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