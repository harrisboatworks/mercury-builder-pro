import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Gift } from 'lucide-react';
import { money, formatExpiry } from '@/lib/quote-utils';
import { useActivePromotions } from '@/hooks/useActivePromotions';

interface PromoPanelProps {
  motorHp?: number;
}

export function PromoPanel({ motorHp }: PromoPanelProps) {
  const { promotions, loading } = useActivePromotions();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!promotions.length) {
    return null;
  }

  // Calculate total promotional value
  const totalPromoValue = promotions.reduce((total, promo) => {
    let value = 0;
    if (promo.discount_fixed_amount) value += promo.discount_fixed_amount;
    if (promo.warranty_extra_years) value += promo.warranty_extra_years * 100; // Estimate warranty value
    // Add percentage discount value if motor price is available
    if (promo.discount_percentage && motorHp) {
      // Rough estimate based on HP - this would need actual motor price for accuracy
      const estimatedMotorPrice = motorHp * 500; // Rough estimate
      value += (estimatedMotorPrice * promo.discount_percentage) / 100;
    }
    return total + value;
  }, 0);

  return (
    <Card className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    </Card>
  );
}