"use client";
import React from "react";
import { decodeModelName } from "@/lib/motor-helpers";

export default function MotorQuickInfo({
  hp, shaft, weightLbs, altOutput, steering, model
}:{
  hp?: number|string; shaft?: string; weightLbs?: number|string; altOutput?: string; steering?: string; model?: string;
}) {
  return (
    <div role="tooltip" className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-1">
        {hp && <div><span className="text-slate-500">Horsepower:</span> <span className="font-medium">{hp}</span></div>}
        {model && (() => {
          console.log('MotorQuickInfo - model:', model);
          const decoded = decodeModelName(model);
          console.log('MotorQuickInfo - decoded:', decoded);
          return decoded.length > 0 ? (
            <div className="mt-1 rounded bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {decoded.slice(0, 6).map((item, i) => (
                <div key={i} className="truncate">
                  {item.code} - {item.meaning}
                </div>
              ))}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}