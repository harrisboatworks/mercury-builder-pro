import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { MotorImageGallery } from './MotorImageGallery';
import { getMotorImageGallery } from '../../lib/motor-helpers';
import { enhanceImageUrls } from '@/lib/image-utils';

interface MotorDetailsImageSectionProps {
  motor: any;
  gallery: string[];
  img?: string | null;
  title: string;
}

export function MotorDetailsImageSection({ motor, gallery, img, title }: MotorDetailsImageSectionProps) {
  const [allImages, setAllImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Get images from motor_media table and motor object
        const motorMediaImages = await getMotorImageGallery(motor);
        
        // Combine all image sources with hero image prioritized first
        const combinedImages: (string | { url: string })[] = [];
        
        // PRIORITY 1: Add hero image first if provided
        if (img && img !== '/lovable-uploads/speedboat-transparent.png') {
          combinedImages.push(img);
        }
        
        // PRIORITY 2: Add motor media images (but avoid duplicating the hero image)
        const motorMediaUrls = motorMediaImages.filter((mediaImg: any) => {
          const mediaUrl = typeof mediaImg === 'string' ? mediaImg : mediaImg?.url;
          return mediaUrl && mediaUrl !== img;
        });
        combinedImages.push(...motorMediaUrls);
        
        // PRIORITY 3: Process motor.images (array of objects with url property)
        if (motor?.images && Array.isArray(motor.images)) {
          const motorImageUrls = motor.images.filter((motorImg: any) => {
            const motorUrl = typeof motorImg === 'string' ? motorImg : motorImg?.url;
            return motorUrl && motorUrl !== img && !combinedImages.some((existing: any) => {
              const existingUrl = typeof existing === 'string' ? existing : existing?.url;
              return existingUrl === motorUrl;
            });
          });
          combinedImages.push(...motorImageUrls);
        }
        
        // PRIORITY 4: Add gallery URLs if provided (avoid duplicates)
        if (gallery && gallery.length > 0) {
          const uniqueGalleryImages = gallery.filter((galleryImg: string) => 
            galleryImg !== img && !combinedImages.some((existing: any) => {
              const existingUrl = typeof existing === 'string' ? existing : existing?.url;
              return existingUrl === galleryImg;
            })
          );
          combinedImages.push(...uniqueGalleryImages);
        }
        
        // FALLBACK: Add default image if no images found
        if (combinedImages.length === 0) {
          combinedImages.push(img || '/lovable-uploads/speedboat-transparent.png');
        }
        
        // Enhance all image URLs to get full-size versions
        const enhancedImageUrls = enhanceImageUrls(combinedImages);
        
        // Use enhanced URLs if available, otherwise use original URLs
        const finalImages = enhancedImageUrls.length > 0 
          ? enhancedImageUrls 
          : combinedImages.map(img => typeof img === 'string' ? img : img?.url).filter(Boolean);
        
        setAllImages(finalImages);
      } catch (error) {
        console.warn('Failed to load motor images:', error);
        // Fallback to basic images on error
        const fallbackImages: string[] = [];
        if (motor?.images && Array.isArray(motor.images)) {
          fallbackImages.push(...motor.images.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean));
        }
        if (gallery && gallery.length > 0) {
          fallbackImages.push(...gallery);
        }
        if (fallbackImages.length === 0 && img) {
          fallbackImages.push(img);
        }
        setAllImages(fallbackImages);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [motor, gallery, img]);

  if (loading) {
    return (
      <div className="space-y-3">
        {/* Main image skeleton with shimmer */}
        <div className="relative h-96 w-full rounded-xl bg-white overflow-hidden border border-stone-100 shadow-sm">
          <div className="absolute inset-0 animate-shimmer" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  if (allImages.length > 0) {
    return (
      <MotorImageGallery 
        images={allImages}
        motorTitle={title}
        enhanced={true}
      />
    );
  }

  return (
    <div className="text-center text-slate-500 py-12">
      No images available
    </div>
  );
}