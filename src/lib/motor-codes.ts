// Comprehensive Mercury outboard motor code definitions
// Used for tooltips, configurator, and educational content

export interface MotorCodeDefinition {
  meaning: string;
  benefit: string;
  icon: string;
  category: 'start' | 'shaft' | 'control' | 'feature' | 'family' | 'fuel';
}

export const MOTOR_CODES: Record<string, MotorCodeDefinition> = {
  // Start Type
  'E': { 
    meaning: 'Electric Start', 
    benefit: 'Push-button convenience - no pull cord needed', 
    icon: '⚡',
    category: 'start'
  },
  'M': { 
    meaning: 'Manual Start', 
    benefit: 'Pull cord — simple, reliable, lightweight', 
    icon: '🔧',
    category: 'start'
  },
  
  // Shaft Length  
  'S': { 
    meaning: 'Short Shaft (15")', 
    benefit: 'For 15" transom boats - small inflatables & dinghies',
    icon: '📏',
    category: 'shaft'
  },
  'L': { 
    meaning: 'Long Shaft (20")', 
    benefit: 'For standard 20" transoms - most common',
    icon: '📏',
    category: 'shaft'
  },
  'XL': { 
    meaning: 'Extra Long Shaft (25")', 
    benefit: 'For 25" transoms - deep-V hulls',
    icon: '📏',
    category: 'shaft'
  },
  'XXL': { 
    meaning: 'Extra Extra Long (30")', 
    benefit: 'For 30" transoms - offshore boats',
    icon: '📏',
    category: 'shaft'
  },
  
  // Control Type
  'H': { 
    meaning: 'Tiller Handle', 
    benefit: 'Steer directly from motor - ideal for small boats',
    icon: '🎛️',
    category: 'control'
  },
  'R': { 
    meaning: 'Remote Control', 
    benefit: 'Steering wheel & console controls',
    icon: '🚗',
    category: 'control'
  },
  
  // Features
  'PT': { 
    meaning: 'Power Trim & Tilt', 
    benefit: 'Adjust motor angle on the fly for optimal performance',
    icon: '⬆️',
    category: 'feature'
  },
  'T': { 
    meaning: 'Power Tilt', 
    benefit: 'Easy motor lifting when beaching or trailering',
    icon: '⬆️',
    category: 'feature'
  },
  'O': { 
    meaning: 'Oil Injection', 
    benefit: 'Automatic oil mixing - no pre-mix required',
    icon: '💧',
    category: 'feature'
  },
  'CT': { 
    meaning: 'Command Thrust', 
    benefit: 'Larger gearcase for superior thrust and control',
    icon: '💪',
    category: 'feature'
  },
  'EFI': { 
    meaning: 'Electronic Fuel Injection', 
    benefit: 'Reliable cold starts & improved fuel efficiency',
    icon: '⛽',
    category: 'fuel'
  },
  'DTS': { 
    meaning: 'Digital Throttle & Shift', 
    benefit: 'Smooth, precise electronic controls',
    icon: '🎮',
    category: 'feature'
  },
  'BF': { 
    meaning: 'BigFoot', 
    benefit: 'High-thrust gearcase for heavy loads',
    icon: '🦶',
    category: 'feature'
  },
  
  // Special Designations / Families
  'ProXS': { 
    meaning: 'Pro XS Performance', 
    benefit: 'Sport-tuned for maximum speed',
    icon: '🏁',
    category: 'family'
  },
  'SeaPro': { 
    meaning: 'Commercial Grade', 
    benefit: 'Built for heavy-duty commercial use',
    icon: '⚓',
    category: 'family'
  },
  'ProKicker': { 
    meaning: 'Kicker/Trolling Motor', 
    benefit: 'Optimized for trolling with large gearcase',
    icon: '🎣',
    category: 'family'
  },
  'Verado': { 
    meaning: 'Premium Verado', 
    benefit: 'Supercharged performance with advanced technology',
    icon: '✨',
    category: 'family'
  },
  'FourStroke': { 
    meaning: '4-Stroke Engine', 
    benefit: 'Quiet, fuel-efficient, no oil mixing required',
    icon: '🔄',
    category: 'fuel'
  },
  'TwoStroke': { 
    meaning: '2-Stroke Engine', 
    benefit: 'Lightweight, powerful, simpler maintenance',
    icon: '🔄',
    category: 'fuel'
  },
};

// Shaft length mapping for transom heights
export const SHAFT_LENGTHS = [
  { code: 'S', name: 'Short', inches: 15, transomRange: '13-16"', suitableFor: 'Small inflatables, dinghies' },
  { code: 'L', name: 'Long', inches: 20, transomRange: '17-21"', suitableFor: 'Most fishing boats, pontoons' },
  { code: 'XL', name: 'Extra Long', inches: 25, transomRange: '22-26"', suitableFor: 'Deep-V hulls, larger boats' },
  { code: 'XXL', name: 'Ultra Long', inches: 30, transomRange: '27-31"', suitableFor: 'Offshore boats, high transoms' },
];

// Parse model name and extract codes
export function parseMotorCodes(modelName: string): { code: string; definition: MotorCodeDefinition }[] {
  const results: { code: string; definition: MotorCodeDefinition }[] = [];
  const upperModel = modelName.toUpperCase();
  
  // Check for multi-character codes first (order matters)
  const multiCharCodes = ['XXL', 'XL', 'EFI', 'DTS', 'PT', 'CT', 'BF'];
  multiCharCodes.forEach(code => {
    if (upperModel.includes(code) && MOTOR_CODES[code]) {
      results.push({ code, definition: MOTOR_CODES[code] });
    }
  });
  
  // Check for family designations
  const familyCodes = ['ProXS', 'SeaPro', 'ProKicker', 'Verado', 'FourStroke'];
  familyCodes.forEach(code => {
    if (modelName.toLowerCase().includes(code.toLowerCase()) && MOTOR_CODES[code]) {
      results.push({ code, definition: MOTOR_CODES[code] });
    }
  });
  
  // Check for single character codes (avoiding duplicates from multi-char)
  const singleCharCodes = ['E', 'M', 'S', 'L', 'H', 'R', 'T', 'O'];
  singleCharCodes.forEach(code => {
    // Make sure we're not matching part of a multi-char code
    const hasMultiChar = multiCharCodes.some(mc => mc.includes(code) && upperModel.includes(mc));
    if (!hasMultiChar && upperModel.includes(code) && MOTOR_CODES[code]) {
      // Additional check: 'L' should only match if it's a shaft code position
      if (code === 'L' && !results.some(r => r.code === 'XL' || r.code === 'XXL')) {
        results.push({ code, definition: MOTOR_CODES[code] });
      } else if (code !== 'L') {
        results.push({ code, definition: MOTOR_CODES[code] });
      }
    }
  });
  
  return results;
}

// Get recommended shaft length based on transom measurement
export function getRecommendedShaft(transomInches: number): typeof SHAFT_LENGTHS[0] | null {
  if (transomInches <= 16) return SHAFT_LENGTHS[0]; // Short
  if (transomInches <= 21) return SHAFT_LENGTHS[1]; // Long
  if (transomInches <= 26) return SHAFT_LENGTHS[2]; // XL
  if (transomInches <= 31) return SHAFT_LENGTHS[3]; // XXL
  return null; // Too tall
}
