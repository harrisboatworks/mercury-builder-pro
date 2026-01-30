/**
 * Visible Motors Store
 * 
 * A simple global store that tracks what motors are currently visible on the screen
 * after filtering. This allows the voice agent to read the same data the user sees
 * without making an API call.
 */

export interface VisibleMotor {
  id: string;
  model: string;
  model_display?: string;
  horsepower: number;
  price: number;
  msrp?: number;
  in_stock?: boolean;
  stock_quantity?: number;
  type?: string;
}

interface VisibleMotorsState {
  motors: VisibleMotor[];
  filterHP: number | null;
  filterQuery: string | null;
  updatedAt: number;
}

// Global state - updated by MotorSelectionPage, read by voice agent
let state: VisibleMotorsState = {
  motors: [],
  filterHP: null,
  filterQuery: null,
  updatedAt: 0,
};

// Listeners for state changes
const listeners: Set<() => void> = new Set();

/**
 * Update the visible motors (called from MotorSelectionPage when filtering)
 */
export function setVisibleMotors(
  motors: VisibleMotor[],
  filterHP: number | null = null,
  filterQuery: string | null = null
): void {
  state = {
    motors,
    filterHP,
    filterQuery,
    updatedAt: Date.now(),
  };
  
  // Notify listeners
  listeners.forEach(listener => listener());
  
  console.log(`[VisibleMotorsStore] Updated: ${motors.length} motors, HP filter: ${filterHP}, query: "${filterQuery}"`);
}

/**
 * Get the current visible motors (called by voice agent)
 */
export function getVisibleMotors(): VisibleMotorsState {
  return state;
}

/**
 * Get a summary for the voice agent to speak
 */
export function getVisibleMotorsSummary(): {
  count: number;
  filterHP: number | null;
  inStockCount: number;
  priceRange: { min: number; max: number } | null;
  hasManualStart: boolean;
  hasElectricStart: boolean;
  motors: VisibleMotor[];
} {
  const motors = state.motors;
  
  if (motors.length === 0) {
    return {
      count: 0,
      filterHP: state.filterHP,
      inStockCount: 0,
      priceRange: null,
      hasManualStart: false,
      hasElectricStart: false,
      motors: [],
    };
  }
  
  const inStockCount = motors.filter(m => m.in_stock).reduce((sum, m) => sum + ((m as any).stock_quantity || 1), 0);
  const prices = motors.map(m => m.price).filter(p => p > 0);
  
  // Check for start types by looking at model names
  const hasManualStart = motors.some(m => 
    m.model?.includes('M') || m.model_display?.toLowerCase().includes('manual')
  );
  const hasElectricStart = motors.some(m => 
    m.model?.includes('E') || m.model_display?.toLowerCase().includes('electric')
  );
  
  return {
    count: motors.length,
    filterHP: state.filterHP,
    inStockCount,
    priceRange: prices.length > 0 
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null,
    hasManualStart,
    hasElectricStart,
    motors: motors.slice(0, 10), // Return top 10 for voice to reference
  };
}

/**
 * Subscribe to state changes
 */
export function subscribeToVisibleMotors(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Format motors for voice agent response
 */
export function formatMotorsForVoice(limit: number = 5): string {
  const summary = getVisibleMotorsSummary();
  
  if (summary.count === 0) {
    return JSON.stringify({
      found: false,
      message: "No motors match the current filter.",
    });
  }
  
  const configInfo = [];
  if (summary.hasManualStart && summary.hasElectricStart) {
    configInfo.push("both manual and electric start");
  } else if (summary.hasManualStart) {
    configInfo.push("manual start");
  } else if (summary.hasElectricStart) {
    configInfo.push("electric start");
  }
  
  return JSON.stringify({
    found: true,
    count: summary.count,
    filter_hp: summary.filterHP,
    in_stock_count: summary.inStockCount,
    price_range: summary.priceRange,
    configurations: configInfo.join(", "),
    top_motors: summary.motors.slice(0, limit).map(m => ({
      model: m.model_display || m.model,
      hp: m.horsepower,
      price: m.price,
      in_stock: m.in_stock,
      quantity: m.stock_quantity || (m.in_stock ? 1 : 0),
    })),
    message: summary.filterHP 
      ? `Showing ${summary.count} ${summary.filterHP}HP configurations on screen. ${summary.inStockCount > 0 ? `${summary.inStockCount} in stock.` : ''} ${configInfo.length > 0 ? `Available in ${configInfo.join(", ")}.` : ''}`
      : `Showing ${summary.count} motors on screen.`,
  });
}
