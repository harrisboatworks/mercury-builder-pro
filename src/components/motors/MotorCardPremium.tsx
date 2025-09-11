"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import MotorQuickInfo from "./MotorQuickInfo";
import MotorDetailsSheet from './MotorDetailsSheet';
import type { Motor } from '../../lib/motor-helpers';
import { getHPDescriptor, getPopularityIndicator, getBadgeColor } from '../../lib/motor-helpers';
import { useIsMobile } from "@/hooks/use-mobile";

export default function MotorCardPremium({ 
  img, 
  title, 
  hp, 
  msrp, 
  price, 
  monthly, 
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
  motor
}: {
  img?: string | null;
  title: string;
  hp?: number | string;
  msrp?: number | null;
  price?: number | null;
  monthly?: number | null;
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
}) {
  const fmt = (n?: number | null) => (typeof n === "number" ? `$${n.toLocaleString()}` : undefined);
  const hpNum = typeof hp === "string" ? parseFloat(hp) : (typeof hp === "number" ? hp : undefined);
  const isMobile = useIsMobile();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  
  // Check if device has fine pointer (mouse) for hover
  const hasHover = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  
  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    setShowDetailsSheet(true);
  };
  
  const handleTooltipMouseEnter = () => {
    console.log('Motor card hover enter:', { title, model: motor?.model, isMobile, hasHover });
    // Simplified: show tooltip on desktop regardless of hasHover for debugging
    if (!isMobile) {
      setShowTooltip(true);
    }
  };
  
  const handleTooltipMouseLeave = () => {
    console.log('Motor card hover leave');
    setShowTooltip(false);
  };
  
  return (
    <>
      <div className="relative">
        <button 
          onClick={handleMoreInfoClick} 
          className="motor-card-premium text-left w-full transition-all duration-200 border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 hover:shadow-md"
        >
          {/* Image and title area - hover for tooltip */}
          <div 
            className="relative"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {img && (
              <img 
                src={img} 
                alt="" 
                className="mb-3 h-40 w-full rounded-lg object-contain bg-white dark:bg-slate-900" 
              />
            )}
            <div className="text-[15px] font-semibold text-slate-900 dark:text-white">
              {title}
            </div>
            {hpNum && (
              <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                {hpNum} HP
              </div>
            )}
            
            {/* HP-based descriptor and popularity indicators */}
            {hpNum && (
              <div className="mt-1 space-y-1">
                {/* HP-based descriptor - always show */}
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {getHPDescriptor(hpNum)}
                </p>
                
                {/* Popularity indicator - only show if exists */}
                {(() => {
                  const badge = getPopularityIndicator(title);
                  return badge ? (
                    <p className={`text-xs font-medium ${getBadgeColor(badge)}`}>
                      {badge}
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          
          <div className="mt-2">
            {typeof msrp === "number" && msrp > 0 && (
              <div className="msrp text-sm">{fmt(msrp)}</div>
            )}
            {typeof price === "number" && price > 0 && (
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {fmt(price)}
              </div>
            )}
            {promoText && (
              <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                {promoText}
              </div>
            )}
            {typeof monthly === "number" && monthly > 0 && (
              <div className="text-xs text-slate-500">
                from ~${Math.round(monthly)}/mo OAC
              </div>
            )}
          </div>
        </button>
        
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
          onClose={() => setShowDetailsSheet(false)}
          onSelect={onSelect}
          title={title}
          subtitle={hpNum ? `${hpNum} HP Mercury Outboard` : undefined}
          img={img}
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