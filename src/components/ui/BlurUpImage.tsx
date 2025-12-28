import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BlurUpImageProps {
  src: string;
  placeholder?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * BlurUpImage - Premium LQIP (Low Quality Image Placeholder) component
 * Shows a blurred placeholder that transitions smoothly to the full-res image
 */
export function BlurUpImage({ 
  src, 
  placeholder, 
  alt, 
  className,
  containerClassName,
  onLoad,
  onError 
}: BlurUpImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  }, [onError]);

  // Use Mercury brand gradient as fallback placeholder
  const fallbackPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23f8fafc"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%23e2e8f0"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="400" height="300"/%3E%3C/svg%3E';

  const placeholderSrc = placeholder || fallbackPlaceholder;

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Blurred placeholder - visible until full image loads */}
      <img 
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute inset-0 w-full h-full object-contain",
          "blur-up-placeholder",
          "transition-opacity duration-500 ease-out",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      />
      
      {/* Full resolution image - fades in over blur */}
      <img 
        src={src}
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-500 ease-out",
          isLoaded && !hasError ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

export default BlurUpImage;
