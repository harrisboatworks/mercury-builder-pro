import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, CalendarOff, Percent, Banknote, Check, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import mercuryLogo from '@/assets/mercury-logo.png';
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
      icon: CalendarOff,
      title: '6 Months',
      subtitle: 'No Payments',
    },
    {
      id: 'special_financing' as PromoOptionType,
      icon: Percent,
      title: `${lowestRate}%`,
      subtitle: 'APR',
    },
    {
      id: 'cash_rebate' as PromoOptionType,
      icon: Banknote,
      title: `$${rebateAmount}`,
      subtitle: 'Rebate',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={mercuryLogo} alt="Mercury" className="h-5" />
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
            GET 7
          </span>
        </div>
        {endDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{getTimeRemaining(endDate)}</span>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        {/* Warranty Badge - Left Aligned */}
        <div className="flex items-center gap-3 bg-green-50/70 rounded-lg p-3 border border-green-100/50">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">7 Years Warranty</span>
              <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                Included
              </span>
            </div>
            <span className="text-xs text-muted-foreground">3 + 4 FREE years</span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-card text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Plus Pick One
            </span>
          </div>
        </div>
        
        {/* Compact 3-Column Option Cards */}
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => {
            const isSelected = selectedOption === option.id;
            const Icon = option.icon;
            
            return (
              <button
                key={option.id}
                onClick={() => onChangeOption(option.id)}
                className={cn(
                  'relative flex flex-col items-center p-2.5 rounded-lg border-2 transition-all duration-200 text-center',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                
                {/* Icon */}
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-colors',
                  isSelected ? 'bg-primary/15' : 'bg-primary/10'
                )}>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {option.title}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {option.subtitle}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Link to full details */}
        <Link 
          to="/promotions" 
          className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline pt-1"
        >
          View full details
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}
