import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MotorImageGalleryProps {
  images: string[];
  motorTitle: string;
}

export function MotorImageGallery({ images, motorTitle }: MotorImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Fallback to main image if no gallery images
  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    setShowLightbox(true);
  };

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative group cursor-pointer" onClick={handleMainImageClick}>
        <img
          src={images[selectedIndex]}
          alt={`${motorTitle} - Image ${selectedIndex + 1}`}
          className="h-48 w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-800 transition-all duration-200 group-hover:scale-[1.02]"
        />
        
        {/* Navigation arrows for main image */}
        {images.length > 1 && (
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
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-primary shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <img
                src={image}
                alt={`${motorTitle} thumbnail ${index + 1}`}
                className="w-full h-full object-contain bg-slate-50 dark:bg-slate-800"
              />
            </button>
          ))}
        </div>
      )}

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
              src={images[selectedIndex]}
              alt={`${motorTitle} - Full size`}
              className="max-w-full max-h-full object-contain"
            />
            
            {images.length > 1 && (
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