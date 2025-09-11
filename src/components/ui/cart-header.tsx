import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useNavigate } from 'react-router-dom';
import { money } from '@/lib/money';

export const CartHeader = () => {
  const { state } = useQuote();
  const navigate = useNavigate();
  
  const handleCartClick = () => {
    console.log('CartHeader: handleCartClick called', { hasMotor: !!state.motor, motor: state.motor?.hp });
    if (state.motor) {
      console.log('CartHeader: Navigating to /quote/summary');
      // Navigate to quote summary if we have a motor in cart
      navigate('/quote/summary');
    } else {
      console.log('CartHeader: No motor in state, not navigating');
    }
  };

  const hasItemsInCart = !!state.motor;
  const totalPrice = state.motor ? Math.round(state.motor.price * 1.13) : 0; // With tax

  if (!hasItemsInCart) return null;

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
      className="relative flex-shrink-0 p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 min-w-0"
      aria-label={`View quote - ${money(totalPrice)}`}
    >
      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
      {hasItemsInCart && (
        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          1
        </span>
      )}
      <span className="ml-1.5 sm:ml-2 hidden sm:inline text-xs sm:text-sm font-medium truncate">
        {money(totalPrice)}
      </span>
    </Button>
  );
};