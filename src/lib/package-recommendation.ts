/**
 * Smart package recommendation engine based on user's boat type, motor HP, and purchase path.
 */

export interface PackageRecommendation {
  packageId: 'good' | 'better' | 'best';
  reason: string;
  badge: string;
}

// Boat type to category mapping
const BOAT_CATEGORIES = {
  // Casual/Recreational - Essential is fine
  casual: ['ultralite', 'canoe', 'inflatable', 'kayak', 'dinghy'],
  // Light duty - Essential or Complete
  light: ['utility', 'jon-boat', 'tender'],
  // Family/Entertainment - Complete recommended
  family: ['pontoon', 'bowrider', 'deck-boat', 'tritoon'],
  // Serious fishing - Complete or Premium
  fishing: ['v-hull-fishing', 'aluminum-fishing', 'walleye'],
  // Performance/Offshore - Premium recommended
  performance: ['center-console', 'speed-boat', 'bass-boat', 'sport-boat', 'offshore', 'bay-boat']
};

function getBoatCategory(boatType: string | undefined): string | null {
  if (!boatType) return null;
  const normalizedType = boatType.toLowerCase().replace(/\s+/g, '-');
  
  for (const [category, types] of Object.entries(BOAT_CATEGORIES)) {
    if (types.some(t => normalizedType.includes(t))) {
      return category;
    }
  }
  return null;
}

export function getPackageRecommendation(
  boatType: string | undefined,
  motorHP: number,
  purchasePath: 'loose' | 'installed' | null = null
): PackageRecommendation {
  const category = getBoatCategory(boatType);
  const boatDisplayName = boatType?.replace(/-/g, ' ') || 'boat';
  
  // High HP motors (200+) → Premium for max protection of investment
  if (motorHP >= 200) {
    return {
      packageId: 'best',
      reason: `Maximum protection for your ${motorHP}HP investment`,
      badge: `Best for ${motorHP}HP motors`
    };
  }
  
  // High HP motors (150-199) → Premium recommended
  if (motorHP >= 150) {
    return {
      packageId: 'best',
      reason: `Extended coverage for high-performance motors`,
      badge: `Recommended for ${motorHP}HP`
    };
  }
  
  // Performance/offshore boats → Premium
  if (category === 'performance') {
    return {
      packageId: 'best',
      reason: `Max coverage for offshore & tournament use`,
      badge: `Best for ${boatDisplayName}s`
    };
  }
  
  // Serious fishing boats → Complete or Premium based on HP
  if (category === 'fishing') {
    if (motorHP >= 90) {
      return {
        packageId: 'best',
        reason: `Full protection for serious fishing trips`,
        badge: `Popular with anglers`
      };
    }
    return {
      packageId: 'better',
      reason: `Great coverage for fishing boats`,
      badge: `Best for fishing`
    };
  }
  
  // Family/entertainment boats → Complete (sweet spot)
  if (category === 'family') {
    return {
      packageId: 'better',
      reason: `Most popular with ${boatDisplayName} owners`,
      badge: `#1 for families`
    };
  }
  
  // Mid-range HP (40-149) → Complete
  if (motorHP >= 40) {
    return {
      packageId: 'better',
      reason: `Smart protection for mid-range motors`,
      badge: `Best value`
    };
  }
  
  // Light duty boats → Essential or Complete
  if (category === 'light') {
    return {
      packageId: 'good',
      reason: `Perfect for light-duty use`,
      badge: `Great for utility boats`
    };
  }
  
  // Casual boats with small motors → Essential
  if (category === 'casual' || motorHP < 25) {
    return {
      packageId: 'good',
      reason: `Ideal for casual boating`,
      badge: `Perfect fit`
    };
  }
  
  // Default: Complete is the safe middle ground
  return {
    packageId: 'better',
    reason: `Best balance of coverage and value`,
    badge: `Most popular choice`
  };
}
