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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Current Promotion
            </div>
            {left !== null && (
              <div className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                {left} day{left === 1 ? "" : "s"} left
              </div>
            )}
          </div>
          
          {/* Main promo title */}
          <div className="text-base font-medium text-slate-900 dark:text-white">
            {p.bonus_title || p.name}
          </div>
          
          {/* Warranty badge */}
          {p.warranty_extra_years && (
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm dark:bg-green-900/20 dark:text-green-300">
              <Shield className="w-4 h-4" />
              <span className="font-medium">7 Years Factory Coverage</span>
              <span className="text-green-600 dark:text-green-400">(3 + 4 FREE)</span>
            </div>
          )}
          
          {/* Choose One options summary */}
          {isChooseOne && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {chooseOneOptions.slice(0, 3).map((option) => (
                <div 
                  key={option.id}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  {option.id === 'no_payments' && <Calendar className="w-3.5 h-3.5 text-blue-500" />}
                  {option.id === 'special_financing' && <Percent className="w-3.5 h-3.5 text-purple-500" />}
                  {option.id === 'cash_rebate' && <DollarSign className="w-3.5 h-3.5 text-green-500" />}
                  <span className="truncate">{option.title}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Description if no choose-one */}
          {!isChooseOne && p.bonus_description && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
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