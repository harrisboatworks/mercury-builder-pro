"use client";
import React from "react";

export default function MotorCardPremium({ 
  img, 
  title, 
  hp, 
  msrp, 
  price, 
  monthly, 
  promoText, 
  selected, 
  onSelect 
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
}) {
  const fmt = (n?: number | null) => (typeof n === "number" ? `$${n.toLocaleString()}` : undefined);
  const hpNum = typeof hp === "string" ? parseFloat(hp) : (typeof hp === "number" ? hp : undefined);
  
  return (
    <button 
      onClick={onSelect} 
      aria-pressed={!!selected}
      className={`motor-card-premium text-left w-full transition-all duration-200 ${
        selected 
          ? "border-blue-600 ring-2 ring-blue-600/15 shadow-lg" 
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
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
  );
}