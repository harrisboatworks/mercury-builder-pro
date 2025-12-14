import { useMemo } from 'react';
import type { Motor } from '@/components/QuoteBuilder';

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
      
      // Analyze features across all variants
      const hasElectricStart = variants.some(m => 
        modelUpper(m).includes('E') && !modelUpper(m).includes('SEA')
      );
      const hasManualStart = variants.some(m => 
        modelUpper(m).includes('M') && !modelUpper(m).includes('COMMAND')
      );
      const hasTiller = variants.some(m => 
        modelUpper(m).includes('H') || modelUpper(m).includes('TILLER')
      );
      const hasRemote = variants.some(m => 
        !modelUpper(m).includes('H') || modelUpper(m).includes('REMOTE')
      );
      const hasPowerTrim = variants.some(m => 
        modelUpper(m).includes('PT')
      );
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
      
      // Get hero image from first variant with an image
      const heroImage = variants.find(m => m.image)?.image || '/lovable-uploads/speedboat-transparent.png';
      
      result.push({
        hp,
        variants,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        features: {
          hasElectricStart,
          hasManualStart,
          hasTiller,
          hasRemote,
          hasPowerTrim,
          hasCommandThrust,
          shaftLengths: Array.from(shaftSet).sort((a, b) => parseInt(a) - parseInt(b))
        },
        families: Array.from(familySet),
        inStockCount,
        heroImage
      });
    });
    
    // Sort by HP
    result.sort((a, b) => a.hp - b.hp);
    
    return result;
  }, [motors]);
}
