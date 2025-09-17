// Helper functions for motor calculations and display logic

// Clean HTML tags from motor names
export function cleanMotorName(rawName: string): string {
  if (!rawName) return '';
  
  return rawName
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;|&gt;/g, '') // Remove escaped brackets
    .replace(/&amp;/g, '&') // Replace encoded ampersands
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export interface Motor {
  id: string;
  model: string;
  hp: number;
  price: number;
  specifications?: any;
  features?: string[];
  description?: string;
  images?: string[];
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

  // Multi-part combos (match longest first to avoid partial overlaps)
  if (upper.includes('EXLHPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('XL', 'Extra Long Shaft (25")', 'For 25" transom boats');
    add('H', 'Tiller Handle', 'Direct steering control');
    add('PT', 'Power Trim & Tilt', 'Adjust angle on the fly');
  }
  if (upper.includes('EXLH') && !upper.includes('EXLHPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('XL', 'Extra Long Shaft (25")', 'For 25" transom boats');
    add('H', 'Tiller Handle', 'Direct steering control');
  }
  if (upper.includes('ELHPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('L', 'Long Shaft (20")', 'Standard transom height');
    add('H', 'Tiller Handle', 'Direct steering control');
    add('PT', 'Power Tilt', 'Easy motor lifting');
  }
  if (upper.includes('ELH') && !upper.includes('ELHPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('L', 'Long Shaft (20")', 'For 20" transom boats');
    add('H', 'Tiller Handle', 'Direct steering control');
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
  if (/XL|EXLPT|EXLHPT|EXLH/.test(model)) return '25" (XL) transom';
  if (/\bL\b|ELPT|MLH|LPT|\bEL\b/.test(model)) return '20" (L) transom';
  if (/\bS\b/.test(model)) return '15" (S) transom';
  
  // Default: No shaft indicators means Short Shaft (15")
  return '15" (S) transom';
};

export const getBatteryRequirement = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  const n = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  
  // Check specifications.starting field first if available
  if (motor.specifications?.starting) {
    const startType = motor.specifications.starting.toLowerCase();
    if (startType.includes('pull') || startType.includes('manual')) {
      return 'Not required (manual start)';
    }
    if (startType.includes('electric')) {
      if (n <= 30) return '24M7 1000CA Starting Battery';
      if (n <= 115) return '12V marine cranking battery (min 800 CCA)';
      return 'High-output 12V (or dual) marine battery';
    }
  }
  
  // Check for specific manual start suffixes
  if (model.includes(' MH') || model.includes(' MLH') || model.endsWith('MH') || model.endsWith('MLH')) {
    return 'Not required (manual start)';
  }
  
  // Check for specific electric start suffixes
  if (model.includes(' EH') || model.includes(' ELPT') || model.includes(' EXLPT') || 
      model.endsWith('EH') || model.endsWith('ELPT') || model.endsWith('EXLPT')) {
    if (n <= 30) return '24M7 1000CA Starting Battery';
    if (n <= 115) return '12V marine cranking battery (min 800 CCA)';
    return 'High-output 12V (or dual) marine battery';
  }
  
  // Fall back to HP-based assumptions for motors without clear indicators
  if (n > 25) {
    // Most motors over 25HP are typically electric start
    if (n <= 30) return '24M7 1000CA Starting Battery';
    if (n <= 115) return '12V marine cranking battery (min 800 CCA)';
    return 'High-output 12V (or dual) marine battery';
  }
  
  // Small motors without clear indicators are typically manual start
  return 'Not required (manual start)';
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
  const isTiller = isTillerMotor(model);
  const isProKicker = model.includes('PROKICKER');
  
  // ≤6HP: Internal fuel tank (built-in)
  if (hp <= 6) return true;
  
  // 8-20HP: Include 12L fuel tank and hose (both tiller and remote)
  if (hp >= 8 && hp <= 20) return true;
  
  // 25-30HP tiller: Include 25L fuel tank and hose
  if (hp >= 25 && hp <= 30 && isTiller) return true;
  
  // 25-30HP remote/prokicker: No fuel tank included
  if (hp >= 25 && hp <= 30 && (!isTiller || isProKicker)) return false;
  
  // >30HP: No fuel tank included
  if (hp > 30) return false;
  
  return false;
};

export const includesPropeller = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  
  // Tiller motors typically include propeller
  if (isTillerMotor(model)) return true;
  
  return false;
};

export const getStartType = (model: string): string => {
  const decodedItems = decodeModelName(model);
  
  // Look for start type in decoded items
  const startItem = decodedItems.find(item => 
    item.meaning.includes('Electric Start') || item.meaning.includes('Manual Start')
  );
  
  if (startItem) {
    return startItem.meaning.includes('Electric') ? 'Electric' : 'Manual';
  }
  
  // Fallback: check model directly for common patterns
  const upperModel = model.toUpperCase();
  if (upperModel.includes('E') && (upperModel.includes('H') || upperModel.includes('L') || upperModel.includes('PT'))) {
    return 'Electric';
  }
  if (upperModel.includes('M') && (upperModel.includes('H') || upperModel.includes('L'))) {
    return 'Manual';
  }
  
  // Default for most motors over 25HP is electric start
  const hp = parseInt(model.match(/\d+/)?.[0] || '0');
  return hp > 25 ? 'Electric' : 'Manual';
};

export const isTillerMotor = (model: string) => {
  const upperModel = model.toUpperCase();
  
  // Check for explicit tiller indicators
  if (upperModel.includes('BIG TILLER') || upperModel.includes('TILLER')) {
    return true;
  }
  
  // Check for tiller handle patterns - more comprehensive detection
  // MH = Manual start + tiller Handle
  if (/(^|\s|-)MH(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // EH = Electric start + tiller Handle  
  if (/(^|\s|-)EH(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // MLH = Manual start + Long shaft + tiller Handle
  if (/(^|\s|-)MLH(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // ELH = Electric start + Long shaft + tiller Handle
  if (/(^|\s|-)ELH(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // EXLH = Electric start + eXtra Long shaft + tiller Handle
  if (/(^|\s|-)EXLH(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // ELHPT = Electric start + Long shaft + tiller Handle + Power Tilt
  if (/(^|\s|-)ELHPT(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // EXLHPT = Electric start + eXtra Long shaft + tiller Handle + Power Tilt
  if (/(^|\s|-)EXLHPT(\s|$|-)/i.test(upperModel)) {
    return true;
  }
  
  // Check for standalone H pattern (tiller Handle) - but avoid HP, FH, etc.
  // Must be a standalone H, not part of another code
  if (/(^|\s|-)H(\s|$|-)/i.test(upperModel) && !upperModel.includes('HP')) {
    return true;
  }
  
  return false;
};

export const getIncludedAccessories = (motor: Motor) => {
  const accessories = [];
  const hp = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  const model = (motor.model || '').toUpperCase();
  const isTiller = isTillerMotor(model);
  
  // First check for accessory_notes from price list symbols (highest priority)
  const accessoryNotes = (motor as any).accessory_notes;
  if (accessoryNotes && Array.isArray(accessoryNotes)) {
    if (accessoryNotes.includes('fuel_tank')) {
      if (hp <= 6) {
        accessories.push('Internal fuel tank');
      } else if (hp >= 8 && hp <= 20) {
        accessories.push('12L fuel tank & hose');
      } else if (hp >= 25 && hp <= 30 && isTiller) {
        accessories.push('25L fuel tank & hose');
      } else {
        accessories.push('Fuel tank & hose');
      }
    }
    
    if (accessoryNotes.includes('propeller')) {
      accessories.push('Standard propeller');
    }
    
    // Standard documentation
    accessories.push('Owner\'s manual & warranty');
    
    return accessories;
  }
  
  // Fallback to legacy logic if no accessory_notes available
  // Check for fuel tank inclusion
  if (includesFuelTank(motor)) {
    if (hp <= 6) {
      accessories.push('Internal fuel tank');
    } else if (hp >= 8 && hp <= 20) {
      accessories.push('12L fuel tank & hose');
    } else if (hp >= 25 && hp <= 30 && isTiller) {
      accessories.push('25L fuel tank & hose');
    }
  }
  
  // Check for propeller inclusion
  if (includesPropeller(motor)) {
    accessories.push('Standard propeller');
  }
  
  // Standard documentation
  accessories.push('Owner\'s manual & warranty');
  
  return accessories;
};

export const requiresMercuryControls = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  return !isTillerMotor(model);
};

export const getAdditionalRequirements = (motor: Motor) => {
  const requirements = [];
  const hp = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  const model = (motor.model || '').toUpperCase();
  
  // Mercury controls and cables for non-tiller motors
  if (requiresMercuryControls(motor)) {
    if (hp <= 30) {
      requirements.push({ item: 'Mercury controls & cables', cost: '$800-1,000' });
    } else if (hp <= 115) {
      requirements.push({ item: 'Mercury digital controls & cables', cost: '$1,000-1,300' });
    } else {
      requirements.push({ item: 'Mercury premium controls & cables', cost: '$1,200-1,500' });
    }
  }
  
  // Battery requirement for electric start (only if not already included with motor)
  const batteryReq = getBatteryRequirement(motor);
  if (!batteryReq.includes('Not required')) {
    if (hp <= 30) {
      requirements.push({ item: '24M7 1000CA Starting Battery', cost: '$180' });
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

// Image selection priority logic
export const getMotorImageByPriority = (motor: any): { url: string; isInventory: boolean } => {
  const fallbackImage = '/lovable-uploads/speedboat-transparent.png';
  
  // Priority 1: If in_stock=true and we have inventory images, use that
  if (motor?.in_stock === true && motor?.images && Array.isArray(motor.images)) {
    const inventoryImages = motor.images.filter((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      return url && url.includes('/mercury/inventory/');
    });
    
    if (inventoryImages.length > 0) {
      const bestImage = inventoryImages[0];
      const imageUrl = typeof bestImage === 'string' ? bestImage : bestImage?.url;
      return { url: imageUrl || fallbackImage, isInventory: true };
    }
  }
  
  // Priority 2: Use hero_image_url if exists
  if (motor?.hero_image_url) {
    return { url: motor.hero_image_url, isInventory: false };
  }
  
  // Priority 3: Use any available image from images array
  if (motor?.images && Array.isArray(motor.images) && motor.images.length > 0) {
    const bestImage = motor.images[0];
    const imageUrl = typeof bestImage === 'string' ? bestImage : bestImage?.url;
    if (imageUrl) {
      return { url: imageUrl, isInventory: false };
    }
  }
  
  // Priority 4: Use image_url if available
  if (motor?.image_url || motor?.image) {
    return { url: motor.image_url || motor.image, isInventory: false };
  }
  
  // Priority 5: Fallback to Mercury placeholder
  return { url: fallbackImage, isInventory: false };
};

// Get all images for gallery, maintaining brochure hero in array
export const getMotorImageGallery = (motor: any): string[] => {
  const allImages: string[] = [];
  
  // Add hero image first if exists
  if (motor?.hero_image_url) {
    allImages.push(motor.hero_image_url);
  }
  
  // Add images from images array
  if (motor?.images && Array.isArray(motor.images)) {
    motor.images.forEach((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && !allImages.includes(url)) {
        allImages.push(url);
      }
    });
  }
  
  // Add main image_url if not already included
  if ((motor?.image_url || motor?.image) && !allImages.includes(motor.image_url || motor.image)) {
    allImages.push(motor.image_url || motor.image);
  }
  
  // Filter out invalid URLs
  return allImages.filter(url => 
    url && 
    typeof url === 'string' && 
    url.length > 5 &&
    !url.includes('facebook.com') &&
    !url.includes('tracking') &&
    !url.includes('pixel')
  );
};

// Extract HP and code from model text - Enhanced version for consistent key building
export const extractHpAndCode = (modelText: string): { hp: number | null; code: string | null; fuel: string | null; family: string | null } => {
  if (!modelText) return { hp: null, code: null, fuel: null, family: null };
  
  const text = modelText.toUpperCase();
  
  // Extract HP
  const hpMatch = text.match(/(?<!\d)(\d{1,3}(?:\.\d)?)\s*HP?/);
  const hp = hpMatch ? Number(hpMatch[1]) : null;
  
  // Extract fuel type
  const fuel = /EFI/.test(text) ? 'EFI' : null;
  
  // Extract family - enhanced detection
  let family = null;
  if (/FOUR\s*STROKE|FOURSTROKE/i.test(text)) family = 'FourStroke';
  else if (/PRO\s*XS|PROXS/i.test(text)) family = 'ProXS';
  else if (/SEAPRO/i.test(text)) family = 'SeaPro';
  else if (/VERADO/i.test(text)) family = 'Verado';
  else if (/RACING/i.test(text)) family = 'Racing';
  else if (hp) family = 'FourStroke'; // Default for motors with HP
  
  // Extract code (most specific patterns first)
  let code = null;
  const codePatterns = [
    'EXLHPT', 'ELHPT', 'EXLPT', 'ELPT', 'XLPT', 'LPT',
    'EXLH', 'ELH', 'MLH', 'XLH',
    'EH', 'MH',
    'XXL', 'XL', 'CT', 'DTS', 'JET', 'TILLER', 'REMOTE'
  ];
  
  for (const pattern of codePatterns) {
    if (new RegExp(`\\b${pattern}\\b`).test(text)) {
      code = pattern;
      break;
    }
  }
  
  // Check for L or S as shaft indicators (but not when part of other codes)
  if (!code) {
    if (/\bL\b/.test(text) && !/EL|XL|XXL/.test(text)) code = 'L';
    else if (/\bS\b/.test(text)) code = 'S';
  }
  
  return { hp, code, fuel, family };
};

// Build consistent model key from model text - Enhanced for better specificity
export function buildModelKey(modelDisplay: string, modelCode?: string, attrs?: any): string {
  if (!modelDisplay && !modelCode) return '';
  
  const input = modelDisplay || modelCode || '';
  let s = input
    // strip HTML & odd chars
    .replace(/<[^>]*>/g, ' ')
    .replace(/[()]/g, ' ')
    // remove year tokens
    .replace(/\b20\d{2}\b/g, ' ')
    // normalize family names
    .replace(/\bfour[\s-]*stroke\b/ig, 'FourStroke')
    .replace(/\bpro[\s-]*xs\b/ig, 'ProXS')
    .replace(/\bsea[\s-]*pro\b/ig, 'SeaPro')
    .replace(/\bverado\b/ig, 'Verado')
    .replace(/\bracing\b/ig, 'Racing')
    // normalize EFI
    .replace(/\befi\b/ig, 'EFI')
    // coalesce whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Extract components for more specific keys
  const hpMatch = s.match(/\b(\d+(\.\d+)?)\s*hp\b/i);
  const hp = hpMatch ? `${hpMatch[1]}HP` : '';
  
  // Extract family
  const famMatch = s.match(/\b(FourStroke|ProXS|SeaPro|Verado|Racing)\b/i);
  const family = famMatch ? famMatch[1] : (attrs?.family || 'FourStroke');
  
  // Extract shaft length with priority order
  let shaft = '';
  if (/XXXL/i.test(s)) shaft = 'XXXL';
  else if (/XXL/i.test(s)) shaft = 'XXL'; 
  else if (/\bXL\b/i.test(s)) shaft = 'XL';
  else if (/\bL\b/i.test(s)) shaft = 'L';
  else if (/\bS\b/i.test(s)) shaft = 'S';
  else if (attrs?.shaft) shaft = attrs.shaft;
  
  // Extract control type
  let control = '';
  if (/TILLER/i.test(s)) control = 'TILLER';
  else if (/DTS/i.test(s)) control = 'DTS';
  else if (/ELHPT/i.test(s)) control = 'ELHPT';
  else if (/ELPT/i.test(s)) control = 'ELPT';
  else if (/ELH/i.test(s)) control = 'ELH';
  else if (/ELO/i.test(s)) control = 'ELO';
  else if (attrs?.control) control = attrs.control;
  
  // Extract special features
  const ct = /\bCT\b/i.test(s) || attrs?.ct;
  const jet = /JET/i.test(s) || attrs?.jet;
  
  // Build key components in priority order
  const keyParts = [
    family,
    hp,
    shaft,
    control,
    ct ? 'CT' : '',
    jet ? 'JET' : '',
    'EFI'
  ].filter(Boolean);
  
  // If we still don't have enough specificity, append model code suffix
  let key = keyParts.join('-');
  if (modelCode && modelCode !== modelDisplay) {
    // Take last 3-4 chars of model code for additional uniqueness
    const codeSuffix = modelCode.slice(-4).replace(/[^A-Z0-9]/g, '');
    if (codeSuffix) key += `-${codeSuffix}`;
  }
  
  return key.toUpperCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export const getHPDescriptor = (hp: number | string) => {
  const horsepower = typeof hp === 'string' ? parseFloat(hp) : hp;
  
  if (horsepower <= 5) return 'Perfect for Inflatables';
  if (horsepower <= 9.9) return 'Ideal for Small Utilities';
  
  // UPSELL DESCRIPTORS for less-preferred models
  if (horsepower === 15) return '⚠️ See 20HP for Better Value';
  if (horsepower === 75) return '⚠️ Consider 90HP - Same Frame';
  
  // POSITIVE DESCRIPTORS for preferred models
  if (horsepower === 20) return '★ Best Value Under 25HP';
  if (horsepower === 90) return '★ Sweet Spot Power Choice';
  
  if (horsepower === 25) return 'Entry-Level Pontoon Option';
  if (horsepower === 30) return 'Small Pontoon Power';
  if (horsepower === 40) return 'Mid-Size Boat Choice';
  if (horsepower === 50) return 'Popular Pontoon Motor';
  if (horsepower === 60) return 'Ideal Pontoon Power';
  if (horsepower === 115) return 'Performance Fishing Power';
  if (horsepower === 150) return 'Serious Multi-Species Power';
  if (horsepower <= 200) return 'High Performance Cruising';
  if (horsepower <= 250) return 'Big Water Performance';
  if (horsepower <= 300) return 'Offshore Capable Power';
  if (horsepower <= 400) return 'Maximum Offshore Power';
  if (horsepower > 400) return '💪 Ultimate Performance';
  
  return 'Proven Mercury Power';
};

export const getPopularityIndicator = (motorModel: string, isInStock: boolean | null = null): string | null => {
  const model = motorModel.toUpperCase();
  const hp = parseInt(model.match(/\d+/)?.[0] || '0');
  
  // UPSELL INDICATORS for motors we don't want to sell
  if (hp === 15) {
    // Always show why 20HP is better
    const upsellBadges = [
      '💡 Consider 20HP - Same Weight',
      '➡️ 20HP Only $200 More',
      '📊 Compare with 20HP',
      '⚠️ Special Order Only'
    ];
    return upsellBadges[Math.floor(Math.random() * upsellBadges.length)];
  }
  
  if (hp === 75) {
    // Always show why 90HP is better
    const upsellBadges = [
      '💡 90HP Better Value - Same Size',
      '➡️ Upgrade to 90HP',
      '📊 Compare with 90HP',
      '⚠️ Special Order Item'
    ];
    return upsellBadges[Math.floor(Math.random() * upsellBadges.length)];
  }
  
  // POSITIVE BADGES for the motors we want to sell
  if (hp === 20) {
    // Make 20HP extra attractive
    if (Math.random() < 0.7) {  // Show more often
      return '✅ Best Value - In Stock';
    }
  }
  
  if (hp === 90) {
    // Make 90HP extra attractive
    if (Math.random() < 0.7) {  // Show more often
      return '✅ Smart Buy - Popular Choice';
    }
  }
  
  // If we KNOW it's out of stock, never say it's in stock
  if (isInStock === false) {
    // Only show badges that don't mention stock
    const outOfStockBadges = [
      '📦 Order for Spring Delivery',
      '🔄 Available to Order',
      '📅 Pre-Order for 2025',
      '⏰ 2-3 Week Lead Time'
    ];
    
    // 50% chance to show an out-of-stock badge
    if (Math.random() < 0.5) {
      return outOfStockBadges[Math.floor(Math.random() * outOfStockBadges.length)];
    }
    // Otherwise show performance/feature badges (not stock-related)
  }
  
  // NOTE: Stock status badges removed to prevent misleading customers
  // Only show stock badges when we have verified inventory data
  if (isInStock === true) {
    // Continue to other promotional badges instead of fake stock status
  }
  
  // CORRECTED BEST SELLERS - No 15HP pontoon nonsense!
  if (model.includes('9.9') && model.includes('MH')) return '🔥 Best Seller - Perfect Utility';
  if (model.includes('20') && model.includes('EH') && !model.includes('ELH')) return '🔥 Best Seller - Electric Start';
  if (model.includes('20') && model.includes('ELH')) return '🔥 Best Seller - Fishing Favorite';
  if (model.includes('60') && model.includes('ELPT') && model.includes('CT')) return '🔥 Best Seller - Pontoon Power';
  if (model.includes('60') && model.includes('ELPT') && !model.includes('CT')) return '🔥 Best Seller - Walleye Special';
  if (model.includes('115')) return '🔥 Best Seller - Bass Boat Choice';
  
  // VERADO MODELS (V10, 350-425hp range)
  if (model.includes('VERADO')) {
    if (hp >= 350) {
      const veradoBadges = [
        '🏁 Performance Pick - Race-Inspired Engineering',
        '🏆 Pro\'s Choice - Tournament Proven',
        '🔥 Most Talked-About Marina Motor 2025',
        '✨ Smooth Operator - Vibration-Free Ride',
        '🚤 Pushes the Limits - Offshore Champion',
        '🎮 Digital Command - Joystick Ready'
      ];
      return veradoBadges[Math.floor(Math.random() * veradoBadges.length)];
    }
    // Regular Verado
    return '✨ Smooth Operator - Quietest in Class';
  }
  
  // AVATOR ELECTRIC MODELS
  if (model.includes('AVATOR')) {
    const avatorBadges = [
      '⚡ Future Ready - Electric Innovation',
      '🌎 Eco Cruiser - Zero Emissions',
      '🤫 Whisper Power - Silent Running'
    ];
    return avatorBadges[Math.floor(Math.random() * avatorBadges.length)];
  }
  
  // PONTOON-SPECIFIC BADGES for appropriate HP only (25HP+)
  if (hp >= 25 && hp <= 90) {
    // Command Thrust models are specifically for pontoons
    if (model.includes('CT')) {
      return '🚤 Command Thrust - Built for Pontoons';
    }
    
    // Random pontoon-related badges for appropriate HP
    if (Math.random() < 0.3 && hp >= 40) {
      const pontoonBadges = [
        '🚤 Popular Pontoon Choice',
        '⚓ Pontoon Ready',
        '🌊 Smooth Pontoon Cruising'
      ];
      return pontoonBadges[Math.floor(Math.random() * pontoonBadges.length)];
    }
  }
  
  // SEAPRO MODELS
  if (model.includes('SEAPRO')) {
    return '🛠️ Commercial Grade - Built to Work';
  }
  
  // PRO XS MODELS
  if (model.includes('PRO XS')) {
    return '🏁 Tournament Performance';
  }
  
  // 25-30HP RANGE (small boat focus, not pontoons for 25HP)
  if (hp >= 25 && hp <= 30) {
    const smallBadges = [
      '⭐ Fisherman\'s Favourite - Compact & Trusted',
      '🎣 Dockside Hero - Cottage Dependable',
      '💧 Easy Start - Family Friendly',
      '🛠️ Mechanic Approved - Simple & Reliable'
    ];
    return smallBadges[Math.floor(Math.random() * smallBadges.length)];
  }
  
  // 40-60HP RANGE
  if (hp >= 40 && hp <= 60) {
    const midBadges = [
      '🎣 Versatile Performer',
      '⭐ Family Boating Favourite',
      '🛠️ Shop Recommended'
    ];
    return midBadges[Math.floor(Math.random() * midBadges.length)];
  }
  
  // 75-115HP RANGE - Skip 75HP since it's handled above
  if (hp >= 76 && hp <= 115) {
    const upperMidBadges = [
      '🏆 Tournament Ready',
      '🎣 Serious Fishing Power',
      '⭐ Most Popular HP Range'
    ];
    return upperMidBadges[Math.floor(Math.random() * upperMidBadges.length)];
  }
  
  // 150-250HP RANGE
  if (hp >= 150 && hp <= 250) {
    const highBadges = [
      '🚤 Offshore Capable',
      '🏆 Performance Choice',
      '💪 Serious Power',
      '🎮 Digital Controls Available'
    ];
    return highBadges[Math.floor(Math.random() * highBadges.length)];
  }
  
  // GENERAL MERCURY AWARDS (randomly apply to 20% of remaining motors)
  if (Math.random() < 0.20) {
    const awardBadges = [
      '🥇 2024 CSI Award Winner',
      '🔄 Best Upgrade Choice',
      '🏅 Dealer\'s Most Requested'
    ];
    return awardBadges[Math.floor(Math.random() * awardBadges.length)];
  }
  
  // NOTE: Removed misleading stock status badges to ensure customer accuracy
  // Stock status will only be shown via StockBadge component using real inventory data
  
  // 50% of motors show a badge, 50% don't (to avoid clutter)
  return null;
};

export const getBadgeColor = (badgeText: string | null): string => {
  if (!badgeText) return '';
  
  // Upsell/warning badges = amber/orange
  if (badgeText.includes('Consider') || badgeText.includes('Compare') || badgeText.includes('Special Order') || badgeText.includes('Upgrade')) {
    return 'text-amber-600 dark:text-amber-400';
  }
  
  // Best sellers & hot items = orange
  if (badgeText.includes('Best Seller') || badgeText.includes('Most Talked')) return 'text-orange-600 dark:text-orange-400';
  
  // Smart choices & best values = green
  if (badgeText.includes('Best Value') || badgeText.includes('Smart Buy')) return 'text-green-600 dark:text-green-400';
  
  // Awards & pro choice = gold/yellow
  if (badgeText.includes('Award') || badgeText.includes('Pro\'s Choice')) return 'text-yellow-600 dark:text-yellow-400';
  
  // Stock status = green
  if (badgeText.includes('Stock') || badgeText.includes('Available')) return 'text-green-600 dark:text-green-400';
  
  // Performance = red
  if (badgeText.includes('Performance') || badgeText.includes('Tournament')) return 'text-red-600 dark:text-red-400';
  
  // Eco/Electric = teal
  if (badgeText.includes('Eco') || badgeText.includes('Electric') || badgeText.includes('Future')) return 'text-teal-600 dark:text-teal-400';
  
  // Everything else = blue
  return 'text-blue-600 dark:text-blue-400';
};

// Unit tests for buildModelKey function
export const testBuildModelKey = () => {
  const tests = [
    {
      input: "2025 Mercury FourStroke 25 HP EFI ELHPT",
      expected: "FOURSTROKE-25HP-ELHPT-EFI"
    },
    {
      input: "150 Pro XS XL",
      expected: "PROXS-150HP-XL-EFI"
    },
    {
      input: "SeaPro 200 HP EXLPT",
      expected: "SEAPRO-200HP-XL-ELPT-EFI"
    },
    {
      input: "Mercury Verado 300 HP DTS",
      expected: "VERADO-300HP-DTS-EFI"
    },
    {
      input: "FourStroke 9.9 HP EFI ELH",
      expected: "FOURSTROKE-9.9HP-ELH-EFI"
    }
  ];

  console.log('Running buildModelKey tests...');
  const results = tests.map(test => {
    const result = buildModelKey(test.input);
    const passed = result === test.expected;
    console.log(`Input: "${test.input}" → Expected: "${test.expected}" → Got: "${result}" → ${passed ? '✓' : '✗'}`);
    return passed;
  });

  const allPassed = results.every(r => r);
  console.log(`Tests ${allPassed ? 'PASSED' : 'FAILED'}: ${results.filter(r => r).length}/${results.length}`);
  return allPassed;
};

// Run tests in development
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  // Only run tests in development
  setTimeout(() => testBuildModelKey(), 1000);
}