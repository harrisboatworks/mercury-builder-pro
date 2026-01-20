import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CreditCard, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DepositTier {
  amount: number;
  label: string;
  description: string;
}

const DEPOSIT_TIERS: DepositTier[] = [
  { amount: 500, label: "$500", description: "Small motors" },
  { amount: 1000, label: "$1,000", description: "Mid-range" },
  { amount: 2500, label: "$2,500", description: "High-performance" },
];

export const getRecommendedDeposit = (hp: number): number => {
  if (hp < 50) return 500;
  if (hp <= 150) return 1000;
  return 2500;
};

interface PaymentPreferenceSelectorProps {
  motorHP: number;
  paymentPreference: 'cash' | 'financing';
  onPaymentPreferenceChange: (preference: 'cash' | 'financing') => void;
  selectedDeposit: number;
  onDepositChange: (amount: number) => void;
  isProcessing?: boolean;
}

export function PaymentPreferenceSelector({
  motorHP,
  paymentPreference,
  onPaymentPreferenceChange,
  selectedDeposit,
  onDepositChange,
  isProcessing = false,
}: PaymentPreferenceSelectorProps) {
  const recommendedDeposit = getRecommendedDeposit(motorHP);

  return (
    <div className="space-y-4">
      {/* Payment Method Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          How would you like to proceed?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPaymentPreferenceChange('cash')}
            disabled={isProcessing}
            className={cn(
              "relative flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
              paymentPreference === 'cash'
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Pay Cash</span>
            {paymentPreference === 'cash' && (
              <Check className="w-4 h-4 absolute right-2" />
            )}
          </button>
          <button
            onClick={() => onPaymentPreferenceChange('financing')}
            disabled={isProcessing}
            className={cn(
              "relative flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
              paymentPreference === 'financing'
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">Finance</span>
            {paymentPreference === 'financing' && (
              <Check className="w-4 h-4 absolute right-2" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {paymentPreference === 'cash' 
            ? "75% of our customers choose cash—secure with a refundable deposit"
            : "No deposit required—apply now and we'll contact you"}
        </p>
      </div>

      {/* Deposit Tier Selection (Cash only) */}
      <AnimatePresence mode="wait">
        {paymentPreference === 'cash' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-sm font-medium text-foreground">
                Select Deposit Amount
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DEPOSIT_TIERS.map((tier) => {
                  const isRecommended = tier.amount === recommendedDeposit;
                  const isSelected = tier.amount === selectedDeposit;
                  
                  return (
                    <button
                      key={tier.amount}
                      onClick={() => onDepositChange(tier.amount)}
                      disabled={isProcessing}
                      className={cn(
                        "relative p-3 rounded-lg border-2 text-center transition-all",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                          : "border-border hover:border-emerald-300 dark:hover:border-emerald-700"
                      )}
                    >
                      {isRecommended && (
                        <Badge 
                          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 flex items-center gap-0.5"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Best
                        </Badge>
                      )}
                      <div className={cn(
                        "font-semibold text-sm",
                        isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"
                      )}>
                        {tier.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {tier.description}
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 absolute top-1 right-1 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                100% refundable • Secures your motor immediately
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { DEPOSIT_TIERS };
