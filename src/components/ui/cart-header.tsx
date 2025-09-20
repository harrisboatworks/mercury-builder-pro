import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useNavigate } from 'react-router-dom';
import { money } from '@/lib/money';

export const CartHeader = () => {
  const { state, isStepAccessible } = useQuote();
  const navigate = useNavigate();
  
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

  const hasItemsInCart = !!state.motor;
  const totalPrice = state.motor ? Math.round(state.motor.price * 1.13) : 0; // With tax

  if (!hasItemsInCart) return null;

  const motorDisplayName = state.motor ? `${state.motor.hp}HP ${state.motor.model || 'Motor'}` : '';

  return (
    <Button
      variant="ghost" 
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('CartHeader: Button clicked');
        handleCartClick();
      }}
      className="relative flex items-center gap-2 p-2 text-muted-foreground hover:text-primary min-w-0 transition-colors"
      aria-label={`View quote - ${motorDisplayName} - ${money(totalPrice)}`}
    >
      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
      
      {/* Mobile: Price only (< 640px) */}
      <span className="text-xs font-medium truncate sm:hidden">
        {money(totalPrice)}
      </span>
      
      {/* Tablet: Motor HP + Price inline (640px - 1024px) */}
      <div className="hidden sm:flex lg:hidden items-center gap-1.5 min-w-0">
        <span className="text-xs font-medium truncate text-foreground">
          {state.motor?.hp}HP
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {money(totalPrice)}
        </span>
      </div>
      
      {/* Desktop: Full details stacked (1024px+) */}
      <div className="hidden lg:flex flex-col items-start min-w-0">
        <span className="text-xs font-medium truncate max-w-full text-foreground">
          {motorDisplayName}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {money(totalPrice)}
        </span>
      </div>
    </Button>
  );
};