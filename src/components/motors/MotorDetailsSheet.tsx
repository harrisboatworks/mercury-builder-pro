"use client";
import React, { useEffect } from "react";

const money = (n:number)=>n.toLocaleString("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0});

export default function MotorDetailsSheet({
  open, onClose,
  title, subtitle, img, gallery=[],
  msrp, price, promoText, description,
  hp, shaft, weightLbs, altOutput, steering, features=[],
  specSheetUrl
}:{
  open:boolean; onClose:()=>void;
  title:string; subtitle?:string; img?:string|null; gallery?:string[];
  msrp?:number|null; price?:number|null; promoText?:string|null; description?:string|null;
  hp?:number|string; shaft?:string; weightLbs?:number|string; altOutput?:string; steering?:string; features?:string[];
  specSheetUrl?:string|null;
}) {
  // Handle escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    // Prevent scroll on body when sheet is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  
  if(!open) return null;
  
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 grid gap-4 sm:grid-cols-[160px_1fr]">
          {img && <img src={img} alt="" className="h-36 w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-800" />}
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
            {subtitle && <div className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</div>}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              {typeof msrp==="number" && <span className="text-slate-500 line-through">{money(msrp)}</span>}
              {typeof price==="number" && <span className="font-semibold">{money(price)}</span>}
              {promoText && <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">{promoText}</span>}
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="mt-3 grid gap-2 text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {hp && <div><span className="text-slate-500">Horsepower</span><div className="font-medium">{hp}</div></div>}
            {shaft && <div><span className="text-slate-500">Shaft</span><div className="font-medium">{shaft}</div></div>}
            {weightLbs && <div><span className="text-slate-500">Weight</span><div className="font-medium">{weightLbs} lb</div></div>}
            {altOutput && <div><span className="text-slate-500">Alternator</span><div className="font-medium">{altOutput}</div></div>}
            {steering && <div><span className="text-slate-500">Steering</span><div className="font-medium capitalize">{steering}</div></div>}
          </div>

          {features?.length ? (
            <div className="mt-2">
              <div className="text-slate-500">Highlights</div>
              <ul className="mt-1 grid list-disc gap-1 pl-5">
                {features.slice(0,6).map((f,i)=><li key={i} className="text-slate-800 dark:text-slate-200">{f}</li>)}
              </ul>
            </div>
          ) : null}

          {description && <p className="mt-2 text-slate-700 dark:text-slate-300">{description}</p>}

          {specSheetUrl && (
            <a href={specSheetUrl} target="_blank" rel="noopener noreferrer"
               className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
              Download spec sheet (PDF)
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Close</button>
        </div>
      </div>
    </div>
  );
}