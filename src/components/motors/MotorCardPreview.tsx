"use client";
import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuote } from '@/contexts/QuoteContext';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { Button } from '@/components/ui/button';
import { LuxuryPriceDisplay } from '@/components/pricing/LuxuryPriceDisplay';
import { StockBadge } from '@/components/inventory/StockBadge';
import { PopularityBadge, getMotorPopularity } from './PopularityBadge';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompareButton } from './CompareButton';
import { ShareLinkButton } from './ShareLinkButton';
import { VoiceChatButton } from './VoiceChatButton';
import { VoiceChatCoachMark } from './VoiceChatCoachMark';
import { AskQuestionButton } from './AskQuestionButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Motor } from '../../lib/motor-helpers';
import { isTillerMotor, getMotorImageByPriority, getMotorImageGallery, decodeModelName, cleanMotorName } from '../../lib/motor-helpers';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatMotorDisplayName } from '@/lib/motor-display-formatter';
import { getDisplayPrices } from '@/lib/pricing';
import { getFinancingTerm } from '@/lib/finance';

import { preloadConfiguratorImagesHighPriority } from '@/lib/configurator-preload';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useSmartImageScale } from '@/hooks/useSmartImageScale';

// Shared data passed from parent to avoid per-card hook explosion
export interface SharedCardData {
  promotions: Array<{ warranty_extra_years?: number | null; end_date?: string | null; name?: string; bonus_title?: string | null }>;
  toggleComparison: (motor: any) => void;
  isInComparison: (id: string) => boolean;
  comparisonCount: number;
  comparisonFull: boolean;
  hasSeenVoiceCoachMark: boolean;
  markVoiceCoachMarkSeen: () => void;
  addToRecentlyViewed: (motor: { id: string; model: string; hp: number; price: number; image?: string }) => void;
}

// Lazy load heavy modal component (~120KB)
const MotorDetailsPremiumModal = lazy(() => import('./MotorDetailsPremiumModal'));

// Prefetch modal chunk on hover/touch so it's cached before click
let modalPrefetched = false;
const prefetchModal = () => {
  if (modalPrefetched) return;
  modalPrefetched = true;
  import('./MotorDetailsPremiumModal').catch(() => {
    modalPrefetched = false; // Allow retry on failure
  });
};

function MotorCardPreviewInner({ 
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
  ctaTextVariant = "View Details",
  sharedData
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
  sharedData?: SharedCardData;
}) {
  const hpNum = typeof hp === "string" ? parseFloat(hp) : (typeof hp === "number" ? hp : undefined);
  // Use shared data from parent when available, otherwise keep working standalone
  const promotions = sharedData?.promotions ?? [];
  const { dispatch } = useQuote();
  const { openChat } = useAIChat();
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // UX feature hooks — use shared data from parent to avoid per-card instantiation
  const toggleComparison = sharedData?.toggleComparison ?? (() => {});
  const isInComparison = sharedData?.isInComparison ?? (() => false);
  const comparisonCount = sharedData?.comparisonCount ?? 0;
  const comparisonFull = sharedData?.comparisonFull ?? false;
  const hasSeenVoiceCoachMark = sharedData?.hasSeenVoiceCoachMark ?? true;
  const markVoiceCoachMarkSeen = sharedData?.markVoiceCoachMarkSeen ?? (() => {});
  const addToRecentlyViewed = sharedData?.addToRecentlyViewed ?? (() => {});
  const { triggerHaptic } = useHapticFeedback();
  
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

  // Dispatch preview motor when modal opens + track recently viewed
  // Don't clear on close - motor stays in bar until user picks another
  useEffect(() => {
    if (showDetailsSheet && motor) {
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: motor as any });
      // Track as recently viewed
      addToRecentlyViewed({
        id: motor.id,
        model: (motor as any).model_display || motor.model,
        hp: motor.hp,
        price: motor.price,
        image: motor.image
      });
    }
  }, [showDetailsSheet, motor, dispatch, addToRecentlyViewed]);
  
  // Get the best available image URL using priority logic
  const [imageInfo, setImageInfo] = useState<{ url: string }>({
    url: img || '/lovable-uploads/speedboat-transparent.png'
  });

  // Get photo count for image overlay
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Intersection Observer — defer expensive async image resolution until card is near viewport
  const cardRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNearViewport) return; // Defer until near viewport

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
  }, [motor, img, isNearViewport]);
  
  const imageUrl = imageInfo.url || '';
  const [imageError, setImageError] = useState(false);
  
  // Reset error state when URL changes (e.g. async resolution provides a new URL)
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);
  
  const hasValidImage = imageUrl && !imageError;

  const handleCardClick = () => {
    triggerHaptic('light');
    setShowDetailsSheet(true);
  };

  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('motorSelected');
    setShowDetailsSheet(true);
  };

  const handleCloseModal = useCallback(() => {
    setShowDetailsSheet(false);
  }, []);

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

  // Get warranty text if applicable - show TOTAL warranty (base 3 + promo bonus)
  const getWarrantyText = () => {
    if (hasWarrantyPromo && warrantyYears > 0) {
      const totalYears = 3 + warrantyYears; // Base 3-year + promo bonus
      return `✓ ${totalYears} Year Warranty`;
    }
    return null;
  };

  // Use shared display pricing helper — always shows MSRP (inflated if equal)
  const dp = getDisplayPrices(msrp, price);

  // Format promo text elegantly
  const getPromoDisplay = () => {
    if (hasWarrantyPromo && warrantyYears > 0) {
      const totalYears = 3 + warrantyYears; // Base 3-year + promo bonus
      let promoText = `Mercury Get ${totalYears}: ${totalYears} Years Factory Warranty Included`;
      
      // Add end date if available
      const activePromo = promotions.find(promo => promo.warranty_extra_years);
      if (activePromo?.end_date) {
        const endDate = new Date(activePromo.end_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        promoText += ` • Until ${endDate}`;
      }
      
      return promoText;
    }
    return null;
  };

  const deliveryStatus = getDeliveryStatus();
  const warrantyText = getWarrantyText();

  // Calculate dynamic monthly payment estimate
  const calculateMonthlyPayment = () => {
    if (!price || price < 5000) return null; // Hide financing for motors under $5k (FINANCING_MINIMUM)
    
    const term = getFinancingTerm(price);
    const priceWithTax = price * 1.13; // 13% HST
    const totalFinanced = priceWithTax + 299; // Add Dealerplan fee
    const monthlyPayment = totalFinanced / term;
    
    return Math.round(monthlyPayment);
  };

  const monthlyPayment = calculateMonthlyPayment();

  // Build slug for individual motor URL (same logic as ShareLinkButton)
  const buildMotorSlug = (source: string): string => {
    return source
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Generate Product schema for SEO
  const getProductSchema = () => {
    if (!motor) return null;
    
    const displayName = formatMotorDisplayName(title);
    const priceValue = price || msrp;
    const siteUrl = 'https://mercuryrepower.ca';
    const imageUrlFull = imageUrl?.startsWith('/') 
      ? `${siteUrl}${imageUrl}` 
      : imageUrl;
    
    // Build individual motor URL for SEO
    const slugSource = motor.model_key || motor.model || title;
    const motorSlug = buildMotorSlug(slugSource);
    const motorUrl = `${siteUrl}/motors/${motorSlug}`;
    
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": displayName,
      "description": description || `${displayName} outboard motor - Mercury Marine`,
      "image": imageUrlFull || `${siteUrl}/lovable-uploads/logo-dark.png`,
      "brand": {
        "@type": "Brand",
        "name": "Mercury Marine"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "Mercury Marine"
      },
      "category": "Outboard Motors",
      "sku": motor.id,
      "mpn": motor.model || title,
      ...(priceValue && {
        "offers": {
          "@type": "Offer",
          "url": motorUrl,
          "priceCurrency": "CAD",
          "price": priceValue,
          "availability": inStock 
            ? "https://schema.org/InStock" 
            : "https://schema.org/PreOrder",
          "seller": {
            "@type": "Organization",
            "name": "Harris Boat Works",
            "url": siteUrl
          }
        }
      })
    };
  };

  const productSchema = getProductSchema();

  // Specs string with styled separators
  const specsRaw = getSimplifiedSpecs();
  const specsParts = specsRaw ? specsRaw.split(/\s*[•·]\s*/).filter(Boolean) : [];
  // Sale tag takes priority over status tags
  const saleAmount = dp.savingsRounded > 0 ? dp.savingsRounded : 0;
  const popularityType = motor && !motor.hasManualSalePrice ? getMotorPopularity(motor) : null;
  const showSaleTag = saleAmount > 0;

  return (
    <div ref={cardRef}>
      {/* Product schema moved to parent as batched ItemList */}
      <div
        className="group bg-repower-cream rounded-lg border border-[rgba(10,22,40,0.10)] overflow-hidden cursor-pointer touch-action-manipulation
          transition-all duration-[350ms] [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]
          hover:-translate-y-[3px] hover:border-[rgba(10,22,40,0.18)]
          hover:shadow-[0_16px_40px_rgba(10,22,40,0.10),0_4px_12px_rgba(10,22,40,0.05)]
          active:scale-[0.99]"
        onClick={handleCardClick}
        onMouseEnter={() => { preloadConfiguratorImagesHighPriority(); prefetchModal(); }}
        onTouchStart={() => { preloadConfiguratorImagesHighPriority(); prefetchModal(); }}
      >
        <div
          className="relative aspect-[4/3] overflow-hidden"
          style={{ background: 'var(--gradient-image-bg)' }}
        >
              {/* Shimmer loading overlay */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-repower-paper animate-shimmer z-10" />
              )}
              <div className="absolute inset-0 flex items-center justify-center p-[12%]">
                {hasValidImage ? (
                  <img 
                    src={imageUrl} 
                    alt={title} 
                    className={`max-h-full max-w-full object-contain mix-blend-multiply transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.04] ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${!inStock ? 'grayscale-[0.5]' : ''}`}
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
                  <div className="flex flex-col items-center justify-center h-full text-repower-navy-900/40">
                    <ImageIcon className="h-16 w-16 mb-3 opacity-40" />
                    <span className="text-sm font-medium">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Top-left tag — STATUS only (Best Seller / Popular / New). Sale state is communicated typographically in the price block, not as a flashy pill. */}
              {popularityType ? (
                <div className="absolute top-[14px] left-[14px]">
                  <PopularityBadge type={popularityType} />
                </div>
              ) : null}

              {/* Quiet sale indicator — single 6px gold dot, bottom-right of image area */}
              {showSaleTag && (
                <div
                  className="absolute bottom-[14px] right-[44px] w-[6px] h-[6px] rounded-full"
                  style={{ backgroundColor: '#C9A24A' }}
                  aria-label="On sale"
                />
              )}
              
              {/* HP Badge - top-right */}
              {hpNum && (
                <div className={`absolute top-[14px] right-[14px] font-display leading-none px-[14px] py-[8px] rounded-[4px] text-[14px] tracking-[-0.01em] ${inStock ? 'bg-repower-navy-900 text-repower-cream' : 'bg-repower-navy-900/50 text-repower-cream'}`}>
                  <span className="font-bold">{hpNum}</span>
                  <span className="font-medium opacity-70"> HP</span>
                </div>
              )}
              
              {/* Compare, Voice, Ask, Share — kept */}
              {motor && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="absolute bottom-3 left-3 flex flex-col items-center gap-1 transition-opacity duration-200 [&_button]:!w-7 [&_button]:!h-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <CompareButton 
                    isInComparison={isInComparison(motor.id)}
                    isFull={comparisonFull}
                    onToggle={() => toggleComparison(motor as any)}
                    count={comparisonCount}
                  />
                  <div className="relative">
                    <VoiceChatCoachMark 
                      show={!hasSeenVoiceCoachMark}
                      onDismiss={markVoiceCoachMarkSeen}
                    />
                    <VoiceChatButton 
                      motor={motor as any}
                      size="sm"
                      onInteraction={markVoiceCoachMarkSeen}
                    />
                  </div>
                  <AskQuestionButton motor={motor} />
                  <ShareLinkButton modelKey={motor.model_key} modelFallback={motor.model} size="sm" />
                </div>

              )}

              {/* Mercury logo - bottom-right */}
              <div className="absolute bottom-[14px] right-[14px] opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                <img src={mercuryLogo} alt="Mercury Marine" className="h-5 w-auto" />
              </div>
            </div>
          
          {/* Content Section */}
          <div className="p-[18px] md:p-6 space-y-0">
            {/* Title */}
            <h3 className="font-display font-semibold text-[19px] md:text-[22px] tracking-[-0.02em] leading-[1.15] text-repower-navy-900">
              {formatTitle(title)}
            </h3>
            
            {/* Model code */}
            {motor?.model_number && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] font-medium text-repower-navy-900/45">
                {motor.model_number}
              </p>
            )}
            
            {/* Specs line */}
            <p className="mt-[14px] text-[13px] md:text-[13.5px] font-normal leading-[1.45] text-repower-navy-900/65 min-h-[38px]">
              {specsParts.length > 0 ? specsParts.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-repower-navy-900/30 mx-[6px]">·</span>}
                  {part}
                </React.Fragment>
              )) : <>&nbsp;</>}
            </p>
            
            {/* Price block — always 3 rows */}
            <div className="mt-[22px] mb-[18px]">
              <p className="text-[13px] font-normal leading-[18px] h-[18px] text-repower-navy-900/40 line-through">
                {dp.displayMsrp ? `$${dp.displayMsrp.toLocaleString()}` : '\u00A0'}
              </p>
              <p className="font-display font-bold text-[28px] md:text-[32px] tracking-[-0.025em] leading-none mt-1 text-repower-navy-900">
                {dp.callForPrice ? 'Call for Price' : `$${(dp.displayPrice ?? 0).toLocaleString()}`}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-repower-mercury-red leading-none h-[14px]">
                {dp.savingsRounded > 0 ? `You Save $${dp.savingsRounded.toLocaleString()}` : '\u00A0'}
              </p>
            </div>
            
            {/* Trust line */}
            <div className="border-t border-[rgba(10,22,40,0.10)] py-[14px] mb-[18px] flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="text-repower-gold text-[14px] leading-none">✓</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900">
                  {inStock ? 'In Stock' : 'Order Now'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-repower-gold text-[14px] leading-none">✓</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900">
                  {warrantyText ? warrantyText.replace('✓ ', '') : '7-Yr Warranty'}
                </span>
              </span>
            </div>
            
            {/* Out-of-stock secondary line */}
            {!inStock && (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-repower-mercury-red mb-3">
                Order Now · 4–6 weeks
              </p>
            )}
            
            {/* CTA button */}
            <button 
              className={`w-full flex items-center justify-between px-[22px] py-[16px] rounded-[4px] text-[12px] font-bold uppercase tracking-[0.12em] text-repower-cream transition-all duration-300 ${inStock ? 'bg-repower-navy-900 group-hover:bg-repower-mercury-red' : 'bg-repower-navy-900/85 group-hover:bg-repower-navy-900'}`}
              onClick={handleMoreInfoClick}
            >
              <span>{inStock ? 'Build & Price' : 'Notify When In Stock'}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>

            {/* Monthly payment estimate (kept, secondary) */}
            {monthlyPayment && (
              <p className="mt-3 text-[12px] font-light text-repower-navy-900/55 text-center">
                or ${monthlyPayment}/mo*
              </p>
            )}
          </div>
        </div>
      
      {/* Premium Details Modal */}
      {createPortal(
        <AnimatePresence>
          {showDetailsSheet && (
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
                openChat={openChat}
              />
            </Suspense>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// React.memo wrapper — prevents re-render when parent filters change but this card's props don't
const MotorCardPreview = React.memo(MotorCardPreviewInner);
export default MotorCardPreview;