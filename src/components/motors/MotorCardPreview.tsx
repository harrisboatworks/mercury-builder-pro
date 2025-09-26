"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import MotorDetailsSheet from './MotorDetailsSheet';
import { Button } from '@/components/ui/button';
import type { Motor } from '../../lib/motor-helpers';
import { isTillerMotor, getMotorImageByPriority, getMotorImageGallery, decodeModelName, cleanMotorName } from '../../lib/motor-helpers';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatMotorDisplayName } from '@/lib/motor-display-formatter';
import mercuryLogo from '@/assets/mercury-logo.png';

export default function MotorCardPreview({ 
  img, 
  title, 
  hp, 
  msrp, 
  price, 
  promoText, 
  selected, 
  onSelect,
  shaft,
  weightLbs,
  altOutput,
  steering,
  features,
  description,
  specSheetUrl,
  motor,
  inStock,
  showSavingsLine = true,
  ctaTextVariant = "View Details"
}: {
  img?: string | null;
  title: string;
  hp?: number | string;
  msrp?: number | null;
  price?: number | null;
  promoText?: string | null;
  selected?: boolean;
  onSelect: () => void;
  shaft?: string;
  weightLbs?: number | string;
  altOutput?: string;
  steering?: string;
  features?: string[];
  description?: string | null;
  specSheetUrl?: string | null;
  motor?: Motor;
  inStock?: boolean | null;
  showSavingsLine?: boolean;
  ctaTextVariant?: "View Details" | "Build My Quote" | "View Details & Quote";
}) {
  const hpNum = typeof hp === "string" ? parseFloat(hp) : (typeof hp === "number" ? hp : undefined);
  const { promotions } = useActivePromotions();
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const isMobile = useIsMobile();
  
  // Get the best available image URL using priority logic
  const [imageInfo, setImageInfo] = useState<{ url: string }>({
    url: img || '/lovable-uploads/speedboat-transparent.png'
  });

  // Get photo count for image overlay
  const [photoCount, setPhotoCount] = useState<number>(0);

  useEffect(() => {
    const loadImageInfo = async () => {
      try {
        if (img && img !== '/lovable-uploads/speedboat-transparent.png') {
          setImageInfo({ url: img });
          
          // Get photo count if motor exists
          if (motor) {
            const images = await getMotorImageGallery(motor);
            setPhotoCount(images.length);
          }
          return;
        }

        const { url: primaryImageUrl } = await getMotorImageByPriority(motor);
        const finalUrl = primaryImageUrl !== '/lovable-uploads/speedboat-transparent.png' 
          ? primaryImageUrl 
          : (img || '/lovable-uploads/speedboat-transparent.png');
        
        setImageInfo({ url: finalUrl });
        
        // Get photo count
        if (motor) {
          const images = await getMotorImageGallery(motor);
          setPhotoCount(images.length);
        }
      } catch (error) {
        console.warn('Failed to load motor image info:', error);
      }
    };

    loadImageInfo();
  }, [motor, img]);
  
  const imageUrl = imageInfo.url;

  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScrollPosition(window.scrollY);
    setShowDetailsSheet(true);
  };

  const handleCloseModal = () => {
    setShowDetailsSheet(false);
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'instant'
      });
    }, 10);
  };

  // Get shaft length for display
  const getShaftLength = () => {
    if (motor?.shaft_inches) return `${motor.shaft_inches}"`;
    if (shaft) return shaft;
    return null;
  };

  // Get start type based on HP
  const getStartType = () => {
    if (hpNum && hpNum >= 40) return "Electric Start";
    return "Manual Start";
  };

  // Get control type using consistent model source
  const getControlType = () => {
    const modelForDecode = motor?.model_display || motor?.model || title;
    if (motor && isTillerMotor(modelForDecode)) return "Tiller Steering";
    return "Remote Control";
  };

  // Check for warranty promotion
  const hasWarrantyPromo = promotions.some(promo => 
    promo.warranty_extra_years && promo.warranty_extra_years > 0
  );

  const warrantyYears = promotions.find(promo => promo.warranty_extra_years)?.warranty_extra_years || 0;

  // Utility functions for display
  const formatTitle = (title: string) => {
    return formatMotorDisplayName(title);
  };

  const getAvailabilityText = () => {
    if (inStock) return "In Stock Today";
    return "Factory Order — 2–3 Week Lead Time";
  };

  const getAvailabilityDotColor = () => {
    return inStock ? "bg-green-500" : "bg-[hsl(var(--luxury-medium-gray))]";
  };

  // Build specs array showing all rigging code breakdown
  const getSpecsDisplay = () => {
    if (!motor?.model_display && !motor?.model && !title) return "";
    
    // Single source of truth for model decoding
    const modelForDecode = motor?.model_display || motor?.model || title;
    
    // 🔧 DEBUG: Log all input values including model_display priority
    console.log("🔧 MotorCardPreview getSpecsDisplay DEBUG:", {
      modelDisplay: motor?.model_display,
      motorModel: motor?.model,
      title: title,
      modelForDecode: modelForDecode,
      hp: hp,
      hpNum: hpNum,
      motorId: motor?.id
    });
    
    // Use decodeModelName to get accurate rigging code breakdown
    const decodedItems = decodeModelName(modelForDecode, hpNum);
    
    // 🔧 DEBUG: Log decoded results
    console.log("🔧 decodeModelName results:", {
      inputModel: motor?.model || title,
      inputHP: hpNum,
      decodedItems: decodedItems,
      decodedCount: decodedItems?.length || 0
    });
    
    if (decodedItems && decodedItems.length > 0) {
      // Sort decoded items for consistent display: Start Type → Control Type → Shaft → Engine Family
      const sortedItems = [...decodedItems].sort((a, b) => {
        const getOrder = (meaning: string) => {
          if (meaning.includes('Manual Start') || meaning.includes('Electric Start')) return 0;
          if (meaning.includes('Tiller') || meaning.includes('Remote Control')) return 1;
          if (meaning.includes('Shaft')) return 2;
          if (meaning.includes('Engine') || meaning.includes('4-Stroke')) return 3;
          return 4; // Other items last
        };
        return getOrder(a.meaning) - getOrder(b.meaning);
      });
      
      const allSpecs = sortedItems.map(item => item.meaning);
      
      // 🔧 DEBUG: Log final specs array
      console.log("🔧 Final specs display:", {
        allSpecs: allSpecs,
        joinedSpecs: allSpecs.join(" • ")
      });
      
      return allSpecs.join(" • ");
    }
    
    // Fallback to current logic if decoding fails
    const specs = [];
    
    const startType = getStartType();
    if (startType) specs.push(startType);
    
    const controlType = getControlType();
    if (controlType) specs.push(controlType);
    
    const shaftLength = getShaftLength();
    if (shaftLength) specs.push(`${shaftLength}" Shaft`);
    
    return specs.join(" • ");
  };

  // Calculate savings for display
  const calculateSavings = () => {
    if (msrp && price && msrp > price) {
      return msrp - price;
    }
    return 0;
  };

  // Format promo text elegantly
  const getPromoDisplay = () => {
    if (hasWarrantyPromo && warrantyYears > 0) {
      let promoText = `Mercury Promotion: ${warrantyYears} Years Extended Coverage Included`;
      
      // Add end date if available (example logic - would need actual promo data)
      const activePromo = promotions.find(promo => promo.warranty_extra_years);
      if (activePromo?.end_date) {
        const endDate = new Date(activePromo.end_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        promoText += ` • Available Until ${endDate}`;
      }
      
      return promoText;
    }
    return null;
  };

  return (
    <>
      <div className="bg-[hsl(var(--luxury-white))] rounded-none shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-0.5 group">
        <div className="relative">
          {/* Image Section */}
          {imageUrl && (
            <div className="relative bg-[hsl(var(--luxury-light-gray))] p-4 md:p-8">
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-32 md:h-48 w-full object-contain aspect-[4/3]" 
              />
              
              {/* HP Badge */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-[hsl(var(--luxury-black))] text-[hsl(var(--luxury-white))] px-3 py-1 text-xs font-light tracking-wider">
                  {hpNum} HP
                </div>
              )}
              
              {/* Photo Count Overlay */}
              {photoCount > 1 && (
                <div className="absolute bottom-4 left-4 bg-[hsl(var(--luxury-photo-overlay))/70%] text-white px-2 py-1.5 rounded-[10px] text-[10px] md:text-[12px] font-medium">
                  +{photoCount} photos
                </div>
              )}
              
              {/* Mercury Logo - 50% opacity */}
              <div className="absolute bottom-4 right-4 opacity-50">
                <img 
                  src={mercuryLogo}
                  alt="Mercury Marine"
                  className="h-6 w-auto"
                />
              </div>
            </div>
          )}
          
          {/* Content Section - Optimized Padding */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-5">
            {/* Model Information */}
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-light text-[hsl(var(--luxury-black))]">
                {formatTitle(title)}
              </h3>
              {motor?.model_number && (
                <p className="text-xs text-[hsl(var(--luxury-medium-gray))]">
                  Model: {motor.model_number}
                </p>
              )}
            </div>
            
            {/* Specifications - Single Line */}
            <div className="text-xs text-[hsl(var(--luxury-medium-gray))] pt-3 border-t border-[hsl(var(--luxury-light-gray))]">
              <span className="whitespace-normal md:whitespace-nowrap">{getSpecsDisplay()}</span>
            </div>
            
            {/* Availability Badge */}
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--luxury-light-gray))] px-3 py-2 rounded-full">
              <div className={`w-2 h-2 ${getAvailabilityDotColor()} rounded-full`}></div>
              <span className="text-xs text-[hsl(var(--luxury-medium-gray))]">{getAvailabilityText()}</span>
            </div>

            {/* Promo Line - Elegant Single Sentence */}
            {getPromoDisplay() && (
              <div className="text-xs md:text-sm text-[hsl(var(--luxury-promo-blue))] leading-relaxed">
                {getPromoDisplay()}
              </div>
            )}
            
            {/* Pricing Block - Premium but Unmistakable */}
            <div className="space-y-1 pt-4">
              {/* OUR PRICE Label */}
              {(price || msrp) && (
                <p className="text-xs text-[hsl(var(--luxury-our-price-label))] tracking-[0.02em] uppercase">
                  Our Price
                </p>
              )}
              
              {/* Main Price - Responsive Font Sizing */}
              {(price || msrp) && (
                <p className="text-lg md:text-2xl font-semibold text-[hsl(var(--luxury-deep-red))]">
                  ${(price || msrp)?.toLocaleString()}
                </p>
              )}
              
              {/* Savings Line */}
              {showSavingsLine && calculateSavings() > 0 && (
                <p className="text-xs text-[hsl(var(--pricing-savings))]">
                  You Save ${calculateSavings().toLocaleString()}
                </p>
              )}
              
              {!price && !msrp && (
                <p className="text-lg md:text-xl font-light text-[hsl(var(--luxury-dark-gray))]">
                  Call for Price
                </p>
              )}
            </div>
            
            {/* CTA Button - Modern Style */}
            <Button 
              variant="luxuryModern"
              className="w-full mt-6"
              onClick={handleMoreInfoClick}
            >
              {ctaTextVariant}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Details Sheet */}
      {showDetailsSheet && createPortal(
        <MotorDetailsSheet
          open={showDetailsSheet}
          onClose={handleCloseModal}
          onSelect={onSelect}
          title={title}
          subtitle={hpNum ? `${hpNum} HP Mercury Outboard` : undefined}
          img={imageUrl}
          msrp={msrp}
          price={price}
          promoText={promoText}
          description={description}
          hp={hpNum}
          shaft={shaft}
          weightLbs={weightLbs}
          altOutput={altOutput}
          steering={steering}
          features={features}
          specSheetUrl={specSheetUrl}
          motor={motor}
        />,
        document.body
      )}
    </>
  );
}