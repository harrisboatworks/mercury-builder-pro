
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';
import { getFinancingDisplay } from '@/lib/finance';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';

interface MonthlyPaymentDisplayProps {
  motorPrice: number;
}

export function MonthlyPaymentDisplay({ motorPrice }: MonthlyPaymentDisplayProps) {
  const monthlyPayment = useMotorMonthlyPayment({ motorPrice });
  const { promo } = useActiveFinancingPromo();
  
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
