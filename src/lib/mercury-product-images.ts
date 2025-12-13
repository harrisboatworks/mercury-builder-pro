/**
 * Static mapping of Mercury motor HP ranges to official product images
 * Images sourced from shop.mercurymarine.com product galleries
 * 
 * This provides reliable, high-quality product photos for each motor category
 */

export interface MercuryProductImages {
  heroImage: string;
  galleryImages: string[];
}

// Base URL for Mercury shop images
const SHOP_BASE = 'https://shop.mercurymarine.com/media/catalog/product';

/**
 * Maps horsepower ranges to their official Mercury product images
 * Keys are HP values (as strings for easy lookup)
 */
export const mercuryProductImages: Record<string, MercuryProductImages> = {
  // 2.5 HP FourStroke (portable)
  '2.5': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
      `${SHOP_BASE}/4/b/4b6544442bf9e0a71fdd194072f37d8ed9a49408507cfe14637e2b9fe3076149.jpeg`,
      `${SHOP_BASE}/f/e/fe3fa22123639af47634db0beeb91f9571959be7b718d9fec2006270c6348bc4.jpeg`,
    ]
  },

  // 3.5 HP FourStroke (portable) - shares images with 2.5-20hp range
  '3.5': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  // 4-6 HP FourStroke (portable)
  '4': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
    ]
  },
  
  '5': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
    ]
  },

  '6': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  // 8-9.9 HP FourStroke (portable/mid)
  '8': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
      `${SHOP_BASE}/4/b/4b6544442bf9e0a71fdd194072f37d8ed9a49408507cfe14637e2b9fe3076149.jpeg`,
    ]
  },

  '9.9': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
      `${SHOP_BASE}/4/b/4b6544442bf9e0a71fdd194072f37d8ed9a49408507cfe14637e2b9fe3076149.jpeg`,
      `${SHOP_BASE}/f/e/fe3fa22123639af47634db0beeb91f9571959be7b718d9fec2006270c6348bc4.jpeg`,
    ]
  },

  // 15-20 HP FourStroke
  '15': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  '20': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
      `${SHOP_BASE}/4/b/4b6544442bf9e0a71fdd194072f37d8ed9a49408507cfe14637e2b9fe3076149.jpeg`,
    ]
  },

  // 25-30 HP FourStroke
  '25': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  '30': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
    ]
  },

  // 40-60 HP FourStroke (mid-range)
  '40': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  '50': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
    ]
  },

  '60': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  // 75-115 HP FourStroke (high-performance)
  '75': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
    ]
  },

  '90': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  '100': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
    ]
  },

  '115': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
    ]
  },

  // 150 HP FourStroke (high-performance)
  '150': {
    heroImage: `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
    galleryImages: [
      `${SHOP_BASE}/3/c/3cd1aa544290e09e1487babd5b609e48ee9ca870e96f9bc4053ff04736c89ea8.jpeg`,
      `${SHOP_BASE}/2/c/2c0cd4ba62d56d35ef5cc038955a5ede3c2f9c56af977b4ebca0329a3f372452.jpeg`,
      `${SHOP_BASE}/3/2/32c140aaed8725c8bb5eec8c4b4bdd58041212d57323e0ce5dda06d6fac6d1ea.jpeg`,
      `${SHOP_BASE}/4/b/4b6544442bf9e0a71fdd194072f37d8ed9a49408507cfe14637e2b9fe3076149.jpeg`,
    ]
  },
};

/**
 * Get product images for a given horsepower
 * Falls back to closest available HP if exact match not found
 */
export function getMotorImages(hp: number): MercuryProductImages | null {
  // Try exact match first
  const hpKey = String(hp);
  if (mercuryProductImages[hpKey]) {
    return mercuryProductImages[hpKey];
  }

  // Try without decimal (e.g., 9.9 -> 9.9, but 10.0 -> 10)
  const cleanHpKey = hp % 1 === 0 ? String(Math.floor(hp)) : String(hp);
  if (mercuryProductImages[cleanHpKey]) {
    return mercuryProductImages[cleanHpKey];
  }

  // Find closest match
  const hpValues = Object.keys(mercuryProductImages).map(Number).sort((a, b) => a - b);
  let closest = hpValues[0];
  let minDiff = Math.abs(hp - closest);

  for (const val of hpValues) {
    const diff = Math.abs(hp - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }

  const closestKey = String(closest);
  return mercuryProductImages[closestKey] || null;
}

/**
 * Get hero image for a motor by HP
 */
export function getMotorHeroImage(hp: number): string | null {
  const images = getMotorImages(hp);
  return images?.heroImage || null;
}

/**
 * Get gallery images for a motor by HP
 */
export function getMotorGalleryImages(hp: number): string[] {
  const images = getMotorImages(hp);
  return images?.galleryImages || [];
}
