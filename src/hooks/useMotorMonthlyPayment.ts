import { useMemo } from 'react';
import { useActiveFinancingPromo } from './useActiveFinancingPromo';
import { calculateMonthlyPayment, getFinancingTerm } from '@/lib/finance';

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
    // Only calculate for motors above threshold
    if (motorPrice <= minimumThreshold || motorPrice <= 0) {
      return null;
    }

    // Calculate price including HST (13% for Canada)
    const priceWithHST = motorPrice * 1.13;
    
    // Use smart term selection and promotional rate
    const promoRate = promo?.rate || null;
    const { payment, termMonths, rate } = calculateMonthlyPayment(priceWithHST, promoRate);
    
    return {
      amount: payment,
      rate: rate,
      isPromoRate: !!promo,
      termMonths: termMonths
    };
  }, [motorPrice, minimumThreshold, promo]);

  return monthlyPayment;
}