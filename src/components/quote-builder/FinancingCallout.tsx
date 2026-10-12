import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE, FINANCING_MINIMUM, formatFinancingEstimateLine, isUsableFinancingRate } from '@/lib/finance';
import { useMemo } from 'react';

interface FinancingCalloutProps {
  totalPrice: number;
  beforeTaxSubtotal?: number;
  onApplyForFinancing?: () => void;
  financingTerms?: {
    payment: number;
    rate: number;
    termMonths: number;
    isPromotional: boolean;
  };
}

export function FinancingCallout({ totalPrice, beforeTaxSubtotal, onApplyForFinancing, financingTerms }: FinancingCalloutProps) {
  const { promo } = useActiveFinancingPromo();
  
  const financingDetails = useMemo(() => {
    if (financingTerms) return financingTerms;

    // Add mandatory Dealerplan fee
    const amountToFinance = totalPrice + DEALERPLAN_FEE;
    
    // Use existing calculation logic with promotional rate
    const promoRate = isUsableFinancingRate(promo?.rate) ? promo.rate : null;
    const { payment, termMonths, rate } = calculateMonthlyPayment(amountToFinance, promoRate);
    
    return { payment, termMonths, rate, isPromotional: !!promo };
  }, [totalPrice, promo, financingTerms]);

  // Standing minimum is on the before-tax subtotal; totalPrice (after tax)
  // still drives the amount financed. Keep hooks above the conditional.
  if ((beforeTaxSubtotal ?? totalPrice) < FINANCING_MINIMUM) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-between">
      <div className="text-base text-repower-navy-900 font-medium">
        From {formatFinancingEstimateLine(financingDetails)}
      </div>
      
      {onApplyForFinancing && (
        <button
          onClick={onApplyForFinancing}
          className="text-sm text-repower-navy-900 hover:text-repower-navy-900 transition-all duration-200 ease hover:translate-x-0.5 min-h-[44px] px-2"
        >
          Apply for Financing →
        </button>
      )}
    </div>
  );
}
