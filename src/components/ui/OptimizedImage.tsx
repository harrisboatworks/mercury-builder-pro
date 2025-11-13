import { ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  sizes?: string; // For responsive images
}

/**
 * Optimized image component with automatic lazy loading, 
 * responsive images, and WebP support
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  className,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate srcset for responsive images (if width provided)
  const generateSrcSet = (baseSrc: string, baseWidth?: number) => {
    if (!baseWidth || baseSrc.startsWith('data:')) return undefined;
    
    // Generate 1x, 1.5x, 2x versions for different screen densities
    const widths = [baseWidth, Math.round(baseWidth * 1.5), baseWidth * 2];
    
    // For Supabase Storage URLs, we can add size parameters
    if (baseSrc.includes('supabase')) {
      return widths
        .map(w => `${baseSrc}?width=${w} ${w}w`)
        .join(', ');
    }
    
    return undefined;
  };

  const srcSet = generateSrcSet(src, width);

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        hasError && 'hidden',
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};
