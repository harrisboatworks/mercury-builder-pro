"use client";
import React, { useState } from "react";
import { Info } from "lucide-react";
import MotorQuickInfo from "./MotorQuickInfo";
import MotorDetailsSheet from "./MotorDetailsSheet";
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
  specSheetUrl
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
    if (!isMobile && hasHover) {
      setShowTooltip(true);
    }
  };
  
  const handleTooltipMouseLeave = () => {
    setShowTooltip(false);
  };
  
  return (
    <>
      <div className="relative">
        <button 
          onClick={onSelect} 
          aria-pressed={!!selected}
          className={`motor-card-premium text-left w-full transition-all duration-200 ${
            selected 
              ? "border-blue-600 ring-2 ring-blue-600/15 shadow-lg" 
              : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
          }`}
        >
          {/* Tooltip trigger area - image and title */}
          <div 
            className="relative"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {img && (
              <img 
                src={img} 
                alt="" 
                className="mb-3 h-40 w-full rounded-lg object-contain bg-slate-50 dark:bg-slate-800" 
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
        
        {/* More info button - always visible */}
        <button
          onClick={handleMoreInfoClick}
          className="absolute top-2 right-2 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:bg-slate-800/80 dark:hover:bg-slate-800"
          aria-label="More details"
        >
          <Info className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
        </button>
        
        {/* Desktop hover tooltip */}
        {showTooltip && !isMobile && hasHover && (
          <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2">
            <MotorQuickInfo
              hp={hpNum}
              shaft={shaft}
              weightLbs={weightLbs}
              altOutput={altOutput}
              steering={steering}
              promoText={promoText}
            />
          </div>
        )}
      </div>
      
      {/* Mobile/click details sheet */}
      <MotorDetailsSheet
        open={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
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
      />
    </>
  );
}