"use client";
import React, { useRef, useState } from "react";
import { Info } from "lucide-react";
import MotorDetailsSheet from './MotorDetailsSheet';
import MotorQuickInfoPopover from "./MotorQuickInfoPopover";
import type { Motor } from '../../lib/motor-helpers';
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
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  
  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    setShowDetailsSheet(true);
  };
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoOpen(!infoOpen);
  };
  
  return (
    <div ref={cardRef} className="relative min-h-[108px]">
      <button 
        onClick={onSelect} 
        aria-pressed={!!selected}
        className={`motor-card-premium text-left w-full transition-all duration-200 ${
          selected 
            ? "border-blue-600 ring-2 ring-blue-600/15 shadow-lg" 
            : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
        }`}
      >
        {/* Motor content */}
        <div className="relative">
          {img && (
            <img 
              src={img} 
              alt="" 
              className="mb-3 h-40 w-full rounded-lg object-contain bg-slate-50 dark:bg-slate-800" 
            />
          )}
          <h3 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          {hpNum && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {hpNum} HP
            </div>
          )}
        </div>
        
        <div className="mt-1">
          {typeof msrp === "number" && msrp > 0 && (
            <div className="msrp text-sm">{fmt(msrp)}</div>
          )}
          {typeof price === "number" && price > 0 && (
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {fmt(price)}
            </div>
          )}
          {promoText && (
            <div className="mt-1">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                {promoText}
              </span>
            </div>
          )}
          {typeof monthly === "number" && monthly > 0 && (
            <div className="text-xs text-slate-500">
              from ~${Math.round(monthly)}/mo OAC
            </div>
          )}
        </div>
      </button>
      
      {/* Info button - triggers popover */}
      <button
        onClick={handleInfoClick}
        className="absolute top-2 right-2 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:bg-slate-800/80 dark:hover:bg-slate-800"
        aria-label="More info"
      >
        <Info className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
      </button>

      <MotorQuickInfoPopover
        anchorEl={cardRef.current}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        content={
          <div className="grid gap-1">
            {hpNum && <div><span className="text-muted-foreground">Horsepower:</span> <span className="font-medium">{hpNum}</span></div>}
            {shaft && <div><span className="text-muted-foreground">Shaft:</span> <span className="font-medium">{shaft}</span></div>}
            {weightLbs && <div><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{weightLbs} lb</span></div>}
            {altOutput && <div><span className="text-muted-foreground">Alternator:</span> <span className="font-medium">{altOutput}</span></div>}
            {steering && <div><span className="text-muted-foreground">Steering:</span> <span className="font-medium capitalize">{steering}</span></div>}
            {promoText && <div className="mt-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">{promoText}</div>}
          </div>
        }
      />

      {/* Mobile/click details sheet */}
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
      />
    </div>
  );
}