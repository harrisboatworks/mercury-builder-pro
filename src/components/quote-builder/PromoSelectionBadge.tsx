import { Shield, CalendarOff, Percent, Banknote, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { cn } from '@/lib/utils';
import mercuryLogo from '@/assets/mercury-logo.png';

type PromoOptionType = 'no_payments' | 'special_financing' | 'cash_rebate' | null;

interface PromoSelectionBadgeProps {
  motorHP: number;
  selectedOption: PromoOptionType;
  endDate?: Date | null;
}

const optionConfig = {
  no_payments: {
    icon: CalendarOff,
    title: '6 Months No Payments',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
  special_financing: {
    icon: Percent,
    title: 'Special Financing',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100',
  },
  cash_rebate: {
    icon: Banknote,
    title: 'Factory Rebate',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100',
  },
};

export function PromoSelectionBadge({ 
  motorHP, 
  selectedOption,
  endDate 
}: PromoSelectionBadgeProps) {
  const navigate = useNavigate();
  const { getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  
  // Get dynamic value based on selection
  const getSelectedValue = () => {
    if (!selectedOption) return '';
    
    switch (selectedOption) {
      case 'no_payments':
        return 'Buy Now, Pay Later';
      case 'special_financing':
        const rates = getSpecialFinancingRates();
        const lowestRate = rates?.[0]?.rate || 2.99;
        return `${lowestRate}% APR`;
      case 'cash_rebate':
        const rebate = getRebateForHP(motorHP) || 250;
        return `$${rebate.toLocaleString()} Back`;
      default:
        return '';
    }
  };

  const config = selectedOption ? optionConfig[selectedOption] : null;
  const Icon = config?.icon || Banknote;
  const value = getSelectedValue();

  return (
    <div className="bg-gradient-to-br from-stone-50 to-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900 text-white">
        <div className="flex items-center gap-3">
          <img src={mercuryLogo} alt="Mercury" className="h-5 brightness-0 invert" />
          <span className="text-xs font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full">
            GET 7
          </span>
        </div>
        {endDate && (
          <CountdownTimer endDate={endDate} compact className="text-xs" />
        )}
      </div>

      {/* Selection Display */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Warranty + Bonus Selection */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Warranty Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-foreground">7 Years</div>
                <div className="text-xs text-muted-foreground">Warranty</div>
              </div>
            </div>

            <div className="text-xl text-stone-300 font-light">+</div>

            {/* Selected Bonus */}
            {config ? (
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border',
                config.bgColor,
                config.borderColor
              )}>
                <Icon className={cn('w-5 h-5 shrink-0', config.color)} />
                <div className="min-w-0">
                  <div className={cn('text-sm font-semibold truncate', config.color)}>
                    {config.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {value}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No bonus selected
              </div>
            )}
          </div>

          {/* Change Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quote/promo-selection')}
            className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
          >
            Change
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
