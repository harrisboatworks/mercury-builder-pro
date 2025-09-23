import { useState, useEffect } from 'react';
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
        
        // Combine all image sources
        const combinedImages: (string | { url: string })[] = [];
        
        // Add motor media images
        combinedImages.push(...motorMediaImages);
        
        // Process motor.images (array of objects with url property)
        if (motor?.images && Array.isArray(motor.images)) {
          combinedImages.push(...motor.images);
        }
        
        // Add gallery URLs if provided
        if (gallery && gallery.length > 0) {
          combinedImages.push(...gallery);
        }
        
        // Add fallback image if no other images found
        if (combinedImages.length === 0 && img) {
          combinedImages.push(img);
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
      <div className="text-center text-slate-500 dark:text-slate-400 py-12">
        Loading images...
      </div>
    );
  }

  if (allImages.length > 0) {
    return (
      <MotorImageGallery 
        images={allImages}
        motorTitle={title}
      />
    );
  }

  return (
    <div className="text-center text-slate-500 dark:text-slate-400 py-12">
      No images available
    </div>
  );
}