"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import MotorQuickInfo from "./MotorQuickInfo";
import MotorDetailsSheet from './MotorDetailsSheet';
import { StockBadge } from '@/components/inventory/StockBadge';
import { LuxuryPriceDisplay } from '@/components/pricing/LuxuryPriceDisplay';
import type { Motor } from '../../lib/motor-helpers';
import { getHPDescriptor, getPopularityIndicator, getBadgeColor, requiresMercuryControls, isTillerMotor, getMotorImageByPriority, getMotorImageGallery, buildModelKey, extractHpAndCode } from '../../lib/motor-helpers';
import { useIsMobile } from "@/hooks/use-mobile";
import { useFinancing } from '@/contexts/FinancingContext';
import { getFinancingDisplay } from '@/lib/finance';
import { getPriceDisplayState } from '@/lib/pricing';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [motorBadge, setMotorBadge] = useState<string | null>(null);
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
  
  // Smart financing calculation using context
  const { calculateMonthlyPayment, promo } = useFinancing();
  const financingInfo = calculateMonthlyPayment(price || 0, 1000);
  
  // Generate badge once when component mounts and optionally rotate
  useEffect(() => {
    // Generate badge once when component mounts
    const badge = getPopularityIndicator(title, inStock);
    setMotorBadge(badge);
    
    // Optional: Rotate badges every 30 seconds for fresh feel
    const interval = setInterval(() => {
      const newBadge = getPopularityIndicator(title, inStock);
      setMotorBadge(newBadge);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [title, inStock]);
  
  // Check if device has fine pointer (mouse) for hover
  const hasHover = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  
  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    // Store current scroll position before opening modal
    setScrollPosition(window.scrollY);
    setShowDetailsSheet(true);
  };

  const handleCloseModal = () => {
    setShowDetailsSheet(false);
    // Restore scroll position after modal closes
    setTimeout(() => {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'instant' // Use 'instant' not 'smooth' for immediate return
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
    
    // Add start type based on HP
    if (hpNum && hpNum >= 40) {
      specs.push("Electric Start");
    } else {
      specs.push("Manual Start");
    }
    
    // Add shaft length if available
    if (shaft) {
      specs.push(`${shaft} Shaft`);
    } else if (motor?.shaft_inches) {
      specs.push(`${motor.shaft_inches}" Shaft`);
    }
    
    // Add engine type for 4-stroke motors
    if (hpNum && hpNum >= 2.5) {
      specs.push("4-Stroke");
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
      text: "2-3 Week Delivery",
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
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="relative">
          {/* Image Section */}
          {imageUrl && (
            <div className="relative bg-gray-50 p-4">
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-32 md:h-48 w-full object-contain aspect-[4/3]" 
              />
              
              {/* HP Badge */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-light tracking-wider">
                  {hpNum} HP
                </div>
              )}
              
              {/* Photo Count Overlay */}
              {imageCount > 1 && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1.5 rounded-[10px] text-[10px] md:text-[12px] font-medium">
                  +{imageCount} photos
                </div>
              )}
            </div>
          )}
          
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
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
              <div className={`w-1.5 h-1.5 ${deliveryStatus.dotColor} rounded-full`}></div>
              <span>{deliveryStatus.text}</span>
            </div>
            
            {/* Warranty - Clean Checkmark */}
            {warrantyText && (
              <p className="text-sm text-blue-600 mt-2">
                {warrantyText}
              </p>
            )}
            
            {/* Premium Black Button */}
            <button 
              className="w-full bg-black text-white py-4 text-base font-light tracking-wider uppercase mt-6 rounded-none hover:bg-gray-900 transition-colors"
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