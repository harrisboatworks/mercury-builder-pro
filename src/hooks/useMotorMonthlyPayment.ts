import { useMemo } from 'react';
import { useActiveFinancingPromo } from './useActiveFinancingPromo';

interface UseMotorMonthlyPaymentProps {
  motorPrice: number;
  minimumThreshold?: number;
}

export function useMotorMonthlyPayment({ 
  motorPrice, 
  minimumThreshold = 5000 
}: UseMotorMonthlyPaymentProps) {
  const { promo } = useActiveFinancingPromo();
  
  const monthlyPayment = useMemo(() => {
    console.log('useMotorMonthlyPayment:', { motorPrice, minimumThreshold, promo });
    
    // Only calculate for motors above threshold
    if (motorPrice <= minimumThreshold) {
      console.log('Motor price below threshold:', motorPrice, '<=', minimumThreshold);
      return null;
    }

    if (!motorPrice || motorPrice <= 0) {
      console.log('Invalid motor price:', motorPrice);
      return null;
    }

    // Use promotional rate if available, otherwise fallback to standard rate
    const annualRate = promo?.rate || 6.99; // Default standard rate
    const monthlyRate = annualRate / 100 / 12;
    const termMonths = 60; // 5 year term
    
    // Calculate price including HST (13% for Canada)
    const priceWithHST = motorPrice * 1.13;
    
    // Calculate monthly payment with $0 down
    // Formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const principal = priceWithHST;
    const monthlyPaymentAmount = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    return {
      amount: Math.round(monthlyPaymentAmount),
      rate: annualRate,
      isPromoRate: !!promo,
      termMonths
    };
  }, [motorPrice, minimumThreshold, promo]);

  return monthlyPayment;
}