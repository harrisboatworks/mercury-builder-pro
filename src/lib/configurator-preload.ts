/**
 * Configurator Image Preloader
 * 
 * Preloads configurator images in the background when users are on the motor selection page.
 * Uses requestIdleCallback for non-blocking performance.
 */

// All configurator images used in MotorConfiguratorModal
export const CONFIGURATOR_IMAGE_URLS = [
  // Control step images
  'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/controls/tiller-handle.png',
  'https://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/motor-images/controls/remote-control.png',
  // Future: add start type and feature images when downloaded
];

let preloaded = false;

/**
 * Preload configurator images in the background
 * Uses low priority to avoid competing with motor card images
 */
export const preloadConfiguratorImages = (): void => {
  if (preloaded || typeof window === 'undefined') return;
  
  const preload = () => {
    CONFIGURATOR_IMAGE_URLS.forEach((src, index) => {
      // Stagger preloads to avoid network congestion
      setTimeout(() => {
        const img = new Image();
        img.src = src;
        // Use low priority - don't interfere with main content
        if ('fetchPriority' in img) {
          (img as any).fetchPriority = 'low';
        }
      }, index * 200); // 200ms between each
    });
    
    preloaded = true;
  };
  
  // Use requestIdleCallback if available (better for performance)
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preload, { timeout: 3000 });
  } else {
    // Fallback: wait 2 seconds after page load
    setTimeout(preload, 2000);
  }
};

/**
 * High-priority preload for when user hovers over a motor card
 * Called on mouseenter/touchstart to ensure instant modal display
 */
export const preloadConfiguratorImagesHighPriority = (): void => {
  if (typeof window === 'undefined') return;
  
  CONFIGURATOR_IMAGE_URLS.forEach((src) => {
    // Check if already in browser cache via link preload
    const existingLink = document.querySelector(`link[href="${src}"]`);
    if (existingLink) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if ('fetchPriority' in link) {
      (link as any).fetchPriority = 'high';
    }
    document.head.appendChild(link);
  });
};
