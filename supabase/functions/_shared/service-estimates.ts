/**
 * Service Cost Estimates for Voice Agent
 * These are rough estimates to help customers budget - actual pricing determined at service
 */

export interface ServiceEstimate {
  range: string;
  minPrice: number;
  maxPrice: number;
  includes: string[];
  notes?: string;
}

export interface ServiceCategory {
  name: string;
  description: string;
  hpRanges: {
    small: ServiceEstimate;    // 2.5-30 HP
    medium: ServiceEstimate;   // 40-115 HP
    large: ServiceEstimate;    // 150-300 HP
    xlarge: ServiceEstimate;   // 350+ HP
  };
}

export const SERVICE_ESTIMATES: Record<string, ServiceCategory> = {
  '100_hour': {
    name: '100-Hour Service',
    description: 'Annual or 100-hour maintenance service',
    hpRanges: {
      small: {
        range: '2.5-30 HP',
        minPrice: 250,
        maxPrice: 400,
        includes: ['Oil & filter change', 'Gear lube', 'Spark plugs', 'Visual inspection', 'Fuel filter check']
      },
      medium: {
        range: '40-115 HP',
        minPrice: 400,
        maxPrice: 600,
        includes: ['Oil & filter change', 'Gear lube', 'Spark plugs', 'Fuel filter', 'Anodes check', 'Full inspection']
      },
      large: {
        range: '150-300 HP',
        minPrice: 550,
        maxPrice: 850,
        includes: ['Oil & filter change', 'Gear lube', 'Spark plugs', 'Fuel filters', 'Anodes', 'Belt inspection', 'Full diagnostic']
      },
      xlarge: {
        range: '350+ HP',
        minPrice: 800,
        maxPrice: 1200,
        includes: ['Full oil service', 'Gear lube', 'All filters', 'Anodes', 'Belt check', 'Diagnostic scan', 'Compression test']
      }
    }
  },
  'winterization': {
    name: 'Winterization',
    description: 'Prepare motor for winter storage',
    hpRanges: {
      small: {
        range: '2.5-30 HP',
        minPrice: 150,
        maxPrice: 250,
        includes: ['Fuel stabilizer', 'Fogging oil', 'Gear lube drain/refill', 'Anti-freeze flush']
      },
      medium: {
        range: '40-115 HP',
        minPrice: 250,
        maxPrice: 400,
        includes: ['Fuel stabilizer', 'Fogging oil', 'Gear lube', 'Anti-freeze', 'Battery prep', 'Cover installation']
      },
      large: {
        range: '150-300 HP',
        minPrice: 350,
        maxPrice: 550,
        includes: ['Full fuel treatment', 'Fogging', 'Gear lube', 'Cooling system flush', 'Battery service', 'Cover']
      },
      xlarge: {
        range: '350+ HP',
        minPrice: 500,
        maxPrice: 750,
        includes: ['Complete winterization', 'All fluids', 'Fuel system treatment', 'Battery', 'Cover', 'Storage report']
      }
    }
  },
  'spring_commissioning': {
    name: 'Spring Commissioning',
    description: 'De-winterize and prepare for season',
    hpRanges: {
      small: {
        range: '2.5-30 HP',
        minPrice: 175,
        maxPrice: 300,
        includes: ['Remove storage prep', 'Fresh fuel', 'Battery check', 'Test run', 'Safety inspection']
      },
      medium: {
        range: '40-115 HP',
        minPrice: 300,
        maxPrice: 450,
        includes: ['De-winterize', 'Fresh fuel', 'Battery service', 'Full test run', 'Safety check', 'Prop inspection']
      },
      large: {
        range: '150-300 HP',
        minPrice: 400,
        maxPrice: 600,
        includes: ['Complete de-winterization', 'All fluids check', 'Battery', 'Extended test run', 'Full safety inspection']
      },
      xlarge: {
        range: '350+ HP',
        minPrice: 550,
        maxPrice: 850,
        includes: ['Full commissioning', 'Diagnostic scan', 'Sea trial', 'All systems check', 'Documentation']
      }
    }
  },
  'impeller': {
    name: 'Water Pump / Impeller',
    description: 'Water pump impeller replacement',
    hpRanges: {
      small: {
        range: '2.5-30 HP',
        minPrice: 200,
        maxPrice: 350,
        includes: ['Impeller', 'Gaskets', 'Housing inspection', 'Test run'],
        notes: 'Recommended every 2-3 years or 300 hours'
      },
      medium: {
        range: '40-115 HP',
        minPrice: 350,
        maxPrice: 500,
        includes: ['Impeller kit', 'All gaskets/seals', 'Housing check', 'Thermostat check', 'Test run']
      },
      large: {
        range: '150-300 HP',
        minPrice: 450,
        maxPrice: 700,
        includes: ['Complete impeller kit', 'Seals', 'Thermostat inspection', 'Full cooling test']
      },
      xlarge: {
        range: '350+ HP',
        minPrice: 600,
        maxPrice: 900,
        includes: ['Full water pump service', 'All seals/gaskets', 'Thermostat', 'Pressure test', 'Extended run test']
      }
    }
  },
  'lower_unit': {
    name: 'Lower Unit Service',
    description: 'Gear case service and inspection',
    hpRanges: {
      small: {
        range: '2.5-30 HP',
        minPrice: 100,
        maxPrice: 175,
        includes: ['Drain and refill gear lube', 'Seal inspection', 'Check for water intrusion']
      },
      medium: {
        range: '40-115 HP',
        minPrice: 150,
        maxPrice: 250,
        includes: ['Gear lube service', 'Seal check', 'Prop shaft inspection', 'Anode check']
      },
      large: {
        range: '150-300 HP',
        minPrice: 200,
        maxPrice: 350,
        includes: ['Full gear lube service', 'Seal inspection', 'Prop shaft', 'Bearings check', 'Anodes']
      },
      xlarge: {
        range: '350+ HP',
        minPrice: 275,
        maxPrice: 450,
        includes: ['Complete lower unit service', 'All seals/bearings inspection', 'Prop system', 'Full report']
      }
    }
  },
  'prop_change': {
    name: 'Propeller Change',
    description: 'Remove and install propeller',
    hpRanges: {
      small: {
        range: '2.5-30 HP',
        minPrice: 50,
        maxPrice: 100,
        includes: ['Remove old prop', 'Inspect hub', 'Install new prop', 'Torque to spec']
      },
      medium: {
        range: '40-115 HP',
        minPrice: 75,
        maxPrice: 125,
        includes: ['Prop removal', 'Hub inspection', 'Shaft check', 'Install and torque']
      },
      large: {
        range: '150-300 HP',
        minPrice: 100,
        maxPrice: 175,
        includes: ['Full prop service', 'Hub kit inspection', 'Shaft inspection', 'Install']
      },
      xlarge: {
        range: '350+ HP',
        minPrice: 125,
        maxPrice: 200,
        includes: ['Complete prop service', 'Hub system check', 'Shaft inspection', 'Torque to spec']
      }
    }
  }
};

/**
 * Get HP category based on horsepower value
 */
export function getHpCategory(hp: number): 'small' | 'medium' | 'large' | 'xlarge' {
  if (hp <= 30) return 'small';
  if (hp <= 115) return 'medium';
  if (hp <= 300) return 'large';
  return 'xlarge';
}

/**
 * Get service estimate for a specific service type and horsepower
 */
export function getServiceEstimate(serviceType: string, hp: number): ServiceEstimate | null {
  const service = SERVICE_ESTIMATES[serviceType];
  if (!service) return null;
  
  const category = getHpCategory(hp);
  return service.hpRanges[category];
}

/**
 * Format service estimate for voice response
 */
export function formatServiceEstimateForVoice(
  serviceType: string, 
  hp: number,
  motorModel?: string
): string {
  const service = SERVICE_ESTIMATES[serviceType];
  if (!service) {
    return "I don't have pricing for that service type. Let me connect you with our service department.";
  }
  
  const category = getHpCategory(hp);
  const estimate = service.hpRanges[category];
  
  const motorRef = motorModel ? `your ${motorModel}` : `a ${hp} horsepower motor`;
  
  let response = `For ${service.name.toLowerCase()} on ${motorRef}, `;
  response += `you're looking at about $${estimate.minPrice} to $${estimate.maxPrice}. `;
  response += `That includes ${estimate.includes.slice(0, 3).join(', ')}`;
  
  if (estimate.includes.length > 3) {
    response += `, and more`;
  }
  response += '. ';
  
  if (estimate.notes) {
    response += estimate.notes + ' ';
  }
  
  response += "Want me to have our service team reach out to schedule?";
  
  return response;
}

/**
 * Trade-in value estimation based on age, brand, and HP
 */
export interface TradeInEstimate {
  lowValue: number;
  highValue: number;
  factors: string[];
  disclaimer: string;
}

export function estimateTradeInValue(params: {
  brand: string;
  year: number;
  horsepower: number;
  condition?: 'excellent' | 'good' | 'fair' | 'rough';
  hours?: number;
}): TradeInEstimate {
  const currentYear = new Date().getFullYear();
  const age = currentYear - params.year;
  const condition = params.condition || 'good';
  
  // Base value multipliers by brand
  const brandMultipliers: Record<string, number> = {
    mercury: 1.0,
    yamaha: 0.95,
    honda: 0.90,
    suzuki: 0.85,
    evinrude: 0.70,
    johnson: 0.60,
    tohatsu: 0.75,
  };
  
  const brandKey = params.brand.toLowerCase();
  const brandMult = brandMultipliers[brandKey] || 0.65;
  
  // Condition multipliers
  const conditionMultipliers: Record<string, number> = {
    excellent: 1.15,
    good: 1.0,
    fair: 0.80,
    rough: 0.55,
  };
  const condMult = conditionMultipliers[condition];
  
  // Base value estimation (rough MSRP proxy based on HP)
  let baseValue: number;
  if (params.horsepower <= 10) baseValue = params.horsepower * 400;
  else if (params.horsepower <= 30) baseValue = params.horsepower * 350;
  else if (params.horsepower <= 75) baseValue = params.horsepower * 250;
  else if (params.horsepower <= 150) baseValue = params.horsepower * 180;
  else if (params.horsepower <= 300) baseValue = params.horsepower * 140;
  else baseValue = params.horsepower * 120;
  
  // Depreciation by age (steeper first 3 years)
  let depreciationRate: number;
  if (age <= 1) depreciationRate = 0.80;
  else if (age <= 3) depreciationRate = 0.65;
  else if (age <= 5) depreciationRate = 0.50;
  else if (age <= 10) depreciationRate = 0.35;
  else if (age <= 15) depreciationRate = 0.25;
  else depreciationRate = 0.15;
  
  // Calculate range
  const estimatedValue = baseValue * brandMult * condMult * depreciationRate;
  const lowValue = Math.round(estimatedValue * 0.85 / 100) * 100;
  const highValue = Math.round(estimatedValue * 1.15 / 100) * 100;
  
  // Build factors list
  const factors: string[] = [];
  if (age <= 3) factors.push('Recent model year is a plus');
  else if (age > 10) factors.push('Older model affects value');
  
  if (brandKey === 'mercury') factors.push('Mercury holds value well');
  else if (['yamaha', 'honda'].includes(brandKey)) factors.push(`${params.brand} has good resale`);
  else if (['evinrude', 'johnson'].includes(brandKey)) factors.push('Parts availability affects value');
  
  if (condition === 'excellent') factors.push('Excellent condition adds value');
  else if (condition === 'fair' || condition === 'rough') factors.push('Condition affects final value');
  
  if (params.hours && params.hours > 500) factors.push('Higher hours may reduce value');
  
  return {
    lowValue: Math.max(lowValue, 200), // Minimum trade value
    highValue: Math.max(highValue, 500),
    factors,
    disclaimer: 'This is a rough estimate. Final trade-in value determined after inspection.'
  };
}
