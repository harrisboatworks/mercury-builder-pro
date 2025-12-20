/**
 * Image Validation Utility
 * Detects detail/close-up shots that shouldn't be used as hero images
 */

// Keywords that indicate a detail/close-up shot (NOT suitable for hero images)
const DETAIL_SHOT_KEYWORDS = [
  // Control components
  'tiller-handle', 'tiller_handle', 'tillerhandle',
  'handle-', '_handle_', '-handle',
  'throttle', 'shift-lever', 'shift_lever',
  'control-box', 'controlbox', 'control_box',
  'steering', 'helm',
  
  // Engine parts
  'propeller', 'prop-', '_prop_', '-prop-',
  'cowl-', '_cowl_', 'cowling',
  'trim-', '_trim_', 'tilt-',
  'clamp', 'mount-', '_mount_',
  
  // Electrical
  'gauge', 'gauges', 'speedometer', 'tachometer',
  'battery', 'wiring', 'cable-', '_cable_',
  
  // Other details
  'close-up', 'closeup', 'close_up', 'detail-',
  'accessory', 'accessories',
  'fuel-tank', 'fuel_tank', 'fueltank',
  'logo-', '_logo_', 'decal', 'badge',
  'exhaust', 'intake', 'filter'
];

// Patterns that suggest a FULL motor shot (GOOD for hero images)
const FULL_MOTOR_KEYWORDS = [
  // View angles
  'rear-port', 'rear_port', 'rearport',
  'rear-starboard', 'rear_starboard',
  'front-port', 'front_port',
  'front-starboard', 'front_starboard',
  '3-4', '3_4', 'three-quarter', 'threequarter',
  '34-view', '34view',
  'side-view', 'side_view', 'sideview',
  'profile', 'full-view', 'fullview',
  
  // Product indicators
  '-hp-', '_hp_',
  'outboard', 'motor-',
  'hero', 'main', 'primary',
  
  // Mercury-specific
  'verado', 'fourstroke', 'proxs', 'seapro'
];

// File extensions for images
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export interface ImageValidationResult {
  isDetailShot: boolean;
  isFullMotorShot: boolean;
  score: number; // 0-100, higher = better hero candidate
  reason?: string;
  keywords: string[];
}

/**
 * Check if a URL/filename indicates a detail shot
 */
export function isDetailShotByUrl(url: string): ImageValidationResult {
  const urlLower = url.toLowerCase();
  const matchedDetailKeywords: string[] = [];
  const matchedFullKeywords: string[] = [];
  
  // Check for detail shot keywords
  for (const keyword of DETAIL_SHOT_KEYWORDS) {
    if (urlLower.includes(keyword)) {
      matchedDetailKeywords.push(keyword);
    }
  }
  
  // Check for full motor shot keywords
  for (const keyword of FULL_MOTOR_KEYWORDS) {
    if (urlLower.includes(keyword)) {
      matchedFullKeywords.push(keyword);
    }
  }
  
  const isDetailShot = matchedDetailKeywords.length > 0;
  const isFullMotorShot = matchedFullKeywords.length > 0 && !isDetailShot;
  
  // Calculate hero image score (0-100)
  let score = 50; // Neutral starting point
  
  // Penalize for detail shot keywords (more keywords = lower score)
  score -= matchedDetailKeywords.length * 25;
  
  // Bonus for full motor shot keywords
  score += matchedFullKeywords.length * 15;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  // Determine reason
  let reason: string | undefined;
  if (isDetailShot) {
    reason = `Detail shot detected: ${matchedDetailKeywords.join(', ')}`;
  } else if (isFullMotorShot) {
    reason = `Full motor shot indicators: ${matchedFullKeywords.join(', ')}`;
  }
  
  return {
    isDetailShot,
    isFullMotorShot,
    score,
    reason,
    keywords: [...matchedDetailKeywords, ...matchedFullKeywords]
  };
}

/**
 * Score multiple images and return the best hero candidate
 */
export function selectBestHeroImage(imageUrls: string[]): {
  bestUrl: string | null;
  bestScore: number;
  results: Array<{ url: string; validation: ImageValidationResult }>;
} {
  if (!imageUrls || imageUrls.length === 0) {
    return { bestUrl: null, bestScore: 0, results: [] };
  }
  
  const results = imageUrls.map(url => ({
    url,
    validation: isDetailShotByUrl(url)
  }));
  
  // Sort by score descending
  results.sort((a, b) => b.validation.score - a.validation.score);
  
  // Select best non-detail shot
  const bestCandidate = results.find(r => !r.validation.isDetailShot);
  
  return {
    bestUrl: bestCandidate?.url || (results[0]?.validation.score >= 25 ? results[0].url : null),
    bestScore: bestCandidate?.validation.score || results[0]?.validation.score || 0,
    results
  };
}

/**
 * Check if a filename/path is an image file
 */
export function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Validate and filter a list of image URLs for hero image selection
 * Returns only URLs suitable for hero images (excludes detail shots)
 */
export function filterHeroCandidates(imageUrls: string[]): string[] {
  return imageUrls.filter(url => {
    const validation = isDetailShotByUrl(url);
    return !validation.isDetailShot && validation.score >= 40;
  });
}

/**
 * Log image validation for debugging
 */
export function logImageValidation(url: string, context: string = ''): void {
  const result = isDetailShotByUrl(url);
  const prefix = context ? `[${context}]` : '';
  
  if (result.isDetailShot) {
    console.log(`${prefix} ⚠️ Detail shot detected: ${url}`);
    console.log(`${prefix}   Reason: ${result.reason}`);
  } else if (result.isFullMotorShot) {
    console.log(`${prefix} ✓ Good hero candidate (score: ${result.score}): ${url}`);
  } else {
    console.log(`${prefix} ? Neutral image (score: ${result.score}): ${url}`);
  }
}
