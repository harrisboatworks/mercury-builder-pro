import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enhanceImageUrl, isThumbnailUrl } from '@/lib/image-utils';
import { useSmartImageScale } from '@/hooks/useSmartImageScale';

interface MotorImageGalleryProps {
  images: string[];
  motorTitle: string;
  enhanced?: boolean; // NEW: Enable larger gallery size for premium view
}

export function MotorImageGallery({ images, motorTitle, enhanced = false }: MotorImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [lightboxImageLoading, setLightboxImageLoading] = useState(false);
  const [lightboxEnhancedUrls, setLightboxEnhancedUrls] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Hover zoom state
  const [isHovered, setIsHovered] = useState(false);
  
  // Mobile pinch-to-zoom state
  const [pinchScale, setPinchScale] = useState(1);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [basePinchScale, setBasePinchScale] = useState(1);
  
  // Smart image scaling for gallery - aggressive scaling for small motor images
  const { scale: rawMainImageScale, handleImageLoad: handleMainImageLoad } = useSmartImageScale({
    minExpectedDimension: 600,
    maxScale: 2.5,
    defaultScale: 1.6
  });
  
  // Force minimum scale of 1.6x for enhanced gallery (motor details modal)
  const minScale = enhanced ? 1.6 : 1.0;
  const mainImageScale = Math.max(rawMainImageScale, minScale);
  
  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  // Touch event handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
      setBasePinchScale(pinchScale);
    }
  }, [getTouchDistance, pinchScale]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.min(3, Math.max(1, basePinchScale * scaleChange));
      setPinchScale(newScale);
    }
  }, [getTouchDistance, initialPinchDistance, basePinchScale]);
  
  const handleTouchEnd = useCallback(() => {
    setInitialPinchDistance(null);
    // Reset pinch scale after a delay if back to 1
    if (pinchScale <= 1.1) {
      setPinchScale(1);
    }
  }, [pinchScale]);
  
  // Calculate combined scale: base * hover * pinch
  const effectiveScale = isHovered ? mainImageScale * 1.1 : mainImageScale;
  const finalScale = effectiveScale * pinchScale;

  // Reset image loaded state when switching images
  useEffect(() => {
    setImageLoaded(false);
  }, [selectedIndex]);

  // Combined image load handler
  const onMainImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    handleMainImageLoad(e);
    setImageLoaded(true);
  };

  // Fallback to main image if no gallery images
  if (!images || images.length === 0) {
    return null;
  }

  // Filter out images that failed to load and ensure we have valid images
  const validImages = images.filter((img, index) => img && typeof img === 'string' && !imageLoadErrors.has(index));

  const handleImageError = (index: number) => {
    setImageLoadErrors(prev => new Set([...prev, index]));
    // If current selected image fails, move to next valid image
    if (index === selectedIndex) {
      const nextValidIndex = validImages.findIndex((_, i) => i > selectedIndex);
      setSelectedIndex(nextValidIndex >= 0 ? nextValidIndex : 0);
    }
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    setLightboxImageLoading(true);
    // Pre-enhance images for lightbox (get full-size versions)
    const enhanced = validImages.map(url => enhanceImageUrl(url));
    setLightboxEnhancedUrls(enhanced);
    setShowLightbox(true);
    setLightboxImageLoading(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          e.preventDefault();
          setShowLightbox(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  // Early return if no valid images
  if (validImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative group cursor-pointer overflow-hidden rounded-xl" onClick={handleMainImageClick}>
        {/* Shimmer overlay while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 rounded-xl bg-white overflow-hidden z-10">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        )}
        {/* Fixed-height container that centers the scaled image */}
        <div 
          className={`${enhanced ? 'h-96' : 'h-48'} w-full bg-white rounded-xl flex items-center justify-center overflow-hidden border border-stone-100 shadow-sm`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <img
            src={validImages[selectedIndex]}
            alt={`${motorTitle} - Image ${selectedIndex + 1}`}
            className={`max-h-full max-w-full object-contain transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={onMainImageLoad}
            onError={() => handleImageError(selectedIndex)}
            style={{ 
              transform: `scale(${finalScale})`,
              transformOrigin: 'center center'
            }}
          />
        </div>
        
        {/* Click to expand hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="bg-white/90 text-slate-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            {lightboxImageLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              'Click to expand'
            )}
          </div>
        </div>
        
        {/* Image quality indicator */}
        {isThumbnailUrl(validImages[selectedIndex]) && (
          <div className="absolute top-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full">
            Thumbnail
          </div>
        )}
        
        {/* Navigation arrows for main image */}
        {validImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image counter */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {validImages.length}
          </div>
        )}
      </div>


      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white z-10"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <img
              src={lightboxEnhancedUrls[selectedIndex] || validImages[selectedIndex]}
              alt={`${motorTitle} - Full size`}
              className="max-w-full max-h-full object-contain"
              onError={() => handleImageError(selectedIndex)}
            />
            
            {/* Image counter in lightbox */}
            {validImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {selectedIndex + 1} of {validImages.length}
              </div>
            )}
            
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}