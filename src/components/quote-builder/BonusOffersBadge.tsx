"use client";
import { useActivePromotions } from "@/hooks/useActivePromotions";
import { Link } from "react-router-dom";
import { Gift, Shield, Calendar, Percent, DollarSign, ChevronRight } from "lucide-react";

function daysLeft(end: string | null) {
  if (!end) return null;
  const now = new Date();
  const d = new Date(end);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24));
  return diff < 0 ? 0 : diff;
}

export default function CurrentPromotions() {
  const { promotions, getChooseOneOptions } = useActivePromotions();
  const promos = promotions ?? [];
  if (!promos.length) return null;

  const p = promos[0];
  const left = daysLeft(p.end_date);
  const chooseOneOptions = getChooseOneOptions?.() ?? [];
  const isChooseOne = chooseOneOptions.length > 0;

  return (
    <div className="rounded-2xl border border-repower-navy-900/10 bg-white p-5 shadow-sm  ">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-repower-navy-900/400 ">
              Current Promotion
            </div>
            {left !== null && (
              <div className="rounded-full bg-repower-cream px-2.5 py-0.5 text-xs font-medium text-repower-navy-900 ring-1 ring-inset ring-repower-navy-900/20   ">
                {left} day{left === 1 ? "" : "s"} left
              </div>
            )}
          </div>
          
          {/* Main promo title */}
          <div className="text-base font-medium text-repower-navy-900 ">
            {p.bonus_title || p.name}
          </div>
          
          {/* Warranty badge */}
          {p.warranty_extra_years && (
            <div className="inline-flex items-center gap-2 bg-repower-cream text-repower-gold px-3 py-1.5 rounded-lg text-sm  ">
              <Shield className="w-4 h-4" />
              <span className="font-medium">7 Years Factory Coverage</span>
              <span className="text-repower-gold ">(3 + 4 FREE)</span>
            </div>
          )}
          
          {/* Choose One options summary */}
          {isChooseOne && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {chooseOneOptions.slice(0, 3).map((option) => (
                <div 
                  key={option.id}
                  className="flex items-center gap-1.5 text-xs text-repower-navy-900/65 "
                >
                  {option.id === 'no_payments' && <Calendar className="w-3.5 h-3.5 text-repower-navy-9000" />}
                  {option.id === 'special_financing' && <Percent className="w-3.5 h-3.5 text-repower-navy-9000" />}
                  {option.id === 'cash_rebate' && <DollarSign className="w-3.5 h-3.5 text-repower-gold0" />}
                  <span className="truncate">{option.title}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Description if no choose-one */}
          {!isChooseOne && p.bonus_description && (
            <div className="text-sm text-repower-navy-900/65 ">
              {p.bonus_description}
            </div>
          )}
        </div>
        
        {/* Link to promotions page */}
        <Link 
          to="/promotions" 
          className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}