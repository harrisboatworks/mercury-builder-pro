import { useState, useCallback, useRef, useEffect } from 'react';

interface UseContainerAwareScaleOptions {
  targetFillPercent?: number;  // Target fill of container (0.85 = 85%)
  maxScale?: number;           // Maximum scale factor
  minScale?: number;           // Minimum scale factor
}

interface UseContainerAwareScaleReturn {
  scale: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function useContainerAwareScale(
  options: UseContainerAwareScaleOptions = {}
): UseContainerAwareScaleReturn {
  const {
    targetFillPercent = 0.85,
    maxScale = 2.0,
    minScale = 1.0
  } = options;

  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  const calculateOptimalScale = useCallback(() => {
    if (!containerRef.current || !imageDimensionsRef.current) return;

    const container = containerRef.current;
    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;
    
    if (containerHeight === 0 || containerWidth === 0) return;

    const { width: imgWidth, height: imgHeight } = imageDimensionsRef.current;

    // The <img> uses object-contain, so it's already rendered at the largest
    // size that fits within the container while preserving aspect ratio.
    // Compute that contained/displayed size first.
    const containedScale = Math.min(
      containerWidth / imgWidth,
      containerHeight / imgHeight
    );
    const displayedWidth = imgWidth * containedScale;
    const displayedHeight = imgHeight * containedScale;

    // How much room is left up to the target fill % of the container?
    const targetHeight = containerHeight * targetFillPercent;
    const targetWidth = containerWidth * targetFillPercent;
    const scaleForHeight = targetHeight / displayedHeight;
    const scaleForWidth = targetWidth / displayedWidth;
    const optimalScale = Math.min(scaleForHeight, scaleForWidth);

    // Quality-aware cap: don't upscale low-resolution images (pixelation).
    // Tiered cap based on the image's smaller natural dimension.
    const naturalMin = Math.min(imgWidth, imgHeight);
    let qualityMaxScale = maxScale;
    if (naturalMin < 250) qualityMaxScale = 1.0;
    else if (naturalMin < 450) qualityMaxScale = 1.1;
    else if (naturalMin < 700) qualityMaxScale = 1.25;

    // Clamp between min and quality-adjusted max. Never less than 1 (object-contain already fits).
    const clampedScale = Math.max(minScale, Math.min(qualityMaxScale, optimalScale));

    setScale(clampedScale);
  }, [targetFillPercent, maxScale, minScale]);


  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imageDimensionsRef.current = {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
    calculateOptimalScale();
  }, [calculateOptimalScale]);

  // Recalculate on container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateOptimalScale();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [calculateOptimalScale]);

  return { scale, containerRef, handleImageLoad };
}
