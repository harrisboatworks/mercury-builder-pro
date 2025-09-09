// Helper functions for motor calculations and display logic

export interface Motor {
  id: string;
  model: string;
  hp: number;
  price: number;
  specifications?: any;
  features?: string[];
  description?: string;
  [key: string]: any;
}

export const decodeModelName = (modelName: string) => {
  type Item = {
    code: string;
    meaning: string;
    benefit: string;
  };
  const decoded: Item[] = [];
  const name = modelName || '';
  const upper = name.toUpperCase();
  const added = new Set<string>();
  const add = (code: string, meaning: string, benefit: string) => {
    if (!added.has(code)) {
      decoded.push({
        code,
        meaning,
        benefit
      });
      added.add(code);
    }
  };
  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(upper);
  const hpMatch = upper.match(/(\d+(?:\.\d+)?)HP/);
  const hp = hpMatch ? parseFloat(hpMatch[1]) : 0;

  // Engine family & special designations
  if (/FOUR\s*STROKE|FOURSTROKE/i.test(name)) add('FourStroke', '4-Stroke Engine', 'Quiet, fuel-efficient, no oil mixing');
  if (/SEAPRO/i.test(name)) add('SeaPro', 'Commercial Grade', 'Built for heavy use & durability');
  if (/PROKICKER/i.test(name)) add('ProKicker', 'Kicker Motor', 'Optimized for trolling & backup power');
  if (/JET\b/i.test(name)) add('Jet', 'Jet Drive', 'Great for shallow water operation');
  if (/BIGFOOT/i.test(name)) add('BigFoot', 'High Thrust', 'Ideal for pontoons & heavy boats');

  // Multi-part combos (match first to avoid partial overlaps)
  if (upper.includes('ELHPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('L', 'Long Shaft (20")', 'Standard transom height');
    add('H', 'Tiller Handle', 'Direct steering control');
    add('PT', 'Power Tilt', 'Easy motor lifting');
  }
  if (upper.includes('ELXPT') || upper.includes('EXLPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('XL', 'Extra Long Shaft (25")', 'For 25" transom boats');
    add('PT', 'Power Trim & Tilt', 'Adjust angle on the fly');
  }
  if (upper.includes('ELPT')) {
    add('E', 'Electric Start', 'Push-button convenience');
    add('L', 'Long Shaft (20")', 'For 20" transom boats');
    add('PT', 'Power Trim & Tilt', 'Adjust angle on the fly');
  }
  // Handle standalone EL (Electric start + Long shaft) - must check after longer combos
  if (upper.includes('EL') && !upper.includes('ELH') && !upper.includes('ELP') && !upper.includes('ELX')) {
    add('E', 'Electric Start', 'Push-button convenience');
    add('L', 'Long Shaft (20")', 'For 20" transom boats');
  }
  if (upper.includes('MLH')) {
    add('M', 'Manual Start', 'Pull cord — simple & reliable');
    add('L', 'Long Shaft (20")', 'For 20" transom boats');
    add('H', 'Tiller Handle', 'Steer directly from motor');
  }
  if (upper.includes('MH')) {
    add('M', 'Manual Start', 'Pull cord — simple & reliable');
    add('H', 'Tiller Handle', 'Steer directly from motor');
  }
  if (upper.includes('EH')) {
    add('E', 'Electric Start', 'Push-button convenience');
    add('H', 'Tiller Handle', 'Direct steering control');
  }

  // Steering and control
  if (hasWord('RC') || upper.includes('ERC')) add('RC', 'Remote Control', 'Steering wheel & console controls');
  if (hp >= 40 && !added.has('RC')) add('RC', 'Remote Control', 'Steering wheel & console controls');
  // Command Thrust
  if (hasWord('CT') || /COMMAND\s*THRUST/i.test(name)) add('CT', 'Command Thrust', 'Larger gearcase & prop for superior control');

  // Shaft length (check longer tokens first, skip if already handled in combos)
  if (!added.has('XX') && !added.has('XL') && !added.has('L') && !added.has('S')) {
    if (hasWord('XXL') || hasWord('XX')) {
      add('XX', 'Ultra Long Shaft (30")', 'For 30" transom boats');
    } else if (hasWord('XL') || (hasWord('X') && !hasWord('XX'))) {
      add('XL', 'Extra Long Shaft (25")', 'For 25" transom boats');
    } else if (hasWord('L')) {
      add('L', 'Long Shaft (20")', 'For 20" transom boats');
    } else if (hasWord('S')) {
      add('S', 'Short Shaft (15")', 'For 15" transom boats');
    } else {
      // Default: No shaft indicators means Short Shaft (15")
      add('S', 'Short Shaft (15")', 'For 15" transom boats');
    }
  }

  // Features / technology
  if (hasWord('PT')) add('PT', 'Power Trim & Tilt', 'Adjust motor angle on the fly');
  if (hasWord('T')) add('T', 'Power Tilt', 'Easy motor lifting');
  if (hasWord('GA')) add('GA', 'Gas Assist Tilt', 'Lighter effort when tilting');
  if (hasWord('EFI')) add('EFI', 'Electronic Fuel Injection', 'Reliable starting & efficiency');
  if (hasWord('DTS')) add('DTS', 'Digital Throttle & Shift', 'Smooth precise electronic controls');
  if (hasWord('PXS') || /PROXS/i.test(name)) add('PXS', 'ProXS (High Performance)', 'Sport-tuned for acceleration');

  // Single flags
  if (hasWord('E') && !added.has('E')) add('E', 'Electric Start', 'Push-button convenience');
  if (hasWord('M') && !added.has('M')) add('M', 'Manual Start', 'Pull cord — simple & reliable');
  if (hp <= 30 && hasWord('H') && !added.has('H')) add('H', 'Tiller Handle', 'Steer directly from motor');
  return decoded;
};

export const getRecommendedBoatSize = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return 'Up to 12ft';
  if (n <= 15) return '12-16ft';
  if (n <= 30) return '14-18ft';
  if (n <= 60) return '16-20ft';
  if (n <= 90) return '18-22ft';
  if (n <= 115) return '20-24ft';
  if (n <= 150) return '22-26ft';
  if (n <= 200) return '24-28ft';
  return '26ft+';
};

export const getEstimatedSpeed = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return '5-8 mph';
  if (n <= 15) return '15-20 mph';
  if (n <= 30) return '25-30 mph';
  if (n <= 60) return '35-40 mph';
  if (n <= 90) return '40-45 mph';
  if (n <= 115) return '45-50 mph';
  if (n <= 150) return '50-55 mph';
  return '55+ mph';
};

export const getFuelConsumption = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return '0.5-1 gph';
  if (n <= 15) return '1-2 gph';
  if (n <= 30) return '2-3 gph';
  if (n <= 60) return '4-6 gph';
  if (n <= 90) return '7-9 gph';
  if (n <= 115) return '9-11 gph';
  if (n <= 150) return '12-15 gph';
  return '15+ gph';
};

export const getRange = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return 'N/A (portable tank)';
  if (n <= 15) return '80-120 miles';
  if (n <= 30) return '70-110 miles';
  if (n <= 60) return '60-100 miles';
  if (n <= 90) return '55-90 miles';
  if (n <= 115) return '50-85 miles';
  if (n <= 150) return '45-80 miles';
  return '40-70 miles';
};

export const getTransomRequirement = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  const shaft = (motor as any).specifications?.shaft_length as string | undefined;
  
  // Check specifications first
  if (shaft?.includes('30')) return '30" (XXL) transom';
  if (shaft?.includes('25')) return '25" (XL) transom';
  if (shaft?.includes('20')) return '20" (L) transom';
  
  // Check model codes
  if (/\bXXL\b/.test(model)) return '30" (XXL) transom';
  if (/XL|EXLPT|EXLHPT/.test(model)) return '25" (XL) transom';
  if (/\bL\b|ELPT|MLH|LPT|\bEL\b/.test(model)) return '20" (L) transom';
  if (/\bS\b/.test(model)) return '15" (S) transom';
  
  // Default: No shaft indicators means Short Shaft (15")
  return '15" (S) transom';
};

export const getBatteryRequirement = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  if (/\bM\b/.test(model)) return 'Not required (manual start)';
  const n = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  if (n <= 30) return '12V marine battery';
  if (n <= 115) return '12V marine cranking battery (min 800 CCA)';
  return 'High-output 12V (or dual) marine battery';
};

export const getFuelRequirement = (_motor: Motor) => {
  return 'Unleaded 87 octane gasoline (E10 up to 10%)';
};

export const getOilRequirement = (_motor: Motor) => {
  return '4-stroke marine oil 10W-30 or 25W-40 (Mercury)';
};

export const includesFuelTank = (motor: Motor) => {
  const hp = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  const model = (motor.model || '').toUpperCase();
  
  // Tiller motors have internal fuel tanks
  if (isTillerMotor(model)) return true;
  
  // Small remote motors (9.9-20HP) typically include portable fuel tank
  if (hp >= 9.9 && hp <= 20 && !isTillerMotor(model)) return true;
  
  return false;
};

export const includesPropeller = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  
  // Tiller motors typically include propeller
  if (isTillerMotor(model)) return true;
  
  return false;
};

export const isTillerMotor = (model: string) => {
  const upperModel = model.toUpperCase();
  
  // Check for explicit tiller indicators
  if (upperModel.includes('BIG TILLER') || upperModel.includes('TILLER')) {
    return true;
  }
  
  // Check for MH pattern (Manual start, tiller Handle)
  const mhPattern = /(^|\s)MH(\s|$)/;
  if (mhPattern.test(upperModel)) {
    return true;
  }
  
  // Check for standalone H pattern (not part of HP, ELH, etc.)
  const standaloneHPattern = /\s H(\s|$)/;
  if (standaloneHPattern.test(upperModel)) {
    return true;
  }
  
  return false;
};

export const getIncludedAccessories = (motor: Motor) => {
  const accessories = [];
  
  // All motors include basic installation and testing
  accessories.push('Professional installation');
  accessories.push('Water testing & setup');
  accessories.push('Basic rigging');
  
  // Check for fuel tank inclusion
  if (includesFuelTank(motor)) {
    if (isTillerMotor(motor.model || '')) {
      accessories.push('Internal fuel tank');
    } else {
      accessories.push('12L portable fuel tank');
      accessories.push('Fuel line & primer bulb');
    }
  }
  
  // Check for propeller inclusion
  if (includesPropeller(motor)) {
    accessories.push('Standard propeller');
  }
  
  return accessories;
};

export const getAdditionalRequirements = (motor: Motor) => {
  const requirements = [];
  const hp = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  const model = (motor.model || '').toUpperCase();
  
  // Battery requirement for electric start
  if (!model.includes('M') || model.includes('E')) {
    if (hp <= 30) {
      requirements.push({ item: '12V marine battery', cost: '$150-250' });
    } else if (hp <= 115) {
      requirements.push({ item: 'High-output marine battery (800+ CCA)', cost: '$200-350' });
    } else {
      requirements.push({ item: 'High-performance marine battery', cost: '$300-500' });
    }
  }
  
  // Propeller for larger motors if not included
  if (!includesPropeller(motor) && hp >= 25) {
    requirements.push({ item: 'Performance propeller', cost: '$200-600' });
  }
  
  // Fuel tank for larger motors if not included
  if (!includesFuelTank(motor) && hp > 20) {
    requirements.push({ item: 'Fuel tank & lines', cost: '$150-400' });
  }
  
  return requirements;
};

export const cleanSpecSheetUrl = (url: string | undefined) => {
  if (!url) return null;
  
  // Remove duplicate domain portions
  const cleanedUrl = url.replace(/(https?:\/\/[^\/]+)(\/+)(https?:\/\/[^\/]+)/, '$1');
  
  // Basic URL validation
  try {
    new URL(cleanedUrl);
    return cleanedUrl;
  } catch {
    return null;
  }
};

export const getIdealUses = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  
  if (n <= 6) {
    return ['Dinghies & tenders', 'Canoes & kayaks', 'Emergency backup', 'Trolling'];
  }
  if (n <= 30) {
    return ['Aluminum fishing boats', 'Small pontoons', 'Day cruising', 'Lake fishing'];
  }
  if (n <= 90) {
    return ['Family pontoons', 'Bass boats', 'Runabouts', 'Water sports'];
  }
  if (n <= 150) {
    return ['Large pontoons', 'Offshore fishing', 'Performance boats', 'Tournament fishing'];
  }
  return ['High-performance boats', 'Commercial use', 'Offshore racing', 'Heavy loads'];
};