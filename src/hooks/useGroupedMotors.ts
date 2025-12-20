import { useMemo } from 'react';
import type { Motor } from '@/components/QuoteBuilder';
import { hasElectricStart, hasManualStart, hasTillerControl, hasRemoteControl } from '@/lib/motor-config-utils';

export interface MotorGroup {
  hp: number;
  variants: Motor[];
  priceRange: { min: number; max: number };
  features: {
    hasElectricStart: boolean;
    hasManualStart: boolean;
    hasTiller: boolean;
    hasRemote: boolean;
    hasPowerTrim: boolean;
    hasCommandThrust: boolean;
    shaftLengths: string[];
  };
  families: string[];
  inStockCount: number;
  heroImage: string;
  isRepresentativeImage: boolean; // Flag when image is from sibling motor
}

/**
 * Check if a motor has its own scraped images (not fallback)
 */
function hasOwnImages(motor: Motor): boolean {
  // Has database images array with content
  if (motor.images && Array.isArray(motor.images) && motor.images.length > 0) {
    return true;
  }
  
  // Has hero_media_id (assigned media)
  if (motor.hero_media_id) {
    return true;
  }
  
  // Has image that's not from static fallback (mercurymarine.com CDN or supabase storage)
  if (motor.image && (
    motor.image.includes('supabase') || 
    motor.image.includes('harrisboatworks') ||
    motor.image.includes('albernipowermarine')
  )) {
    return true;
  }
  
  return false;
}

export function useGroupedMotors(motors: Motor[]): MotorGroup[] {
  return useMemo(() => {
    // Group by HP
    const groups = new Map<number, Motor[]>();
    
    motors.forEach(motor => {
      const hp = motor.hp;
      if (!groups.has(hp)) {
        groups.set(hp, []);
      }
      groups.get(hp)!.push(motor);
    });
    
    // Convert to MotorGroup array
    const result: MotorGroup[] = [];
    
    groups.forEach((variants, hp) => {
      const prices = variants.map(m => m.price).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const modelUpper = (m: Motor) => (m.model || '').toUpperCase();
      
      // Analyze features across all variants using accurate model code parsing
      const hasElectric = variants.some(m => hasElectricStart(m.model));
      const hasManual = variants.some(m => hasManualStart(m.model));
      const hasTiller = variants.some(m => hasTillerControl(m.model));
      const hasRemote = variants.some(m => hasRemoteControl(m.model));
      const hasPowerTrim = variants.some(m => modelUpper(m).includes('PT'));
      const hasCommandThrust = variants.some(m => 
        modelUpper(m).includes('CT') || modelUpper(m).includes('COMMAND THRUST')
      );
      
      // Extract shaft lengths
      const shaftSet = new Set<string>();
      variants.forEach(m => {
        const model = modelUpper(m);
        if (model.includes('XXL') || model.includes('30"')) shaftSet.add('30"');
        else if (model.includes('XL') || model.includes('25"')) shaftSet.add('25"');
        else if (model.includes('L') || model.includes('20"')) shaftSet.add('20"');
        if (model.includes('MH') || model.includes('15"') || (model.includes('S') && !model.includes('SEA'))) shaftSet.add('15"');
      });
      
      // Extract families
      const familySet = new Set<string>();
      variants.forEach(m => {
        const model = m.model.toLowerCase();
        if (model.includes('verado')) familySet.add('Verado');
        else if (model.includes('pro xs') || model.includes('proxs')) familySet.add('Pro XS');
        else if (model.includes('seapro') || model.includes('sea pro')) familySet.add('SeaPro');
        else if (model.includes('prokicker')) familySet.add('ProKicker');
        else familySet.add('FourStroke');
      });
      
      // Count in-stock variants
      const inStockCount = variants.filter(m => m.in_stock).length;
      
      // IMPROVED IMAGE SELECTION:
      // 1. First, find variants with their own images (scraped/uploaded)
      // 2. Prefer in-stock variants with images
      // 3. Fall back to any variant with images  
      // 4. Only use static fallback as last resort
      
      const variantsWithImages = variants.filter(m => hasOwnImages(m) && m.image);
      const inStockWithImages = variantsWithImages.filter(m => m.in_stock);
      
      let heroImage = '/lovable-uploads/speedboat-transparent.png';
      let isRepresentativeImage = false;
      
      if (inStockWithImages.length > 0) {
        // Best case: in-stock variant with its own image
        heroImage = inStockWithImages[0].image!;
        isRepresentativeImage = false;
      } else if (variantsWithImages.length > 0) {
        // Good case: any variant with its own image (same HP, different config)
        heroImage = variantsWithImages[0].image!;
        isRepresentativeImage = true; // It's from a sibling motor
      } else {
        // Try any variant that has a real image (not placeholder)
        const anyWithRealImage = variants.find(m => 
          m.image && 
          !m.image.includes('placeholder') && 
          !m.image.includes('speedboat-transparent')
        );
        if (anyWithRealImage?.image) {
          heroImage = anyWithRealImage.image;
          isRepresentativeImage = true;
        }
      }
      
      result.push({
        hp,
        variants,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        features: {
          hasElectricStart: hasElectric,
          hasManualStart: hasManual,
          hasTiller,
          hasRemote,
          hasPowerTrim,
          hasCommandThrust,
          shaftLengths: Array.from(shaftSet).sort((a, b) => parseInt(a) - parseInt(b))
        },
        families: Array.from(familySet),
        inStockCount,
        heroImage,
        isRepresentativeImage
      });
    });
    
    // Sort by HP
    result.sort((a, b) => a.hp - b.hp);
    
    return result;
  }, [motors]);
}
