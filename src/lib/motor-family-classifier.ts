/**
 * Mercury Motor Family Classification
 * Determines motor family (Verado, Pro XS, FourStroke) based on HP, model codes, and features
 */

export type MotorFamily = 'Verado' | 'Pro XS' | 'FourStroke';

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
  
  // Verado Family: High-end V engines, typically 200HP+
  // Characteristics: V6/V8/V10 engines, supercharged, premium features
  if (horsepower >= 200 && (
    model.includes('VERADO') ||
    model.includes('V6') ||
    model.includes('V8') ||
    model.includes('V10') ||
    featureText.includes('SUPERCHARGED') ||
    featureText.includes('V6') ||
    featureText.includes('V8') ||
    featureText.includes('V10')
  )) {
    return 'Verado';
  }
  
  // Pro XS Family: Performance engines, 115-300HP
  // Characteristics: Racing/performance features, advanced tech, competition ready
  if (horsepower >= 115 && horsepower <= 300 && (
    model.includes('PRO XS') ||
    model.includes('PROXS') ||
    model.includes('RACING') ||
    model.includes('COMPETITION') ||
    model.includes('TORQUEMASTER') ||
    // High-performance indicators
    (horsepower >= 200 && (
      model.includes('DTS') && model.includes('CXL') // Counter-rotation with DTS
    )) ||
    // Pro XS specific features
    featureText.includes('PRO XS') ||
    featureText.includes('RACING') ||
    featureText.includes('TORQUEMASTER') ||
    featureText.includes('COMPETITION')
  )) {
    return 'Pro XS';
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
    default:
      return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
  }
}