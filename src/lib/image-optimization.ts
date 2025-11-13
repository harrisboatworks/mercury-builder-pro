/**
 * Image Optimization Utilities
 * 
 * Provides helper functions for optimizing images across the application
 */

/**
 * Generate srcset for responsive images
 * Creates multiple image sizes for different screen densities (1x, 1.5x, 2x)
 */
export const generateSrcSet = (src: string, baseWidth: number): string | undefined => {
  if (!src || src.startsWith('data:') || !baseWidth) return undefined;

  const widths = [baseWidth, Math.round(baseWidth * 1.5), baseWidth * 2];

  // For Supabase Storage URLs, add width parameters
  if (src.includes('supabase.co/storage')) {
    return widths
      .map(w => `${src}?width=${w}&quality=80 ${w}w`)
      .join(', ');
  }

  // For other CDN URLs that support query parameters
  if (src.includes('?')) {
    return widths
      .map(w => `${src}&w=${w} ${w}w`)
      .join(', ');
  }

  return undefined;
};

/**
 * Get optimal sizes attribute for responsive images
 * Returns a sizes attribute string based on common breakpoints
 */
export const getImageSizes = (
  placement: 'full' | 'half' | 'third' | 'card' | 'thumbnail'
): string => {
  const sizesMap = {
    full: '100vw',
    half: '(min-width: 768px) 50vw, 100vw',
    third: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
    card: '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw',
    thumbnail: '(min-width: 768px) 200px, 150px'
  };

  return sizesMap[placement];
};

/**
 * Convert image URL to WebP format
 * For supported CDN/storage providers
 */
export const getWebPUrl = (src: string): string => {
  if (!src || src.startsWith('data:')) return src;

  // For Supabase Storage
  if (src.includes('supabase.co/storage')) {
    return `${src}?format=webp&quality=80`;
  }

  // For other URLs, return as-is (would need server-side conversion)
  return src;
};

/**
 * Preload critical images
 * Call this for above-the-fold images to improve LCP
 */
export const preloadImage = (src: string, priority: 'high' | 'low' = 'high') => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 * More control than native lazy loading
 */
export const createLazyLoader = (options: IntersectionObserverInit = {}) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px', // Start loading 50px before entering viewport
    threshold: 0.01,
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
      }
    });
  }, defaultOptions);
};
