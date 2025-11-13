"use client";
import React from "react";
import { money } from "@/lib/money";
import { useActivePromotions } from "@/hooks/useActivePromotions";

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
  deltaOnce
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
      className="sticky bottom-0 z-30 border-t border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 p-2.5 md:flex-row md:items-center md:gap-3 md:p-3 md:justify-between lg:gap-4">
        <div className="min-w-0 flex-1">
          {model && <div className="text-sm md:text-base font-semibold text-slate-900 leading-tight truncate">{model}</div>}
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-700 font-light">
            {typeof total === "number" && <span><span className="hidden md:inline">Total: </span><span className="font-semibold">{money(total)}</span></span>}
            {typeof monthly === "number" && monthly > 0 && <span>≈ {money(Math.round(monthly))}/mo<span className="hidden md:inline"> OAC</span></span>}
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
            {stepLabel && <span className="hidden lg:inline text-slate-500 ml-auto">{stepLabel}</span>}
            {showDelta && deltaOnce && (deltaOnce.cash || deltaOnce.monthly) && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {deltaOnce.cash ? `+${money(deltaOnce.cash)}` : ""}{deltaOnce.cash && deltaOnce.monthly ? " • " : ""}{deltaOnce.monthly ? `+${money(Math.round(deltaOnce.monthly))}/mo` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row flex-nowrap items-center gap-1.5 md:gap-2.5 shrink-0 mt-1 md:mt-0">
          {onSecondary && (
            <button onClick={onSecondary} className="rounded-lg border border-slate-300 px-2.5 py-2 md:px-4 text-xs md:text-sm font-light text-slate-700 hover:opacity-80 transition-opacity min-h-[44px] whitespace-nowrap">
              {secondaryLabel}
            </button>
          )}
          {onPrimary && (
            <button onClick={onPrimary} className="rounded-lg bg-blue-600 px-3 py-2 md:px-4 text-xs md:text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] whitespace-nowrap">
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}