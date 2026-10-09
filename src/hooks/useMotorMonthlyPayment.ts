import { useMemo } from 'react';
import { useActiveFinancingPromo } from './useActiveFinancingPromo';
import {
  calculateMotorFinancingEstimate,
  formatFinancingEstimateLine,
  isUsableFinancingRate,
} from '@/lib/finance';

interface UseMotorMonthlyPaymentProps {
  motorPrice: number;
  minimumThreshold?: number;
}

export function useMotorMonthlyPayment({
  motorPrice,
  minimumThreshold = 5000,
}: UseMotorMonthlyPaymentProps) {
  const { promo } = useActiveFinancingPromo();

  const monthlyPayment = useMemo(() => {
    if (motorPrice <= minimumThreshold || motorPrice <= 0) {
      return null;
    }

    const promoRate = isUsableFinancingRate(promo?.rate) ? promo.rate : null;
    const estimate = calculateMotorFinancingEstimate(motorPrice, promoRate);
    if (!estimate) return null;

    return {
      amount: estimate.payment,
      rate: estimate.rate,
      isPromoRate: !!promo,
      termMonths: estimate.termMonths,
      line: formatFinancingEstimateLine(estimate),
    };
  }, [motorPrice, minimumThreshold, promo]);

  return monthlyPayment;
}
