"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { money } from "@/lib/money";
import { calculateMonthlyPayment, DEALERPLAN_FEE } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { TrendingUp, Shield } from 'lucide-react';

// Safe animation that starts visible and only animates transform (not opacity)
const packageItemVariants = {
  hidden: { y: 15, scale: 0.98 },
  visible: {
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export type PackageOption = {
  id: "good" | "better" | "best" | string;
  label: string;
  priceBeforeTax: number;
  savings: number;
  monthly?: number;
  features: string[];
  recommended?: boolean;
  coverageYears?: number;
  targetWarrantyYears?: number; // used only to trigger selection handler
};

type PackageCardsProps = {
  options: PackageOption[];
  onSelect: (id: string) => void;
  selectedId?: string;
  promoRate?: number | null; // Promotional financing rate (null = use tiered defaults)
  showUpgradeDeltas?: boolean; // Enable comparison mode
  basePackageId?: string; // Package to compare against (default: first package)
};

export function PackageCards({
  options,
  onSelect,
  selectedId,
  promoRate = null,
  showUpgradeDeltas = true,
  basePackageId,
}: PackageCardsProps) {
  const { triggerHaptic } = useHapticFeedback();
  
  // Find base package for comparison (default to first/Essential)
  const basePackage = options.find(p => p.id === (basePackageId || 'good')) || options[0];
  const baseAmountToFinance = (basePackage.priceBeforeTax * 1.13) + DEALERPLAN_FEE;
  const baseMonthly = basePackage.monthly ?? calculateMonthlyPayment(baseAmountToFinance, promoRate).payment;
  const baseCoverageYears = basePackage.coverageYears || 3;

  return (
    <section aria-label="Packages" className="grid gap-3 sm:grid-cols-3">
      {options.map((p) => {
        const amountToFinance = (p.priceBeforeTax * 1.13) + DEALERPLAN_FEE;
        const monthly = p.monthly ?? calculateMonthlyPayment(amountToFinance, promoRate).payment;
        const isSelected = selectedId === p.id;
        const isBase = p.id === (basePackageId || 'good');
        
        // Calculate deltas from base package
        const monthlyDelta = monthly - baseMonthly;
        const coverageDelta = (p.coverageYears || 3) - baseCoverageYears;

        return (
          <motion.button
            key={p.id}
            variants={packageItemVariants}
            onClick={() => {
              triggerHaptic('light');
              onSelect(p.id);
            }}
            className={cn(
              "group relative flex flex-col rounded-2xl border p-6 text-left transition",
              "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
              isSelected
                ? "border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-400 dark:ring-blue-400/30"
                : "border-slate-200 dark:border-slate-700"
            )}
            aria-pressed={isSelected}
          >
            {p.recommended && (
              <span className="absolute right-3 top-3 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                Recommended
              </span>
            )}

            <div className="pr-20">
              <div className="text-base font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                {p.label.split(' • ')[0]}
              </div>
              {p.label.includes(' • ') && (
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {p.label.split(' • ')[1]}
                </div>
              )}
            </div>

            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {money(p.priceBeforeTax)}
            </div>

            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              From <span className="font-semibold">{money(Math.round(monthly))}/mo</span>
            </div>

            {/* Upgrade delta badges - show for non-base packages */}
            {showUpgradeDeltas && !isBase && (coverageDelta > 0 || monthlyDelta > 0) && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex flex-wrap gap-1.5"
                >
                  {coverageDelta > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800">
                      <Shield className="h-3 w-3" />
                      +{coverageDelta}yr coverage
                    </span>
                  )}
                  {monthlyDelta > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                      <TrendingUp className="h-3 w-3" />
                      +{money(Math.round(monthlyDelta))}/mo
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {p.coverageYears != null && (
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Coverage: <span className="font-medium">{p.coverageYears} years total</span>
              </div>
            )}

            <div className="mt-2 inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700">
              Save {money(p.savings)}
            </div>

            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {p.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <svg 
                    className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </motion.button>
        );
      })}
    </section>
  );
}

export default PackageCards;