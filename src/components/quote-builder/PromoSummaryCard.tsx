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
      highlight: 'Deferred',
    },
    {
      id: 'special_financing' as PromoOptionType,
      icon: Percent,
      title: `${lowestRate}% APR`,
      subtitle: 'Special Rate',
      highlight: 'Low Rate',
    },
    {
      id: 'cash_rebate' as PromoOptionType,
      icon: Banknote,
      title: `$${rebateAmount}`,
      subtitle: 'Factory Rebate',
      highlight: 'Your Rebate',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Header Row with Mercury Branding */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-stone-100 to-stone-50 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={mercuryLogo} alt="Mercury" className="h-6" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Mercury Promotion
            </span>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              GET 7
            </span>
          </div>
        </div>
        {endDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Ends: <strong className="text-foreground">{getTimeRemaining(endDate)}</strong></span>
          </div>
        )}
      </div>
      
      <div className="p-5 space-y-5">
        {/* Premium Warranty Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-lg p-3 border border-green-100">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">7 Years Factory Warranty</span>
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <Check className="w-3 h-3" />
                Included
              </span>
            </div>
            <span className="text-sm text-muted-foreground">3 years standard + 4 years FREE extension</span>
          </div>
        </div>
        
        {/* Divider with label */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-card text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Plus Pick One Bonus
            </span>
          </div>
        </div>
        
        {/* Choose One Options - Premium Cards */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose one additional benefit with your {motorHP}HP:
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
                    'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 text-center group',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm'
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* Highlight Badge */}
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2',
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  )}>
                    {option.highlight}
                  </span>
                  
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors',
                    isSelected ? 'bg-primary/15' : 'bg-primary/10 group-hover:bg-primary/15'
                  )}>
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {option.title}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {option.subtitle}
                  </span>
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
