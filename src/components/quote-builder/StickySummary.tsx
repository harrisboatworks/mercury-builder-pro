"use client";
import { money } from "@/lib/money";
import CoverageComparisonTooltip from "@/components/quote-builder/CoverageComparisonTooltip";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type StickySummaryProps = {
  packageLabel: string;
  yourPriceBeforeTax: number;
  totalSavings: number;
  monthly?: number;
  bullets?: string[];
  onReserve: () => void;
  depositAmount?: number;
  coverageYears?: number;
  monthlyDelta?: number; // extra per-month for warranty, precomputed upstream
  promoWarrantyYears?: number; // optional: show "+X yrs promo"
  onDownloadPDF?: () => void;
};

export default function StickySummary({
  packageLabel,
  yourPriceBeforeTax,
  totalSavings,
  monthly,
  bullets = [],
  onReserve,
  depositAmount = 200,
  coverageYears,
  monthlyDelta,
  promoWarrantyYears,
  onDownloadPDF,
}: StickySummaryProps) {
  return (
    <>
      {/* Desktop sticky card */}
      <aside
        aria-label="Summary"
        className="sticky top-4 hidden h-fit rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:block"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {packageLabel}
        </div>
        
        <div className="mt-1">
          <CoverageComparisonTooltip />
        </div>

        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {money(yourPriceBeforeTax)}
        </div>

        <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {monthly != null && (
            <>From <span className="font-semibold">{money(Math.round(monthly))}/mo</span> • </>
          )}
          You save <span className="font-semibold">{money(totalSavings)}</span>
        </div>

        {typeof coverageYears === "number" && (
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Coverage: <span className="font-medium">{coverageYears} years total</span>
          </div>
        )}
        {typeof monthlyDelta === "number" && monthlyDelta > 0 && (
          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            +{money(Math.round(monthlyDelta))}/mo for Extended Warranty
          </div>
        )}
        {promoWarrantyYears ? (
          <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            Includes +{promoWarrantyYears} yrs promo warranty
          </div>
        ) : null}

        <ul className="mt-3 space-y-0.5 lg:space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {bullets.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500 flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2">
          {onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF Quote
            </Button>
          )}

          <button
            onClick={onReserve}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-white shadow-sm transition hover:scale-[1.01] hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Reserve with {money(depositAmount)} refundable deposit
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/80 lg:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 p-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{packageLabel}</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{money(yourPriceBeforeTax)}</div>
            {monthly != null && (
              <div className="text-xs text-slate-600 dark:text-slate-300">From {money(Math.round(monthly))}/mo</div>
            )}
          </div>
          <button
            onClick={onReserve}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm transition hover:scale-[1.02] hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Reserve
          </button>
        </div>
      </div>
    </>
  );
}