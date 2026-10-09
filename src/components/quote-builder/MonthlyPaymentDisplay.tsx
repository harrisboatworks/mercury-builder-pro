
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';

interface MonthlyPaymentDisplayProps {
  motorPrice: number;
}

export function MonthlyPaymentDisplay({ motorPrice }: MonthlyPaymentDisplayProps) {
  const monthlyPayment = useMotorMonthlyPayment({ motorPrice });

  if (!monthlyPayment) return null;

  return (
    <div className="mt-0 mb-1 text-center">
      <div className="text-sm text-muted-foreground">
        {monthlyPayment.line}*
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        *Estimated payment including HST and the DealerPlan fee
      </div>
    </div>
  );
}
