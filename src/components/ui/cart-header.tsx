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
    if (state.motor) {
      // Navigate to quote summary if we have a motor in cart
      navigate('/quote/summary');
    }
  };

  const hasItemsInCart = !!state.motor;
  const totalPrice = state.motor ? Math.round(state.motor.price * 1.13) : 0; // With tax

  if (!hasItemsInCart) return null;

  return (
    <Button
      variant="ghost" 
      size="sm"
      onClick={handleCartClick}
      className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      aria-label={`View quote - ${money(totalPrice)}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {hasItemsInCart && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          1
        </span>
      )}
      <span className="ml-2 hidden sm:inline text-sm font-medium">
        {money(totalPrice)}
      </span>
    </Button>
  );
};