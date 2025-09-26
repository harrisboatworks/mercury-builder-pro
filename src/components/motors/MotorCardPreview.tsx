"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import MotorDetailsSheet from './MotorDetailsSheet';
import { Button } from '@/components/ui/button';
import type { Motor } from '../../lib/motor-helpers';
import { isTillerMotor, getMotorImageByPriority, getMotorImageGallery } from '../../lib/motor-helpers';
import { useActivePromotions } from '@/hooks/useActivePromotions';
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
  const hpNum = typeof hp === "string" ? parseFloat(hp) : (typeof hp === "number" ? hp : undefined);
  const { promotions } = useActivePromotions();
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Get the best available image URL using priority logic
  const [imageInfo, setImageInfo] = useState<{ url: string }>({
    url: img || '/lovable-uploads/speedboat-transparent.png'
  });

  useEffect(() => {
    const loadImageInfo = async () => {
      try {
        if (img && img !== '/lovable-uploads/speedboat-transparent.png') {
          setImageInfo({ url: img });
          return;
        }

        const { url: primaryImageUrl } = await getMotorImageByPriority(motor);
        const finalUrl = primaryImageUrl !== '/lovable-uploads/speedboat-transparent.png' 
          ? primaryImageUrl 
          : (img || '/lovable-uploads/speedboat-transparent.png');
        
        setImageInfo({ url: finalUrl });
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

  // Get control type
  const getControlType = () => {
    if (motor && isTillerMotor(motor.model || title)) return "Tiller Steering";
    return "Remote Control";
  };

  // Check for warranty promotion
  const hasWarrantyPromo = promotions.some(promo => 
    promo.warranty_extra_years && promo.warranty_extra_years > 0
  );

  const warrantyYears = promotions.find(promo => promo.warranty_extra_years)?.warranty_extra_years || 0;

  return (
    <>
      <div className="bg-[hsl(var(--luxury-white))] rounded-none shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-0.5 group">
        <div className="relative">
          {/* Image Section */}
          {imageUrl && (
            <div className="relative bg-[hsl(var(--luxury-light-gray))] p-8">
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-48 w-full object-contain" 
              />
              
              {/* HP Badge */}
              {hpNum && (
                <div className="absolute top-4 right-4 bg-[hsl(var(--luxury-black))] text-[hsl(var(--luxury-white))] px-3 py-1 text-xs font-light tracking-wider">
                  {hpNum} HP
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
          
          {/* Content Section */}
          <div className="p-8 space-y-6">
            {/* Model Information */}
            <div className="space-y-2">
              <h3 className="text-xl font-light tracking-wider text-[hsl(var(--luxury-black))] uppercase">
                {title}
              </h3>
              {motor?.model_number && (
                <p className="text-xs text-[hsl(var(--luxury-medium-gray))] tracking-widest">
                  MODEL {motor.model_number}
                </p>
              )}
            </div>
            
            {/* Specifications */}
            <div className="flex gap-4 text-xs text-[hsl(var(--luxury-medium-gray))] pt-4 border-t border-[hsl(var(--luxury-light-gray))]">
              <span>{getStartType()}</span>
              <span className="text-[hsl(var(--luxury-light-gray))]">|</span>
              <span>{getControlType()}</span>
              {getShaftLength() && (
                <>
                  <span className="text-[hsl(var(--luxury-light-gray))]">|</span>
                  <span>{getShaftLength()} Shaft</span>
                </>
              )}
            </div>
            
            {/* Lead Time Badge */}
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--luxury-light-gray))] px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-[hsl(var(--luxury-medium-gray))]">2-3 Weeks Delivery</span>
            </div>

            {/* Warranty Badge */}
            {hasWarrantyPromo && warrantyYears > 0 && (
              <div className="text-xs text-[hsl(var(--luxury-mercury-blue))]">
                ✓ Extended Coverage (+{warrantyYears} Years)
              </div>
            )}
            
            {/* Pricing Section */}
            <div className="space-y-2 pt-6">
              {msrp && price && msrp !== price && (
                <p className="text-xs text-[hsl(var(--luxury-medium-gray))] line-through">
                  ${msrp.toLocaleString()}
                </p>
              )}
              
              {(price || msrp) && (
                <p className="text-3xl font-light text-[hsl(var(--luxury-deep-red))]">
                  ${(price || msrp)?.toLocaleString()}
                </p>
              )}
              
              {!price && !msrp && (
                <p className="text-2xl font-light text-[hsl(var(--luxury-dark-gray))]">
                  Call for Price
                </p>
              )}
            </div>
            
            {/* CTA Button */}
            <Button 
              variant="luxuryConfigure"
              className="w-full mt-8"
              onClick={handleMoreInfoClick}
            >
              Configure
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