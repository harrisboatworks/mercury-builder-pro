"use client";
import React from "react";
import { money } from "@/lib/money";
import { useActivePromotions } from "@/hooks/useActivePromotions";
import { Calendar, Percent, DollarSign } from "lucide-react";

type Props = {
  model?: string;
  total?: number | null;
  monthly?: number | null;
  coverageYears?: number | null;
  stepLabel?: string | null;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  deltaOnce?: { cash?: number | null; monthly?: number | null } | null;
  // Selected promo option for "Choose One" promotions
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoDisplay?: string | null;
  // Indicates financing is unavailable (total < $5,000)
  financingUnavailable?: boolean;
};

export default function StickyQuoteBar({
  model,
  total,
  monthly,
  coverageYears,
  stepLabel,
  primaryLabel = "Continue",
  onPrimary,
  secondaryLabel = "Change",
  onSecondary,
  deltaOnce,
  selectedPromoOption,
  selectedPromoDisplay,
  financingUnavailable
}: Props) {
  const [showDelta, setShowDelta] = React.useState(true);
  React.useEffect(() => {
    if (!deltaOnce?.cash && !deltaOnce?.monthly) return;
    const t = setTimeout(() => setShowDelta(false), 2400);
    return () => clearTimeout(t);
  }, [deltaOnce?.cash, deltaOnce?.monthly]);

  const { getWarrantyPromotions } = useActivePromotions();
  const promos = getWarrantyPromotions?.() ?? [];

  return (
    <div
      role="region"
      aria-label="Quote summary"
      className="sticky bottom-0 z-30 border-t border-slate-300/50 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/90"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 p-2.5 sm:flex-row sm:items-center sm:gap-2.5 sm:p-3 lg:gap-4 sm:justify-between">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {model && <div className="text-sm md:text-base font-semibold text-slate-900 leading-tight truncate">{model}</div>}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-700 font-light">
            {typeof total === "number" && <span><span className="hidden md:inline">Total: </span><span className="font-semibold">{money(total)}</span></span>}
            {typeof monthly === "number" && monthly > 0 ? (
              <span>≈ {money(Math.round(monthly))}/mo<span className="hidden md:inline"> OAC</span></span>
            ) : financingUnavailable ? (
              <span className="text-slate-400 text-[10px] md:text-xs">Financing N/A</span>
            ) : null}
            {typeof coverageYears === "number" && coverageYears > 0 && (
              <span>
                <span className="md:hidden">{coverageYears}yr</span>
                <span className="hidden md:inline">{coverageYears} yrs coverage</span>
              </span>
            )}
            {promos.map(p => (
              <span key={p.id} className="hidden lg:inline rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {p.bonus_title || `+${p.warranty_extra_years} yrs warranty`}
              </span>
            ))}
            {/* Selected Promo Option Badge */}
            {selectedPromoOption && (
              <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                selectedPromoOption === 'no_payments' 
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : selectedPromoOption === 'special_financing'
                  ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                  : 'bg-green-50 text-green-700 ring-1 ring-green-200'
              }`}>
                {selectedPromoOption === 'no_payments' && <Calendar className="w-3 h-3" />}
                {selectedPromoOption === 'special_financing' && <Percent className="w-3 h-3" />}
                {selectedPromoOption === 'cash_rebate' && <DollarSign className="w-3 h-3" />}
                <span className="hidden md:inline">{selectedPromoDisplay}</span>
                <span className="md:hidden">
                  {selectedPromoOption === 'no_payments' && 'No Payments'}
                  {selectedPromoOption === 'special_financing' && 'Low APR'}
                  {selectedPromoOption === 'cash_rebate' && 'Rebate'}
                </span>
              </span>
            )}
            {stepLabel && <span className="hidden lg:inline text-slate-500 ml-auto">{stepLabel}</span>}
            {showDelta && deltaOnce && (deltaOnce.cash || deltaOnce.monthly) && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {deltaOnce.cash ? `+${money(deltaOnce.cash)}` : ""}{deltaOnce.cash && deltaOnce.monthly ? " • " : ""}{deltaOnce.monthly ? `+${money(Math.round(deltaOnce.monthly))}/mo` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row flex-nowrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 shrink-0 mt-1 sm:mt-0">
          {onSecondary && (
            <button onClick={onSecondary} className="rounded-lg border border-slate-300 px-2.5 py-2 sm:px-3.5 lg:px-4 text-xs md:text-sm font-light text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all min-h-[44px] whitespace-nowrap">
              {secondaryLabel}
            </button>
          )}
          {onPrimary && (
            <button onClick={onPrimary} className="rounded-lg bg-slate-900 px-3 py-2 sm:px-3.5 lg:px-4 text-xs md:text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-slate-700 min-h-[44px] whitespace-nowrap">
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}