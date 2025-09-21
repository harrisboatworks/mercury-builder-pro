"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import MotorQuickInfo from "./MotorQuickInfo";
import MotorDetailsSheet from './MotorDetailsSheet';
import { StockBadge } from '@/components/inventory/StockBadge';
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
  const getImageInfo = (): { url: string; count: number; isInventory: boolean } => {
    const { url: primaryImageUrl, isInventory } = getMotorImageByPriority(motor);
    const allImages = getMotorImageGallery(motor);
    
    // Use img prop as fallback if motor priority didn't find anything good
    const finalUrl = primaryImageUrl !== '/lovable-uploads/speedboat-transparent.png' 
      ? primaryImageUrl 
      : (img || '/lovable-uploads/speedboat-transparent.png');
    
    return {
      url: finalUrl,
      count: Math.max(allImages.length, img ? 1 : 0),
      isInventory
    };
  };

  const imageInfo = getImageInfo();
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
  
  // Debug logging
  useEffect(() => {
    console.log('Motor Debug - ALL DATA:', {
      title: title,
      inStock: inStock,
      stockNumber: motor?.stockNumber,
      stock_quantity: motor?.stock_quantity,
      availability: motor?.availability,
      fullMotorObject: motor
    });
    
    if (inStock) {
      console.log('RENDERING STOCK BADGE for:', title, {
        in_stock: inStock,
        stock_quantity: motor?.stock_quantity,
        stock_number: motor?.stockNumber,
        availability: motor?.availability
      });
    } else {
      console.log('NOT IN STOCK:', title);
    }
  }, [title, inStock, motor]);

  return (
    <>
      <div className="relative">
        <button 
          onClick={handleMoreInfoClick} 
          className={`motor-card-premium text-left w-full transition-all duration-200 border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 hover:shadow-md ${
            (hpNum === 15 || hpNum === 75) ? 'opacity-90' : ''
          }`}
        >
          {/* HP indicator in top-right corner */}
          {hpNum && (
            <div className="absolute top-2 left-2 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-md backdrop-blur-sm font-medium">
              {hpNum} HP
            </div>
          )}
          
          {/* Image and title area - hover for tooltip */}
          <div 
            className="relative"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {imageUrl && (
              <div className="relative mb-3">
                <img 
                  src={imageUrl} 
                  alt="" 
                  className="h-40 w-full rounded-lg object-contain bg-white dark:bg-slate-900" 
                />
                {/* Gallery indicator and stock status */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  {inStock && (
                    <StockBadge 
                      motor={{
                        in_stock: inStock,
                        stock_quantity: motor?.stock_quantity,
                        stock_number: motor?.stock_number,
                        availability: motor?.availability
                      }}
                      variant="compact"
                      className="backdrop-blur-sm z-20 bg-primary/90"
                    />
                  )}
                  
                 {imageCount > 1 && (
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                      {imageCount} photos
                    </div>
                  )}
                  {/* HP display moved to bottom-right corner */}
                  {hpNum && (
                    <div className="bg-blue-600/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm font-medium">
                      {hpNum} HP
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </div>
            
            {/* Mercury Model Number */}
            {motor?.model_number && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Model: {motor.model_number}
              </div>
            )}
            
            {/* HP-based descriptor and popularity indicators */}
            {hpNum && (
              <div className="mt-1 space-y-1">
                {/* HP-based descriptor - always show */}
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getHPDescriptor(hpNum)}
                </p>
                
                {/* Controls required indicator for non-tiller motors */}
                {motor && requiresMercuryControls(motor) && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                    + Controls Required
                  </p>
                )}
                
                {/* Badge container - ALWAYS rendered with minimum height to prevent layout shift */}
                <div className="h-4 transition-opacity duration-300">
                  {motorBadge && (
                    <p className={`text-xs font-medium transition-all duration-300 ${getBadgeColor(motorBadge)}`}>
                      {motorBadge}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-2">
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
                <div className="space-y-1">
                  {displayMSRP && priceState.hasSale && (
                    <div className="text-sm text-muted-foreground line-through">
                      MSRP ${displayMSRP.toLocaleString()}
                    </div>
                  )}
                  {displaySalePrice && (
                    <div className="text-lg font-bold text-red-600">
                      {priceState.hasSale ? 'Our Price ' : ''}${displaySalePrice.toLocaleString()}
                    </div>
                  )}
                  {priceState.hasSale && priceState.savingsRounded > 0 && (
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                      SAVE ${priceState.savingsRounded.toLocaleString()}
                    </div>
                  )}
                  {promoText && (
                    <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      {promoText}
                    </div>
                  )}
                   {financingInfo && displaySalePrice && displaySalePrice > 5000 && (
                     <div className="text-xs text-muted-foreground mt-1">
                       {getFinancingDisplay(displaySalePrice * 1.13, promo?.rate || null)}*
                     </div>
                   )}
                </div>
              );
            })()}
          </div>
        </button>
        
        {/* Special Order banner for less-preferred models */}
        {(hpNum === 15 || hpNum === 75) && (
          <div className="absolute top-2 left-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md shadow-sm dark:bg-amber-900/50 dark:text-amber-200">
            Special Order
          </div>
        )}
        
        {/* More info button with hover tooltip */}
        <button
          onClick={handleMoreInfoClick}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          className="absolute top-2 right-2 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:bg-slate-800/80 dark:hover:bg-slate-800"
          aria-label="More details"
        >
          <Info className="h-5 w-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
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