import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResponsiveWebpSrcSet } from '@/lib/responsiveImageVariants';

interface ExpandableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  caption?: string;
}

export const ExpandableImage: React.FC<ExpandableImageProps> = ({
  src,
  alt,
  className,
  containerClassName,
  caption
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const instructionsId = useId();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      const previousOverflow = document.body.style.overflow;
      const trigger = triggerRef.current;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = previousOverflow;
        trigger?.focus();
      };
    }
  }, [isExpanded]);

  const handleImageClick = () => {
    setIsExpanded(true);
  };

  const handleCloseClick = () => {
    setIsExpanded(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Main Image */}
      <figure className={cn("relative", containerClassName)}>
        <button
          ref={triggerRef}
          type="button"
          className="relative group block w-full cursor-zoom-in rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Expand image: ${alt}`}
          aria-haspopup="dialog"
          aria-expanded={isExpanded}
          aria-controls={dialogId}
          onClick={handleImageClick}
        >
          {(() => {
            const srcSet = getResponsiveWebpSrcSet(src);
            const imgEl = (
              <img
                src={src}
                alt={alt}
                className={cn("w-full h-auto rounded-lg shadow-sm transition-all duration-200 group-hover:shadow-md", className)}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            );
            if (!srcSet) return imgEl;
            return (
              <picture>
                <source
                  srcSet={srcSet}
                  sizes="(min-width: 1024px) 800px, (min-width: 640px) 90vw, 100vw"
                  type="image/webp"
                />
                {imgEl}
              </picture>
            );
          })()}
          
          {/* Expand Hint */}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-lg" aria-hidden="true">
            <span className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <Expand className="w-4 h-4 text-gray-700" aria-hidden="true" />
            </span>
          </span>
          
          {/* Mobile hint - always visible on small screens */}
          <span className="absolute top-2 right-2 md:hidden bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm" aria-hidden="true">
            <Expand className="w-3 h-3 text-gray-600" aria-hidden="true" />
          </span>
        </button>
        
        {/* Caption */}
        {caption && (
          <figcaption className="text-sm text-muted-foreground text-center mt-2 italic">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {isExpanded && (
        <div 
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded image: ${alt}`}
          aria-describedby={instructionsId}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={handleOverlayClick}
        >
          {/* Close Button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleCloseClick}
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            aria-label="Close expanded image"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Expanded Image - with pinch-to-zoom support on mobile */}
          <div 
            className="relative w-full h-full overflow-auto flex items-center justify-center p-4"
            style={{ touchAction: 'pinch-zoom pan-x pan-y' }}
            onClick={handleOverlayClick}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-none object-contain select-none rounded-lg shadow-2xl"
              style={{ 
                minWidth: '100%',
                height: 'auto',
                maxHeight: '90vh',
                width: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Instructions - different for mobile vs desktop */}
          <div id={instructionsId} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="hidden md:inline">Click outside or press ESC to close</span>
            <span className="md:hidden">Pinch to zoom • Tap outside to close</span>
          </div>
        </div>
      )}
    </>
  );
};
