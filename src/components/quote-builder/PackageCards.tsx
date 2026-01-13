"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { money } from "@/lib/money";
import { calculateMonthlyPayment, DEALERPLAN_FEE } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSound } from '@/contexts/SoundContext';
import { TrendingUp, Shield, Check, Star } from 'lucide-react';

// Container variants for staggered entrance
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

// Card variants with spring animation
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 24, 
    scale: 0.96 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 22
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
  recommendationReason?: string; // Dynamic reason for smart recommendation
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
  revealComplete?: boolean; // Whether cinematic reveal has completed (triggers stagger animation)
  variant?: 'light' | 'dark'; // Background context for styling
};

export function PackageCards({
  options,
  onSelect,
  selectedId,
  promoRate = null,
  showUpgradeDeltas = true,
  basePackageId,
  revealComplete = true,
  variant = 'light',
}: PackageCardsProps) {
  const { triggerHaptic } = useHapticFeedback();
  const { playPackageSelect } = useSound();
  const isDark = variant === 'dark';
  
  // Find base package for comparison (default to first/Essential)
  const basePackage = options.find(p => p.id === (basePackageId || 'good')) || options[0];
  const baseAmountToFinance = (basePackage.priceBeforeTax * 1.13) + DEALERPLAN_FEE;
  const baseMonthly = basePackage.monthly ?? calculateMonthlyPayment(baseAmountToFinance, promoRate).payment;
  const baseCoverageYears = basePackage.coverageYears || 3;

  return (
    <motion.section 
      aria-label="Packages" 
      className="grid gap-3 sm:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      animate={revealComplete ? "visible" : "hidden"}
    >
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
            variants={cardVariants}
            onClick={() => {
              triggerHaptic('packageChanged');
              playPackageSelect();
              onSelect(p.id);
            }}
            className={cn(
              "group relative flex flex-col rounded-xl border-2 p-6 text-left",
              // Smooth premium transitions
              "transition-all duration-300 ease-out",
              // Micro-interaction: scale + lift + shadow on hover
              "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl",
              // Active press feedback
              "active:scale-[0.98] active:translate-y-0",
              "cursor-pointer pointer-events-auto touch-manipulation",
              // Background based on variant
              isDark ? "bg-white shadow-lg" : "glass-card",
              isSelected
                ? "border-primary ring-2 ring-primary/20"
                : isDark 
                  ? "border-transparent hover:border-primary/50" 
                  : "border-border/50 hover:border-primary/50"
            )}
            aria-pressed={isSelected}
          >
            {/* Mobile Selected Checkmark Badge */}
            {isSelected && (
              <span className="absolute right-3 bottom-3 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground sm:hidden">
                <Check className="w-4 h-4" />
              </span>
            )}
            
            {p.recommended && (
              <div className={cn(
                "absolute right-3 top-3 flex flex-col items-end gap-1",
                isSelected && "sm:right-3"
              )}>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/80 px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                  <Star className="w-3 h-3 fill-current" />
                  For You
                </span>
              </div>
            )}

            <div className="pr-20">
              <div className="text-base font-bold uppercase tracking-[0.12em] text-foreground">
                {p.label.split(' • ')[0]}
              </div>
              {p.label.includes(' • ') && (
                <div className="text-sm font-medium text-muted-foreground mt-0.5">
                  {p.label.split(' • ')[1]}
                </div>
              )}
            </div>

            <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {money(p.priceBeforeTax)}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              From <span className="font-semibold text-primary">{money(Math.round(monthly))}/mo</span>
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <Shield className="h-3 w-3" />
                      +{coverageDelta}yr coverage
                    </span>
                  )}
                  {Math.ceil(monthlyDelta) >= 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      <TrendingUp className="h-3 w-3" />
                      +{money(Math.ceil(monthlyDelta))}/mo
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {p.coverageYears != null && (
              <div className="mt-2 text-sm text-muted-foreground">
                Coverage: <span className="font-medium text-foreground">{p.coverageYears} years total</span>
              </div>
            )}

            <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              Save {money(p.savings)}
            </div>

            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {p.features.slice(0, 4).map((f, i) => (
                <li 
                  key={i} 
                  className={cn(
                    "flex items-center gap-2.5",
                    isSelected && "spec-row-animate",
                    isSelected && `stagger-${i + 1}`
                  )}
                >
                  <svg 
                    className="h-4 w-4 flex-shrink-0 text-primary" 
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
            
            {/* Mobile "Tap to select" hint for unselected packages */}
            {!isSelected && (
              <span className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
                Tap to select
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.section>
  );
}

export default PackageCards;