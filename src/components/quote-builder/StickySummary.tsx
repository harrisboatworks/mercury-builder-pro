"use client";
import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { money } from "@/lib/money";
import CoverageComparisonTooltip from "@/components/quote-builder/CoverageComparisonTooltip";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, ArrowUp, Sparkles } from "lucide-react";
import confetti from 'canvas-confetti';
import { PaymentMethodBadges } from "@/components/payments/PaymentMethodBadges";
import { useSound } from '@/contexts/SoundContext';

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
  // Payment processing prop
  isProcessingPayment?: boolean;
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
  // Payment processing prop
  isProcessingPayment = false,
}: StickySummaryProps) {
  const { playCelebration } = useSound();
  const [showPulse, setShowPulse] = useState(false);

  // Trigger pulse animation after a delay
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleReserveClick = useCallback(() => {
    // Trigger celebration confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#1D4ED8'],
    });
    
    // Play celebration sound
    playCelebration();
    
    // Call original handler
    onReserve();
  }, [onReserve, playCelebration]);

  return (
    <>
      {/* Desktop sticky card - Premium glassmorphism */}
      <aside
        aria-label="Summary"
        className="sticky top-28 hidden h-fit rounded-2xl glass-card p-5 lg:block animate-card-entrance premium-glow-hover"
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
            onClick={handleReserveClick}
            disabled={isProcessingPayment}
            className={`w-full rounded-xl bg-primary px-4 py-3 text-center text-primary-foreground shadow-sm transition hover:scale-[1.01] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${showPulse && !isProcessingPayment ? 'premium-pulse' : ''}`}
          >
            {isProcessingPayment 
              ? 'Processing...' 
              : `Reserve with ${money(depositAmount)} deposit`
            }
          </button>
          <PaymentMethodBadges className="mt-2" />
        </div>
      </aside>
    </>
  );
}
