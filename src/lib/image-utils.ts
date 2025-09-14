/**
 * Utility functions for enhancing motor image URLs and extracting full-size images from thumbnails
 */

/**
 * Extract full-size image URL from ThumbGenerator URLs
 * @param url - Original image URL (may be a thumbnail)
 * @returns Enhanced URL for full-size image or original URL if no enhancement possible
 */
export function enhanceImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  try {
    // Check if this is a ThumbGenerator URL with embedded image URL
    if (url.includes('ThumbGenerator') || url.includes('img=')) {
      const imgMatch = url.match(/img=([^&]+)/);
      if (imgMatch) {
        let extractedUrl = decodeURIComponent(imgMatch[1]);
        
        // Add protocol if it's protocol-relative
        if (extractedUrl.startsWith('//')) {
          extractedUrl = `https:${extractedUrl}`;
        }
        
        // Remove any size constraints from the extracted URL
        extractedUrl = removeSizeConstraints(extractedUrl);
        
        return extractedUrl;
      }
    }

    // Remove size constraints from regular URLs
    return removeSizeConstraints(url);
  } catch (error) {
    console.warn('Failed to enhance image URL:', error);
    return url;
  }
}

/**
 * Remove size constraint parameters from image URLs
 * @param url - Image URL that may contain size parameters
 * @returns URL with size constraints removed
 */
function removeSizeConstraints(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    
    // Remove common image sizing parameters
    const sizeParams = ['mw', 'mh', 'w', 'h', 'width', 'height', 'resize', 'fit', 'crop'];
    sizeParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Convert /thumb/ paths to /detail/ for better quality
    let pathname = urlObj.pathname;
    if (pathname.includes('/thumb/')) {
      pathname = pathname.replace('/thumb/', '/detail/');
      urlObj.pathname = pathname;
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, try simple string replacements
    return url
      .replace('/thumb/', '/detail/')
      .replace(/[?&](mw|mh|w|h|width|height|resize|fit|crop)=[^&]*/g, '')
      .replace(/[?&]$/, ''); // Clean up trailing ? or &
  }
}

/**
 * Process an array of image URLs and enhance them for full-size display
 * @param images - Array of image URL strings or objects with url property
 * @returns Array of enhanced image URLs
 */
export function enhanceImageUrls(images: (string | { url: string })[]): string[] {
  if (!Array.isArray(images)) return [];
  
  const enhancedUrls: string[] = [];
  
  images.forEach((imageItem) => {
    let url: string;
    
    // Handle both string URLs and objects with url property
    if (typeof imageItem === 'string') {
      url = imageItem;
    } else if (imageItem?.url) {
      url = imageItem.url;
    } else {
      return; // Skip invalid items
    }
    
    // Skip obvious non-image URLs
    if (isInvalidImageUrl(url)) {
      return;
    }
    
    const enhancedUrl = enhanceImageUrl(url);
    if (enhancedUrl && !enhancedUrls.includes(enhancedUrl)) {
      enhancedUrls.push(enhancedUrl);
    }
  });
  
  return enhancedUrls;
}

/**
 * Check if a URL should be filtered out (tracking pixels, invalid images, etc.)
 * @param url - URL to validate
 * @returns true if the URL should be filtered out
 */
function isInvalidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  
  const lowerUrl = url.toLowerCase();
  
  // Filter out tracking pixels and non-image URLs
  const invalidPatterns = [
    'facebook.com/tr',
    'pixel',
    'tracking',
    'analytics',
    'googletagmanager',
    'gtm',
    'doubleclick',
    '.js',
    '.css',
    '.xml',
    'mailto:',
    'tel:',
    'javascript:',
    'data:text'
  ];
  
  return invalidPatterns.some(pattern => lowerUrl.includes(pattern));
}

/**
 * Determine if an image URL appears to be a thumbnail
 * @param url - Image URL to check
 * @returns true if the URL appears to be a thumbnail
 */
export function isThumbnailUrl(url: string): boolean {
  if (!url) return false;
  
  const lowerUrl = url.toLowerCase();
  
  return (
    lowerUrl.includes('thumb') ||
    lowerUrl.includes('thumbgenerator') ||
    lowerUrl.includes('mw=') ||
    lowerUrl.includes('mh=') ||
    lowerUrl.includes('resize=')
  );
}