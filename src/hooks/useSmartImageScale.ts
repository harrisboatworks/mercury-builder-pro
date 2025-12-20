import { useState, useCallback } from 'react';

interface UseSmartImageScaleOptions {
  minExpectedDimension?: number; // Images below this size get scaled up (default: 400)
  maxScale?: number; // Maximum scale factor (default: 1.4 = 40% max enlargement)
  defaultScale?: number; // Default scale before image loads (default: 1.0)
  targetHeight?: number; // Target visual height for balancing (default: 280)
}

export function useSmartImageScale(options: UseSmartImageScaleOptions = {}) {
  const {
    minExpectedDimension = 400,
    maxScale = 1.4,
    defaultScale = 1.0,
    targetHeight = 280
  } = options;
  
  const [scale, setScale] = useState(defaultScale);
  
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    
    if (naturalWidth === 0 || naturalHeight === 0) return;
    
    const aspectRatio = naturalWidth / naturalHeight;
    const area = naturalWidth * naturalHeight;
    const targetArea = targetHeight * targetHeight; // Target visual mass
    
    let calculatedScale = 1;
    
    if (aspectRatio > 1.5) {
      // Wide/landscape image - scale based on height to fill vertical space better
      calculatedScale = Math.min(maxScale, targetHeight / naturalHeight);
    } else if (aspectRatio < 0.7) {
      // Tall/portrait image - be conservative to prevent overflow
      calculatedScale = Math.min(maxScale * 0.8, (targetHeight * 0.9) / naturalHeight);
    } else {
      // Normal aspect ratio - use area-based scaling for visual balance
      const areaScale = Math.sqrt(targetArea / area);
      calculatedScale = Math.min(maxScale, areaScale);
    }
    
    // Never scale below 1 (don't shrink), always scale at least a little for small images
    const finalScale = Math.max(1, calculatedScale);
    
    // Only apply scale if image is smaller than expected
    if (Math.max(naturalWidth, naturalHeight) >= minExpectedDimension) {
      setScale(1); // Large enough, no scaling needed
    } else {
      setScale(finalScale);
    }
  }, [minExpectedDimension, maxScale, targetHeight]);
  
  return { scale, handleImageLoad };
}
