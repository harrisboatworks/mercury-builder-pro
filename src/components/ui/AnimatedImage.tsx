import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  /** Scale factor to apply (from useSmartImageScale) */
  scale?: number;
  /** Callback when image loads */
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Enable hover zoom effect */
  hoverZoom?: boolean;
  /** Duration of fade animation in seconds */
  fadeDuration?: number;
  /** Loading priority */
  loading?: 'lazy' | 'eager';
}

/**
 * Image component with premium fade-in and scale animations
 * Supports smart scaling and hover zoom effects
 */
export function AnimatedImage({
  src,
  alt,
  className,
  containerClassName,
  scale = 1,
  onImageLoad,
  hoverZoom = false,
  fadeDuration = 0.4,
  loading = 'lazy'
}: AnimatedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onImageLoad?.(e);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted/30 text-muted-foreground text-sm',
        containerClassName
      )}>
        Image unavailable
      </div>
    );
  }

  return (
    <motion.div
      className={cn('overflow-hidden', containerClassName)}
      initial={false}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(
          'w-full h-full object-contain',
          hoverZoom && 'transition-transform duration-300',
          className
        )}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
        initial={{ opacity: 0, scale: scale * 0.95 }}
        animate={{
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? scale : scale * 0.95
        }}
        transition={{
          opacity: { duration: fadeDuration, ease: 'easeOut' },
          scale: { duration: fadeDuration * 1.2, ease: [0.16, 1, 0.3, 1] }
        }}
        whileHover={hoverZoom ? { scale: scale * 1.05 } : undefined}
        onLoad={handleLoad}
        onError={handleError}
      />
    </motion.div>
  );
}

/**
 * Skeleton placeholder for loading images
 */
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        'bg-muted/30 rounded-lg',
        className
      )}
      animate={{
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
}
