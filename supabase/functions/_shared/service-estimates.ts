/**
 * Service quoting guardrail for voice agents.
 *
 * HBW does not currently expose a live, authoritative service-price source to
 * the assistant. Model-family maintenance schedules also differ, so neither a
 * price nor an included-parts list may be inferred from horsepower.
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

export const SERVICE_ESTIMATES: Record<string, ServiceCategory> = {};

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
  const motorRef = motorModel ? `your ${motorModel}` : `a ${hp} horsepower motor`;
  return `I don't have a live verified price or confirmed parts list for ${serviceType} on ${motorRef}, so I won't invent one. The exact scope depends on the model and serial number, engine hours, service history, the applicable Mercury manual, and inspection. Harris Boat Works can confirm the work and quote at Gores Landing. Want me to arrange a callback?`;
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
