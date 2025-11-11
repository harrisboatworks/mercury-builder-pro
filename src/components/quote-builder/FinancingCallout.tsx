import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { useMemo } from 'react';

interface FinancingCalloutProps {
  totalPrice: number;
  onApplyForFinancing?: () => void;
}

export function FinancingCallout({ totalPrice, onApplyForFinancing }: FinancingCalloutProps) {
  const { promo } = useActiveFinancingPromo();
  
  const financingDetails = useMemo(() => {
    // Add mandatory Dealerplan fee
    const amountToFinance = totalPrice + DEALERPLAN_FEE;
    
    // Use existing calculation logic with promotional rate
    const promoRate = promo?.rate || null;
    const { payment, termMonths, rate } = calculateMonthlyPayment(amountToFinance, promoRate);
    
    return { payment, termMonths, rate, isPromo: !!promo };
  }, [totalPrice, promo]);
  
  return (
    <div className="flex items-center justify-between">
      <div className="text-base text-gray-900 dark:text-white font-medium">
        From ${financingDetails.payment}/month
        {financingDetails.isPromo && financingDetails.rate < 7.99 && (
          <span className="ml-2 text-xs text-green-600 font-normal">
            {financingDetails.rate}% APR
          </span>
        )}
      </div>
      
      {onApplyForFinancing && (
        <button
          onClick={onApplyForFinancing}
          className="text-sm text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 ease hover:translate-x-0.5 min-h-[44px] px-2"
        >
          Apply for Financing →
        </button>
      )}
    </div>
  );
}
