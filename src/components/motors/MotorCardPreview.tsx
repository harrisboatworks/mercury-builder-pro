"use client";
import React, { useState, useEffect, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import MotorDetailsPremiumModal from './MotorDetailsPremiumModal';
import { Button } from '@/components/ui/button';
import { LuxuryPriceDisplay } from '@/components/pricing/LuxuryPriceDisplay';
import type { Motor } from '../../lib/motor-helpers';
import { isTillerMotor, getMotorImageByPriority, getMotorImageGallery, decodeModelName, cleanMotorName } from '../../lib/motor-helpers';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatMotorDisplayName } from '@/lib/motor-display-formatter';
import mercuryLogo from '@/assets/mercury-logo.png';

const MotorCardPreview = memo(function MotorCardPreview({
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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Get the best available image URL using priority logic
  const [imageInfo, setImageInfo] = useState<{ url: string }>({
    url: img || '/lovable-uploads/speedboat-transparent.png'
  });

  // Get photo count for image overlay
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Memoize motor ID to prevent unnecessary re-renders
  const motorId = useMemo(() => motor?.id, [motor?.id]);
  
  useEffect(() => {
    const loadImageInfo = async () => {
      try {
        if (img && img !== '/lovable-uploads/speedboat-transparent.png') {
          setImageInfo({ url: img });
          
          // Get photo count and gallery images if motor exists
          if (motor) {
            const images = await getMotorImageGallery(motor);
            setPhotoCount(images.length);
            setGalleryImages(images);
          }
          return;
        }

        const { url: primaryImageUrl } = await getMotorImageByPriority(motor);
        const finalUrl = primaryImageUrl !== '/lovable-uploads/speedboat-transparent.png' 
          ? primaryImageUrl 
          : (img || '/lovable-uploads/speedboat-transparent.png');
        
        setImageInfo({ url: finalUrl });
        
        // Get photo count and gallery images
        if (motor) {
          const images = await getMotorImageGallery(motor);
          setPhotoCount(images.length);
          setGalleryImages(images);
        }
      } catch (error) {
        console.warn('Failed to load motor image info:', error);
      }
    };

    loadImageInfo();
  }, [motorId, img]);
  
  const imageUrl = imageInfo.url;

  const handleCardClick = () => {
    setScrollPosition(window.scrollY);
    setShowDetailsSheet(true);
  };

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

  // Memoize warranty promotion calculations to prevent re-renders
  const hasWarrantyPromo = useMemo(() => 
    promotions.some(promo => 
      promo.warranty_extra_years && promo.warranty_extra_years > 0
    ),
    [promotions]
  );

  const warrantyYears = useMemo(() => 
    promotions.find(promo => promo.warranty_extra_years)?.warranty_extra_years || 0,
    [promotions]
  );

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

  // Simplified specs display - single clean line
  const getSimplifiedSpecs = () => {
    const specs = [];
    const modelName = title || motor?.model || '';
    const decodedFeatures = decodeModelName(modelName, hpNum);
    
    // 1. Start type (Manual Start / Electric Start)
    const startFeature = decodedFeatures.find(f => 
      f.meaning.includes('Manual Start') || f.meaning.includes('Electric Start')
    );
    if (startFeature) {
      specs.push(startFeature.meaning.includes('Electric') ? 'Electric Start' : 'Manual Start');
    }
    
    // 2. Engine type (4-Stroke)
    if (hpNum && hpNum >= 2.5) specs.push("4-Stroke");
    
    // 3. Tiller Handle (only show if present - most are remote control)
    const tillerFeature = decodedFeatures.find(f => f.meaning.includes('Tiller Handle'));
    if (tillerFeature) specs.push("Tiller Handle");
    
    // 4. Power Trim (important feature to highlight)
    const ptFeature = decodedFeatures.find(f => 
      f.meaning.includes('Power Trim') || f.meaning.includes('Power Tilt')
    );
    if (ptFeature) specs.push("Power Trim");
    
    // 5. Shaft designation with enhanced formatting
    const shaftFeature = decodedFeatures.find(f => 
      f.meaning.includes('Shaft') && f.meaning.includes('"')
    );
    if (shaftFeature) {
      if (shaftFeature.meaning.includes('15"')) specs.push("Short Shaft - 15\"");
      else if (shaftFeature.meaning.includes('20"')) specs.push("Long Shaft - 20\"");
      else if (shaftFeature.meaning.includes('25"')) specs.push("Extra Long Shaft - 25\"");
      else if (shaftFeature.meaning.includes('30"')) specs.push("Ultra Long Shaft - 30\"");
    }
    
    return specs.join(" • ");
  };

  // Get delivery status with clean indicator
  const getDeliveryStatus = () => {
    if (inStock) {
      return {
        text: "In Stock Today",
        dotColor: "bg-green-500"
      };
    }
    return {
      text: "Quick availability",
      dotColor: "bg-gray-400"
    };
  };

  // Memoize warranty text to prevent re-renders
  const warrantyText = useMemo(() => {
    if (hasWarrantyPromo && warrantyYears > 0) {
      return `✓ ${warrantyYears} Year Extended Coverage`;
    }
    return null;
  }, [hasWarrantyPromo, warrantyYears]);

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

  const deliveryStatus = getDeliveryStatus();

  return (
    <>
      <div 
        className="group bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden transition-all duration-700 ease-out hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative">
          {/* Image Section */}
          {imageUrl && (
            <div className="relative bg-gradient-to-b from-stone-50 to-white p-12">
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-48 md:h-72 w-full object-contain"
              />
              
              {/* HP Badge */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs tracking-widest font-light uppercase">
                  {hpNum} HP
                </div>
              )}
              
              
              {/* Mercury Logo - Enhanced interaction */}
              <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                <img 
                  src={mercuryLogo}
                  alt="Mercury Marine"
                  className="h-6 w-auto"
                />
              </div>
            </div>
          )}
          
          {/* Subtle Top Border */}
          <div className="border-t border-gray-200"></div>
          
          {/* Content Section - Premium Mobile Layout */}
          <div className="p-8 space-y-6">
            {/* Model Name - Prominent */}
            <h3 className="text-2xl font-light tracking-wide text-gray-900">
              {formatTitle(title)}
            </h3>
            
            {/* Model Number - Subtle */}
            {motor?.model_number && (
              <p className="text-sm font-light text-gray-400 mt-1">
                Model: {motor.model_number}
              </p>
            )}
            
            {/* Simplified Specs - Single Line */}
            <p className="text-base font-light text-gray-500 leading-relaxed mt-6">
              {getSimplifiedSpecs()}
            </p>
            
            {/* Pricing - Luxury minimal */}
            <div className="my-8">
              <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 font-light">
                from
              </p>
              {msrp && price && msrp > price && (
                <p className="text-base text-gray-400 font-light line-through mt-2">${msrp.toLocaleString()}</p>
              )}
              <p className="text-4xl font-light tracking-tight text-gray-900 mt-1">
                {price ? `$${price.toLocaleString()}` : 'Call for Price'}
              </p>
            </div>
            
            {/* Delivery Status - Subtle with Icon */}
            <div className="flex items-center gap-2 mt-4 text-sm font-light text-gray-600">
              <div className={`w-1.5 h-1.5 ${deliveryStatus.dotColor} rounded-full`}></div>
              <span>{deliveryStatus.text}</span>
            </div>
            
            {/* Warranty - Clean Checkmark */}
            {warrantyText && (
              <p className="text-sm font-light text-gray-600 mt-2">
                {warrantyText}
              </p>
            )}
            
            {/* Premium Black Button */}
            <button 
              className="w-full border-2 border-black text-black py-4 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-black hover:text-white transition-all duration-500 ease-out mt-8"
              onClick={handleMoreInfoClick}
            >
              View Specifications
            </button>
          </div>
        </div>
      </div>
      
      {/* Premium Details Modal */}
      {showDetailsSheet && createPortal(
        <MotorDetailsPremiumModal
          open={showDetailsSheet}
          onClose={handleCloseModal}
          onSelect={onSelect}
          title={title}
          img={imageUrl}
          gallery={galleryImages}
          msrp={msrp}
          price={price}
          promoText={promoText}
          hp={hpNum}
          shaft={shaft}
          features={features}
          motor={motor}
        />,
        document.body
      )}
    </>
  );
});

export default MotorCardPreview;