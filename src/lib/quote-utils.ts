/**
 * Quote Summary Utilities
 * Calculations and formatting for the enhanced quote summary experience
 */

export interface PricingBreakdown {
  msrp: number;
  discount: number;
  promoValue: number;
  subtotal: number;
  tax: number;
  total: number;
  savings: number;
}

export interface MonthlyPayment {
  amount: number;
  rate: number;
  termMonths: number;
  totalAmount: number;
  totalInterest: number;
}

/**
 * Format currency values consistently
 */
export function money(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate monthly payment for financing with smart term selection
 */
export function calculateMonthly(
  amount: number, 
  rate: number = 7.99, 
  termMonths: number = 60
): MonthlyPayment {
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalAmount = monthlyPayment * termMonths;
  const totalInterest = totalAmount - amount;
  
  return {
    amount: Math.round(monthlyPayment),
    rate,
    termMonths,
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest)
  };
}

/**
 * Calculate days until a date
 */
export function daysUntil(date: Date | string): number {
  const targetDate = new Date(date);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Compute comprehensive pricing totals from quote data
 */
export function computeTotals(data: {
  motorPrice: number;
  accessoryTotal: number;
  promotionalSavings?: number;
  tradeInValue?: number;
  taxRate?: number;
}): PricingBreakdown {
  const {
    motorPrice,
    accessoryTotal,
    promotionalSavings = 0,
    tradeInValue = 0,
    taxRate = 0.13 // 13% HST for Canada
  } = data;

  // Calculate MSRP (assume motor price includes any dealer discount already applied)
  const discount = 0; // Motor price is already discounted
  const msrp = motorPrice;
  
  const subtotal = motorPrice + accessoryTotal - tradeInValue;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const savings = discount + promotionalSavings + tradeInValue;

  return {
    msrp,
    discount,
    promoValue: promotionalSavings,
    subtotal,
    tax,
    total,
    savings
  };
}

/**
 * Calculate complete quote pricing with proper MSRP, discounts, and accessories
 */
export function calculateQuotePricing(data: {
  motorMSRP: number;
  motorDiscount: number;
  accessoryTotal: number;
  warrantyPrice: number;
  promotionalSavings: number;
  tradeInValue: number;
  financingFee?: number;
  taxRate?: number;
}): PricingBreakdown {
  const {
    motorMSRP,
    motorDiscount,
    accessoryTotal,
    warrantyPrice,
    promotionalSavings,
    tradeInValue,
    financingFee = 0,
    taxRate = 0.13
  } = data;

  const msrp = motorMSRP;
  const discount = motorDiscount;
  const promoValue = promotionalSavings;
  
  // Motor after discount + accessories + warranty + financing fee - trade-in - promos
  const subtotal = (msrp - discount) + accessoryTotal + warrantyPrice + financingFee - tradeInValue - promoValue;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const savings = discount + promoValue + tradeInValue;
  
  return {
    msrp,
    discount,
    promoValue,
    subtotal,
    tax,
    total,
    savings
  };
}

/**
 * Format expiry countdown message
 */
export function formatExpiry(endDate: Date | string): string {
  const days = daysUntil(endDate);
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `Expires in ${days} days`;
  if (days <= 30) return `Expires in ${Math.ceil(days / 7)} weeks`;
  return `Expires ${new Date(endDate).toLocaleDateString()}`;
}

/**
 * Calculate warranty extension cost from database-driven pricing
 */
export async function calculateWarrantyExtensionCost(
  motorHP: number,
  currentYears: number,
  targetYears: number
): Promise<number> {
  // Import here to avoid circular dependencies
  const { supabase } = await import('@/integrations/supabase/client');
  
  // If no extension needed, return 0
  if (targetYears <= currentYears) {
    return 0;
  }
  
  // Query warranty pricing based on HP range
  const { data, error } = await supabase
    .from('warranty_pricing')
    .select('*')
    .lte('hp_min', motorHP)
    .gte('hp_max', motorHP)
    .single();
  
  if (error || !data) {
    console.error('Failed to fetch warranty pricing:', error);
    // Fallback to estimated pricing if database query fails
    return (targetYears - currentYears) * 1500;
  }
  
  // Get cumulative cost for current coverage
  const currentCost = getCumulativeCost(data, currentYears);
  
  // Get cumulative cost for target coverage
  const targetCost = getCumulativeCost(data, targetYears);
  
  // Extension cost is the difference
  return Math.max(0, targetCost - currentCost);
}

/**
 * Helper: Get cumulative warranty cost for a given year
 */
function getCumulativeCost(pricingData: any, years: number): number {
  // Map years to database columns
  const yearMap: Record<number, string> = {
    1: 'year_1_price',
    2: 'year_2_price',
    3: 'year_3_price',
    4: 'year_4_price',
    5: 'year_5_price'
  };
  
  // For years 1-5, use direct database values
  if (years <= 5) {
    const columnName = yearMap[years];
    return pricingData[columnName] || 0;
  }
  
  // For years beyond 5, extrapolate using year 5's incremental cost
  const year5Cost = pricingData.year_5_price || 0;
  const year4Cost = pricingData.year_4_price || 0;
  const incrementalCost = year5Cost - year4Cost;
  
  // Add incremental cost for each year beyond 5
  const extraYears = years - 5;
  return year5Cost + (incrementalCost * extraYears);
}

/**
 * Package configurations for Good/Better/Best
 */
export interface PackageConfig {
  id: 'good' | 'better' | 'best';
  name: string;
  description: string;
  inclusions: string[];
  recommended?: boolean;
  additionalCost: number;
}

export const PACKAGE_CONFIGS: PackageConfig[] = [
  {
    id: 'good',
    name: 'Essential',
    description: 'Everything you need to get on the water',
    inclusions: [
      'Mercury motor',
      'Standard controls & rigging',
      'Basic installation'
    ],
    additionalCost: 0
  },
  {
    id: 'better',
    name: 'Complete',
    description: 'Our most popular package',
    inclusions: [
      'Mercury motor',
      'Premium controls & rigging', 
      'Marine starting battery',
      'Standard propeller',
      'Priority installation'
    ],
    recommended: true,
    additionalCost: 179.99 // Battery cost
  },
  {
    id: 'best',
    name: 'Premium',
    description: 'Full peace of mind package',
    inclusions: [
      'Mercury motor',
      'Premium controls & rigging',
      'Marine starting battery',
      'Performance propeller upgrade',
      'White-glove installation'
    ],
    additionalCost: 179.99 + 299.99 // Battery + propeller upgrade
  }
];