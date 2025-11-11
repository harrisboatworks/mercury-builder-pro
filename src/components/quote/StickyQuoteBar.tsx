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
      className="sticky bottom-0 z-50 border-t border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:border-slate-700 dark:bg-slate-900/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1 p-2 sm:gap-2 sm:p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {model && <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-tight">{model}</div>}
          <div className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {typeof total === "number" && <span><span className="hidden sm:inline">Total: </span><span className="font-semibold">{money(total)}</span></span>}
            {typeof monthly === "number" && monthly > 0 && <span>≈ {money(Math.round(monthly))}/mo<span className="hidden sm:inline"> OAC</span></span>}
            {typeof coverageYears === "number" && coverageYears > 0 && <span className="sm:hidden">{coverageYears}yr</span>}
            {typeof coverageYears === "number" && coverageYears > 0 && <span className="hidden sm:inline">{coverageYears} yrs coverage</span>}
            {promos.map(p => (
              <span key={p.id} className="hidden sm:inline rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                {p.bonus_title || `+${p.warranty_extra_years} yrs warranty`}
              </span>
            ))}
            {stepLabel && <span className="hidden sm:inline text-slate-500">{stepLabel}</span>}
            {showDelta && deltaOnce && (deltaOnce.cash || deltaOnce.monthly) && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-800">
                {deltaOnce.cash ? `+${money(deltaOnce.cash)}` : ""}{deltaOnce.cash && deltaOnce.monthly ? " • " : ""}{deltaOnce.monthly ? `+${money(Math.round(deltaOnce.monthly))}/mo` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onSecondary && (
            <button onClick={onSecondary} className="rounded-lg border border-slate-300 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
              {secondaryLabel}
            </button>
          )}
          {onPrimary && (
            <button onClick={onPrimary} className="rounded-lg bg-blue-600 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500">
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}