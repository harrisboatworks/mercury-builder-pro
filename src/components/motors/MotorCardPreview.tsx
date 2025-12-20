"use client";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { ImageIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { LuxuryPriceDisplay } from '@/components/pricing/LuxuryPriceDisplay';
import { StockBadge } from '@/components/inventory/StockBadge';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompareButton } from './CompareButton';
import { FavoriteButton } from './FavoriteButton';
import { AskQuestionButton } from './AskQuestionButton';
import { useMotorComparison } from '@/hooks/useMotorComparison';
import { useFavoriteMotors } from '@/hooks/useFavoriteMotors';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import type { Motor } from '../../lib/motor-helpers';
import { isTillerMotor, getMotorImageByPriority, getMotorImageGallery, decodeModelName, cleanMotorName } from '../../lib/motor-helpers';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatMotorDisplayName } from '@/lib/motor-display-formatter';
import { getFinancingTerm } from '@/lib/finance';
import { MotorCodeTooltip } from './MotorCodeTooltip';
import { preloadConfiguratorImagesHighPriority } from '@/lib/configurator-preload';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useSmartImageScale } from '@/hooks/useSmartImageScale';

// Lazy load heavy modal component (~120KB)
const MotorDetailsPremiumModal = lazy(() => import('./MotorDetailsPremiumModal'));

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
  const { dispatch } = useQuote();
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // UX feature hooks
  const { toggleComparison, isInComparison, count: comparisonCount, isFull: comparisonFull } = useMotorComparison();
  const { toggleFavorite, isFavorite } = useFavoriteMotors();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Smart image scaling - moderate scaling for card thumbnails
  const { scale: imageScale, handleImageLoad } = useSmartImageScale({
    minExpectedDimension: 300,
    maxScale: 1.6,
    defaultScale: 1.0
  });

  // Combined image load handler
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    handleImageLoad(e);
    setImageLoaded(true);
  };

  // Dispatch preview motor when modal opens/closes + track recently viewed
  useEffect(() => {
    if (showDetailsSheet && motor) {
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: motor as any });
      // Track as recently viewed
      addToRecentlyViewed({
        id: motor.id,
        model: motor.model,
        hp: motor.hp,
        price: motor.price,
        image: motor.image
      });
    } else if (!showDetailsSheet) {
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: null });
    }
  }, [showDetailsSheet, motor, dispatch, addToRecentlyViewed]);
  
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
  }, [motor, img]);
  
  const imageUrl = imageInfo.url || '';
  const [imageError, setImageError] = useState(false);
  const hasValidImage = imageUrl && !imageError;

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
    // Harris physical stock
    if (inStock || motor?.in_stock === true) {
      return { text: "In Stock Today", dotColor: "bg-green-500" };
    }
    // Mercury warehouse stock
    if (motor?.availability?.includes('Mercury Warehouse')) {
      return { text: "In Stock at Mercury", dotColor: "bg-amber-500" };
    }
    // Estimated availability date
    if (motor?.availability?.startsWith('Est.')) {
      return { text: motor.availability, dotColor: "bg-gray-400" };
    }
    // Brochure / factory order - no lead time promised
    return { text: "Available to Order", dotColor: "bg-gray-400" };
  };

  // Get warranty text if applicable
  const getWarrantyText = () => {
    if (hasWarrantyPromo && warrantyYears > 0) {
      return `✓ ${warrantyYears} Year Extended Coverage`;
    }
    return null;
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

  const deliveryStatus = getDeliveryStatus();
  const warrantyText = getWarrantyText();

  // Calculate dynamic monthly payment estimate
  const calculateMonthlyPayment = () => {
    if (!price || price <= 0) return null;
    
    const term = getFinancingTerm(price);
    const priceWithTax = price * 1.13; // 13% HST
    const totalFinanced = priceWithTax + 299; // Add Dealerplan fee
    const monthlyPayment = totalFinanced / term;
    
    return Math.round(monthlyPayment);
  };

  const monthlyPayment = calculateMonthlyPayment();

  return (
    <>
      <div 
        className="group bg-white rounded-2xl border border-gray-100/80 overflow-hidden cursor-pointer touch-action-manipulation
          transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.03)] 
          hover:-translate-y-1.5 hover:border-gray-200/90
          active:scale-[0.98] active:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]"
        onClick={handleCardClick}
        onMouseEnter={preloadConfiguratorImagesHighPriority}
        onTouchStart={preloadConfiguratorImagesHighPriority}
      >
        <div className="relative bg-gradient-to-b from-gray-50 to-white p-8 overflow-hidden">
              {/* Shimmer loading overlay */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-50 animate-shimmer z-10" />
              )}
              <div className="flex items-center justify-center h-48 md:h-64 max-h-[220px] md:max-h-[280px]">
                {hasValidImage ? (
                  <img 
                    src={imageUrl} 
                    alt={title} 
                    className={`max-h-full max-w-full object-contain transition-all duration-700 ease-out group-hover:scale-[1.03] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={onImageLoad}
                    onError={() => {
                      setImageError(true);
                      setImageLoaded(true);
                    }}
                    style={{ transform: `scale(${imageScale})` }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <ImageIcon className="h-16 w-16 mb-3 opacity-40" />
                    <span className="text-sm font-medium">No Image</span>
                    <span className="text-xs opacity-70">Available</span>
                  </div>
                )}
              </div>
              
              {/* Stock Badge - Top Left */}
              <div className="absolute top-4 left-4">
                <StockBadge 
                  motor={{
                    in_stock: inStock,
                    stock_quantity: motor?.stockQuantity,
                    stock_number: motor?.stockNumber
                  }}
                  variant="default"
                />
              </div>
              
              {/* HP Badge - Premium pill style */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-gray-900 text-white px-4 py-1.5 text-xs tracking-[0.15em] font-medium rounded-full shadow-lg">
                  {hpNum} HP
                </div>
              )}
              
              {/* Command Thrust Badge with Tooltip */}
              {(motor?.has_command_thrust || title?.toLowerCase().includes('command thrust')) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-4 right-24 bg-[hsl(var(--primary))] text-white px-2 py-1 text-[10px] tracking-wider font-semibold uppercase rounded-sm cursor-help">
                        CT
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-semibold text-sm">Command Thrust</p>
                      <p className="text-xs text-muted-foreground mt-1">Larger gearcase for superior thrust and control at low speeds. Ideal for heavy boats, pontoons, and trolling.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              
              {/* Mercury Logo - Enhanced interaction */}
              <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                <img 
                  src={mercuryLogo}
                  alt="Mercury Marine"
                  className="h-6 w-auto"
                />
              </div>
              
              {/* Compare, Favorite & Ask Buttons */}
              {motor && (
                <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CompareButton 
                    isInComparison={isInComparison(motor.id)}
                    isFull={comparisonFull}
                    onToggle={() => toggleComparison(motor as any)}
                    count={comparisonCount}
                  />
                  <FavoriteButton 
                    isFavorite={isFavorite(motor.id)}
                    onToggle={() => toggleFavorite(motor.id)}
                  />
                  <AskQuestionButton motor={motor} />
                </div>
              )}
            </div>
          
          {/* Subtle Top Border */}
          <div className="border-t border-gray-200"></div>
          
          {/* Content Section - Premium Layout */}
          <div className="p-6 md:p-8 space-y-4">
            {/* Model Name - Refined Typography */}
            <div className="flex items-start gap-2">
              <h3 className="text-lg md:text-xl font-medium tracking-tight text-gray-900">
                {formatTitle(title)}
              </h3>
              <MotorCodeTooltip modelName={title} className="mt-1" />
            </div>
            
            {/* Model Number - Very Subtle */}
            {motor?.model_number && (
              <p className="text-xs font-light text-gray-400 tracking-wide">
                {motor.model_number}
              </p>
            )}
            
            {/* Simplified Specs - Elegant Single Line */}
            <p className="text-sm font-light text-gray-500 leading-relaxed">
              {getSimplifiedSpecs()}
            </p>
            
            {/* Pricing - Refined Hierarchy */}
            <div className="pt-4 pb-2">
              {msrp && price && msrp > price && (
                <p className="text-sm text-gray-400 font-light line-through">${msrp.toLocaleString()}</p>
              )}
              <p className="text-2xl font-semibold tracking-tight text-gray-900">
                {price ? `$${price.toLocaleString()}` : 'Call for Price'}
              </p>
              
              {/* Monthly Payment Estimate */}
              {monthlyPayment && (
                <p className="text-sm font-light text-gray-500 mt-1">
                  or ${monthlyPayment}/mo*
                </p>
              )}
            </div>
            
            {/* Delivery & Warranty - Compact */}
            <div className="space-y-1.5 text-sm font-light text-gray-500">
              <p>{deliveryStatus.text}</p>
              {warrantyText && <p>{warrantyText}</p>}
            </div>
            
            {/* Premium CTA Button */}
            <button 
              className="w-full bg-gray-900 text-white py-3.5 text-xs tracking-[0.2em] uppercase font-medium rounded-lg 
                transition-all duration-300 ease-out mt-4 shadow-sm
                hover:bg-gray-800 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5
                active:scale-[0.98] active:shadow-sm
                premium-pulse"
              onClick={handleMoreInfoClick}
            >
              Build & Price
            </button>
          </div>
        </div>
      
      {/* Premium Details Modal */}
      {showDetailsSheet && createPortal(
        <Suspense fallback={<ModalSkeleton />}>
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
          />
        </Suspense>,
        document.body
      )}
    </>
  );
}