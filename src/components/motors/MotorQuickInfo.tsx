"use client";
import React from "react";

export default function MotorQuickInfo({
  hp, shaft, weightLbs, altOutput, steering, promoText
}:{
  hp?: number|string; shaft?: string; weightLbs?: number|string; altOutput?: string; steering?: string; promoText?: string|null;
}) {
  return (
    <div role="tooltip" className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-1">
        {hp && <div><span className="text-slate-500">Horsepower:</span> <span className="font-medium">{hp}</span></div>}
        {shaft && <div><span className="text-slate-500">Shaft:</span> <span className="font-medium">{shaft}</span></div>}
        {weightLbs && <div><span className="text-slate-500">Weight:</span> <span className="font-medium">{weightLbs} lb</span></div>}
        {altOutput && <div><span className="text-slate-500">Alternator:</span> <span className="font-medium">{altOutput}</span></div>}
        {steering && <div><span className="text-slate-500">Steering:</span> <span className="font-medium">{steering}</span></div>}
        {promoText && <div className="mt-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">{promoText}</div>}
      </div>
    </div>
  );
}