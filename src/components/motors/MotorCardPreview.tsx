"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, Shield } from "lucide-react";
import MotorQuickInfo from "./MotorQuickInfo";
import MotorDetailsSheet from './MotorDetailsSheet';
import { StockBadge } from '@/components/inventory/StockBadge';
import { Card } from '@/components/ui/card';
import type { Motor } from '../../lib/motor-helpers';
import { getHPDescriptor, getPopularityIndicator, getBadgeColor, requiresMercuryControls, isTillerMotor, getMotorImageByPriority, getMotorImageGallery, buildModelKey, extractHpAndCode } from '../../lib/motor-helpers';
import { useIsMobile } from "@/hooks/use-mobile";
import { useFinancing } from '@/contexts/FinancingContext';
import { getFinancingDisplay } from '@/lib/finance';
import { getPriceDisplayState } from '@/lib/pricing';

export default function MotorCardPreview({ 
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

  return (
    <>
      <Card className="rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer border-t-2 border-[hsl(var(--primary))] overflow-hidden">
        <button 
          onClick={handleMoreInfoClick} 
          className="text-left w-full transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-0"
        >
          {/* Image Section with HP Badge Overlay */}
          <div className="relative">
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="" 
                  className="h-48 w-full object-contain bg-white dark:bg-slate-900" 
                />
                
                {/* HP Badge Overlay - Top Right */}
                {hpNum && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                    {hpNum} HP
                  </div>
                )}
                
                {/* Stock Badge - Top Left */}
                {inStock && (
                  <div className="absolute top-2 left-2">
                    <StockBadge 
                      motor={{
                        in_stock: inStock,
                        stock_quantity: motor?.stock_quantity,
                        stock_number: motor?.stock_number,
                        availability: motor?.availability
                      }}
                      variant="compact"
                      className="backdrop-blur-sm bg-primary/90"
                    />
                  </div>
                )}
                
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className="p-4">
            {/* Model Name - Enhanced Typography */}
            <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {title}
            </div>
            
            {/* Mercury Model Number */}
            {motor?.model_number && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-mono">
                Model: {motor.model_number}
              </div>
            )}
            
            {/* HP-based descriptor and popularity indicators */}
            {hpNum && (
              <div className="mb-3 space-y-1">
                {/* HP-based descriptor - always show */}
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {getHPDescriptor(hpNum)}
                </p>
                
                {/* Controls required indicator for non-tiller motors */}
                {motor && requiresMercuryControls(motor) && (
                  <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                    + Controls Required
                  </p>
                )}
                
                {/* Badge container - ALWAYS rendered with minimum height to prevent layout shift */}
                <div className="h-4 transition-opacity duration-300">
                  {motorBadge && (
                    <p className={`text-sm font-medium transition-all duration-300 ${getBadgeColor(motorBadge)}`}>
                      {motorBadge}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Enhanced Pricing Section */}
            <div className="mb-4">
              {(() => {
                // Use the pricing display state logic with artificial pricing enabled
                const priceState = getPriceDisplayState(msrp, price, true);
                
                if (priceState.callForPrice) {
                  return <div className="text-lg font-bold text-foreground">Call for Price</div>;
                }
                
                // Calculate display prices
                const displayMSRP = priceState.isArtificialDiscount && msrp ? Math.round(msrp * 1.1) : msrp;
                const displaySalePrice = priceState.isArtificialDiscount ? msrp : (price || msrp);
                
                return (
                  <>
                    <div className="space-y-2">
                      {displayMSRP && priceState.hasSale && (
                        <div className="text-sm text-gray-500 line-through">
                          MSRP ${displayMSRP.toLocaleString()}
                        </div>
                      )}
                      {displaySalePrice && (
                        <div className="text-2xl font-bold text-red-600 mt-2">
                          {priceState.hasSale ? 'Your Price ' : ''}${displaySalePrice.toLocaleString()}
                        </div>
                      )}
                      {priceState.hasSale && priceState.savingsRounded > 0 && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-sm font-semibold">
                          SAVE ${priceState.savingsRounded.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Financing Info - moved inside the closure to access displaySalePrice */}
                    {financingInfo && displaySalePrice && displaySalePrice > 5000 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {getFinancingDisplay(displaySalePrice * 1.13, promo?.rate || null)}*
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            
            {/* Enhanced Promo Badge */}
            {promoText && (
              <div className="mb-3">
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                  <Shield className="w-4 h-4" />
                  {promoText}
                </div>
              </div>
            )}
            
            {/* Add specs row with divider */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-around text-xs text-gray-600">
                {/* Only show specs that exist */}
                {motor?.horsepower && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{motor.horsepower} HP</span>
                  </span>
                )}
                
                {motor?.specifications?.weight && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{motor.specifications.weight} lbs</span>
                  </>
                )}
                
                {motor?.shaft_inches && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{motor.shaft_inches}" Shaft</span>
                  </>
                )}
                
                {/* If no specs available, show a view details link */}
                {!motor?.horsepower && !motor?.specifications?.weight && !motor?.shaft_inches && (
                  <span className="text-blue-600 text-xs">View Full Specs →</span>
                )}
              </div>
            </div>
            
          </div>
        </button>
        
        {/* More info button with hover tooltip */}
        <button
          onClick={handleMoreInfoClick}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          className="absolute top-2 right-12 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:bg-slate-800/90 dark:hover:bg-slate-800"
          aria-label="More details"
        >
          <Info className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
        </button>
        
        {/* Desktop hover tooltip - improved positioning and simplified condition */}
        {showTooltip && !isMobile && (
          <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2">
            <MotorQuickInfo
              hp={hpNum}
              shaft={shaft}
              weightLbs={weightLbs}
              altOutput={altOutput}
              steering={steering}
              model={motor?.model || title}
            />
          </div>
        )}
      </Card>
      
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
