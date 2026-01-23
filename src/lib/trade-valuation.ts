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

// Config (could be wired to env; kept in-code due to app constraints)
export const TRADEIN_BRAND_PENALTIES: Record<string, number> = {
  JOHNSON: 0.5,
  EVINRUDE: 0.5,
};
export const TRADEIN_MIN_VALUE = 100;

export function normalizeBrand(input?: string): string {
  return (input || '').trim().toUpperCase();
}

export function getBrandPenaltyFactor(brand?: string): number {
  const b = normalizeBrand(brand);
  if (!b) return 1;
  // If the brand string contains any penalized brand name, apply the most severe (lowest factor)
  let factor = 1;
  for (const key of Object.keys(TRADEIN_BRAND_PENALTIES)) {
    if (b.includes(key)) {
      factor = Math.min(factor, TRADEIN_BRAND_PENALTIES[key]);
    }
  }
  return factor;
}
// Trade value database with common outboard values (in CAD)
const tradeValues = {
  'Mercury': {
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
  },
  'Yamaha': {
    '2020-2024': {
      '5': { excellent: 750, good: 600, fair: 475, poor: 285 },
      '10': { excellent: 1300, good: 1050, fair: 825, poor: 500 },
      '15': { excellent: 1850, good: 1500, fair: 1175, poor: 725 },
      '20': { excellent: 2400, good: 1950, fair: 1525, poor: 925 },
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
      '5': { excellent: 650, good: 525, fair: 400, poor: 240 },
      '10': { excellent: 1100, good: 900, fair: 700, poor: 425 },
      '15': { excellent: 1575, good: 1275, fair: 1000, poor: 600 },
      '20': { excellent: 2050, good: 1650, fair: 1300, poor: 800 },
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
    },
    '2010-2014': {
      '5': { excellent: 550, good: 450, fair: 350, poor: 210 },
      '10': { excellent: 950, good: 775, fair: 600, poor: 375 },
      '15': { excellent: 1375, good: 1100, fair: 875, poor: 525 },
      '20': { excellent: 1800, good: 1425, fair: 1125, poor: 700 },
      '25': { excellent: 2275, good: 1800, fair: 1400, poor: 850 },
      '40': { excellent: 3150, good: 2500, fair: 1950, poor: 1200 },
      '50': { excellent: 3600, good: 2850, fair: 2200, poor: 1350 },
      '60': { excellent: 4100, good: 3300, fair: 2550, poor: 1550 },
      '75': { excellent: 5000, good: 4000, fair: 3100, poor: 1900 },
      '90': { excellent: 5850, good: 4700, fair: 3600, poor: 2200 },
      '115': { excellent: 7500, good: 6000, fair: 4650, poor: 2800 },
      '150': { excellent: 10000, good: 8000, fair: 6200, poor: 3700 },
      '200': { excellent: 12350, good: 9900, fair: 7650, poor: 4600 },
      '250': { excellent: 15000, good: 12000, fair: 9300, poor: 5600 },
      '300': { excellent: 17800, good: 14200, fair: 11000, poor: 6650 }
    },
    '2005-2009': {
      '5': { excellent: 475, good: 375, fair: 300, poor: 175 },
      '10': { excellent: 825, good: 650, fair: 500, poor: 300 },
      '15': { excellent: 1175, good: 925, fair: 725, poor: 450 },
      '20': { excellent: 1550, good: 1225, fair: 950, poor: 575 },
      '25': { excellent: 1950, good: 1550, fair: 1200, poor: 725 },
      '40': { excellent: 2700, good: 2150, fair: 1650, poor: 1000 },
      '50': { excellent: 3100, good: 2450, fair: 1900, poor: 1150 },
      '60': { excellent: 3550, good: 2800, fair: 2175, poor: 1300 },
      '75': { excellent: 4275, good: 3400, fair: 2625, poor: 1600 },
      '90': { excellent: 5050, good: 4025, fair: 3100, poor: 1875 },
      '115': { excellent: 6450, good: 5150, fair: 4000, poor: 2400 },
      '150': { excellent: 8550, good: 6850, fair: 5300, poor: 3175 },
      '200': { excellent: 10600, good: 8475, fair: 6550, poor: 3950 },
      '250': { excellent: 12900, good: 10300, fair: 8000, poor: 4800 },
      '300': { excellent: 15250, good: 12200, fair: 9450, poor: 5700 }
    }
  },
  'Honda': {
    '2020-2024': {
      '5': { excellent: 725, good: 575, fair: 450, poor: 275 },
      '10': { excellent: 1250, good: 1000, fair: 800, poor: 475 },
      '15': { excellent: 1775, good: 1425, fair: 1125, poor: 700 },
      '20': { excellent: 2300, good: 1850, fair: 1475, poor: 900 },
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
      '5': { excellent: 625, good: 500, fair: 375, poor: 225 },
      '10': { excellent: 1075, good: 850, fair: 650, poor: 400 },
      '15': { excellent: 1525, good: 1225, fair: 950, poor: 575 },
      '20': { excellent: 1975, good: 1575, fair: 1225, poor: 750 },
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
    },
    '2010-2014': {
      '5': { excellent: 525, good: 425, fair: 325, poor: 200 },
      '10': { excellent: 925, good: 725, fair: 575, poor: 350 },
      '15': { excellent: 1325, good: 1050, fair: 825, poor: 500 },
      '20': { excellent: 1700, good: 1350, fair: 1050, poor: 650 },
      '25': { excellent: 2150, good: 1700, fair: 1325, poor: 800 },
      '40': { excellent: 2950, good: 2350, fair: 1825, poor: 1100 },
      '50': { excellent: 3375, good: 2700, fair: 2100, poor: 1275 },
      '60': { excellent: 3900, good: 3100, fair: 2425, poor: 1475 },
      '75': { excellent: 4675, good: 3725, fair: 2875, poor: 1750 },
      '90': { excellent: 5475, good: 4350, fair: 3375, poor: 2050 },
      '115': { excellent: 7100, good: 5675, fair: 4400, poor: 2675 },
      '150': { excellent: 9350, good: 7475, fair: 5800, poor: 3500 },
      '200': { excellent: 11600, good: 9275, fair: 7200, poor: 4350 },
      '250': { excellent: 14100, good: 11275, fair: 8750, poor: 5300 }
    },
    '2005-2009': {
      '5': { excellent: 450, good: 350, fair: 275, poor: 165 },
      '10': { excellent: 800, good: 625, fair: 500, poor: 300 },
      '15': { excellent: 1150, good: 900, fair: 700, poor: 425 },
      '20': { excellent: 1475, good: 1175, fair: 900, poor: 550 },
      '25': { excellent: 1850, good: 1475, fair: 1150, poor: 700 },
      '40': { excellent: 2550, good: 2025, fair: 1575, poor: 950 },
      '50': { excellent: 2925, good: 2325, fair: 1800, poor: 1100 },
      '60': { excellent: 3375, good: 2700, fair: 2100, poor: 1275 },
      '75': { excellent: 4050, good: 3225, fair: 2500, poor: 1500 },
      '90': { excellent: 4750, good: 3775, fair: 2925, poor: 1775 },
      '115': { excellent: 6150, good: 4900, fair: 3800, poor: 2300 },
      '150': { excellent: 8100, good: 6475, fair: 5025, poor: 3025 },
      '200': { excellent: 10050, good: 8025, fair: 6225, poor: 3750 },
      '250': { excellent: 12225, good: 9775, fair: 7575, poor: 4575 }
    }
  },
  'Suzuki': {
    '2020-2024': {
      '5': { excellent: 675, good: 550, fair: 425, poor: 250 },
      '10': { excellent: 1150, good: 925, fair: 725, poor: 450 },
      '15': { excellent: 1650, good: 1325, fair: 1050, poor: 650 },
      '20': { excellent: 2150, good: 1750, fair: 1375, poor: 850 },
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
    },
    '2015-2019': {
      '5': { excellent: 575, good: 475, fair: 375, poor: 225 },
      '10': { excellent: 1000, good: 800, fair: 625, poor: 400 },
      '15': { excellent: 1425, good: 1150, fair: 900, poor: 575 },
      '20': { excellent: 1875, good: 1500, fair: 1175, poor: 725 },
      '25': { excellent: 2350, good: 1900, fair: 1475, poor: 875 },
      '40': { excellent: 3200, good: 2575, fair: 2000, poor: 1225 },
      '50': { excellent: 3650, good: 2950, fair: 2275, poor: 1400 },
      '60': { excellent: 4175, good: 3375, fair: 2600, poor: 1575 },
      '75': { excellent: 4950, good: 4000, fair: 3050, poor: 1850 },
      '90': { excellent: 5825, good: 4700, fair: 3575, poor: 2175 },
      '115': { excellent: 7575, good: 6100, fair: 4700, poor: 2850 },
      '150': { excellent: 9900, good: 7925, fair: 6100, poor: 3675 },
      '200': { excellent: 12275, good: 9825, fair: 7575, poor: 4550 },
      '250': { excellent: 14950, good: 11975, fair: 9225, poor: 5575 }
    },
    '2010-2014': {
      '5': { excellent: 500, good: 400, fair: 325, poor: 200 },
      '10': { excellent: 875, good: 700, fair: 550, poor: 350 },
      '15': { excellent: 1250, good: 1000, fair: 800, poor: 500 },
      '20': { excellent: 1625, good: 1300, fair: 1025, poor: 625 },
      '25': { excellent: 2050, good: 1650, fair: 1275, poor: 775 },
      '40': { excellent: 2800, good: 2250, fair: 1750, poor: 1075 },
      '50': { excellent: 3200, good: 2575, fair: 2000, poor: 1225 },
      '60': { excellent: 3650, good: 2950, fair: 2275, poor: 1375 },
      '75': { excellent: 4325, good: 3475, fair: 2675, poor: 1625 },
      '90': { excellent: 5100, good: 4100, fair: 3125, poor: 1900 },
      '115': { excellent: 6625, good: 5325, fair: 4100, poor: 2500 },
      '150': { excellent: 8650, good: 6925, fair: 5350, poor: 3225 },
      '200': { excellent: 10700, good: 8575, fair: 6625, poor: 4000 },
      '250': { excellent: 13050, good: 10450, fair: 8050, poor: 4875 }
    },
    '2005-2009': {
      '5': { excellent: 425, good: 350, fair: 275, poor: 165 },
      '10': { excellent: 750, good: 600, fair: 475, poor: 300 },
      '15': { excellent: 1075, good: 850, fair: 675, poor: 425 },
      '20': { excellent: 1400, good: 1125, fair: 875, poor: 525 },
      '25': { excellent: 1775, good: 1425, fair: 1100, poor: 675 },
      '40': { excellent: 2425, good: 1950, fair: 1500, poor: 925 },
      '50': { excellent: 2775, good: 2225, fair: 1725, poor: 1050 },
      '60': { excellent: 3175, good: 2550, fair: 1975, poor: 1200 },
      '75': { excellent: 3750, good: 3000, fair: 2325, poor: 1400 },
      '90': { excellent: 4425, good: 3550, fair: 2725, poor: 1650 },
      '115': { excellent: 5750, good: 4600, fair: 3550, poor: 2150 },
      '150': { excellent: 7500, good: 6000, fair: 4650, poor: 2800 },
      '200': { excellent: 9300, good: 7450, fair: 5750, poor: 3475 },
      '250': { excellent: 11325, good: 9075, fair: 7000, poor: 4225 }
    }
  },
  'Evinrude': {
    '2015-2019': {
      '5': { excellent: 550, good: 450, fair: 350, poor: 210 },
      '10': { excellent: 950, good: 775, fair: 600, poor: 375 },
      '15': { excellent: 1350, good: 1100, fair: 875, poor: 525 },
      '20': { excellent: 1750, good: 1425, fair: 1125, poor: 700 },
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
    },
    '2010-2014': {
      '5': { excellent: 475, good: 375, fair: 300, poor: 175 },
      '10': { excellent: 825, good: 650, fair: 500, poor: 325 },
      '15': { excellent: 1175, good: 925, fair: 750, poor: 450 },
      '20': { excellent: 1525, good: 1200, fair: 950, poor: 600 },
      '25': { excellent: 1900, good: 1525, fair: 1200, poor: 725 },
      '40': { excellent: 2600, good: 2075, fair: 1625, poor: 1000 },
      '50': { excellent: 2950, good: 2350, fair: 1825, poor: 1125 },
      '60': { excellent: 3375, good: 2700, fair: 2075, poor: 1250 },
      '75': { excellent: 4000, good: 3200, fair: 2500, poor: 1525 },
      '90': { excellent: 4700, good: 3750, fair: 2875, poor: 1750 },
      '115': { excellent: 6075, good: 4875, fair: 3750, poor: 2275 },
      '150': { excellent: 8000, good: 6400, fair: 4950, poor: 2975 },
      '200': { excellent: 9900, good: 7925, fair: 6100, poor: 3675 },
      '250': { excellent: 12075, good: 9675, fair: 7475, poor: 4525 }
    },
    '2005-2009': {
      '5': { excellent: 400, good: 325, fair: 250, poor: 150 },
      '10': { excellent: 700, good: 550, fair: 425, poor: 275 },
      '15': { excellent: 1000, good: 800, fair: 625, poor: 375 },
      '20': { excellent: 1300, good: 1025, fair: 800, poor: 500 },
      '25': { excellent: 1650, good: 1300, fair: 1025, poor: 625 },
      '40': { excellent: 2250, good: 1800, fair: 1400, poor: 850 },
      '50': { excellent: 2550, good: 2025, fair: 1575, poor: 950 },
      '60': { excellent: 2925, good: 2325, fair: 1800, poor: 1100 },
      '75': { excellent: 3475, good: 2775, fair: 2150, poor: 1300 },
      '90': { excellent: 4075, good: 3250, fair: 2500, poor: 1525 },
      '115': { excellent: 5275, good: 4225, fair: 3250, poor: 1975 },
      '150': { excellent: 6925, good: 5550, fair: 4275, poor: 2575 },
      '200': { excellent: 8575, good: 6875, fair: 5300, poor: 3200 },
      '250': { excellent: 10450, good: 8375, fair: 6475, poor: 3925 }
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
    let low = estimatedValue * 0.85;
    let high = estimatedValue * 1.15;
    const factors: string[] = ['Unknown brand', 'Estimated depreciation'];
    const adj = applyBrandPenaltyToRange(low, high, brand, factors);
    
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
  
  // Determine year range
  let yearRange = '';
  if (year >= 2020) {
    yearRange = '2020-2024';
  } else if (year >= 2015) {
    yearRange = '2015-2019';
  } else if (year >= 2010) {
    yearRange = '2010-2014';
  } else if (year >= 2005) {
    yearRange = '2005-2009';
  } else {
    // Very old motor (pre-2005) - improved formula
    const currentYear = new Date().getFullYear();
    const motorAge = currentYear - year;
    const baseValue = horsepower * 40;  // Increased from $25
    const ageDepreciation = Math.max(0.35, 1 - (motorAge - 20) * 0.03);  // Slower decline
    const conditionMultiplier = { excellent: 1.0, good: 0.8, fair: 0.6, poor: 0.35 }[condition];
    const estimatedValue = baseValue * ageDepreciation * conditionMultiplier;
    let low = estimatedValue * 0.8;
    let high = estimatedValue * 1.2;
    const factors = ['Motor age over 20 years', 'Value based on condition and market demand'];
    const adj = applyBrandPenaltyToRange(low, high, brand, factors);
    
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
  
  const preLow = finalValue * 0.85;
  const preHigh = finalValue * 1.15;
  const adj = applyBrandPenaltyToRange(preLow, preHigh, brand, factors);
  
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

// Compute the median of a low/high range and round to the nearest $25
// Compute the median of a low/high range and round to the nearest $25 (with min floor)
export function medianRoundedTo25(low: number, high: number): number {
  const median = (low + high) / 2;
  let rounded = Math.round(median / 25) * 25;
  if (rounded < TRADEIN_MIN_VALUE) rounded = TRADEIN_MIN_VALUE;
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
export function applyBrandPenaltyToRange(low: number, high: number, brand?: string, factors: string[] = []) {
  const originalLow = low;
  const originalHigh = high;
  const factor = getBrandPenaltyFactor(brand);
  let adjustedLow = low;
  let adjustedHigh = high;
  let penaltyApplied = false;

  if (factor < 1) {
    adjustedLow = Math.max(originalLow * factor, TRADEIN_MIN_VALUE);
    adjustedHigh = Math.max(originalHigh * factor, TRADEIN_MIN_VALUE);
    penaltyApplied = true;
    const note = 'Adjusted for brand (-50%) — Manufacturer out of business; parts & service availability limited.';
    if (!factors.includes(note)) factors.push(note);

    const chosen = medianRoundedTo25(adjustedLow, adjustedHigh);
    console.log(
      `tradein_penalty_applied penalty_reason="brand_out_of_business" brand=${normalizeBrand(brand)} factor=${factor} original_low=${originalLow} original_high=${originalHigh} adjusted_low=${adjustedLow} adjusted_high=${adjustedHigh} chosen=${chosen}`
    );
  }

  // Enforce floors even when no penalty
  adjustedLow = Math.max(adjustedLow, TRADEIN_MIN_VALUE);
  adjustedHigh = Math.max(adjustedHigh, TRADEIN_MIN_VALUE);

  return { low: adjustedLow, high: adjustedHigh, factors, penaltyApplied, factor } as const;
}

// Helper for tests and utilities
export function computeRoundedTradeIn(low: number, high: number, brand?: string) {
  const { low: l2, high: h2 } = applyBrandPenaltyToRange(low, high, brand, []);
  return { low: l2, high: h2, rounded: medianRoundedTo25(l2, h2) } as const;
}