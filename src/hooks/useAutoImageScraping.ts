import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Motor {
  id: string;
  model: string;
  images?: any[] | null;
  image_url?: string | null;
  detail_url?: string | null;
}

export const useAutoImageScraping = (motors: Motor[]) => {
  const scrapeAttempts = useRef(new Set<string>());
  const scrapeQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  // Process scraping queue
  const processQueue = async () => {
    if (isProcessing.current || scrapeQueue.current.length === 0) return;
    
    isProcessing.current = true;
    
    try {
      const motorId = scrapeQueue.current.shift();
      if (!motorId) return;

      console.log(`Background scraping images for motor: ${motorId}`);
      
      // Use waitUntil pattern for background task
      const scrapePromise = supabase.functions.invoke('scrape-motor-details', {
        body: { 
          motor_id: motorId,
          background: true,
          priority: 'low'
        },
      });

      // Don't await - let it run in background
      scrapePromise.then((result) => {
        if (result.error) {
          console.log(`Background scraping failed for ${motorId}:`, result.error);
        } else {
          console.log(`Background scraping completed for ${motorId}`);
        }
      });

      // Process next item after small delay
      setTimeout(() => {
        isProcessing.current = false;
        processQueue();
      }, 2000);

    } catch (error) {
      console.log('Background scraping queue error:', error);
      isProcessing.current = false;
    }
  };

  // Check motors and queue ones needing images
  useEffect(() => {
    if (!motors.length) return;

    const motorsNeedingImages = motors.filter(motor => {
      // Skip if already attempted or no detail URL
      if (scrapeAttempts.current.has(motor.id) || !motor.detail_url) {
        return false;
      }

      // Check if motor needs images
      const hasMultipleImages = motor.images && Array.isArray(motor.images) && motor.images.length > 1;
      const hasDetailUrl = !!motor.detail_url;
      
      return hasDetailUrl && !hasMultipleImages;
    });

    // Add to queue and mark as attempted
    motorsNeedingImages.forEach(motor => {
      if (!scrapeQueue.current.includes(motor.id)) {
        scrapeQueue.current.push(motor.id);
        scrapeAttempts.current.add(motor.id);
      }
    });

    // Start processing if we have items
    if (scrapeQueue.current.length > 0) {
      processQueue();
    }

  }, [motors]);

  // Return status for debugging
  return {
    queueLength: scrapeQueue.current.length,
    attempted: scrapeAttempts.current.size,
    isProcessing: isProcessing.current
  };
};