import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enhanceImageUrl, isThumbnailUrl } from '@/lib/image-utils';

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
      <div className="relative group cursor-pointer" onClick={handleMainImageClick}>
        <img
          src={validImages[selectedIndex]}
          alt={`${motorTitle} - Image ${selectedIndex + 1}`}
          className={`${enhanced ? 'h-96' : 'h-48'} w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-800 transition-all duration-200 group-hover:scale-[1.02]`}
          onError={() => handleImageError(selectedIndex)}
        />
        
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