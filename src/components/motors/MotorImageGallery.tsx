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
  // Placeholder image for when no valid images exist - use a simple SVG data URI
  const PLACEHOLDER_IMAGE =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3QgZmlsbD0iI0Y1RjFFQSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzA1MEUxQyIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNiI+Tm8gSW1hZ2U8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1OCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwNTBFMUMiIG9wYWNpdHk9IjAuNiIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxMiI+QXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

  // Normalize incoming images and ensure we always have at least one entry
  const effectiveImages = (!images || images.length === 0) ? [PLACEHOLDER_IMAGE] : images;

  // Track load failures by URL (NOT by index) to avoid index mismatch after filtering
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  // Only show images that are not known-bad; if everything is bad, show placeholder
  const displayImages = (() => {
    const candidates = effectiveImages.filter((url) => {
      if (!url || typeof url !== 'string') return false;
      return !failedUrls.has(url);
    });
    return candidates.length > 0 ? candidates : [PLACEHOLDER_IMAGE];
  })();

  const [selectedUrl, setSelectedUrl] = useState<string>(displayImages[0]);
  const [showLightbox, setShowLightbox] = useState(false);
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
    targetFillPercent: enhanced ? 0.90 : 0.84,
    maxScale: 2.2, // Product cutouts vary widely; normalize small source images.
    minScale: 1.0, // Never shrink images
  });

  // Keep selectedUrl valid when displayImages changes (e.g. after an error)
  useEffect(() => {
    const nextSelected = displayImages.includes(selectedUrl) ? selectedUrl : displayImages[0];
    if (nextSelected !== selectedUrl) setSelectedUrl(nextSelected);
  }, [displayImages, selectedUrl]);

  const selectedIndex = Math.max(0, displayImages.indexOf(selectedUrl));

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Touch event handlers for pinch-to-zoom and double-tap to reset
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
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
    },
    [getTouchDistance, pinchScale, lastTapTime, triggerHaptic]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance !== null) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scaleChange = currentDistance / initialPinchDistance;
        const newScale = Math.min(3, Math.max(1, basePinchScale * scaleChange));
        setPinchScale(newScale);
      }
    },
    [getTouchDistance, initialPinchDistance, basePinchScale]
  );

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
  }, [selectedUrl]);

  // Combined image load handler
  const onMainImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    handleMainImageLoad(e);
    setImageLoaded(true);
  };

  const handleImageError = (failedUrl: string) => {
    console.warn('Image failed to load:', failedUrl);

    // Ensure we don't get stuck in a permanent "loading" (white) state
    setImageLoaded(true);

    setFailedUrls((prev) => new Set([...prev, failedUrl]));

    // If the currently-selected image failed, move to the next available image
    if (failedUrl === selectedUrl) {
      const next = displayImages.find((u) => u !== failedUrl) || PLACEHOLDER_IMAGE;
      setSelectedUrl(next);
    }
  };

  const handlePrevious = useCallback(() => {
    const prevIndex = selectedIndex === 0 ? displayImages.length - 1 : selectedIndex - 1;
    setSelectedUrl(displayImages[prevIndex]);
  }, [displayImages, selectedIndex]);

  const handleNext = useCallback(() => {
    const nextIndex = selectedIndex === displayImages.length - 1 ? 0 : selectedIndex + 1;
    setSelectedUrl(displayImages[nextIndex]);
  }, [displayImages, selectedIndex]);

  const handleThumbnailClick = (index: number) => {
    setSelectedUrl(displayImages[index]);
  };

  const handleMainImageClick = () => {
    // Don't open lightbox for placeholder
    if (displayImages[0] === PLACEHOLDER_IMAGE) return;

    setLightboxImageLoading(true);
    // Pre-enhance images for lightbox (get full-size versions)
    const enhanced = displayImages.map((url) => enhanceImageUrl(url));
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
  }, [handleNext, handlePrevious, showLightbox]);

  // No early return - we always show placeholder as fallback

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative group cursor-pointer overflow-hidden rounded-xl" onClick={handleMainImageClick}>
        {/* Shimmer overlay while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 rounded-xl overflow-hidden z-10" style={{ background: 'var(--gradient-image-bg)' }}>
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        )}
        {/* Fixed-height container that centers the scaled image */}
        <div
          ref={containerRef}
          className={`${enhanced ? 'h-[300px] sm:h-96' : 'h-48'} w-full rounded-xl flex items-center justify-center overflow-hidden bg-white`}
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={displayImages[selectedIndex]}
            alt={`${motorTitle} - Image ${selectedIndex + 1}`}
            className={`w-full h-full object-contain transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={onMainImageLoad}
            onError={() => handleImageError(displayImages[selectedIndex])}
            style={{
              transform: `scale(${finalScale})`,
              transformOrigin: 'center center'
            }}
          />
        </div>

        {/* Click to expand hint - only show for non-placeholder */}
        {displayImages[0] !== PLACEHOLDER_IMAGE && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 text-[#050E1C]" style={{ backgroundColor: 'rgba(245, 241, 234, 0.95)' }}>
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-repower-cream/85 hover:bg-repower-cream text-[#050E1C] opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-repower-cream/85 hover:bg-repower-cream text-[#050E1C] opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div
          className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button — high contrast, safe-area aware, generous tap target */}
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={(e) => {
              e.stopPropagation();
              setShowLightbox(false);
            }}
            className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg ring-2 ring-black/20 active:scale-95 transition"
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>

          {/* Image counter */}
          {displayImages.length > 1 && (
            <div
              className="absolute left-4 z-20 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white"
              style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            >
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}

          <div
            className="relative flex h-full w-full items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxEnhancedUrls[selectedIndex] || displayImages[selectedIndex]}
              alt={`${motorTitle} - Full size`}
              className="max-w-[92vw] max-h-[70vh] md:max-w-[70vw] md:max-h-[75vh] object-contain"
              onError={() => handleImageError(displayImages[selectedIndex])}
            />
          </div>

          {/* Nav arrows — bottom-positioned on mobile for thumb reach, solid bg */}
          {displayImages.length > 1 && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center justify-center gap-6 px-4 md:hidden"
              style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg ring-2 ring-black/20 active:scale-95 transition"
              >
                <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg ring-2 ring-black/20 active:scale-95 transition"
              >
                <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Desktop side arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg hover:bg-white md:flex"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg hover:bg-white md:flex"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
