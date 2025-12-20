import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enhanceImageUrl, isThumbnailUrl } from '@/lib/image-utils';
import { useContainerAwareScale } from '@/hooks/useContainerAwareScale';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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
  const [lastTapTime, setLastTapTime] = useState(0);
  const { triggerHaptic } = useHapticFeedback();
  
  // Container-aware adaptive scaling - scales images to fill container optimally
  const { scale: mainImageScale, containerRef, handleImageLoad: handleMainImageLoad } = useContainerAwareScale({
    targetFillPercent: enhanced ? 0.85 : 0.80,  // Fill 85% of modal, 80% of regular
    maxScale: 2.0,                               // Allow up to 2x for small images
    minScale: 1.0                                // Never shrink images
  });
  
  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  
  // Touch event handlers for pinch-to-zoom and double-tap to reset
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Double-tap to reset zoom (single finger)
    if (e.touches.length === 1) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTapTime < DOUBLE_TAP_DELAY && pinchScale > 1) {
        // Double-tap detected - reset zoom with smooth transition
        e.preventDefault();
        setPinchScale(1);
        setLastTapTime(0);
        triggerHaptic('light');
      } else {
        setLastTapTime(now);
      }
    }
    
    // Pinch-to-zoom (two fingers)
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
      setBasePinchScale(pinchScale);
    }
  }, [getTouchDistance, pinchScale, lastTapTime]);
  
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

  // Placeholder image for when no valid images exist - use a simple SVG data URI
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3QgZmlsbD0iI2YxZjVmOSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY0NzQ4YiIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNiI+Tm8gSW1hZ2U8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1OCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5NGE0YjgiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTIiPkF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
  
  // Fallback to placeholder if no gallery images
  const effectiveImages = (!images || images.length === 0) ? [PLACEHOLDER_IMAGE] : images;
  const isPlaceholder = effectiveImages[0] === PLACEHOLDER_IMAGE;

  // Filter out images that failed to load and ensure we have valid images
  const validImages = effectiveImages.filter((img, index) => img && typeof img === 'string' && !imageLoadErrors.has(index));
  
  // If all images failed, show placeholder
  const displayImages = validImages.length > 0 ? validImages : [PLACEHOLDER_IMAGE];

  const handleImageError = (index: number) => {
    console.warn(`Image failed to load at index ${index}:`, effectiveImages[index]);
    setImageLoadErrors(prev => new Set([...prev, index]));
    // If current selected image fails, move to next valid image
    if (index === selectedIndex) {
      const nextValidIndex = effectiveImages.findIndex((img, i) => 
        i !== index && img && typeof img === 'string' && !imageLoadErrors.has(i)
      );
      if (nextValidIndex >= 0) {
        setSelectedIndex(nextValidIndex);
      }
    }
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    // Don't open lightbox for placeholder
    if (displayImages[0] === PLACEHOLDER_IMAGE) return;
    
    setLightboxImageLoading(true);
    // Pre-enhance images for lightbox (get full-size versions)
    const enhanced = displayImages.map(url => enhanceImageUrl(url));
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

  // No early return - we always show placeholder as fallback

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
          ref={containerRef}
          className={`${enhanced ? 'h-96' : 'h-48'} w-full bg-white rounded-xl flex items-center justify-center overflow-hidden border border-stone-100 shadow-sm`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <img
            src={displayImages[selectedIndex]}
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
        
        {/* Click to expand hint - only show for non-placeholder */}
        {displayImages[0] !== PLACEHOLDER_IMAGE && (
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
        )}
        
        {/* Image quality indicator */}
        {isThumbnailUrl(displayImages[selectedIndex]) && (
          <div className="absolute top-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full">
            Thumbnail
          </div>
        )}
        
        {/* Navigation arrows for main image */}
        {displayImages.length > 1 && displayImages[0] !== PLACEHOLDER_IMAGE && (
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
        {displayImages.length > 1 && displayImages[0] !== PLACEHOLDER_IMAGE && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {displayImages.length}
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
              src={lightboxEnhancedUrls[selectedIndex] || displayImages[selectedIndex]}
              alt={`${motorTitle} - Full size`}
              className="max-w-[85vw] max-h-[75vh] md:max-w-[70vw] md:max-h-[70vh] object-contain"
              onError={() => handleImageError(selectedIndex)}
            />
            
            {/* Image counter in lightbox */}
            {displayImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {selectedIndex + 1} of {displayImages.length}
              </div>
            )}
            
            {displayImages.length > 1 && (
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