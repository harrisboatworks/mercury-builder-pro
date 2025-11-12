import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useNavigate } from 'react-router-dom';
import { money } from '@/lib/money';
import { calculateMonthlyPayment } from '@/lib/finance';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export const CartHeader = () => {
  const { state, isStepAccessible } = useQuote();
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  
  const findNextIncompleteStep = (): string => {
    // Check each step in order to find the first incomplete one
    for (let step = 1; step <= 7; step++) {
      if (!isStepAccessible(step)) {
        // Map step numbers to routes
        switch (step) {
          case 1: return '/quote/motor-selection';
          case 2: return '/quote/purchase-path';
          case 3: 
            return state.purchasePath === 'installed' ? '/quote/boat-info' : '/quote/fuel-tank';
          case 4: return '/quote/trade-in';
          case 5: return state.purchasePath === 'installed' ? '/quote/installation' : '/quote/summary';
          case 6: return '/quote/summary';
          case 7: return '/quote/schedule';
          default: return '/quote/motor-selection';
        }
      }
    }
    // If all steps are accessible, go to summary
    return '/quote/summary';
  };

  const handleCartClick = () => {
    console.log('CartHeader: handleCartClick called', { 
      hasMotor: !!state.motor, 
      motor: state.motor?.hp,
      canAccessSummary: isStepAccessible(6),
      purchasePath: state.purchasePath,
      hasBoatInfo: !!state.boatInfo,
      hasTradein: state.hasTradein,
      hasTradeInInfo: !!state.tradeInInfo
    });

    if (!state.motor) {
      console.log('CartHeader: No motor in state, not navigating');
      return;
    }

    if (isStepAccessible(6)) {
      console.log('CartHeader: All requirements met, navigating to /quote/summary');
      navigate('/quote/summary');
    } else {
      const nextStep = findNextIncompleteStep();
      console.log('CartHeader: Summary not accessible, navigating to next incomplete step:', nextStep);
      navigate(nextStep);
    }
  };

  const { promo } = useActiveFinancingPromo();
  
  const hasItemsInCart = !!state.motor;
  const totalPrice = state.motor ? Math.round(state.motor.price * 1.13) : 0; // With tax

  // Calculate monthly payment
  const monthlyPayment = useMemo(() => {
    if (!state.motor) return 0;
    const { payment } = calculateMonthlyPayment(totalPrice, promo?.rate || null);
    return Math.round(payment);
  }, [totalPrice, state.motor, promo?.rate]);

  if (!hasItemsInCart) return null;

  const motorDisplayName = state.motor ? `${state.motor.hp}HP ${state.motor.model || 'Motor'}` : '';

  return (
    <Button
      variant="ghost" 
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        console.log('CartHeader: Button clicked');
        handleCartClick();
      }}
      className="relative flex items-center gap-3 px-3 py-2 min-w-0 transition-all duration-300 hover:opacity-80 active:scale-[0.98] active:opacity-70 cursor-pointer"
      aria-label={`View quote - ${motorDisplayName} - ${money(totalPrice)}`}
    >
      {/* Mobile: Price + Arrow (< 640px) */}
      <div className="flex sm:hidden items-center gap-2">
        <span className="text-sm font-light text-foreground">
          {money(totalPrice)}
        </span>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      </div>
      
      {/* Tablet: Label + Price (640px - 1024px) */}
      <div className="hidden sm:flex lg:hidden flex-col items-end">
        <span className="text-xs font-light text-muted-foreground uppercase tracking-wider">
          Your Quote
        </span>
        <span className="text-sm font-light text-foreground">
          {money(totalPrice)}
        </span>
      </div>
      
      {/* Desktop: Full luxury display (1024px+) */}
      <div className="hidden lg:flex flex-col items-end gap-0.5">
        <span className="text-xs font-light text-muted-foreground uppercase tracking-wider">
          Your Configuration
        </span>
        <span className="text-sm font-light text-foreground">
          {money(totalPrice)}
        </span>
        <span className="text-xs font-light text-muted-foreground">
          From {money(monthlyPayment)}/mo
        </span>
      </div>
    </Button>
  );
};