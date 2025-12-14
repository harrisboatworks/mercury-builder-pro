import React, { useState } from 'react';
import { MotorGroup } from '@/hooks/useGroupedMotors';
import { StockBadge } from '@/components/inventory/StockBadge';
import mercuryLogo from '@/assets/mercury-logo.png';
import proXSLogo from '@/assets/pro-xs-logo.png';
import { useSmartImageScale } from '@/hooks/useSmartImageScale';

interface HPMotorCardProps {
  group: MotorGroup;
  onConfigure: (group: MotorGroup) => void;
}

export function HPMotorCard({ group, onConfigure }: HPMotorCardProps) {
  const { hp, variants, priceRange, features, families, inStockCount, heroImage } = group;
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Smart image scaling - aggressive scaling for small motor images
  const { scale: imageScale, handleImageLoad } = useSmartImageScale({
    minExpectedDimension: 380,
    maxScale: 2.0,
    defaultScale: 1.3
  });

  // Combined image load handler
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    handleImageLoad(e);
    setImageLoaded(true);
  };
  
  // Check if Pro XS variants are available
  const hasProXS = families.includes('Pro XS');
  
  // Get description based on HP
  const getHPDescription = (hp: number): string => {
    if (hp <= 6) return "Perfect for tenders & small inflatables";
    if (hp <= 15) return "Ideal for fishing boats & dinghies";
    if (hp <= 30) return "Great for pontoons & utility boats";
    if (hp <= 60) return "Versatile power for mid-size boats";
    if (hp <= 115) return "Strong performance for larger vessels";
    if (hp <= 200) return "High performance for serious boating";
    return "Maximum power for offshore adventures";
  };
  
  // Format feature pills
  const featurePills: string[] = [];
  // Only show start type for smaller motors where it's a differentiator
  if (hp < 40) {
    if (features.hasElectricStart && features.hasManualStart) {
      featurePills.push('Electric or Manual Start');
    } else if (features.hasElectricStart) {
      featurePills.push('Electric Start');
    } else if (features.hasManualStart) {
      featurePills.push('Manual Start');
    }
  }
  
  if (features.shaftLengths.length > 1) {
    featurePills.push(`${features.shaftLengths.join(', ')} Shaft Options`);
  } else if (features.shaftLengths.length === 1) {
    featurePills.push(`${features.shaftLengths[0]} Shaft`);
  }
  
  if (features.hasTiller && features.hasRemote) {
    featurePills.push('Tiller or Remote Control');
  } else if (features.hasTiller) {
    featurePills.push('Tiller Control');
  }
  
  if (features.hasCommandThrust) {
    featurePills.push('Command Thrust Available');
  }
  
  // Add Pro XS as first feature pill when available
  if (hasProXS) {
    featurePills.unshift('Pro XS Available');
  }
  
  return (
    <div 
      className="group bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden transition-all duration-200 ease-out hover:shadow-2xl hover:-translate-y-2 cursor-pointer active:scale-[0.98] active:opacity-95"
      onClick={() => onConfigure(group)}
    >
      {/* Image Section */}
      <div className="relative bg-white p-6 overflow-hidden">
        {/* Shimmer loading overlay */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white animate-shimmer z-10" />
        )}
        <img 
          src={heroImage} 
          alt={`${hp} HP Mercury Outboard`}
          className={`h-48 md:h-72 w-full object-contain transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={onImageLoad}
          style={{ transform: `scale(${imageScale})` }}
        />
        
        {/* Stock Badge */}
        {inStockCount > 0 && (
          <div className="absolute top-4 left-4">
            <StockBadge 
              motor={{ in_stock: true, stock_quantity: inStockCount }}
              variant="default"
            />
          </div>
        )}
        
        {/* Pro XS Badge */}
        {hasProXS && (
          <div className="absolute top-4 right-20">
            <img 
              src={proXSLogo} 
              alt="Pro XS Available" 
              className="h-8 w-auto drop-shadow-md"
            />
          </div>
        )}
        
        {/* HP Badge */}
        <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs tracking-widest font-medium uppercase">
          {hp} HP
        </div>
        
        {/* Variant Count */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700">
          {variants.length} Configuration{variants.length !== 1 ? 's' : ''}
        </div>
        
        {/* Mercury Logo */}
        <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-50 transition-opacity">
          <img src={mercuryLogo} alt="Mercury Marine" className="h-6 w-auto" />
        </div>
      </div>
      
      {/* Content */}
      <div className="border-t border-gray-200"></div>
      <div className="p-8 space-y-4">
        {/* Title */}
        <h3 className="text-xl font-semibold tracking-wide text-gray-900">
          {hp} HP {families.length === 1 ? families[0] : 'Mercury'}
        </h3>
        
        {/* Description */}
        <p className="text-sm font-normal text-gray-500">
          {getHPDescription(hp)}
        </p>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2 mt-4">
          {featurePills.slice(0, 3).map((pill, i) => (
            <span 
              key={i}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              {pill}
            </span>
          ))}
        </div>
        
        {/* Price Range */}
        <div className="mt-6">
          <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 font-medium">
            from
          </p>
          <p className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            ${priceRange.min.toLocaleString()}
            {priceRange.max > priceRange.min && (
              <span className="text-base font-normal text-gray-400">
                {' '}– ${priceRange.max.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        
        {/* Stock Status */}
        <p className="text-sm font-normal text-gray-600 mt-2">
          {inStockCount > 0 ? (
            <>🟢 {inStockCount} in stock today</>
          ) : (
            <>○ Available to order</>
          )}
        </p>
        
        {/* CTA Button */}
        <button 
          className="w-full border-2 border-black text-black py-4 text-xs tracking-widest uppercase font-medium rounded-sm hover:bg-black hover:text-white transition-all duration-500 ease-out mt-6"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(group);
          }}
        >
          Configure Your Motor
        </button>
      </div>
    </div>
  );
}
