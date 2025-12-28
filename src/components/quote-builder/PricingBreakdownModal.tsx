import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DEALERPLAN_FEE, getDefaultFinancingRate, getFinancingTerm } from '@/lib/finance';
import { money } from '@/lib/money';
import { Calculator, Info, TrendingUp, Shield, DollarSign } from 'lucide-react';

interface PricingBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Price before tax (package or motor price) */
  priceBeforeTax: number;
  /** Promotional APR rate if active, null for default tiered rate */
  promoRate?: number | null;
  /** Optional base package price for comparison */
  basePackagePrice?: number;
  /** Package name for display */
  packageName?: string;
  /** Base package name for comparison */
  basePackageName?: string;
}

const HST_RATE = 0.13;

export function PricingBreakdownModal({
  open,
  onOpenChange,
  priceBeforeTax,
  promoRate = null,
  basePackagePrice,
  packageName = 'Your Package',
  basePackageName = 'Essential',
}: PricingBreakdownModalProps) {
  // Calculate components
  const tax = priceBeforeTax * HST_RATE;
  const priceWithTax = priceBeforeTax + tax;
  const totalFinanced = priceWithTax + DEALERPLAN_FEE;
  
  // Get rate and term
  const defaultRate = getDefaultFinancingRate(totalFinanced);
  const effectiveRate = promoRate ?? defaultRate;
  const termMonths = getFinancingTerm(totalFinanced);
  
  // Calculate monthly payment
  const monthlyRate = effectiveRate / 100 / 12;
  const monthlyPayment = monthlyRate === 0 
    ? totalFinanced / termMonths
    : (totalFinanced * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  // Base comparison (if provided)
  let baseMonthly: number | null = null;
  let monthlyDelta: number | null = null;
  
  if (basePackagePrice && basePackagePrice !== priceBeforeTax) {
    const baseTax = basePackagePrice * HST_RATE;
    const baseTotalFinanced = basePackagePrice + baseTax + DEALERPLAN_FEE;
    const baseTermMonths = getFinancingTerm(baseTotalFinanced);
    const baseMonthlyRate = effectiveRate / 100 / 12;
    baseMonthly = baseMonthlyRate === 0 
      ? baseTotalFinanced / baseTermMonths
      : (baseTotalFinanced * baseMonthlyRate * Math.pow(1 + baseMonthlyRate, baseTermMonths)) / 
        (Math.pow(1 + baseMonthlyRate, baseTermMonths) - 1);
    monthlyDelta = monthlyPayment - baseMonthly;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            How We Calculate Your Payment
          </DialogTitle>
          <DialogDescription>
            Transparent breakdown of your monthly financing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Price Components Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="h-4 w-4" />
              Price Components
            </h3>
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{packageName}</span>
                <span className="font-medium">{money(priceBeforeTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HST (13%)</span>
                <span className="font-medium">+ {money(Math.round(tax))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DealerPlan Fee</span>
                <span className="font-medium">+ {money(DEALERPLAN_FEE)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total Financed</span>
                <span className="text-primary">{money(Math.round(totalFinanced))}</span>
              </div>
            </div>
          </div>
          
          {/* Financing Terms Section */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4" />
              Financing Terms
            </h3>
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">APR Rate</span>
                <span className="font-medium">
                  {effectiveRate}%
                  {promoRate !== null && promoRate < defaultRate && (
                    <span className="ml-1.5 text-xs text-emerald-600">(Promo)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Term Length</span>
                <span className="font-medium">{termMonths} months ({Math.round(termMonths / 12)} years)</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Monthly Payment</span>
                <span className="text-primary">{money(Math.round(monthlyPayment))}/mo</span>
              </div>
            </div>
          </div>
          
          {/* Comparison Section (if applicable) */}
          {baseMonthly !== null && monthlyDelta !== null && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="h-4 w-4" />
                Package Comparison
              </h3>
              <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-sm dark:bg-blue-950/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{basePackageName}</span>
                  <span className="font-medium">{money(Math.round(baseMonthly))}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{packageName}</span>
                  <span className="font-medium">{money(Math.round(monthlyPayment))}/mo</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 dark:border-blue-800">
                  <span className="font-semibold">Upgrade Cost</span>
                  <span className="font-semibold text-blue-600">
                    +{money(Math.ceil(monthlyDelta))}/mo
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Info Footer */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <strong>OAC</strong> – On Approved Credit. Rates may vary based on credit approval. 
              DealerPlan processing fee is mandatory for all financed purchases.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingBreakdownModal;
