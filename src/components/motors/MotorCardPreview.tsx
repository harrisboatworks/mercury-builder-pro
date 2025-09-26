"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shield, Zap, Weight, Ruler, Settings, Gamepad2, Check, Clock, X, Package } from "lucide-react";
import MotorDetailsSheet from './MotorDetailsSheet';
import { StockBadge } from '@/components/inventory/StockBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Motor } from '../../lib/motor-helpers';
import { getHPDescriptor, getPopularityIndicator, getBadgeColor, requiresMercuryControls, isTillerMotor, getMotorImageByPriority, getMotorImageGallery, buildModelKey, extractHpAndCode } from '../../lib/motor-helpers';
import { useIsMobile } from "@/hooks/use-mobile";
import { useFinancing } from '@/contexts/FinancingContext';
import { getFinancingDisplay } from '@/lib/finance';
import { getPriceDisplayState } from '@/lib/pricing';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import mercuryLogo from '@/assets/mercury-logo.png';

// Helper function to extract weight from motor specifications
const parseMotorWeight = (motor?: Motor): string | null => {
  if (!motor?.specifications) return null;
  
  // Try different weight field variations
  const weightFields = [
    'Dry Weight (lbs/kg)',
    'weight',
    'Weight',
    'Dry Weight'
  ];
  
  for (const field of weightFields) {
    const weightValue = motor.specifications[field];
    if (weightValue) {
      // Parse numeric value from strings like "85lbs/38.5kg (MRC model)" or "85"
      const match = String(weightValue).match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return match[1];
      }
    }
  }
  
  return null;
};

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
  const parsedWeight = parseMotorWeight(motor);
  const isMobile = useIsMobile();
  const { promotions } = useActivePromotions();
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

  // Helper functions for Quick Specs
  const getShaftLength = () => {
    if (motor?.shaft_inches) return `${motor.shaft_inches}"`;
    if (shaft) return shaft;
    return null;
  };

  const getStartType = () => {
    if (hpNum && hpNum >= 40) return "Electric";
    return "Manual";
  };

  const getControlType = () => {
    if (motor && isTillerMotor(motor.model || title)) return "Tiller";
    return "Remote";
  };

  // Enhanced stock status for dealer experience
  const getStockStatus = () => {
    const hasRealStock = motor?.stock_quantity && motor.stock_quantity > 0 && 
                        motor?.stock_number && motor.stock_number !== 'N/A' && motor.stock_number.trim() !== '';
    const isInStock = motor?.in_stock === true || hasRealStock;
    
    if (isInStock) {
      return {
        status: "In Stock",
        icon: Check,
        className: "bg-green-600 text-white"
      };
    } else {
      return {
        status: "Available to Order – 2-3 Week Lead Time",
        icon: Package,
        className: "bg-gray-500 text-white"
      };
    }
  };

  const stockInfo = getStockStatus();

  // Get dynamic promo information
  const activePromos = promotions.filter(promo => 
    promo.warranty_extra_years && promo.warranty_extra_years > 0 ||
    promo.bonus_title ||
    promo.discount_percentage > 0 ||
    promo.discount_fixed_amount > 0
  );

  const getPromoContent = () => {
    if (activePromos.length === 0) return null;
    
    const promo = activePromos[0]; // Use first active promo
    
    if (promo.warranty_extra_years && promo.warranty_extra_years > 0) {
      return `🎁 +${promo.warranty_extra_years} Years Extended Warranty`;
    }
    
    if (promo.bonus_title) {
      return `🎁 ${promo.bonus_title}`;
    }
    
    if (promo.discount_percentage > 0) {
      return `🎁 ${promo.discount_percentage}% Off Promotion`;
    }
    
    return `🎁 ${promo.name}`;
  };

  return (
    <>
      <Card className="rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden bg-card border border-border/50 hover:border-primary/20">
        <div className="relative">
          {/* Image Section with luxury enhancements */}
          {imageUrl && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10 pointer-events-none" />
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-80 w-full object-contain bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 filter drop-shadow-lg" 
              />
              
              {/* HP Badge - Enhanced luxury styling */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-2xl border border-white/20">
                  {hpNum} HP
                </div>
              )}
              
              {/* Mercury Logo - Enhanced with subtle glow */}
              <div className="absolute bottom-4 right-4 opacity-70 group-hover:opacity-90 transition-opacity duration-300">
                <img 
                  src={mercuryLogo}
                  alt="Mercury Marine"
                  className="h-6 w-auto filter drop-shadow-md"
                />
              </div>
            </div>
          )}
          
          {/* Content Section - Enhanced luxury spacing */}
          <div className="p-8 space-y-6">
            {/* Product Title - Premium typography */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-card-foreground leading-tight tracking-tight">
                {title}
              </h3>
              {motor?.model_number && (
                <p className="text-sm text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded inline-block">
                  Model: {motor.model_number}
                </p>
              )}
            </div>
            
            {/* Quick Specs Strip - Luxury treatment */}
            <div className="bg-gradient-to-r from-muted/40 to-muted/60 rounded-xl p-4 border border-border/30">
              <div className="flex justify-between items-center text-sm">
                {getShaftLength() && (
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-primary/10">
                      <Ruler className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">{getShaftLength()}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-primary/10">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{getStartType()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-primary/10">
                    <Gamepad2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{getControlType()}</span>
                </div>
              </div>
            </div>
            
            {/* Premium Pricing Section */}
            <div className="space-y-3 bg-gradient-to-br from-background to-muted/20 p-6 rounded-xl border border-border/20">
              {(() => {
                const priceState = getPriceDisplayState(msrp, price, true);
                
                if (priceState.callForPrice) {
                  return <div className="text-3xl font-bold text-card-foreground">Call for Price</div>;
                }
                
                const displayMSRP = priceState.isArtificialDiscount && msrp ? Math.round(msrp * 1.1) : msrp;
                const displaySalePrice = priceState.isArtificialDiscount ? msrp : (price || msrp);
                
                return (
                  <div className="space-y-2">
                    {displayMSRP && priceState.hasSale && (
                      <div className="text-sm text-muted-foreground line-through font-medium tracking-wide">
                        MSRP ${displayMSRP.toLocaleString()}
                      </div>
                    )}
                    {displaySalePrice && (
                      <div className="text-4xl font-bold text-red-600 tracking-tight">
                        ${displaySalePrice.toLocaleString()}
                      </div>
                    )}
                    {priceState.hasSale && priceState.savingsRounded > 0 && (
                      <div className="text-xl font-bold text-green-600 tracking-wide">
                        You Save ${priceState.savingsRounded.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Luxury Availability Badge */}
            <div className="flex flex-col items-center space-y-3">
              <Badge className={`${stockInfo.className} px-4 py-2 text-sm font-semibold rounded-full shadow-lg border border-white/20`}>
                <stockInfo.icon className="w-4 h-4 mr-2" />
                {stockInfo.status === "In Stock" ? "In Stock Today" : "Factory Order – 2-3 Weeks"}
              </Badge>
              
              {/* Dynamic Promo Badge System */}
              {getPromoContent() && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-blue-500/20">
                  {getPromoContent()}
                </div>
              )}
            </div>
            
            {/* Financing Info */}
            {(() => {
              const priceState = getPriceDisplayState(msrp, price, true);
              const displaySalePrice = priceState.isArtificialDiscount ? msrp : (price || msrp);
              
              if (financingInfo && displaySalePrice && displaySalePrice > 5000) {
                return (
                  <div className="text-xs text-muted-foreground text-center">
                    {getFinancingDisplay(displaySalePrice * 1.13, promo?.rate || null)}*
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Premium CTA Button */}
            <Button 
              onClick={handleMoreInfoClick}
              variant="luxury"
              className="w-full font-bold py-4 text-lg rounded-xl"
              size="lg"
            >
              Request a Quote
            </Button>
          </div>
        </div>
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
