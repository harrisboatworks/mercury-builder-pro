import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';

interface MonthlyPaymentDisplayProps {
  motorPrice: number;
}

export function MonthlyPaymentDisplay({ motorPrice }: MonthlyPaymentDisplayProps) {
  const monthlyPayment = useMotorMonthlyPayment({ motorPrice, minimumThreshold: 1000 });
  
  // Debug logging
  console.log('MonthlyPaymentDisplay:', { motorPrice, monthlyPayment });
  
  if (!monthlyPayment) return null;
  
  return (
    <div className="mt-1 mb-1 text-center">
      <div className="text-sm text-muted-foreground">
        Starting at <span className="font-semibold text-foreground">${monthlyPayment.amount.toLocaleString()}/mo</span>*
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        *Est. with {monthlyPayment.rate}%{monthlyPayment.isPromoRate ? ' promo' : ''} rate, 60 mo, incl. HST
      </div>
    </div>
  );
}