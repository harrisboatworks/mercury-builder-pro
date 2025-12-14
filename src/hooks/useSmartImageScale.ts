import { useState, useCallback } from 'react';

interface UseSmartImageScaleOptions {
  minExpectedDimension?: number; // Images below this size get scaled up (default: 400)
  maxScale?: number; // Maximum scale factor (default: 1.4 = 40% max enlargement)
  defaultScale?: number; // Default scale before image loads (default: 1.0)
}

export function useSmartImageScale(options: UseSmartImageScaleOptions = {}) {
  const {
    minExpectedDimension = 400,
    maxScale = 1.4,
    defaultScale = 1.0  // Start at 100% - no scaling until we know image size
  } = options;
  
  const [scale, setScale] = useState(defaultScale);
  
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
    
    if (maxDim >= minExpectedDimension) {
      // Large image - keep at 1x (no scaling needed)
      setScale(1);
    } else if (maxDim > 0) {
      // Small image - scale up proportionally, capped at maxScale
      const calculatedScale = Math.min(maxScale, minExpectedDimension / maxDim);
      setScale(calculatedScale);
    }
  }, [minExpectedDimension, maxScale]);
  
  return { scale, handleImageLoad };
}
