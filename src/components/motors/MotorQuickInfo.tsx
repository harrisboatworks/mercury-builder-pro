"use client";
import React from "react";
import { decodeModelName, cleanMotorName } from "@/lib/motor-helpers";

export default function MotorQuickInfo({
  hp, shaft, weightLbs, altOutput, steering, model
}:{
  hp?: number|string; shaft?: string; weightLbs?: number|string; altOutput?: string; steering?: string; model?: string;
}) {
  return (
    <div role="tooltip" className="rounded-xl border bg-card p-3 text-sm shadow-xl">
      <div className="grid gap-1">
        {hp && <div><span className="text-muted-foreground">Horsepower:</span> <span className="font-medium">{hp}</span></div>}
        {weightLbs && <div><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{weightLbs} lbs</span></div>}
        {model && (() => {
          // Defensive cleaning for any HTML artifacts that might slip through
          let cleanModel = model;
          if (typeof model === 'string' && (model.includes('<') || model.includes('>'))) {
            cleanModel = model.replace(/<[^>]*>/g, '').trim();
            console.warn('MotorQuickInfo - cleaned HTML from model:', model, '->', cleanModel);
          }
          
          // Add automatic Power Trim for motors 40 HP and above
          const motorHP = typeof hp === 'string' ? parseInt(hp) : hp;
          
          const cleanedModel = cleanMotorName(cleanModel);
          console.log('MotorQuickInfo - model:', cleanModel);
          console.log('MotorQuickInfo - cleaned:', cleanedModel);
          const decoded = decodeModelName(cleanedModel, motorHP);
          const enhancedDecoded = [...decoded];
          if (motorHP && motorHP >= 40 && !decoded.some(item => item.code === 'PT')) {
            enhancedDecoded.unshift({
              code: 'PT',
              meaning: 'Power Trim & Tilt',
              benefit: 'Standard on all Mercury motors 40 HP and above'
            });
          }
          
          return enhancedDecoded.length > 0 ? (
            <div className="mt-1 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {enhancedDecoded.slice(0, 6).map((item, i) => (
                <div key={i} className="truncate">
                  <span className="font-semibold">{item.code}</span> - {item.meaning}
                </div>
              ))}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}