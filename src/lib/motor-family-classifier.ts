/**
 * Mercury Motor Family Classification
 * Determines motor family (Verado, Pro XS, FourStroke, ProKicker, SeaPro) based on HP, model codes, and features
 */

export type MotorFamily = 'Verado' | 'Pro XS' | 'FourStroke' | 'ProKicker' | 'SeaPro';

/**
 * Classify motor into Mercury family based on specifications
 */
export function classifyMotorFamily(
  horsepower: number,
  modelDisplay: string,
  features?: string[]
): MotorFamily {
  const model = modelDisplay.toUpperCase();
  const featureText = (features || []).join(' ').toUpperCase();
  
  // ProKicker - dedicated trolling motors (check first, most specific)
  if (model.includes('PROKICKER') || 
      model.includes('PRO KICKER') ||
      model.includes('PRO-KICKER') ||
      featureText.includes('PROKICKER') ||
      featureText.includes('PRO KICKER')) {
    return 'ProKicker';
  }
  
  // Pro XS Family: Performance engines, 115-300HP
  // Check before FourStroke since Pro XS is more specific
  if (model.includes('PRO XS') ||
      model.includes('PROXS') ||
      model.includes('PRO-XS') ||
      featureText.includes('PRO XS') ||
      featureText.includes('PROXS')) {
    return 'Pro XS';
  }
  
  // SeaPro - commercial/workboat engines
  if (model.includes('SEAPRO') || 
      model.includes('SEA PRO') ||
      model.includes('SEA-PRO') ||
      featureText.includes('SEAPRO') ||
      featureText.includes('SEA PRO')) {
    return 'SeaPro';
  }
  
  // Verado Family: High-end V engines, typically 200HP+
  // Characteristics: V6/V8/V10 engines, supercharged, premium features
  if (model.includes('VERADO') ||
      featureText.includes('VERADO') ||
      (horsepower >= 200 && (
        model.includes('V6') ||
        model.includes('V8') ||
        model.includes('V10') ||
        featureText.includes('SUPERCHARGED') ||
        featureText.includes('V6') ||
        featureText.includes('V8') ||
        featureText.includes('V10')
      ))) {
    return 'Verado';
  }
  
  // FourStroke Family: Standard engines (all other cases)
  // This includes portable, mid-range, and standard high-horsepower engines
  return 'FourStroke';
}

/**
 * Get motor family display name with proper styling
 */
export function getMotorFamilyDisplay(family: MotorFamily): string {
  switch (family) {
    case 'Verado':
      return 'Verado';
    case 'Pro XS':
      return 'Pro XS';
    case 'FourStroke':
      return 'FourStroke';
    case 'ProKicker':
      return 'ProKicker';
    case 'SeaPro':
      return 'SeaPro';
    default:
      return 'FourStroke';
  }
}

/**
 * Get motor family description
 */
export function getMotorFamilyDescription(family: MotorFamily): string {
  switch (family) {
    case 'Verado':
      return 'Premium supercharged V engines for ultimate performance';
    case 'Pro XS':
      return 'High-performance engines built for speed and competition';
    case 'FourStroke':
      return 'Reliable, fuel-efficient engines for every application';
    case 'ProKicker':
      return 'Dedicated trolling motors for precision control';
    case 'SeaPro':
      return 'Commercial-grade engines built for demanding workboat applications';
    default:
      return 'Mercury Marine outboard engine';
  }
}

/**
 * Get motor family color theme
 */
export function getMotorFamilyColor(family: MotorFamily): string {
  switch (family) {
    case 'Verado':
      return 'bg-gradient-to-r from-red-600 to-red-700 text-white';
    case 'Pro XS':
      return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';  
    case 'FourStroke':
      return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white';
    case 'ProKicker':
      return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
    case 'SeaPro':
      return 'bg-gradient-to-r from-slate-600 to-slate-700 text-white';
    default:
      return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
  }
}

/**
 * Get the Mercury portal search key for a family
 */
export function getPortalSearchKey(family: MotorFamily): string {
  switch (family) {
    case 'Verado':
      return 'Verado';
    case 'Pro XS':
      return 'Pro XS';
    case 'FourStroke':
      return 'FourStroke';
    case 'ProKicker':
      return 'ProKicker';
    case 'SeaPro':
      return 'SeaPro';
    default:
      return 'FourStroke';
  }
}
