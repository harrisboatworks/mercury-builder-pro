"use client";
import React from "react";
import { money } from "@/lib/money";

type Props = {
  model?: string;               // ex: "2025 FourStroke 40HP Command Thrust ELPT"
  totalWithTax?: number;        // read from state.totals.total (or equivalent)
  monthly?: number | null;      // read from financing hook if available
  coverageYears?: number | null;// from state.warrantyConfig.totalYears
  onPrimary?: () => void;       // Continue / Reserve
  primaryLabel?: string;        // default "Continue"
  onSecondary?: () => void;     // Change Motor or Edit
  secondaryLabel?: string;      // default "Change"
  deltaOnce?: { cash?: number | null; monthly?: number | null } | null; // optional one-shot price delta visual
};

export default function StickyQuoteBar({
  model,
  totalWithTax,
  monthly,
  coverageYears,
  onPrimary,
  primaryLabel = "Continue",
  onSecondary,
  secondaryLabel = "Change",
  deltaOnce
}: Props) {
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    if (!deltaOnce?.cash && !deltaOnce?.monthly) return;
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [deltaOnce?.cash, deltaOnce?.monthly]);

  return (
    <div className="sticky bottom-0 z-50 border-t border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-700 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {model && <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{model}</div>}
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            {typeof totalWithTax === "number" && <span>Total: <span className="font-semibold">{money(totalWithTax)}</span></span>}
            {typeof monthly === "number" && monthly > 0 && <span>≈ {money(Math.round(monthly))}/mo OAC</span>}
            {typeof coverageYears === "number" && coverageYears > 0 && <span>{coverageYears} yrs coverage</span>}
            {show && deltaOnce && (deltaOnce.cash || deltaOnce.monthly) ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-800">
                {deltaOnce.cash ? `+${money(deltaOnce.cash)}` : ""}{deltaOnce.cash && deltaOnce.monthly ? " • " : ""}{deltaOnce.monthly ? `+${money(Math.round(deltaOnce.monthly))}/mo` : ""}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {onSecondary && (
            <button onClick={onSecondary} className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex-none">
              {secondaryLabel}
            </button>
          )}
          {onPrimary && (
            <button onClick={onPrimary} className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.01] hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-none">
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}