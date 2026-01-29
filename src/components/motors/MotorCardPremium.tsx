"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MotorQuickInfo from "./MotorQuickInfo";
import MotorDetailsSheet from './MotorDetailsSheet';
import { StockBadge } from '@/components/inventory/StockBadge';
import { PopularityBadge, getMotorPopularity } from './PopularityBadge';
import { LuxuryPriceDisplay } from '@/components/pricing/LuxuryPriceDisplay';
import type { Motor } from '../../lib/motor-helpers';
import { getHPDescriptor, requiresMercuryControls, isTillerMotor, getMotorImageByPriority, getMotorImageGallery, buildModelKey, extractHpAndCode, decodeModelName } from '../../lib/motor-helpers';
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { getFinancingDisplay } from '@/lib/finance';
import { getPriceDisplayState } from '@/lib/pricing';
import mercuryLogo from '@/assets/mercury-logo.png';

export default function MotorCardPremium({ 
  img, 
  title, 
  hp, 
  msrp, 
  price, 
  promoText, 
  selected, 
  onSelect,
  // New specification props
  shaft,
  weightLbs,
  altOutput,
  steering,
  features,
  description,
  specSheetUrl,
  motor,
  inStock
}: {
  img?: string | null;
  title: string;
  hp?: number | string;
  msrp?: number | null;
  price?: number | null;
  promoText?: string | null;
  selected?: boolean;
  onSelect: () => void;
  // New specification props
  shaft?: string;
  weightLbs?: number | string;
  altOutput?: string;
  steering?: string;
  features?: string[];
  description?: string | null;
  specSheetUrl?: string | null;
  motor?: Motor;
  inStock?: boolean | null;
}) {
  const fmt = (n?: number | null) => (typeof n === "number" ? `$${n.toLocaleString()}` : undefined);
  const hpNum = typeof hp === "string" ? parseFloat(hp) : (typeof hp === "number" ? hp : undefined);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  // Get popularity type for this motor - prioritize "Special Price" if manual sale price is set
  const popularityType = motor?.hasManualSalePrice ? 'special-price' : (motor ? getMotorPopularity(motor) : null);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Get the best available image URL and count total images using priority logic
  const [imageInfo, setImageInfo] = useState<{ url: string; count: number; isInventory: boolean }>({
    url: img || '/lovable-uploads/speedboat-transparent.png',
    count: img ? 1 : 0,
    isInventory: false
  });

  useEffect(() => {
    const loadImageInfo = async () => {
      try {
        // If we have a valid hero image URL passed as img prop, prioritize it
        if (img && img !== '/lovable-uploads/speedboat-transparent.png') {
          const allImages = await getMotorImageGallery(motor);
          setImageInfo({
            url: img,
            count: Math.max(allImages.length, 1),
            isInventory: false
          });
          return;
        }

        const { url: primaryImageUrl, isInventory } = await getMotorImageByPriority(motor);
        const allImages = await getMotorImageGallery(motor);
        
        // Use img prop as fallback if motor priority didn't find anything good
        const finalUrl = primaryImageUrl !== '/lovable-uploads/speedboat-transparent.png' 
          ? primaryImageUrl 
          : (img || '/lovable-uploads/speedboat-transparent.png');
        
        setImageInfo({
          url: finalUrl,
          count: Math.max(allImages.length, img ? 1 : 0),
          isInventory
        });
      } catch (error) {
        console.warn('Failed to load motor image info:', error);
        // Keep fallback values on error
      }
    };

    loadImageInfo();
  }, [motor, img]);
  const imageUrl = imageInfo.url;
  const imageCount = imageInfo.count;
  const isInventoryImage = imageInfo.isInventory;
  
  // Smart financing calculation
  const { promo } = useActiveFinancingPromo();
  const financingDisplay = getFinancingDisplay((price || 0) * 1.13, promo?.rate || null);
  
  // Popularity badge is now handled by getMotorPopularity (rule-based, no state needed)
  
  // Check if device has fine pointer (mouse) for hover
  const hasHover = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  
  const handleCardClick = () => {
    if (motor?.id) {
      navigate(`/motors/${motor.id}`);
    }
  };
  
  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (motor?.id) {
      navigate(`/motors/${motor.id}`);
    }
  };

  const handleCloseModal = () => {
    setShowDetailsSheet(false);
    // Restore scroll position after modal closes
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'auto' // Use 'auto' not 'smooth' for immediate return
      });
    }, 10); // Small delay to ensure DOM updates
  };
  
  const handleTooltipMouseEnter = () => {
    if (!isMobile) {
      setShowTooltip(true);
    }
  };
  
  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
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
        text: "🟢 In Stock Today",
        dotColor: "bg-green-500"
      };
    }
    return {
      text: "○ Quick availability",
      dotColor: "bg-gray-400"
    };
  };

  // Get warranty text if applicable (simplified for premium card)
  const getWarrantyText = () => {
    // Check if there are any warranty promotions
    // This would need to be connected to actual promo data
    return null; // Simplified for now
  };

  const deliveryStatus = getDeliveryStatus();
  const warrantyText = getWarrantyText();

  return (
    <>
      <div 
        className="group bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:transform hover:-translate-y-2 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative">
          {/* Image Section */}
          {imageUrl && (
            <div className="relative bg-white p-4 overflow-hidden">
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-32 md:h-48 w-full object-contain aspect-[4/3] transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('speedboat-transparent.png')) {
                    target.src = '/lovable-uploads/speedboat-transparent.png';
                  }
                }}
              />
              
              {/* Stock Badge & Popularity Badge - Top Left */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <StockBadge 
                  motor={{
                    in_stock: inStock,
                    stock_quantity: motor?.stockQuantity,
                    stock_number: motor?.stockNumber
                  }}
                  variant="default"
                />
                {popularityType && (
                  <PopularityBadge type={popularityType} />
                )}
              </div>
              
              {/* HP Badge */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-light tracking-wider">
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
          
          {/* Mercury Brand Accent */}
          <div className="h-0.5 bg-gradient-to-r from-[#003F7F] to-transparent"></div>
          
          {/* Content Section - Premium Mobile Layout */}
          <div className="p-4 space-y-4">
            {/* Model Name - Prominent */}
            <h3 className="text-2xl font-light tracking-wide text-black">
              {title}
            </h3>
            
            {/* Model Number - Subtle */}
            {motor?.model_number && (
              <p className="text-sm text-gray-500 mt-1">
                Model: {motor.model_number}
              </p>
            )}
            
            {/* Simplified Specs - Single Line */}
            <p className="text-sm text-gray-600 mt-4 tracking-wide">
              {getSimplifiedSpecs()}
            </p>
            
            {/* Pricing - Clean & Direct */}
            <div className="mt-4">
              {msrp && price && msrp > price && (
                <p className="text-base text-gray-500 line-through font-light">${msrp.toLocaleString()}</p>
              )}
              <p className="text-3xl font-light text-black mt-1">
                {price ? `$${price.toLocaleString()}` : 'Call for Price'}
              </p>
            </div>
            
            {/* Delivery Status - Subtle with Icon */}
            <p className="mt-4 text-sm text-gray-600">
              {deliveryStatus.text}
            </p>
            
            {/* Warranty - Clean Checkmark */}
            {warrantyText && (
              <p className="text-sm text-blue-600 mt-2">
                {warrantyText}
              </p>
            )}
            
            {/* Premium Black Button */}
            <button 
              className="w-full bg-black text-white py-4 text-base font-light tracking-wider uppercase mt-6 rounded-none hover:bg-gray-900 transition-colors duration-200"
              onClick={handleMoreInfoClick}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile/click details sheet - rendered via portal */}
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