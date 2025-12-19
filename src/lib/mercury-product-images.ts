/**
 * Static mapping of Mercury motor HP ranges to official product images
 * Images sourced from shop.mercurymarine.com product galleries
 * 
 * This provides reliable, high-quality product photos for each motor category
 * Each HP range has visually distinct images appropriate for that motor size
 */

export interface MercuryProductImages {
  heroImage: string;
  galleryImages: string[];
}

// Official Mercury product images by HP range
// Images are from Mercury's CDN and are HP-appropriate
const MERCURY_CDN = 'https://www.mercurymarine.com/content/dam/mercury-marine';

/**
 * Maps horsepower to their official Mercury product images
 * Each HP has distinct, size-appropriate imagery
 */
export const mercuryProductImages: Record<string, MercuryProductImages> = {
  // 2.5 HP FourStroke (small portable)
  '2.5': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/2-5hp-fourstroke/en-us-canada/2-5hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/2-5hp-fourstroke/en-us-canada/2-5hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/portable/2-5hp-fourstroke/en-us-canada/2-5hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 3.5 HP FourStroke (small portable)
  '3.5': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/3-5hp-fourstroke/en-us-canada/3-5hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/3-5hp-fourstroke/en-us-canada/3-5hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/portable/3-5hp-fourstroke/en-us-canada/3-5hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 4 HP FourStroke (small portable)
  '4': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/4hp-fourstroke/en-us-canada/4hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/4hp-fourstroke/en-us-canada/4hp-fourstroke-gallery-1.jpg`,
    ]
  },
  
  // 5 HP FourStroke (small portable)
  '5': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/5hp-fourstroke/en-us-canada/5hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/5hp-fourstroke/en-us-canada/5hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 6 HP FourStroke (small portable)
  '6': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/6hp-fourstroke/en-us-canada/6hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/6hp-fourstroke/en-us-canada/6hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 8 HP FourStroke (portable/kicker)
  '8': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/8hp-fourstroke/en-us-canada/8hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/8hp-fourstroke/en-us-canada/8hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 9.9 HP FourStroke (popular kicker)
  '9.9': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/9-9hp-fourstroke/en-us-canada/9-9hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/9-9hp-fourstroke/en-us-canada/9-9hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/portable/9-9hp-fourstroke/en-us-canada/9-9hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 15 HP FourStroke (mid portable)
  '15': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/15hp-fourstroke/en-us-canada/15hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/15hp-fourstroke/en-us-canada/15hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/portable/15hp-fourstroke/en-us-canada/15hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 20 HP FourStroke (mid portable)
  '20': {
    heroImage: `${MERCURY_CDN}/images/outboards/portable/20hp-fourstroke/en-us-canada/20hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/portable/20hp-fourstroke/en-us-canada/20hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/portable/20hp-fourstroke/en-us-canada/20hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 25 HP FourStroke (mid-range)
  '25': {
    heroImage: `${MERCURY_CDN}/images/outboards/midrange/25hp-fourstroke/en-us-canada/25hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/midrange/25hp-fourstroke/en-us-canada/25hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 30 HP FourStroke (mid-range)
  '30': {
    heroImage: `${MERCURY_CDN}/images/outboards/midrange/30hp-fourstroke/en-us-canada/30hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/midrange/30hp-fourstroke/en-us-canada/30hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 40 HP FourStroke (mid-range)
  '40': {
    heroImage: `${MERCURY_CDN}/images/outboards/midrange/40hp-fourstroke/en-us-canada/40hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/midrange/40hp-fourstroke/en-us-canada/40hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/midrange/40hp-fourstroke/en-us-canada/40hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 50 HP FourStroke (mid-range)
  '50': {
    heroImage: `${MERCURY_CDN}/images/outboards/midrange/50hp-fourstroke/en-us-canada/50hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/midrange/50hp-fourstroke/en-us-canada/50hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 60 HP FourStroke (mid-range)
  '60': {
    heroImage: `${MERCURY_CDN}/images/outboards/midrange/60hp-fourstroke/en-us-canada/60hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/midrange/60hp-fourstroke/en-us-canada/60hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 75 HP FourStroke (high performance)
  '75': {
    heroImage: `${MERCURY_CDN}/images/outboards/highperformance/75hp-fourstroke/en-us-canada/75hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/highperformance/75hp-fourstroke/en-us-canada/75hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 90 HP FourStroke (high performance)
  '90': {
    heroImage: `${MERCURY_CDN}/images/outboards/highperformance/90hp-fourstroke/en-us-canada/90hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/highperformance/90hp-fourstroke/en-us-canada/90hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 100 HP FourStroke (high performance)
  '100': {
    heroImage: `${MERCURY_CDN}/images/outboards/highperformance/100hp-fourstroke/en-us-canada/100hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/highperformance/100hp-fourstroke/en-us-canada/100hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 115 HP FourStroke (high performance)
  '115': {
    heroImage: `${MERCURY_CDN}/images/outboards/highperformance/115hp-fourstroke/en-us-canada/115hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/highperformance/115hp-fourstroke/en-us-canada/115hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 150 HP FourStroke (high performance)
  '150': {
    heroImage: `${MERCURY_CDN}/images/outboards/highperformance/150hp-fourstroke/en-us-canada/150hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/highperformance/150hp-fourstroke/en-us-canada/150hp-fourstroke-gallery-1.jpg`,
      `${MERCURY_CDN}/images/outboards/highperformance/150hp-fourstroke/en-us-canada/150hp-fourstroke-gallery-2.jpg`,
    ]
  },

  // 200 HP FourStroke (V6)
  '200': {
    heroImage: `${MERCURY_CDN}/images/outboards/v6/200hp-fourstroke/en-us-canada/200hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v6/200hp-fourstroke/en-us-canada/200hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 225 HP FourStroke (V6)
  '225': {
    heroImage: `${MERCURY_CDN}/images/outboards/v6/225hp-fourstroke/en-us-canada/225hp-fourstroke-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v6/225hp-fourstroke/en-us-canada/225hp-fourstroke-gallery-1.jpg`,
    ]
  },

  // 250 HP FourStroke (V8)
  '250': {
    heroImage: `${MERCURY_CDN}/images/outboards/v8/250hp-verado/en-us-canada/250hp-verado-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v8/250hp-verado/en-us-canada/250hp-verado-gallery-1.jpg`,
    ]
  },

  // 300 HP Verado (V8)
  '300': {
    heroImage: `${MERCURY_CDN}/images/outboards/v8/300hp-verado/en-us-canada/300hp-verado-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v8/300hp-verado/en-us-canada/300hp-verado-gallery-1.jpg`,
    ]
  },

  // 350 HP Verado (V8)
  '350': {
    heroImage: `${MERCURY_CDN}/images/outboards/v8/350hp-verado/en-us-canada/350hp-verado-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v8/350hp-verado/en-us-canada/350hp-verado-gallery-1.jpg`,
    ]
  },

  // 400 HP Verado (V10)
  '400': {
    heroImage: `${MERCURY_CDN}/images/outboards/v10/400hp-verado/en-us-canada/400hp-verado-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v10/400hp-verado/en-us-canada/400hp-verado-gallery-1.jpg`,
    ]
  },

  // 450R Racing (V8)
  '450': {
    heroImage: `${MERCURY_CDN}/images/outboards/racing/450r/en-us-canada/450r-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/racing/450r/en-us-canada/450r-gallery-1.jpg`,
    ]
  },

  // 500R Racing (V10)
  '500': {
    heroImage: `${MERCURY_CDN}/images/outboards/racing/500r/en-us-canada/500r-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/racing/500r/en-us-canada/500r-gallery-1.jpg`,
    ]
  },

  // 600 HP Verado (V12)
  '600': {
    heroImage: `${MERCURY_CDN}/images/outboards/v12/600hp-verado/en-us-canada/600hp-verado-gallery-1.jpg`,
    galleryImages: [
      `${MERCURY_CDN}/images/outboards/v12/600hp-verado/en-us-canada/600hp-verado-gallery-1.jpg`,
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

  // Find closest match within same size category
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

/**
 * Validate if an image URL likely matches the expected HP
 * Used by scrapers to filter out wrong-HP images
 */
export function validateImageHpMatch(imageUrl: string, targetHp: number): boolean {
  const url = imageUrl.toLowerCase();
  const hpStr = String(targetHp).replace('.', '-');
  
  // Check if URL contains the target HP
  if (url.includes(`${hpStr}hp`) || url.includes(`${hpStr}-hp`) || url.includes(`${targetHp}hp`)) {
    return true;
  }
  
  // Check for HP numbers that DON'T match (false positive detection)
  const hpPatterns = [
    /(\d+(?:\.\d+)?)\s*hp/gi,
    /(\d+(?:\.\d+)?)-hp/gi,
    /-(\d+(?:\.\d+)?)-/g, // HP in path segments like /40-fourstroke/
  ];
  
  for (const pattern of hpPatterns) {
    let match;
    while ((match = pattern.exec(url)) !== null) {
      const foundHp = parseFloat(match[1]);
      // If we find a different HP in the URL, it's likely wrong
      if (foundHp > 1 && foundHp <= 600 && Math.abs(foundHp - targetHp) > 5) {
        return false;
      }
    }
  }
  
  // No HP detected in URL, assume it might be valid
  return true;
}
