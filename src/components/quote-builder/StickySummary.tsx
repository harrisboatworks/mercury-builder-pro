"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { money } from "@/lib/money";
import CoverageComparisonTooltip from "@/components/quote-builder/CoverageComparisonTooltip";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, ArrowUp, Sparkles, ChevronUp, Check, Mail, MessageSquare, Calendar } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

type StickySummaryProps = {
  packageLabel: string;
  yourPriceBeforeTax: number;
  totalSavings: number;
  monthly?: number;
  bullets?: string[];
  onReserve: () => void;
  depositAmount?: number;
  coverageYears?: number;
  monthlyDelta?: number;
  promoWarrantyYears?: number;
  onDownloadPDF?: () => void;
  onSaveForLater?: () => void;
  onApplyForFinancing?: () => void;
  isGeneratingPDF?: boolean;
  // Upgrade prompt props
  showUpgradePrompt?: boolean;
  upgradeToLabel?: string;
  upgradeCostDelta?: number;
  upgradeCoverageGain?: number;
  onUpgradeClick?: () => void;
  // Mobile sheet props
  packageInclusions?: string[];
  onEmailQuote?: () => void;
  onTextQuote?: () => void;
  onBookConsult?: () => void;
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
  onSaveForLater,
  onApplyForFinancing,
  isGeneratingPDF = false,
  // Upgrade prompt props
  showUpgradePrompt = false,
  upgradeToLabel,
  upgradeCostDelta,
  upgradeCoverageGain,
  onUpgradeClick,
  // Mobile sheet props
  packageInclusions = [],
  onEmailQuote,
  onTextQuote,
  onBookConsult,
}: StickySummaryProps) {
  return (
    <>
      {/* Desktop sticky card */}
      <aside
        aria-label="Summary"
        className="sticky top-28 hidden h-fit rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:block"
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

        {/* Upgrade prompt - shown when on Essential */}
        <AnimatePresence>
          {showUpgradePrompt && upgradeToLabel && upgradeCostDelta != null && onUpgradeClick && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              <button
                onClick={onUpgradeClick}
                className="w-full rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-left transition hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Want more coverage?</span>
                </div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Upgrade to <span className="font-semibold">{upgradeToLabel}</span> for just{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{money(Math.round(upgradeCostDelta))}/mo
                  </span>
                </div>
                {upgradeCoverageGain != null && upgradeCoverageGain > 0 && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <ArrowUp className="h-3 w-3" />
                    <span>+{upgradeCoverageGain} years extra protection</span>
                  </div>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ul className="mt-3 space-y-0.5 lg:space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {bullets.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500 flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2">
          {onSaveForLater && (
            <Button
              onClick={onSaveForLater}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Save for Later
            </Button>
          )}
          
          {onDownloadPDF && (
            <Button
              onClick={onDownloadPDF}
              variant="outline"
              className="w-full"
              disabled={isGeneratingPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Quote'}
            </Button>
          )}

          {onApplyForFinancing && (
            <Button
              onClick={onApplyForFinancing}
              variant="default"
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Apply for Financing
            </Button>
          )}

          <button
            onClick={onReserve}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-white shadow-sm transition hover:scale-[1.01] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Reserve with {money(depositAmount)} refundable deposit
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar with expandable sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <Drawer>
          <div className="border-t border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 p-3">
              <DrawerTrigger asChild>
                <button className="flex flex-1 items-center gap-3 text-left">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{packageLabel}</span>
                      <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{money(yourPriceBeforeTax)}</div>
                    {monthly != null && (
                      <div className="text-xs text-slate-600 dark:text-slate-300">From {money(Math.round(monthly))}/mo</div>
                    )}
                  </div>
                </button>
              </DrawerTrigger>
              <button
                onClick={onReserve}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm transition hover:scale-[1.02] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Reserve
              </button>
            </div>
          </div>

          <DrawerContent className="max-h-[85vh]">
            <div className="mx-auto w-full max-w-lg overflow-y-auto p-4 pb-8">
              {/* Header */}
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{packageLabel}</h3>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{money(yourPriceBeforeTax)}</div>
                {monthly != null && (
                  <div className="text-sm text-slate-600 dark:text-slate-300">From {money(Math.round(monthly))}/mo</div>
                )}
                {typeof coverageYears === "number" && (
                  <div className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    {coverageYears} years total coverage
                  </div>
                )}
              </div>

              {/* Package Inclusions */}
              {packageInclusions && packageInclusions.length > 0 && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Package Includes</h4>
                  <ul className="space-y-1.5">
                    {packageInclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Savings Badge */}
              {totalSavings > 0 && (
                <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  You save {money(totalSavings)}
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {onEmailQuote && (
                  <button
                    onClick={onEmailQuote}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-xs font-medium">Email</span>
                  </button>
                )}
                {onTextQuote && (
                  <button
                    onClick={onTextQuote}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs font-medium">Text</span>
                  </button>
                )}
                {onBookConsult && (
                  <button
                    onClick={onBookConsult}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs font-medium">Consult</span>
                  </button>
                )}
              </div>

              {/* Main Actions */}
              <div className="space-y-2">
                {onDownloadPDF && (
                  <Button
                    onClick={onDownloadPDF}
                    variant="outline"
                    className="w-full"
                    disabled={isGeneratingPDF}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Quote'}
                  </Button>
                )}

                {onApplyForFinancing && (
                  <Button
                    onClick={onApplyForFinancing}
                    variant="secondary"
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Apply for Financing
                  </Button>
                )}

                <button
                  onClick={onReserve}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-white shadow-sm transition hover:opacity-90"
                >
                  Reserve with {money(depositAmount)} refundable deposit
                </button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}