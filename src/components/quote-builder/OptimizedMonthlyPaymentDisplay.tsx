import { useFinancing } from '@/contexts/FinancingContext';
import { getFinancingDisplay } from '@/lib/finance';

interface OptimizedMonthlyPaymentDisplayProps {
  motorPrice: number;
}

export function OptimizedMonthlyPaymentDisplay({ motorPrice }: OptimizedMonthlyPaymentDisplayProps) {
  const { calculateMonthlyPayment, promo } = useFinancing();
  const monthlyPayment = calculateMonthlyPayment(motorPrice);
  
  if (!monthlyPayment) return null;
  
  const displayText = getFinancingDisplay(motorPrice * 1.13, promo?.rate || null);
  
  return (
    <div className="mt-0 mb-1 text-center">
      <div className="text-sm text-muted-foreground">
        {displayText}*
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        *Estimated payment including HST
      </div>
    </div>
  );
}