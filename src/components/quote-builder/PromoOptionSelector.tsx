import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Percent, DollarSign, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivePromotions } from '@/hooks/useActivePromotions';

export type PromoOptionType = 'no_payments' | 'special_financing' | 'cash_rebate';

interface PromoOptionSelectorProps {
  motorHP?: number;
  totalAmount?: number;
  onSelect: (option: PromoOptionType) => void;
  selectedOption?: PromoOptionType | null;
  className?: string;
}

export function PromoOptionSelector({
  motorHP = 0,
  totalAmount = 0,
  onSelect,
  selectedOption,
  className
}: PromoOptionSelectorProps) {
  const { getRebateForHP, getSpecialFinancingRates, getChooseOneOptions } = useActivePromotions();
  const [expandedOption, setExpandedOption] = useState<PromoOptionType | null>(null);

  // Get the promo options from the database using the helper
  const promoOptions = useMemo(() => {
    return getChooseOneOptions();
  }, [getChooseOneOptions]);

  // Calculate the rebate amount for this motor
  const rebateAmount = useMemo(() => {
    return getRebateForHP(motorHP) || 0;
  }, [motorHP, getRebateForHP]);

  // Get financing rates
  const financingRates = useMemo(() => {
    return getSpecialFinancingRates() || [];
  }, [getSpecialFinancingRates]);

  // Determine the best option for this customer
  const recommendedOption = useMemo((): PromoOptionType => {
    // High HP motors benefit most from rebate
    if (motorHP >= 150 && rebateAmount >= 500) {
      return 'cash_rebate';
    }
    // Large financed amounts benefit from lower rates
    if (totalAmount >= 15000 && financingRates.length > 0) {
      return 'special_financing';
    }
    // Default to no payments for broad appeal
    return 'no_payments';
  }, [motorHP, rebateAmount, totalAmount, financingRates]);

  // Auto-select recommended if nothing selected
  useEffect(() => {
    if (!selectedOption && promoOptions.length > 0) {
      onSelect(recommendedOption);
    }
  }, [recommendedOption, selectedOption, onSelect, promoOptions.length]);

  const options = [
    {
      id: 'no_payments' as PromoOptionType,
      title: '6 Months No Payments',
      shortTitle: 'No Payments',
      description: 'Enjoy your motor all season before making a payment',
      icon: Clock,
      color: 'blue',
      detail: 'Get your motor now and start payments in 6 months. Perfect for buying at the start of the season.',
      value: 'Defer payments 6 months'
    },
    {
      id: 'special_financing' as PromoOptionType,
      title: 'Special Financing Rates',
      shortTitle: 'Low APR',
      description: 'Reduced interest rates for qualified buyers',
      icon: Percent,
      color: 'purple',
      detail: financingRates.length > 0 
        ? `Rates as low as ${Math.min(...financingRates.map(r => r.rate))}% APR`
        : 'Special promotional rates available',
      rates: financingRates,
      value: financingRates.length > 0 ? `${Math.min(...financingRates.map(r => r.rate))}% APR` : 'Low rates'
    },
    {
      id: 'cash_rebate' as PromoOptionType,
      title: 'Factory Cash Rebate',
      shortTitle: 'Cash Back',
      description: 'Instant savings based on motor horsepower',
      icon: DollarSign,
      color: 'green',
      detail: rebateAmount > 0 
        ? `Your ${motorHP}HP motor qualifies for a $${rebateAmount.toLocaleString()} rebate!`
        : 'Rebate amount based on motor HP',
      value: rebateAmount > 0 ? `$${rebateAmount.toLocaleString()}` : 'Up to $1,500'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'blue': return 'bg-blue-50 border-blue-500 ring-2 ring-blue-500';
        case 'purple': return 'bg-purple-50 border-purple-500 ring-2 ring-purple-500';
        case 'green': return 'bg-green-50 border-green-500 ring-2 ring-green-500';
        default: return 'bg-primary/5 border-primary ring-2 ring-primary';
      }
    }
    return 'bg-white border-border hover:border-muted-foreground';
  };

  const getIconColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      case 'green': return 'text-green-600 bg-green-100';
      default: return 'text-primary bg-primary/10';
    }
  };

  if (promoOptions.length === 0) {
    return null; // Don't show if no promo options available
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Choose Your Bonus
          </h3>
          <p className="text-sm text-muted-foreground">
            Select one promotional benefit to add to your purchase
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
          Pick One
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isRecommended = recommendedOption === option.id;
          const isExpanded = expandedOption === option.id;
          const Icon = option.icon;

          return (
            <div key={option.id} className="relative">
              {isRecommended && !isSelected && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">
                    Recommended
                  </Badge>
                </div>
              )}
              
              <Card
                className={cn(
                  'relative cursor-pointer transition-all duration-200 border-2',
                  getColorClasses(option.color, isSelected),
                  isRecommended && !isSelected && 'ring-2 ring-amber-300 ring-offset-2'
                )}
                onClick={() => onSelect(option.id)}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={cn('p-2 rounded-lg', getIconColorClasses(option.color))}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="p-1 bg-primary rounded-full"
                      >
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <h4 className="font-semibold text-foreground">{option.shortTitle}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>

                  {/* Value Badge */}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'w-full justify-center py-1',
                      isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'
                    )}
                  >
                    {option.value}
                  </Badge>

                  {/* Expand/Collapse Details */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOption(isExpanded ? null : option.id);
                    }}
                  >
                    {isExpanded ? (
                      <>Less info <ChevronUp className="h-3 w-3 ml-1" /></>
                    ) : (
                      <>More info <ChevronDown className="h-3 w-3 ml-1" /></>
                    )}
                  </Button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                          <p>{option.detail}</p>
                          
                          {/* Show financing rates if this is the financing option */}
                          {option.id === 'special_financing' && option.rates && option.rates.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {option.rates.map((rate, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{rate.months} months:</span>
                                  <span className="font-medium text-foreground">{rate.rate}% APR</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
