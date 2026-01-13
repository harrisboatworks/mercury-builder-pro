import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Calendar, Percent, DollarSign, Check, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import type { PromoOptionType } from './PromoOptionSelector';

interface PromoSummaryCardProps {
  motorHP: number;
  selectedOption: PromoOptionType | null;
  onChangeOption: (option: PromoOptionType) => void;
  endDate: Date | null;
}

function getTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function PromoSummaryCard({
  motorHP,
  selectedOption,
  onChangeOption,
  endDate,
}: PromoSummaryCardProps) {
  const { promotions, getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  
  const promo = promotions?.[0];
  if (!promo) return null;
  
  const rebateAmount = getRebateForHP?.(motorHP) || 0;
  const financingRates = getSpecialFinancingRates?.();
  const lowestRate = financingRates?.[0]?.rate || 2.99;
  
  const options = [
    {
      id: 'no_payments' as PromoOptionType,
      icon: Calendar,
      title: '6 Months',
      subtitle: 'No Payments',
      value: 'Deferred',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'special_financing' as PromoOptionType,
      icon: Percent,
      title: `${lowestRate}% APR`,
      subtitle: 'Special Financing',
      value: 'Low Rate',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'cash_rebate' as PromoOptionType,
      icon: DollarSign,
      title: `$${rebateAmount}`,
      subtitle: 'Factory Rebate',
      value: `For ${motorHP}HP`,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Mercury Promotion
          </span>
        </div>
        {endDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Ends: <strong className="text-foreground">{getTimeRemaining(endDate)}</strong></span>
          </div>
        )}
      </div>
      
      <div className="p-5 space-y-5">
        {/* Warranty Included - Always shows */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium text-foreground">7 Years Factory Warranty</span>
            </div>
            <span className="text-sm text-muted-foreground">3 standard + 4 bonus years included</span>
          </div>
        </div>
        
        {/* Divider with label */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-card text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Plus Pick Your Bonus
            </span>
          </div>
        </div>
        
        {/* Choose One Options */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose one additional benefit with your {motorHP}HP motor:
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            {options.map((option) => {
              const isSelected = selectedOption === option.id;
              const Icon = option.icon;
              
              return (
                <button
                  key={option.id}
                  onClick={() => onChangeOption(option.id)}
                  className={cn(
                    'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 text-center',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', option.bgColor)}>
                    <Icon className={cn('w-4 h-4', option.iconColor)} />
                  </div>
                  
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {option.title}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {option.subtitle}
                  </span>
                  
                  {/* Value tag for selected */}
                  {isSelected && (
                    <span className="mt-1.5 text-[10px] font-medium text-primary">
                      {option.value}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Link to full details */}
        <Link 
          to="/promotions" 
          className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline pt-2"
        >
          View full promotion details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
