import React, { useState, useEffect } from 'react';
import { X, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const ExpandableImage: React.FC<ExpandableImageProps> = ({
  src,
  alt,
  className,
  containerClassName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
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
      <div className={cn("relative group cursor-pointer", containerClassName)}>
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-auto rounded-lg shadow-sm transition-all duration-200 group-hover:shadow-md", className)}
          loading="lazy"
          onClick={handleImageClick}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Expand Hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-lg">
          <div className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <Expand className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        
        {/* Mobile hint - always visible on small screens */}
        <div className="absolute top-2 right-2 md:hidden bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
          <Expand className="w-3 h-3 text-gray-600" />
        </div>
      </div>

      {/* Lightbox Modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          {/* Close Button */}
          <button
            onClick={handleCloseClick}
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            aria-label="Close expanded image"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Expanded Image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: '90vh', maxWidth: '90vw' }}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            Tap outside image or press ESC to close
          </div>
        </div>
      )}
    </>
  );
};