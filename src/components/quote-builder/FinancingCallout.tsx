import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE, FINANCING_MINIMUM } from '@/lib/finance';
import { useMemo } from 'react';

interface FinancingCalloutProps {
  totalPrice: number;
  onApplyForFinancing?: () => void;
  financingTerms?: {
    payment: number;
    rate: number;
    termMonths: number;
    isPromotional: boolean;
  };
}

export function FinancingCallout({ totalPrice, onApplyForFinancing, financingTerms }: FinancingCalloutProps) {
  const { promo } = useActiveFinancingPromo();
  
  const financingDetails = useMemo(() => {
    if (financingTerms) return financingTerms;

    // Add mandatory Dealerplan fee
    const amountToFinance = totalPrice + DEALERPLAN_FEE;
    
    // Use existing calculation logic with promotional rate
    const promoRate = promo?.rate || null;
    const { payment, termMonths, rate } = calculateMonthlyPayment(amountToFinance, promoRate);
    
    return { payment, termMonths, rate, isPromotional: !!promo };
  }, [totalPrice, promo, financingTerms]);

  // Don't show financing for purchases under $5,000. Keep hooks above the
  // conditional so rerenders cannot change hook order.
  if (totalPrice < FINANCING_MINIMUM) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-between">
      <div className="text-base text-repower-navy-900 font-medium">
        From ${financingDetails.payment}/month
        <span className="ml-2 text-xs text-repower-gold font-normal">
          {financingDetails.rate}% APR · {financingDetails.termMonths} months
        </span>
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
