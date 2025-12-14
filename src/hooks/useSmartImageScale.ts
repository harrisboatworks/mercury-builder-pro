import { useState, useCallback } from 'react';

interface UseSmartImageScaleOptions {
  minExpectedDimension?: number; // Images below this size get scaled up
  maxScale?: number; // Maximum scale factor (e.g., 1.4)
  defaultScale?: number; // Default scale before image loads
}

export function useSmartImageScale(options: UseSmartImageScaleOptions = {}) {
  const {
    minExpectedDimension = 400,
    maxScale = 1.4,
    defaultScale = 1.15
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
