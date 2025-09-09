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

  const items: Item[] = [];
  const model = modelName.toUpperCase();
  const added = new Set<string>();
  
  const add = (code: string, meaning: string, benefit: string) => {
    if (!added.has(code)) {
      items.push({ code, meaning, benefit });
      added.add(code);
    }
  };

  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(model);
  
  // HP extraction
  const hpMatch = model.match(/(\d+(?:\.\d+)?)\s*HP/i);
  if (hpMatch) add(hpMatch[1] + 'HP', `${hpMatch[1]} Horsepower`, 'Engine power rating');
  
  // Starting system
  if (hasWord('M') && !hasWord('ELPT') && !hasWord('EL')) add('M', 'Manual Start', 'Pull cord start - no battery needed');
  if (hasWord('E') || hasWord('EL') || hasWord('EH') || model.includes('EFI')) add('E', 'Electric Start', 'Push-button start with battery');
  
  // Shaft lengths
  if (hasWord('S')) add('S', 'Short Shaft (15")', 'Standard transom height');
  if (hasWord('L') && !hasWord('XL')) add('L', 'Long Shaft (20")', 'Higher transom boats');
  if (hasWord('XL') && !hasWord('XXL')) add('XL', 'Extra Long (25")', 'Pontoon/high transom');
  if (hasWord('XXL')) add('XXL', 'Extra Extra Long (30")', 'Very high transoms');
  
  // Control types
  if (hasWord('H')) add('H', 'Tiller Handle', 'Steer directly from motor');
  if (hasWord('PT')) add('PT', 'Power Tilt', 'Electric trim and tilt');
  
  // Fuel system
  if (model.includes('EFI')) add('EFI', 'Electronic Fuel Injection', 'Better fuel economy and performance');
  
  // Special features
  if (model.includes('PRO')) add('PRO', 'Pro Series', 'Enhanced features for serious anglers');
  if (model.includes('COMMAND')) add('COMMAND', 'Command Thrust', '20% more thrust in reverse');
  
  return items;
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